const {
  InternalServerError
} = require('../errors');
const BillingDoc = require('../workers/BillingDoc');
const Database = require('../workers/Database');
const BaseAction = require('./BaseAction.js');

class Pay extends BaseAction{

  constructor() {
    super("Pay");
    this.reference = '';
    this.totalSum = 0;
  }

  _getRequestValuesJSON(result) {
    this.reference = result.reference;
    this.totalSum = result.totalSum;
  }

  _getRequestValuesXML(result) {
    //this.actNumber = result.Transfer.Data[0].PayerInfo[0].$.billIdentifier;
    this.reference = parseInt(result.Transfer.Data[0].CompanyInfo[0].CheckReference[0]);
    this.totalSum = parseFloat(result.Transfer.Data[0].TotalSum[0]);
  }

  async resolveAction(){

    let db = new Database('Pay');
    await db.connect();
    await db.definePayment();

    let pm = await db.findPayment(this.reference);

    if (pm.paySum != this.totalSum){
      throw new InternalServerError('Pay', 'The amount of payment from the request is not equal to the amount of confirmed payment');
    }

    let billDoc = new BillingDoc(pm.id, pm.actID, pm.bonusID, pm.actSum, pm.paySum, pm.accrualAmount, pm.divisionID, pm.clientName, 'Pay');
    await billDoc.create();

    await db.setPayStatus(pm, this.reference);
  }

  _createResponseJSON() {
    let resBody = {
      action: "Pay",
      reference: this.reference
    }
    return JSON.stringify(resBody);
  }

  _createResponseXML() {
    let builder = require('xmlbuilder');
    let xml = builder.create('Transfer', {version: '1.0', encoding: 'UTF-8', standalone: true})
      .att('xmlns','http://debt.privatbank.ua/Transfer')
      .att('interface','Debt')
      .att('action','Pay')
      .ele('Data', {'xmlns:xsi':'http://www.w3.org/2001/XMLSchema-instance', 'xsi:type':'Gateway', 'reference': this.reference})
      .end({
        pretty: true
      });

    // this._xml = xml.toString();
    return xml.toString();
  }

}

module.exports = Pay;
