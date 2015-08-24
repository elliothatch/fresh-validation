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
// usage:
// var validator = new Validator();
// validator.is('elliot', 'name').string()                     //valid
// 	.is(4, 'count').number().greaterThan(5)                    //invalid
// 	.is(undefined, 'width').number()                           //invalid
// 	.is(undefined, 'height').not.required().number().equalTo(0) //valid
// 	.is({ type: 'a', position: {x: 10, y: 20} }, 'element')
// 		.property('type')                                      //select property
// 			.string().equalTo('a')                             //valid
// 		.back()                                                //return from 'type' property to parent object
// 		.property('position')
// 			.property('x').number().lessThan(15).back()        //valid
// 			.property('y').number().lessThan(15).back()        //invalid
//  .is(5).lessThan(0).or.greaterThan(8).or.equalTo(5)         //valid
//  .is(5).lessThan(0).or.greaterThan(8).equalTo(5)            //invalid
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
//error message interpolated strings:
//{name}: target name
//{val}: target val
//{1}...{n}: nth parameter value	

var Errors = require('./Errors');

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

Validator.prototype.addValidator = function(name, continueOnFail, errorMessage, validationFunction) {
	var customValidator;
	if(typeof name === 'string') {
		customValidator = {
			name: name,
			continueOnFail: continueOnFail,
			errorMessage: errorMessage,
			validationFunction: validationFunction		
		};
	}
	else if(typeof name === 'object') {
		customValidator = {
			name: name.name,
			continueOnFail: name.continueOnFail,
			errorMessage: name.errorMessage,
			validationFunction: name.validationFunction
		};
	}
	else {
		throw new Errors.InvalidValidatorError('fresh-validation: Invalid Validator');
	}
	this.customValidators.push(customValidator);
};

Validator._addPrototypeValidator = function(validator) {
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

var ValidationChain = function(validator, target, name) {
	this.validator = validator;
	this._reset(target, name);
	for(var i = 0; i < validator.customValidators.length; i++) {
		var customValidator = validator.customValidators[i];
		this[customValidator.name] = createValidateFunction(customValidator);
	}
};

ValidationChain.prototype._reset = function(target, name) {
	this.rootTarget = target;
	this.target = target;
	this.name = name;
	this.targetName = name;
	this.propertyStack = [{name: name, val: target}];
	this.failureStack = [false];
	this.negateNext = false;
	this.orNext = false;
	this.orSatisfied = false;
};

ValidationChain.prototype.is = function(target, name) {
	this._reset(target, name);
	return this;
};

//chainers
['a', 'an'].forEach(function(name) {
	Object.defineProperty(ValidationChain.prototype, name, {
		get: function() { return this; },
		enumerable: true
	});
});

Object.defineProperty(ValidationChain.prototype, 'not', {
	get: function() {
		this.negateNext = !this.negateNext;
		return this;
	},
	enumerable: true
});

Object.defineProperty(ValidationChain.prototype, 'or', {
	get: function() {
		this.orNext = true;
		return this;
	},
	enumerable: true
});

ValidationChain.prototype.property = function(property) {
	var propertyVal;
	if(this.target !== undefined && this.target !== null) {
		propertyVal = this.target[property];
	}
	this.propertyStack.push({name: property, val: propertyVal});
	this.target = propertyVal;

	this.targetName += '.' + property;
	this.failureStack.push(this.failureStack[this.failureStack.length - 1]);
	return this;
};

ValidationChain.prototype.back = function() {
	var lastProperty = this.propertyStack.pop();
	this.targetName = this.targetName.slice(0, -(lastProperty.name.length + 1));
	this.failureStack.pop();
	this.target = this.propertyStack[this.propertyStack.length - 1].val;
	return this;
};

ValidationChain.prototype._validate = function(validator, params) {
	if(this.failureStack[this.failureStack.length - 1]) {
		return this;
	}
	
	var orNext = this.orNext;
	this.orNext = false;
	var negateNext = this.negateNext;
	this.negateNext = false;
	
	if(orNext && this.orSatisfied) {
		return this;
	}
	
	var valid = validator.validationFunction.apply(null, [this.target].concat(params));
	if(negateNext) {
		valid = !valid;
	}
	
	this.orSatisfied = orNext && valid;
	
	if(!valid) {
		this.validator._addError(
			new Errors.ValidationError(interpolateString(validator.errorMessage, {
					name: this.targetName, val: this.target}, params),
				this.targetName, this.target, params));
		if(!validator.continueOnFail) {
			this.failureStack[this.failureStack.length - 1] = true;
		}
	}
	return this;
};


//required is a special function instead of a normal validator, for 2 main reasons
//1. required has different behavior when negated
//		(required() means 'is defined', not.required() doesn't mean 'is not defined')
//2. 'not.required' doesn't follow the normal behavior 'pass->continue, fail->abort'
//		instead, not.required never emits an error, it only continues or doesn't continue
//note: 'required' is a special function, but the validator 'defined' also exists as a normal validator
ValidationChain.prototype.required = function(validator) {	
	if(this.failureStack[this.failureStack.length - 1]) {
		return this;
	}
	
	var orNext = this.orNext;
	this.orNext = false;
	var negateNext = this.negateNext;
	this.negateNext = false;
	
	if(orNext && this.orSatisfied) {
		return this;
	}
	
	var defined = this.target !== undefined && this.target !== null;
	
	this.orSatisfied = orNext && defined;
	
	if(!defined) {
		if(!negateNext) {
			this.validator._addError(
				new Errors.ValidationError(interpolateString('{name} is required', {
					name: this.targetName, val: this.target}, []),
				this.targetName, this.target, []));
		}
		this.failureStack[this.failureStack.length - 1] = true;
	}
	
	return this;	
};

//values is an object--property names are matched and their values are interpolated
//params is an array which will be matched by index-1 (e.g. {1} matches params[0])
function interpolateString(str, values, params) {
	return str.replace(/{\w+}/g, function(match) {
		var val = match.slice(1,-1);
		if(/\d+/.test(val)) {
			return params[parseInt(val) - 1];
		}
		else {
			return values[val];
		}
	});
}

module.exports = {
	Validator: Validator,
	ValidationChain: ValidationChain
};