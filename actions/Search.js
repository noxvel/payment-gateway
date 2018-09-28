var PaymentAct = require('../PaymentAct.js');
var BonusCard = require('../BonusCard.js');
const {
  InternalServerError
} = require('../errors');

class Search {

  constructor() {
    this.actSum = 0;
    this.bonusSum = 0;
    this.actNumber = '';
    this.bonusNumber = ''; 
    this.useBonus = false;
    this.totalAmount = 0;
  }

  getRequestValues(result){
    try {
      this.actNumber   = result.Transfer.Data[0].Unit[0].$.value;
      this.bonusNumber = result.Transfer.Data[0].Unit[1].$.value;
      this.useBonus    = result.Transfer.Data[0].Unit[2].$.value;
    } catch (error) {
      throw new InternalServerError();
    }
  }

  async resolveAction() {

    let payment = new PaymentAct('Search', this.actNumber);
    await payment.getPaymentData();

    let bonus = new BonusCard('Search', this.bonusNumber, payment.actSum);
    if (this.bonusNumber !== '') {
      await bonus.getAllowedChargeBonusSum();
    }
    this.actSum = payment.actSum;
    
    if(this.useBonus == 'true'){
      this.totalAmount = payment.actSum - bonus.discout;
    }else{
      this.totalAmount = payment.actSum;
    }

  }

  createResponse() {

    let builder = require('xmlbuilder');
    let xml = builder.create('Transfer', {version: '1.0', encoding: 'UTF-8', standalone: true})
      .att('xmlns','http://debt.privatbank.ua/Transfer')
      .att('interface','Debt')
      .att('action','Search')
      .ele('Data', {'xmlns:xsi':'http://www.w3.org/2001/XMLSchema-instance', 'xsi:type':'DebtPack'})
        .ele('Message', {}, 'Данные о задолженности можно получить в Кассе!')
        .up()
        .ele('PayerInfo', {'billIdentifier': this.actNumber, 'ls': this.bonusNumber})
        .up()
        .ele('ServiceGroup')
          .ele('DebtService',{'serviceCode':'101'})
            .ele('CompanyInfo')
              .ele('CompanyCode',{},'1')
              .up()
              .ele('CompanyName',{},'МЦ Медикап')
              .up()
            .up()
            .ele('DebtInfo',{'amountToPay':this.totalAmount, 'debt':this.actSum}) 
            .up()
            .ele('ServiceName',{},'Медицинские услуги')
            // .up()
            // .ele('DopData')
            //   .ele('Dop', {'name':'bonus_card', 'value':this.bonusNumber})
            //   .up()
            .up()
            .ele('Destination',{},'Оплата за предоставленные медицинские услуги')
            .up()
            .ele('PayerInfo',{'billIdentifier': this.actNumber})
      .end({
        pretty: true
      });

    // this._xml = xml.toString();
    return xml.toString();

  }

}

module.exports = Search;