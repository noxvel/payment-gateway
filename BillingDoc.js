const fetch = require('node-fetch');
const { BILLING_DOCUMENT_API_PATH } = require('./connection-config');
const {
  InternalServerError
} = require('./errors');

class BillingDoc {

  constructor(actNumber, bonusNumber, actSum, paySum, accrualAmount, divisionId, clientName, action = '') {
    this.action = action;

    this.docData = { 
      actNumber: actNumber,
      bonusNumber: bonusNumber,
      paySum: paySum,
      actSum: actSum,
      accrualAmount: accrualAmount,
      divisionId: divisionId,
      clientName: clientName
    };

  }

  create() {

    return fetch(BILLING_DOCUMENT_API_PATH + 'billingdoc' ,{
      method: 'POST',
      body: JSON.stringify(this.docData),
      headers: { 'Content-Type': 'application/json' },
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new InternalServerError(this.action);
        }
      })
      .then(json => {
        console.log(json);
        if (json.status === 0)
          throw new InternalServerError(this.action, 'Не удалось создать документ оплаты');
        
      })
      .catch(err => {
        console.log(err.message);
        throw new InternalServerError(this.action, err.message);
      })

  }
}

module.exports = BillingDoc;