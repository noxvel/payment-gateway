const { TYPE_OF_CLIENT } = require('./constants')
const { DataTypes } = require('sequelize')

exports.MODELS = {
  website: {
    actID: DataTypes.STRING(20),
    bonusID: DataTypes.STRING(20),
    actSum: DataTypes.FLOAT(15, 2),
    paySum: DataTypes.FLOAT(15, 2),
    accrualAmount: DataTypes.FLOAT(15, 2),
    divisionID: DataTypes.INTEGER(3),
    clientName: DataTypes.STRING(100),
    payStatus: DataTypes.BOOLEAN,
    isCanceled: DataTypes.BOOLEAN,
  },
  selfpayment: {
    actID: DataTypes.STRING(20),
    bonusID: DataTypes.STRING(20),
    actSum: DataTypes.FLOAT(15, 2),
    paySum: DataTypes.FLOAT(15, 2),
    accrualAmount: DataTypes.FLOAT(15, 2),
    divisionID: DataTypes.INTEGER(3),
    clientName: DataTypes.STRING(100),
    payStatus: DataTypes.BOOLEAN,
    isCanceled: DataTypes.BOOLEAN,
    terminalID: DataTypes.INTEGER(4)
  },
}
