const {
  InternalServerError
} = require('../errors');
const BillingDoc = require('../BillingDoc');
const Database = require('../Database');

class Pay {

  constructor() {
    this.actNumber = '';
    this.reference = '';
  }

  getRequestValues(result){
    try {
      this.actNumber = result.Transfer.Data[0].PayerInfo[0].$.billIdentifier;
      this.reference = result.Transfer.Data[0].CompanyInfo[0].CheckReference[0];
    } catch (error) {
      throw new InternalServerError();
    }
  }

  async resolveAction(){

    let db = new Database('Pay');
    await db.connect();
    await db.definePayment();

    let pm = await db.wasPaid(this.reference);

    let billDoc = new BillingDoc(pm.actID, pm.bonusID, pm.actSum, pm.paySum, pm.accrualAmount, pm.divisionID, pm.clientName, 'Pay');
    await billDoc.create();

    // to do
    // set status in database, that docbill is created  ???
  }

  createResponse() {

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