var ValidationError = function(message, targetName, targetValue, parameters) {
	this.message = message;
	this.stack = (new Error()).stack;
	this.targetName = targetName;
	this.targetValue = targetValue;
	this.parameters = parameters;
};
ValidationError.prototype = new Error();
ValidationError.prototype.name = 'ValidationError';	

var InvalidOperationError = function(message) {
	this.message = message;
	this.stack = (new Error()).stack;
};

InvalidOperationError.prototype = new Error();
InvalidOperationError.prototype.name = 'InvalidOperationError';

module.exports = {
	ValidationError: ValidationError,
	InvalidOperationError: InvalidOperationError
};