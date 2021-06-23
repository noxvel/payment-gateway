const PaymentAct = require('../workers/PaymentAct.js');
const BonusCard = require('../workers/BonusCard.js');
const Database = require('../workers/Database.js');
const BaseAction = require('./BaseAction.js');
const {
  InternalServerError
} = require('../errors');
const { TYPE_OF_CLIENT } = require('../constants.js');
class Check extends BaseAction{

  constructor(typeOfClient) {
    super("Check",typeOfClient);
    this.reference = '';
    this.actNumber = '';
    this.bonusNumber = '';
    this.totalSum = 0;
    this.payAct;
    this.bonus;
    this.terminalID = 0;
  }

  _getRequestValuesJSON(result) {
    this.actNumber = result.actNumber;
    this.bonusNumber = result.bonusNumber;
    this.totalSum = result.totalSum;
    if(this.typeOfClient == TYPE_OF_CLIENT.selfpayment) this.terminalID = result.terminalID
  }

  _getRequestValuesXML(result) {
    this.actNumber = result.Transfer.Data[0].PayerInfo[0].$.billIdentifier;
    this.bonusNumber = result.Transfer.Data[0].PayerInfo[0].$.ls;
    this.totalSum = parseFloat(result.Transfer.Data[0].TotalSum[0]);
  }

  async resolveAction() {

    this.payAct = new PaymentAct(this.action, this.actNumber);
    await this.payAct.getPaymentData();

    if (this.payAct.actSum != this.totalSum){
      throw new InternalServerError(this.action, 'The amount of payment from the request is not equal to the amount of confirmed payment');
    }

    this.bonus = new BonusCard(this.action, this.bonusNumber, this.payAct.actSum);
    if (this.bonusNumber !== '') {
      await this.bonus.getAccrualAmount(this.payAct.actSum, this.payAct.actServiceArray);
    }

    let db = new Database(this.action,this.typeOfClient);
    await db.connect();
    await db.definePayment();

    let newPayment = this._getNewPayment();
    this.reference = await db.addPayment(newPayment);

    await db.disconnect();
  }

  _getNewPayment(){
    let newPayment = {
      actID: this.actNumber,
      bonusID: this.bonusNumber,
      actSum: this.payAct.actSum,
      paySum: this.totalSum,
      accrualAmount: this.bonus.accrualAmount,
      divisionID: this.payAct.divisionId,
      clientName: this.payAct.clientName,
      payStatus: false,
      isCanceled: false
    }
    if(this.typeOfClient == TYPE_OF_CLIENT.selfpayment) newPayment.terminalID = this.terminalID
    return newPayment;
  }

  _createResponseJSON() {
    let resBody = {
      action: this.action,
      reference: this.reference,
      actNumber: this.actNumber,
      actSum: this.payAct.actSum,
      bonusNumber: this.bonusNumber,
      clientName: this.payAct.clientName,
      accrualAmount: this.bonus.accrualAmount,
      divisionId: this.payAct.divisionId,
      organizationID: this.payAct.organizationID,
      actServiceArray: this.payAct.actServiceArray
    }

    return JSON.stringify(resBody);
  }

  _createResponseXML() {

    let builder = require('xmlbuilder');
    let xml = builder.create('Transfer', {
      version: '1.0',
      encoding: 'UTF-8',
      standalone: true
    })
      .att('xmlns', 'http://debt.privatbank.ua/Transfer')
      .att('interface', 'Debt')
      .att('action', this.action)
      .ele('Data', {
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:type': 'Gateway',
        'reference': this.reference
      })
      .end({
        pretty: true
      });

    // this._xml = xml.toString();
    return xml.toString();

  }

}

module.exports = Check;
