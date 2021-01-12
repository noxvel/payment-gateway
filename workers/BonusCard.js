const fetch = require('node-fetch')
const { BONUSCARD_API_PATH } = require('../connection-config')

const { InternalServerError, NotFoundError, BaseError } = require('../errors')

class BonusCard {
  constructor(action, cardNumber, paySum) {
    this.action = action
    this.cardNumber = cardNumber
    this.paySum = paySum
    this.discout = 0
    this.accrualAmount = 0
  }

  findCard() {
    return fetch(BONUSCARD_API_PATH + 'findcard/' + this.cardNumber)
      .then(response => {
        if (response.ok) {
          return response.json()
        } else {
          throw new InternalServerError(this.action, `Error while requesting information on a bonus card, code - ${response.status}`)
        }
      })
      .then(json => {
        if (json.statusCode === 0) {
          throw new NotFoundError(this.action, `Could not find bonus card number - ${this.cardNumber}`, 22)
        }
      })
      .catch(err => {
        if(err instanceof BaseError){
          throw err
        }else{
          throw new InternalServerError(this.action, `Error receiving data by bonuscard: ${err.message}`)
        }
      })
  }

  getAllowedChargeBonusSum() {
    return fetch(BONUSCARD_API_PATH + 'balance/' + this.cardNumber + '?paysum=' + this.paySum)
      .then(response => {
        if (response.ok) {
          return response.json()
        } else {
          throw new InternalServerError(this.action, `Error while requesting information on a bonus card, code - ${response.status}`)
        }
      })
      .then(json => {
        if (json.statusCode === 0) {
          throw new NotFoundError(this.action, `Could not find bonus card number - ${this.cardNumber}`, 22)
        } else {
          this.discout = json.cardBalance
        }
      })
      .catch(err => {
        if(err instanceof BaseError){
          throw err
        }else{
          throw new InternalServerError(this.action, 'Error receiving data by bonuscard: ' + err.message)
        }
      })
  }

  getAccrualAmount(totalSum, actServiceArray) {
    return fetch(BONUSCARD_API_PATH + 'accrualamount/' + this.cardNumber + '/' + totalSum, {
      method: 'POST',
      body: JSON.stringify({ actServiceArray: actServiceArray }),
      headers: { 'Content-Type': 'application/json' }
    })
      .then(response => {
        if (response.ok) {
          return response.json()
        } else {
          throw new InternalServerError(this.action, `Error while requesting information on a bonus card, code - ${response.status}`)
        }
      })
      .then(json => {
        if (json.statusCode === 0) {
          throw new NotFoundError(this.action, `Could not find bonus card number - ${this.cardNumber}`, 22)
        } else {
          this.accrualAmount = json.accrualAmount
        }
      })
      .catch(err => {
        if(err instanceof BaseError){
          throw err
        }else{
          throw new InternalServerError(this.action, `Error receiving data by bonuscard: ${err.message}`)
        }
      })
  }
}

module.exports = BonusCard
