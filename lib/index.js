var Validator = require('./Validator').Validator;
var Errors = require('./Errors');
var StandardValidators = require('./StandardValidators');

for(var i = 0; i < StandardValidators.validators.length; i++) {
	Validator.addGlobalValidator(StandardValidators.validators[i]);
}

module.exports = {
	Validator: Validator,
	Errors: Errors
};
