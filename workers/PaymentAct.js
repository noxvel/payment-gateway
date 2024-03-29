const fetch = require('node-fetch')
const { PAYMENT_ACT_SQL_CONFIG, PAYMENT_ACT_PROCEDURE_NAME, PAYMENT_ACT_API_PATH } = require('../connection-config')
const { InternalServerError, NotFoundError, BaseError } = require('../errors')

const MP_Divisions = { id: 1, divs: [] } // All another diviosions are owned to MP
const MS_Divisions = { id: 2, divs: ['114', '115'] }
const MK_Divisions = { id: 3, divs: ['223', '224'] }

class PaymentAct {
  constructor(action, actNumber) {
    this.action = action
    this.actNumber = actNumber
    this.divisionId = ''
    this.organizationID = 0
    this.clientName = ''
    this.actSum = 0
    this.actServiceArray = []
  }

  async getPaymentData() {
    // Test actNumber for Bank testing operations
    if (this.actNumber == '99999999') {
      this.actSum = 9999
      this.clientName = 'Чапаев Иван Васильевич'
      this.divisionId = 211
      return
    }

    // await this.getPaymentDataAPI();
    await this.getPaymentDataSQL()
  }

  _resolveOrganizationID(divisionId) {
    if (MS_Divisions.divs.includes(divisionId)) {
      this.organizationID = MS_Divisions.id
    } else if (MK_Divisions.divs.includes(divisionId)) {
      this.organizationID = MK_Divisions.id
    } else {
      this.organizationID = MP_Divisions.id
    }
  }

  _parseResult(result, isSql = false) {
    if (isSql) {
      result.forEach(i => {
        let finalSum = i.SERVICE_QUANTITY * i.SERVICE_FINAL_PRICE
        finalSum = Math.round(finalSum * 100) / 100
        this.actServiceArray.push({
          service: i.SERVICE_NAME, // NAZVANIYE_USLUGI_UKR - название на укр.
          price: finalSum,
          vat: Math.round(i.VAT * 100) / 100,
          discountPercentage: i.DISCOUNT_PERCENTAGE,
          discountSum: i.DISCOUNT_AMOUNT,
          quantity: i.SERVICE_QUANTITY,
          code: i.KASS_CODE
        })
        this.actSum += finalSum
      })
    } else {
      this.actSum = result[0].K_OPLATE
    }

    this.actSum = Math.round(this.actSum * 100) / 100
    this.clientName = result[0].PATIENT_NAME
    this.divisionId = result[0].ID_PUNKTA_PRIEMA_ZAKAZA
    this._resolveOrganizationID(this.divisionId)
  }

  getPaymentDataAPI() {
    return fetch(PAYMENT_ACT_API_PATH + this.actNumber)
      .then(response => {
        if (response.ok) {
          return response.json()
        } else {
          throw new InternalServerError(this.action, 'Failed to get data for payment act number')
        }
      })
      .then(json => {
        if (json.Act.length == 0) {
          throw new NotFoundError(this.action, 'Could not find payment act number - ' + this.actNumber, 21)
        } else {
          this._parseResult(json.Act)
        }
      })
      .catch(err => {
        if(err instanceof BaseError){
          throw err
        }else{
          throw new InternalServerError(this.action, 'Error receiving data from Doctor Eleks : ' + err.message)
        }
      })
  }

  getPaymentDataSQL() {
    let that = this
    const sql = require('mssql')

    return sql
      .connect(PAYMENT_ACT_SQL_CONFIG)
      .then(pool => {
        return (
          pool
            .request()
            //.input('input_parameter', sql.Int, value)
            .query(
              `exec ${PAYMENT_ACT_PROCEDURE_NAME} @FilterXML='<Filter><ActCode>${parseInt(
                that.actNumber
              )}</ActCode></Filter>', @Login='1c', @DoApply=1, @UseForReport = 0`
            )
        )
      })
      .then(result => {
        if (result.recordset.length > 0) {
          that._parseResult(result.recordset, true)
        } else {
          sql.close()
          throw new NotFoundError(this.action, 'Could not find payment act number - ' + that.actNumber, 21)
        }
        sql.close()

        // Stored procedure
        // return pool.request()
        //   .input('input_parameter', sql.Int, value)
        //   .output('output_parameter', sql.VarChar(50))
        //   .execute('procedure_name')
      })
      .catch(err => {
        sql.close()
        if(err instanceof BaseError){
          throw err
        }else{
          throw new InternalServerError(this.action, 'Error receiving data from Doctor Eleks : ' + err.message)
        }
      })
  }
}

module.exports = PaymentAct
