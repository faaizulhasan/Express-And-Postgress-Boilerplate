const Validator = require('validatorjs');
const dbContainer = require("../Database/index");
const _ = require('lodash');
const { getSplitCharacter } = require('../Helper');

Validator.registerAsync('unique', async function (value, attribute, req, passes) {
    console.log(value, attribute)
    const [table, col] = attribute.split(",");
    console.log(value)
    const model = dbContainer[table];

    const record = await model.count({ where: { [col]: value, deletedAt: null } });
    console.log("Unique counts : ", record)
    if (record > 0) {
        passes(false, `This ${col} is already registered.`);
    }
    else {
        passes();
    }

});

Validator.registerAsync('exists', async function (value, attribute, req, passes) {
    console.log(value, attribute)
    const [table, col] = attribute.split(",");
    console.log(value)
    const model = dbContainer[table];

    const count = await model.count({ where: { [col]: value, deletedAt: null } });
    if (!count) {
        passes(false, `The ${col} is invalid.`);
    }
    else {
        passes();
    }

});

Validator.register('array_string', (value) => {
    return Array.isArray(value) && value.every(item => _.isString(item))

},
    ':attribute should be list of string.');

Validator.register('notContainSpecialCharacter', (value) => {
    if (Array.isArray(value)) {
        return value.every(item => !item.includes(getSplitCharacter()))
    }
    else {
        return !value.includes(getSplitCharacter())
    }

},
    ':attribute should not contain special character.');


Validator.register('float', (val) => {
    var floatRegex = /^-?\d+(?:[.,]\d*?)?$/;
    if (!floatRegex.test(val))
        return false;

    val = parseFloat(val);
    console.log(val)
    if (isNaN(val) || !(typeof val == 'number'))
        return false;
    return true;

},
    ':attribute must be a float value.');

