var ValidationError = function(message, targetName, targetValue, parameters) {
	this.message = message;
	this.stack = (new Error()).stack;
	this.targetName = targetName;
	this.targetValue = targetValue;
	this.parameters = parameters;
};
ValidationError.prototype = new Error();
ValidationError.prototype.name = 'ValidationError';	

var InvalidValidatorError = function(message) {
	this.message = message;
	this.stack = (new Error()).stack;
};

InvalidValidatorError.prototype = new Error();
InvalidValidatorError.prototype.name = 'InvalidValidatorError';

module.exports = {
	ValidationError: ValidationError,
	InvalidValidatorError: InvalidValidatorError
};