const PaymentAct = require('../workers/PaymentAct.js');
const BonusCard = require('../workers/BonusCard.js');
const BaseAction = require('./BaseAction.js');

// const uppaidDevisions = ["114", "115", "223", "224"];
// const {
//   NotFoundError
// } = require('../errors');

class Search extends BaseAction {
  constructor(typeOfClient) {
    super("Search",typeOfClient);
    this.actSum = 0;
    this.actNumber = '';
    this.bonusNumber = '';
    this.payAct;
  }

  _getRequestValuesJSON(result) {
    this.actNumber = result.actNumber;
    this.bonusNumber = result.bonusNumber;
  }

  _getRequestValuesXML(result) {
    this.actNumber = result.Transfer.Data[0].Unit[0].$.value;
    this.bonusNumber = result.Transfer.Data[0].Unit[1].$.value;
  }

  async resolveAction() {

    this.payAct = new PaymentAct(this.action, this.actNumber);
    await this.payAct.getPaymentData();

    // if (uppaidDevisions.includes(payment.divisionId))
    //   throw new NotFoundError(this.action, "At the moment it is not possible to pay under this act - " + this.payAct.actNumber)
    //--------------------------------

    if (this.bonusNumber !== "") {
      let bonus = new BonusCard(this.action, this.bonusNumber, this.payAct.actSum);
      // await bonus.getAllowedChargeBonusSum();
      await bonus.findCard();
    }

  }

  _createResponseJSON() {
    let resBody = {
      action: this.action,
      actNumber: this.actNumber,
      bonusNumber: this.bonusNumber,
      actSum: this.payAct.actSum,
      organizationID: this.payAct.organizationID
    }
    return JSON.stringify(resBody);
  }

  _createResponseXML() {

    let builder = require('xmlbuilder');
    let xml = builder.create('Transfer', { version: '1.0', encoding: 'UTF-8', standalone: true })
      .att('xmlns', 'http://debt.privatbank.ua/Transfer')
      .att('interface', 'Debt')
      .att('action', this.action)
      .ele('Data', { 'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance', 'xsi:type': 'DebtPack' })
      .ele('Message', {}, `Сумма по акту - ${this.payAct.actSum}.`)
      .up()
      .ele('PayerInfo', { 'billIdentifier': this.actNumber })
      .up()
      .ele('ServiceGroup')
      .ele('DebtService', { 'serviceCode': '101' })
      .ele('CompanyInfo')
      .ele('CompanyCode', {}, '1')
      .up()
      .ele('CompanyName', {}, 'МЦ Медикап')
      .up()
      .up()
      .ele('DebtInfo', { 'amountToPay': this.payAct.actSum, 'debt': this.payAct.actSum })
      .up()
      .ele('ServiceName', {}, 'Медицинские услуги')
      // .up()
      // .ele('DopData')
      //   .ele('Dop', {'name':'bonus_card', 'value':this.bonusNumber})
      //   .up()
      .up()
      .ele('Destination', {}, 'Оплата за предоставленные медицинские услуги')
      .up()
      .ele('PayerInfo', { 'billIdentifier': this.actNumber, 'ls': this.bonusNumber })
      .end({
        pretty: true
      });

    return xml.toString();
  }

}

module.exports = Search;
