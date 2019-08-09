const Search = require('../actions/Search.js');
const Check = require('../actions/Check.js');
const Pay = require('../actions/Pay.js');

const {
  BadRequestError,
} = require('../errors');

class ActionHandler {

  constructor(reqType) {
    this.reqType = reqType;
    this.action = '';
    this.resBody = '';
    this.result = {};
    this.reference = '';
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
      throw new BadRequestError('Не удалось получить имя действия');
    }
    this.result = body;
  }

  _parseRequestXML(body) {
    let parseString = require('xml2js').parseString;

    parseString(body, {
      trim: true
    }, (err, result) => {
      if (err) {
        throw new BadRequestError('Не удалось распарсить тело запроса');
      }
      try {
        this.action = result.Transfer.$.action;
      } catch (err) {
        throw new BadRequestError('Не удалось получить имя действия');
      }
      this.result = result;
    });
  }

  createAction() {
    switch (this.action) {
      case "Search":
        this.actionObj = new Search();
        break;
      case "Check":
        this.actionObj = new Check();
        break;
      case "Pay":
        this.actionObj = new Pay();
        break;
      default:
        throw new BadRequestError('Неизвестное название действия - ' + this.action);
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