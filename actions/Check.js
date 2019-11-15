const PaymentAct = require('../workers/PaymentAct.js');
const BonusCard = require('../workers/BonusCard.js');
const Database = require('../workers/Database.js');
const BaseAction = require('./BaseAction.js');
const {
  InternalServerError
} = require('../errors');
class Check extends BaseAction{

  constructor() {
    super("Check");
    this.reference = '';
    this.actNumber = '';
    this.bonusNumber = '';
    this.totalSum = 0;
    this.payAct;
    this.bonus;
  }

  _getRequestValuesJSON(result) {
    this.actNumber = result.actNumber;
    this.bonusNumber = result.bonusNumber;
    this.totalSum = result.totalSum;
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
      await this.bonus.getAccrualAmount(this.totalSum);
    }

    let db = new Database(this.action);
    await db.connect();
    await db.definePayment();
    this.reference = await db.addPayment(this.actNumber, this.bonusNumber, this.payAct.actSum, this.totalSum, this.bonus.accrualAmount, this.payAct.divisionId, this.payAct.clientName);

    await db.disconnect();
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
