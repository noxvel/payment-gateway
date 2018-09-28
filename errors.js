
class BaseError extends Error {

  constructor(message, code, action = '') {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.action = action;
    this.code = code;
    this._xml = '';
  }

  createResponse() {
    let builder = require('xmlbuilder');
    let xml = builder.create('Transfer', {version: '1.0', encoding: 'UTF-8', standalone: true})
      .att('xmlns','http://debt.privatbank.ua/Transfer')
      .att('interface','Debt')
      .att('action',this.action)
      .ele('Data', {'xmlns:xsi':'http://www.w3.org/2001/XMLSchema-instance', 'xsi:type':'ErrorInfo', 'code':this.code})
        .ele('Message', {}, this.message)
      .end({
        pretty: true
      });

    // this._xml = xml.toString();
    return xml.toString();
  }

  get xml(){
    return this._xml;
  }

  set xml(value){
    return; 
  }
}

module.exports.BaseError = BaseError;

module.exports.BadRequestError = class extends BaseError {
    constructor(action = '') {
        super('Неизвестный тип запроса', 1, action);
    }
}

module.exports.NotFoundError = class extends BaseError {
    constructor(action = '', msg = 'Информация не найдена') {
        super(msg, 2, action);
    }
}

module.exports.InternalServerError = class extends BaseError {
    constructor(action = '', msg = 'Внутренняя ошибка сервера') {
        super(msg, 99, action);
    }
}
