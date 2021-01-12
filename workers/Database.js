const Sequelize = require('sequelize');
const { SQLITE_FILE_PATH } = require('../connection-config');
const { InternalServerError } = require('../errors');

class Database {
  constructor(action) {
    this.action = action;
    this.connection = null;
    this.payment = null;
  }

  async connect() {
    return (this.connection = new Sequelize('payments', null, null, {
      dialect: 'sqlite',
      // SQLite only
      storage: SQLITE_FILE_PATH,
      operatorsAliases: '0' 
    }));

    // this.connection
    //   .authenticate()
    //   .then(function () {
    //   }, function (err) {
    //     // console.log('Unable to connect to the database:', err);
    //     throw new InternalServerError(this.action, 'Failed to connect to database: ' + err.message);
    //   });
  }

  async disconnect() {
    return this.connection.close();
  }

  async definePayment() {
    //  MODEL
    return (this.payment = this.connection.define('payment', {
      actID: Sequelize.STRING(20),
      bonusID: Sequelize.STRING(20),
      actSum: Sequelize.FLOAT(15, 2),
      paySum: Sequelize.FLOAT(15, 2),
      accrualAmount: Sequelize.FLOAT(15, 2),
      divisionID: Sequelize.INTEGER(3),
      clientName: Sequelize.STRING(100),
      payStatus: Sequelize.BOOLEAN,
      isCanceled: Sequelize.BOOLEAN
    }));

    // SYNC(Create) SCHEMA
    //await this.connection
    //  .sync({
    //    force: true
    //  })
    //  .then(function () {
    //    console.log('It worked!');
    //  }, function (err) {
    //    console.log('An error occurred while creating the table:', err);
    //    throw err;
    //  });
  }

  async addPayment(actID, bonusID, actSum, paySum, accrualAmount, divisionID, clientName) {
    return this.payment
      .create({
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
        throw new InternalServerError(this.action, 'Error writing payment to database: ' + err.message);
      });
  }

  async findPayment(referense) {
    let pm = await this.payment.findByPk(referense);
    if (pm !== null) {
      if (pm.payStatus) {
        await this.disconnect();
        throw new InternalServerError(this.action, 'Payment already paid - ' + referense);
      }
      return pm;
    } else {
      await this.disconnect();
      throw new InternalServerError(this.action, 'Reference code not found - ' + referense);
    }
  }
  async findAll(limit, offset) {
    let allpm = await this.payment.findAndCountAll({ order: [['id', 'DESC']], limit: limit, offset: offset });
    if (allpm !== null) {
      return allpm;
    } else {
      await this.disconnect();
      throw new InternalServerError(this.action, 'Payments data not found');
    }
  }

  async setPayStatus(pm, reference) {
    if (pm !== undefined) {
      if (pm.payStatus) {
        await this.disconnect();
        throw new InternalServerError(this.action, 'Payment already paid - ' + reference);
      }
      await pm.update({ payStatus: true });
    } else {
      await this.disconnect();
      throw new InternalServerError(this.action, 'Missing entry to update payment status - ' + reference);
    }
  }
}

module.exports = Database;
