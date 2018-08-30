const sql = require('mssql');
const { PAYMENT_ACT_SQL_CONFIG } = require('./connection-config');

class PaymentAct {
  constructor(actNumber) {
    this.actNumber = actNumber;
    this.divisionId = '';
    this.clientName = '';
    this.paySum = 0; 
    this.isError = false;
  }
  
  _parseResult(result){
    for (let i of result){
      this.paySum += i.SERVICE_FINAL_PRICE;
    }
    this.clientName = result[0].PATIENT_NAME;
    this.divisionId = result[0].ID_PUNKTA_PRIEMA_ZAKAZA;
  }
  
  getPaymentData() {
    
    let that = this;
    
    sql.on('error', err => {
      // ... error handler
      throw Error('Ошибка при получения данных по номеру акта');
    })

    return sql.connect(PAYMENT_ACT_SQL_CONFIG).then(pool => {
      // Query

      return pool.request()
        //.input('input_parameter', sql.Int, value)
        .query(`exec spReport1cGetBookingByActNumberWithoutPlnStatus @FilterXML='<Filter><ActCode>${that.actNumber}</ActCode></Filter>', @Login='1c', @DoApply=1, @UseForReport = 0`)
    }).then(result => {
      console.dir(result.recordset)
      if (result.recordset.length > 0){
        that._parseResult(result.recordset);
      }else{
        this.isError = true;
      }
      sql.close();

      // Stored procedure

      // return pool.request()
      //   .input('input_parameter', sql.Int, value)
      //   .output('output_parameter', sql.VarChar(50))
      //   .execute('procedure_name')
    }).catch(err => {
      console.log(err.message);
      sql.close();
      // ... error checks
      throw Error('Ошибка при получения данных по номеру акта');
    })

    //sql.close();

   }

}

module.exports = PaymentAct;