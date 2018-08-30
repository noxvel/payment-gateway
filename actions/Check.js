const {
  InternalServerError
} = require('../errors');

class Check {

  constructor() {
    this.reference = '';
    this._xml = '';

    this.actNumber = '';
    this.bonusNumber = ''; 
  }

  getRequestValues(result){
    try {
      this.actNumber = result.Transfer.Data[0].PayerInfo[0].$.billIdentifier;
      this.bonusNumber = result.Transfer.Data[0].PayerInfo[0].$.ls;
    } catch (error) {
      throw new InternalServerError();
    }
  }

  async resolveAction(){
    return ;
  }

  createResponse() {

    let builder = require('xmlbuilder');
    let xml = builder.create('Transfer', {version: '1.0', encoding: 'UTF-8', standalone: true})
      .att('xmlns','http://debt.privatbank.ua/Transfer')
      .att('interface','Debt')
      .att('action','Check')
      .ele('Data', {'xmlns:xsi':'http://www.w3.org/2001/XMLSchema-instance', 'xsi:type':'Gateway', 'reference': this.reference})
      .end({
        pretty: true
      });

    // this._xml = xml.toString();
    return xml.toString();

  }

  get xml(){
    return this._xml;
  }

  set xml(value){
    return; 
  }
}

module.exports = Check;