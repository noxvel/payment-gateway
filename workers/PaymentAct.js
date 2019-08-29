const sql = require('mssql');
const fetch = require('node-fetch');
const {
  PAYMENT_ACT_SQL_CONFIG,
  PAYMENT_ACT_PROCEDURE_NAME,
  PAYMENT_ACT_API_PATH
} = require('../connection-config');
const {
  InternalServerError,
  NotFoundError
} = require('../errors');

class PaymentAct {
  constructor(action, actNumber) {
    this.action = action;
    this.actNumber = actNumber;
    this.divisionId = '';
    this.clientName = '';
    this.actSum = 0;
  }

  async getPaymentData(){

    // Test actNumber for Bank testing operations
    if (this.actNumber == '99999999') {
      this.actSum = 9999;
      this.clientName = 'Чапаев Иван Васильевич';
      this.divisionId = 211;
      return;
    }

    // await this.getPaymentDataAPI();
    await this.getPaymentDataSQL();
  }

  _parseResult(result,isSql = false) {

    if (isSql){
      result.forEach(i => {
        this.actSum += i.SERVICE_FINAL_PRICE;
      })
    }else{
      this.actSum     = result[0].K_OPLATE;
    }

    this.clientName = result[0].PATIENT_NAME;
    this.divisionId = result[0].ID_PUNKTA_PRIEMA_ZAKAZA;
  }

  getPaymentDataAPI() {

    return fetch(PAYMENT_ACT_API_PATH + this.actNumber)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new InternalServerError(this.action, 'Failed to get data for payment act number');
      }
    })
    .then(json => {
      if (json.Act.length == 0){
        throw new NotFoundError(this.action, 'Could not find payment act number - ' + this.actNumber);
      }else{
        this._parseResult(json.Act);
      }
    }) 
    .catch(err => {
      throw err;
    })

  }

  getPaymentDataSQL() {

    let that = this;

    return sql.connect(PAYMENT_ACT_SQL_CONFIG).then(pool => {
      // Query

      return pool.request()
        //.input('input_parameter', sql.Int, value)
        .query(`exec ${PAYMENT_ACT_PROCEDURE_NAME} @FilterXML='<Filter><ActCode>${parseInt(that.actNumber)}</ActCode></Filter>', @Login='1c', @DoApply=1, @UseForReport = 0`)
        }).then(result => {
          if (result.recordset.length > 0) {
            that._parseResult(result.recordset, true);
          } else {
            throw new NotFoundError(this.action, 'Could not find payment act number - ' + that.actNumber);
          }
          sql.close();

          // Stored procedure
          // return pool.request()
          //   .input('input_parameter', sql.Int, value)
          //   .output('output_parameter', sql.VarChar(50))
          //   .execute('procedure_name')
        }).catch(err => {
          sql.close();
          // ... error checks
          throw err;
        })

  }

}

module.exports = PaymentAct;