const CURRENT_LANG = 'ua';
const ERROR_TRANSLATE = {
  types: {
    1: {
      name: {
        en: 'Unknown request type',
        ua: 'Невідомий тип запиту',
        ru: 'Неизвестный тип запроса'
      }
    },
    2: {
      name: {
        en: 'Information not found',
        ua: 'Інформація не знайдена',
        ru: 'Информация не найдена'
      }
    },
    99: {
      name: {
        en: 'Internal server error',
        ua: 'Внутрішня помилка сервера',
        ru: 'Внутренняя ошибка сервера'
      }
    }
  }
}

class BaseError extends Error {

  constructor(message, code, action = '') {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.action = action;
    this.code = code;
  }

  createResponse(reqType) {
    if (reqType === 'json') {
      return this._createResponseJSON();
    } else if (reqType === 'xml') {
      return this._createResponseXML();
    }
  }
  _createResponseJSON() {
    let resBody = {
      action: this.action,
      code: this.code,
      message: ERROR_TRANSLATE.types[this.code].name[CURRENT_LANG],
      message_details: this.message
    }
    return JSON.stringify(resBody);
  }

  _createResponseXML() {
    let builder = require('xmlbuilder');
    let xml = builder.create('Transfer', { version: '1.0', encoding: 'UTF-8', standalone: true })
      .att('xmlns', 'http://debt.privatbank.ua/Transfer')
      .att('interface', 'Debt')
      .att('action', this.action)
      .ele('Data', { 'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance', 'xsi:type': 'ErrorInfo', 'code': this.code })
      .ele('Message', {}, this.message)
      .end({
        pretty: true
      });

    // this._xml = xml.toString();
    return xml.toString();
  }

}

module.exports.BaseError = BaseError;

module.exports.BadRequestError = class extends BaseError {
  constructor(msg = 'Unknown request type', action = '') {
    super(msg, 1, action);
  }
}

module.exports.NotFoundError = class extends BaseError {
  constructor(action = '', msg = 'Information not found') {
    super(msg, 2, action);
  }
}

module.exports.InternalServerError = class extends BaseError {
  constructor(action = '', msg = 'Internal server error') {
    super(msg, 99, action);
  }
}
