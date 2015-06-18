// validator.js
// chainable validation
//
// each error is a ValidationChainError pushed to the errors array
// all is() calls will be run even if previous is() failed
// remaining validations in the is() call will only be run if the validator has 'continueOnFail' set
// type checks and notRequired have 'continueOnFail' set to false, while equalTo(), etc. is set to true
// the 'failed' flag is reset on every is()
// 'failed' is also reset on back() if the error occured in the child property
// custom validation functions can be added to each validator instance, or to a specific validation (is) instance
// custom validation functions will override built-in validation functions
// validation functions must return true if the validation succeeded and false if it failed
//
// TODO: add 'or' and 'not'
// TODO: add chainers 'a', 'an'
// TODO: allow text interpolation in error messages
// usage:
// var validator = new Validator();
// validator.is('elliot', 'name').string()                      //valid
// 	.is(4, 'count').number().greaterThan(5)                    //invalid
// 	.is(undefined, 'width').number()                           //invalid
// 	.is(undefined, 'height').notRequired().number().equalTo(0) //valid
// 	.is({ type: 'a', position: {x: 10, y: 20} }, 'element')
// 		.property('type')                                      //select property
// 			.string().equalTo('a')                             //valid
// 		.back()                                                //return from 'type' property to parent object
// 		.property('position')
// 			.property('x').number().lessThan(15).back()        //valid
// 			.property('y').number().lessThan(15)               //invalid
// 
// var errors = validator.getErrors();
// console.log(validatior.getErrorMessage());
// output:
// count (4) must be greater than 5, width (undefined) must be a number, element.position.y (20) must be less than 15
// 
// errors: [ValdiationError {message: 'count (4) must be greater than 5', 
//							targetName: 'count' targetValue: 4, parameter: 5}, ... ]
// 
// validator.addValidator('isInArray', true, 'must be an element in the array',
// 	function(target, param) {
// 		return param.indexOf(target) !== -1;
// 	});
// 
//validator
// {
// 		name: string
// 		continueOnFail: boolean
// 		errorMessage: string
// 		validationFunction: function
// }	

var Validator = function() {
	this.errors = [];
	this.customValidators = [];
};

Validator.prototype._addError = function(error) {
	this.errors.push(error);
};

Validator.prototype.is = function(target, name) {
	return new ValidationChain(this, target, name);
};

Validator.prototype.addValidator = function(name, continueOnFail, errorMessage, validationFunc) {
	this.customValidators.push({
		name: name,
		continueOnFail: continueOnFail,
		errorMessage: errorMessage,
		validationFunction: validationFunc		
	});
};

var ValidationChain = function(validator, target, name) {
	this.validator = validator;
	this._reset(target, name);
	for(var i = 0; i < validator.customValidators.length; i++) {
		var customValidator = validator.customValidators[i];
		this[customValidator.name] = createValidateFunction(validator);
	}
};

ValidationChain.prototype._reset = function(target, name) {
	this.rootTarget = target;
	this.target = target;
	this.name = name;
	this.targetName = name;
	this.propertyStack = [];
	this.failureStack = [false];	
};

ValidationChain.prototype.is = function(target, name) {
	this._reset(target, name);
	return this;
};

ValidationChain.prototype.property = function(property) {
	this.propertyStack.push(property);
	this.targetName += '.' + property;
	this.failureStack.push(this.failureStack[this.failureStack.length - 1]);
	return this;
};

ValidationChain.prototype.back = function() {
	var lastProperty = this.propertyStack.pop();
	this.targetName = this.targetName.slice(-lastProperty.length);
	this.failureStack.pop();
	return this;
};

ValidationChain.prototype._validate = function(validator, params) {
	if(this.failureStack[this.failureStack.length - 1]) {
		return this;
	}
	
	if(!validator.validationFunction.apply(null, [this.target].concat(params))) {
		this.validator._addError(
			new ValidationError(interpolateString(validator.errorMessage, [this.targetName].concat(params)),
				this.targetName, this.target, params));
		if(!validator.continueOnFail) {
			this.failureStack[this.failureStack.length - 1] = true;
		}
	}
	return this;
};

function interpolateString(str, params) {
	return str + ': ' + params;	
}

ValidationChain._addPrototypeValidator = function(validator) {
	ValidationChain.prototype[validator.name] = createValidateFunction(validator);
};

function createValidateFunction(validator) {
	return function() {
		var params = [];
		for(var i = 0; i < arguments.length; i++) {
  			params.push(arguments[i]);
		}
		return this._validate(validator, params);	
	};
}

ValidationChain._addPrototypeValidator({
		name: 'required',
		continueOnFail: false,
		errorMessage: '{1} is required',
		validationFunction: function(target) {
				return target !== undefined && target !== null;			
			}
});

var ValidationError = function(message, targetName, targetValue, parameters) {
	this.message = message;
	this.stack = (new Error()).stack;
	this.targetName = targetName;
	this.targetValue = targetValue;
	this.parameters = parameters;
};
ValidationError.prototype = new Error();
ValidationError.prototype.name = 'ValidationError';	

module.exports = Validator;