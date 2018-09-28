const Sequelize = require('sequelize');
const { SQLITE_FILE_PATH } = require('./connection-config');
const {
  InternalServerError
} = require('./errors');

class Database {

  constructor(action) {
    this.action = action;
    this.connection = null;
    this.payment = null;
  }

  connect() {
    this.connection = new Sequelize('payments', null, null, {
      dialect: 'sqlite',
      // SQLite only
      storage: SQLITE_FILE_PATH
    });

    this.connection
      .authenticate()
      .then(function (err) {
        console.log('Connection has been established successfully.');
      }, function (err) {
        console.log('Unable to connect to the database:', err);
        throw err;
      });
  }

  async definePayment() {

    //  MODEL
    this.payment = this.connection.define('Payment', {
      actID: Sequelize.STRING(20),
      bonusID: Sequelize.STRING(20),
      actSum: Sequelize.FLOAT(15,2),
      paySum: Sequelize.FLOAT(15,2),
      accrualAmount: Sequelize.FLOAT(15,2),
      divisionID: Sequelize.INTEGER(3),
      clientName: Sequelize.STRING(100),
      statusPay: Sequelize.BOOLEAN,

      // this field is under question
      statusDoc: Sequelize.BOOLEAN
    });


    // // SYNC SCHEMA
    // await this.connection
    //   .sync({
    //     force: false
    //   })
    //   .then(function () {
    //     console.log('It worked!');
    //   }, function (err) {
    //     console.log('An error occurred while creating the table:', err);
    //     throw err;
    //   });

  }

  addPayment(actID, bonusID, actSum, paySum, accrualAmount, divisionID, clientName) {

    return this.payment.create({
        actID: actID,
        bonusID: bonusID,
        actSum: actSum,
        paySum: paySum,
        accrualAmount: accrualAmount,
        divisionID: divisionID,
        clientName: clientName,
        statusPay: false,
        statusDoc: false
      })
      .then(data => {
        console.log(data);
        return data.id;
      })
      .catch(err => {
        console.log('Error while write data in database');
        throw new InternalServerError(this.action);
      })
  }

  async wasPaid(referense) {

    let pm = await this.payment.findById(referense)
    console.log(pm);
    if (pm !== null) {
      if (pm.statusPay) {
        throw new InternalServerError(this.action, 'Платеж уже оплачен');
      }
      // let updatedPM = await pm.update({
      //   statusPay: true
      // })
      // return updatedPM;
      return pm;
    } else {
      throw new InternalServerError(this.action, 'Код reference не найден');
    }
  }

}


module.exports = Database;