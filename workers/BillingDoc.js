const fetch = require('node-fetch');
const { BILLING_DOCUMENT_API_PATH } = require('../connection-config');
const {
  InternalServerError
} = require('../errors');

class BillingDoc {

  constructor(action = '', dataForBillingDoc) {
    this.action = action;
    this.docData = dataForBillingDoc;
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
          throw new InternalServerError(this.action, 'Error requesting accounting system');
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