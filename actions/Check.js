const PaymentAct = require('../workers/PaymentAct.js');
const BonusCard = require('../workers/BonusCard.js');
const Database = require('../workers/Database.js');
const BaseAction = require('./BaseAction.js');

class Check extends BaseAction{

  constructor() {
    super("Check");
    this.reference = '';
    this.actNumber = '';
    this.bonusNumber = '';
    this.totalSum = 0;
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

    let payAct = new PaymentAct('Check', this.actNumber);
    await payAct.getPaymentData();

    let bonus = new BonusCard('Check', this.bonusNumber, payAct.actSum);
    if (this.bonusNumber !== '') {
      await bonus.getAccrualAmount(this.totalSum);
    }

    let db = new Database('Check');
    await db.connect();
    await db.definePayment();
    this.reference = await db.addPayment(this.actNumber, this.bonusNumber, payAct.actSum, this.totalSum, bonus.accrualAmount, payAct.divisionId, payAct.clientName);

  }

  _createResponseJSON() {
    let resBody = {
      action: "Check",
      reference: this.reference
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
      .att('action', 'Check')
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
