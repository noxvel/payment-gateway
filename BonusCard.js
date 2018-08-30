var fetch = require('node-fetch');
const { BONUSCARD_API_PATH } = require('./connection-config');

class BonusCard {
  
  constructor(cardNumber, paySum) {
    this.cardNumber = cardNumber;
    this.paySum = paySum;
    this.discout = 0;
    this.isError = false;
  }


  async getBonusCardData() {

    let that = this;
    return fetch(BONUSCARD_API_PATH + this.cardNumber + '?paysum=' + this.paySum)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error('Something went wrong ...');
      }
    })
    .then(data => {
      console.log(data);
      if (data.statusCode.code === 4008){
        that.isError = true;
      }else{
        that.discout = data.cardBalance;
      }
      //return data;
    }) 
    .catch(err => {
      console.log(err.message);
      throw err;
    })

    
  }
}

module.exports = BonusCard;