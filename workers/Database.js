const Sequelize = require('sequelize');
const { SQLITE_FILE_PATH } = require('../connection-config');
const { InternalServerError } = require('../errors');
const { TYPE_OF_CLIENT } =  require('../constants')
const { MODELS } =  require('../models')

class Database {
  constructor(action,typeOfClient) {
    this.action = action;
    this.connection = null;
    this.payment = null;
    this.typeOfClient = typeOfClient
  }

  async connect() {
    return (this.connection = new Sequelize('payments', null, null, {
      dialect: 'sqlite',
      // SQLite only
      storage: SQLITE_FILE_PATH[this.typeOfClient],
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
    this.payment = this.connection.define('payment', MODELS[this.typeOfClient]);

    return await this.payment.sync()

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

  async addPayment(newPayment) {
    return this.payment
      .create(newPayment)
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
