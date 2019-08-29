const fetch = require('node-fetch');
const { BONUSCARD_API_PATH } = require('../connection-config');

const {
  InternalServerError,
  NotFoundError
} = require('../errors');

class BonusCard {
  
  constructor(action, cardNumber, paySum) {
    this.action = action;
    this.cardNumber = cardNumber;
    this.paySum = paySum;
    this.discout = 0;
    this.accrualAmount = 0;
  }

  findCard(){

    return fetch(BONUSCARD_API_PATH + 'findcard/' + this.cardNumber)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new InternalServerError();
      }
    })
    .then(json => {
      if (json.statusCode === 0){
        throw new NotFoundError(this.action, "Could not find bonus card number - " + this.cardNumber);
      }
    }) 
    .catch(err => {
      throw err;
    })

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
      if (json.statusCode === 0){
        throw new NotFoundError(this.action, "Could not find bonus card number - " + this.cardNumber);
      }else{
        that.discout = json.cardBalance;
      }
    }) 
    .catch(err => {
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
      if (json.statusCode === 0){
        throw new NotFoundError(this.action, "Could not find bonus card number - " + this.cardNumber);
      }else{
        that.accrualAmount = json.accrualAmount;
      }
    }) 
    .catch(err => {
      throw err;
    })
  }

}

module.exports = BonusCard;
