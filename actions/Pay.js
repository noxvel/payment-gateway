const BillingDoc = require('../workers/BillingDoc');
const Database = require('../workers/Database');
const BaseAction = require('./BaseAction.js');

const { TYPE_OF_CLIENT } = require('../constants.js');
class Pay extends BaseAction{

  constructor(typeOfClient) {
    super("Pay",typeOfClient);
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

    let db = new Database(this.actioni, this.typeOfClient);
    await db.connect();
    await db.definePayment();

    let pm = await db.findPayment(this.reference);

    let dataForBillingDoc = this._getDataForBillingDoc(pm)
    let billDoc = new BillingDoc(this.action, dataForBillingDoc);
    billDoc.create();
    // await billDoc.create();

    await db.setPayStatus(pm, this.reference);

    await db.disconnect();
  }

  _getDataForBillingDoc(payment){

    let data = {
      typeOfClient: this.typeOfClient,
      reference: payment.id, 
      actNumber: payment.actID,
      bonusNumber: payment.bonusID,
      paySum: payment.paySum,
      actSum: payment.actSum,
      accrualAmount: payment.accrualAmount,
      divisionID: payment.divisionID,
      clientName: payment.clientName
    }
    if(this.typeOfClient == TYPE_OF_CLIENT.selfpayment) data.terminalID = payment.terminalID
    return data;
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
