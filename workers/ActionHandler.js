const Search = require('../actions/Search.js');
const Check  = require('../actions/Check.js');
const Pay    = require('../actions/Pay.js');

const {
  BadRequestError,
} = require('../errors');

class ActionHandler {
  
  constructor() {
    this.action = '';
    this._xml = '';
    this.result = {};
    this.reference = '';
  }
  
  parseRequest(xml) {
    let parseString = require('xml2js').parseString;
    
    parseString(xml, {
      trim: true
    }, (err, result) => {
      if (err) {
        throw new BadRequestError('Не удалось распарсить тело запроса');
      }
      this._getAction(result);
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

  getRequestValues(){
    this.actionObj.getRequestValues(this.result);
  }
  
  async resolveAction(){
    await this.actionObj.resolveAction();
  }

  createResponse() {
    this._xml = this.actionObj.createResponse();
  };

  _getAction(xml) {
    try {
      this.action = xml.Transfer.$.action;
    } catch (err) {
      throw new BadRequestError('Не удалось получить имя действия');
    }
  }

  get xml() {
    return this._xml;
  }

  set xml(value) {
    return;
  }
}

module.exports = ActionHandler;