const Sequelize = require('sequelize');
const {
  SQLITE_FILE_PATH
} = require('../connection-config');
const {
  InternalServerError
} = require('../errors');

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
      storage: SQLITE_FILE_PATH,
      operatorsAliases: false
    });

    this.connection
      .authenticate()
      .then(function () {
      }, function (err) {
        // console.log('Unable to connect to the database:', err);
        throw new InternalServerError(this.action, 'Не удалось подключиться к базе данных');
      });
  }

  async definePayment() {

    //  MODEL
    this.payment = this.connection.define('Payment', {
      actID: Sequelize.STRING(20),
      bonusID: Sequelize.STRING(20),
      actSum: Sequelize.FLOAT(15, 2),
      paySum: Sequelize.FLOAT(15, 2),
      accrualAmount: Sequelize.FLOAT(15, 2),
      divisionID: Sequelize.INTEGER(3),
      clientName: Sequelize.STRING(100),
      payStatus: Sequelize.BOOLEAN,
      isCanceled: Sequelize.BOOLEAN
    });


    // // SYNC(Create) SCHEMA
    // await this.connection
    //   .sync({
    //     force: true 
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
        payStatus: false,
        isCanceled: false
      })
      .then(data => {
        return data.id;
      })
      .catch(err => {
        throw new InternalServerError(this.action, 'Ошибка записи платежа');
      })
  }

  async findPayment(referense) {

    let pm = await this.payment.findById(referense)
    if (pm !== null) {
      if (pm.payStatus) {
        throw new InternalServerError(this.action, 'Платеж уже оплачен - ' + referense);
      }
      return pm;
    } else {
      throw new InternalServerError(this.action, 'Код reference не найден - ' + referense);
    }
  }

  async setPayStatus(pm, reference) {

    if (pm !== undefined) {
      if (pm.payStatus) {
        throw new InternalServerError(this.action, 'Платеж уже оплачен - ' + reference);
      }
      await pm.update({ payStatus: true })
    } else {
      throw new InternalServerError(this.action, 'Отсутствует запись для обновления статуса оплаты');
    }
  }
}

module.exports = Database;