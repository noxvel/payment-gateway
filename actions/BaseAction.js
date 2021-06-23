const {
  InternalServerError
} = require('../errors');

class BaseAction {

  constructor(action, typeOfClient) {
    this.action = action;
    this.typeOfClient = typeOfClient
  }

  getRequestValues(reqType, result) {
    try {
      if (reqType === 'json') {
        this._getRequestValuesJSON(result);
      } else if (reqType === 'xml') {
        this._getRequestValuesXML(result);
      }
    } catch (error) {
      throw new InternalServerError(this.action, 'Failed to get parameter value from request - ' + error.message);
    }
  }

  createResponse(reqType) {
    if (reqType === 'json') {
      return this._createResponseJSON();
    } else if (reqType === 'xml') {
      return this._createResponseXML();
    }
  }

}

module.exports = BaseAction;