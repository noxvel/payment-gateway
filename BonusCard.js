const fetch = require('node-fetch');
const { BONUSCARD_API_PATH } = require('./connection-config');

const {
  InternalServerError,
  NotFoundError
} = require('./errors');

class BonusCard {
  
  constructor(action, cardNumber, paySum) {
    this.action = action;
    this.cardNumber = cardNumber;
    this.paySum = paySum;
    this.discout = 0;
    this.accrualAmount = 0;
  }

  getAllowedChargeBonusSum() {

    let that = this;
    return fetch(BONUSCARD_API_PATH + 'balance/' + this.cardNumber + '?paysum=' + this.paySum)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new InternalServerError();
      }
    })
    .then(json => {
      console.log(json);
      if (json.statusCode === 0){
        throw new NotFoundError('Search', 'Не найден номер бонусной карты');
      }else{
        that.discout = json.cardBalance;
      }
    }) 
    .catch(err => {
      console.log(err.message);
      throw err;
    })

  }

  getAccrualAmount(totalSum) {
    let that = this;
    return fetch(BONUSCARD_API_PATH + 'accrualamount/' + this.cardNumber + '/' + totalSum)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new InternalServerError();
      }
    })
    .then(json => {
      console.log(json);
      if (json.statusCode === 0){
        throw new NotFoundError('Search', 'Не найден номер бонусной карты');
      }else{
        that.accrualAmount = json.accrualAmount;
      }
    }) 
    .catch(err => {
      console.log(err.message);
      throw err;
    })
  }


}

module.exports = BonusCard;