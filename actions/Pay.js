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

    let db = new Database(this.action);
    await db.connect();
    await db.definePayment();

    let pm = await db.findPayment(this.reference);

    let billDoc = new BillingDoc(pm.id, pm.actID, pm.bonusID, pm.actSum, pm.paySum, pm.accrualAmount, pm.divisionID, pm.clientName, this.action);
    await billDoc.create();

    await db.setPayStatus(pm, this.reference);

    await db.disconnect();
  }

  _createResponseJSON() {
    let resBody = {
      action: this.action,
      reference: this.reference
    }
    return JSON.stringify(resBody);
  }

  _createResponseXML() {
    let builder = require('xmlbuilder');
    let xml = builder.create('Transfer', {version: '1.0', encoding: 'UTF-8', standalone: true})
      .att('xmlns','http://debt.privatbank.ua/Transfer')
      .att('interface','Debt')
      .att('action',this.action)
      .ele('Data', {'xmlns:xsi':'http://www.w3.org/2001/XMLSchema-instance', 'xsi:type':'Gateway', 'reference': this.reference})
      .end({
        pretty: true
      });

    // this._xml = xml.toString();
    return xml.toString();
  }

}

module.exports = Pay;
