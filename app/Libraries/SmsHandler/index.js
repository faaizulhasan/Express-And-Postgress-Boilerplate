'use strict';

const constants = require('../../config/constants')

class Index {
    static instance() {
        let Sms = require("./" + constants.SMS_SYSTEM);
        return new Sms();
    }
}
module.exports = Index
