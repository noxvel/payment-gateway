const Search = require('../actions/Search.js');
const Check = require('../actions/Check.js');
const Pay = require('../actions/Pay.js');

const {
  BadRequestError,
} = require('../errors');

class ActionHandler {

  constructor(reqType,typeOfClient) {
    this.reqType = reqType;
    this.action = '';
    this.resBody = '';
    this.result = {};
    this.reference = '';
    this.typeOfClient = typeOfClient;
  }

  parseRequest(body) {

    if (this.reqType === 'json') {
      this._parseRequestJSON(body);
    } else if (this.reqType === 'xml') {
      this._parseRequestXML(body);
    }

  }

  _parseRequestJSON(body) {
    try {
      this.action = body.action;
    } catch (err) {
      throw new BadRequestError(this.action, 'Failed to get action name');
    }
    this.result = body;
  }

  _parseRequestXML(body) {
    let parseString = require('xml2js').parseString;

    parseString(body, {
      trim: true
    }, (err, result) => {
      if (err) {
        throw new BadRequestError(this.action, 'Failed to parse request body');
      }
      try {
        this.action = result.Transfer.$.action;
      } catch (err) {
        throw new BadRequestError(this.action, 'Failed to get action name');
      }
      this.result = result;
    });
  }

  createAction() {
    switch (this.action) {
      case "Search":
        this.actionObj = new Search(this.typeOfClient);
        break;
      case "Check":
        this.actionObj = new Check(this.typeOfClient);
        break;
      case "Pay":
        this.actionObj = new Pay(this.typeOfClient);
        break;
      default:
        throw new BadRequestError(this.action, 'Unknown action name - ' + this.action);
    }
  }

  getRequestValues() {
    this.actionObj.getRequestValues(this.reqType,this.result);
  }

  async resolveAction() {
    await this.actionObj.resolveAction();
  }

  createResponse() {
    this.resBody = this.actionObj.createResponse(this.reqType);
  }
  
}

module.exports = ActionHandler;