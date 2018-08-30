var Fault  = require('./errors.js');
var Search = require('./actions/Search.js');
var Check  = require('./actions/Check.js');
var Pay    = require('./actions/Pay.js');

const {
  BadRequestError,
  InternalServerError 
} = require('./errors');

class ActionHandler {
  
  constructor() {
    this.action = '';
    this._xml = '';
    this.result = {};
    this.reference = '';
    this.isError = false;
  }
  
  parseRequest(xml) {
    let parseString = require('xml2js').parseString;
    
    parseString(xml, {
      trim: true
    }, (err, result) => {
      //console.dir(result);
      if (err) {
        console.log(err.message);
        this.isError = true;
        throw new BadRequestError();
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
        this.isError = true;
        throw new BadRequestError();
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
      console.log(err.message);
      this.isError = true;
      throw new BadRequestError();
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