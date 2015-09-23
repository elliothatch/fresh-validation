// validator.js
var Errors = require('./Errors');

var Validator = function() {
	this.errors = [];
	this.customValidators = [];
	this.transformationMode = 'copy';
	this.internalTarget = null;
};

Validator.prototype._addError = function(error) {
	this.errors.push(error);
};

Validator.prototype._popError = function() {
	this.errors.pop();
};

Validator.prototype.is = function(target, name) {
	switch(this.transformationMode) {
		case 'copy':
			this.internalTarget = deepClone(target);
			break;
		case 'mutate':
		case 'none':
			this.internalTarget = target;
			break;
		default:
			throw new Errors.InvalidTransformationModeError('fresh-validation: Invalid transformation mode \'' + this.transformationMode + '\'');
	}
	return new ValidationChain(this, this.internalTarget, name);
};

Validator.prototype.resetErrors = function() {
	this.errors = [];
};

Validator.prototype.addValidator = function(name, continueOnFail, errorMessage, validationFunction) {
	//TODO: validate input types
	function notDefined(x) {
		return x === undefined || x === null;
	}
	var customValidator;
	if(typeof name === 'string') {
		if(notDefined(continueOnFail) ||
			notDefined(errorMessage) ||
			notDefined(validationFunction)) {
			throw new Errors.InvalidValidatorError('fresh-validation: Invalid validator');
		}
		customValidator = {
			name: name,
			continueOnFail: continueOnFail,
			errorMessage: errorMessage,
			validationFunction: validationFunction
		};
	}
	else if(typeof name === 'object') {
		if(notDefined(name.name) ||
			notDefined(name.continueOnFail) ||
			notDefined(name.errorMessage) ||
			notDefined(name.validationFunction)) {
			throw new Errors.InvalidValidatorError('fresh-validation: Invalid validator');
		}
		customValidator = {
			name: name.name,
			continueOnFail: name.continueOnFail,
			errorMessage: name.errorMessage,
			validationFunction: name.validationFunction
		};
	}
	else {
		throw new Errors.InvalidValidatorError('fresh-validation: Invalid validator');
	}
	this.customValidators.push(customValidator);
};

Validator.prototype.transformationOutput = function() {
	return this.internalTarget;
};

Validator.addGlobalValidator = function(validator) {
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
	this.lastOrNext = false;
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
	var orNext = this.orNext;
	this.orNext = false;
	var negateNext = this.negateNext;
	this.negateNext = false;
	var lastOrNext = this.lastOrNext;
	this.lastOrNext = orNext;

	if(orNext && this.orSatisfied) {
		return this;
	}

	if(!orNext && this.failureStack[this.failureStack.length - 1]) {
		return this;
	}
	
	var valid = validator.validationFunction.apply(null, [this.target].concat(params));
	if(negateNext) {
		valid = !valid;
	}
	
	var orSatisfied = this.orSatisfied;
	if(!lastOrNext) {
		this.orSatisfied = valid;
	}
	else {
		this.orSatisfied = orSatisfied || valid;
	}

	if(orNext && !orSatisfied && valid) {
		// the or statement wasn't satisfied until now, we need to remove the error we pushed
		this.validator._popError();
	}

	//required is a special case for 2 reasons
	//1. required has different behavior when negated
	//		(required() means 'is defined', not.required() doesn't mean 'is not defined')
	//2. 'not.required' doesn't follow the normal behavior 'pass->continue, fail->abort'
	//		instead, not.required never emits an error, it only continues or doesn't continue
	//note: 'required' is a special case, but the validator 'defined' also exists as a normal validator
	if(valid && validator.name === 'required' && negateNext) {
		//is(null).not.required() -- don't error but don't continue
		this.failureStack[this.failureStack.length - 1] = true;
	}
	else if(valid) {
		//execute transformation
		if(this.validator.transformationMode !== 'none' &&
				(validator.transformationFunction !== undefined && validator.transformationFunction !== null)) {
			this.target = validator.transformationFunction(this.target);
			if(this.propertyStack.length === 1) {
				this.validator.internalTarget = this.target;
			}
			else {
				var thisProperty = this.propertyStack[this.propertyStack.length - 1];
				var lastProperty = this.propertyStack[this.propertyStack.length - 2];
				lastProperty.val[thisProperty.name] = this.target;
			}
		}
	}
	else {
		if(validator.name !== 'required' || (validator.name === 'required' && !negateNext)) {
			//the validator failed and is not 'required', or it is 'required' and it wasn't negated, so it still errors normally
			var errorMessage = validator.errorMessage;
			var validationError = new Errors.ValidationError(interpolateString(validator.errorMessage,
					{ name: this.targetName, val: this.target, not: negateNext ? ' not' : ''}, params),
				this.targetName,
				this.target,
				params);
			if(orNext) {
				// if this is part of an 'or' expression, report a 'compound' error
				var compoundError = this.validator.errors[this.validator.errors.length - 1];
				if(!lastOrNext) {
					//we need to convert the last error to a compound error
					compoundError.message = interpolateString('{name} ({val}) did not satisfy any validator in the OR expression: ',
						{ name: this.targetName, val: this.target}) + compoundError.message;
					compoundError.parameters = [compoundError.parameters];
				}
				//add this error data
				compoundError.message = compoundError.message + ', ' + validationError.message;
				compoundError.parameters.push(params);
			}
			else {
				this.validator._addError(validationError);
			}
			
			if(!validator.continueOnFail) {
				this.failureStack[this.failureStack.length - 1] = true;
			}
		}
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

function deepClone(o) {
	if(typeof o !== 'object' || o === null) {
		return o;
	}
	
	var newObj = (o instanceof Array) ? [] : {};
	for(var p in o) {
		newObj[p] = deepClone(o[p]);
	}
	return newObj;
}

module.exports = {
	Validator: Validator,
	ValidationChain: ValidationChain
};
