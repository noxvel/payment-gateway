const fetch = require('node-fetch');
const { BILLING_DOCUMENT_API_PATH, BANK_NAME } = require('../connection-config');
const {
  InternalServerError
} = require('../errors');

class BillingDoc {

  constructor(reference, actNumber, bonusNumber, actSum, paySum, accrualAmount, divisionId, clientName, action = '') {
    this.action = action;

    this.docData = {
      bankName: BANK_NAME,
      reference: reference, 
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
          throw new InternalServerError(this.action, 'Ошибка при запросе к платежной системе');
        }
      })
      .then(status => {
        if (status.code === 0)
          throw new InternalServerError(this.action, status.msg);
      })
      .catch(err => {
        throw err;
      })

  }
}

module.exports = BillingDoc;