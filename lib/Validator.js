// validator.js
var Errors = require('./Errors');

var Validator = function() {
	this.customValidators = [];
	this.transformationMode = 'copy';
	this.endValidation();
};

Validator.prototype._addError = function(error) {
	this.errors.push(error);
};

Validator.prototype._popError = function() {
	this.errors.pop();
};

Validator.prototype.is = function(target, name) {
	return new ValidationChain(this, target, name);
};

Validator.prototype.endValidation = function() {
	this.errors = [];
	this.internalTarget = null;
	this.lastRootTarget = null;
	this.validatedProperties = {};
};

// if there are any errors, create a compound error from all the errors, clear the error list, then throw the new error
// the compound error is a ValidatorError with message created from the messages of each individual error.
// targetName is an array of names, target is an array of targets. An additional property, compoundError, is set to true
Validator.prototype.throwErrors = function() {
	if(this.errors.length === 0) {
		return;
	}

	var message = '';
	var targetNames = [];
	var targetValues = [];
	var parameters = [];
	this.errors.forEach(function(e, i) {
		if(i !== 0) {
			message += ', ';
		}
		message += e.message;
		targetNames.push(e.targetName);
		targetValues.push(e.targetValue);
		parameters.push(e.parameters);
	});

	var compoundError = new Errors.ValidationError(message, targetNames, targetValues, parameters);
	compoundError.compoundError = true;

	this.errors = [];
	throw compoundError;
};

Validator.prototype.whitelist = function(allowedKeys) {
	whitelistProperties(this.internalTarget, this.validatedProperties, allowedKeys);
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
	switch(this.validator.transformationMode) {
		case 'copy':
			if(this.validator.lastRootTarget !== target) {
				this.validator.internalTarget = deepClone(target);
			}
			break;
		case 'mutate':
		case 'none':
			this.validator.internalTarget = target;
			break;
		default:
			throw new Errors.InvalidTransformationModeError('fresh-validation: Invalid transformation mode \'' + this.validator.transformationMode + '\'');
	}
	if(this.validator.lastRootTarget !== target) {
		this.validator.validatedProperties = {};
	}
	this.validator.lastRootTarget = target;
	this.target = this.validator.internalTarget;
	this.name = name;
	this.targetName = name;
	this.propertyStack = [{name: name, val: this.target}];
	this.failureStack = [false];
	this.negateNext = false;
	this.orNext = false;
	this.lastOrNext = false;
	this.orSatisfied = false;
	this.validatedPropertiesStack = [this.validator.validatedProperties];
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

	var validatedPropertyObj = this.validatedPropertiesStack[this.validatedPropertiesStack.length - 1][property] || {};
	this.validatedPropertiesStack[this.validatedPropertiesStack.length - 1][property] = validatedPropertyObj;
	this.validatedPropertiesStack.push(validatedPropertyObj);
	return this;
};

ValidationChain.prototype.back = function() {
	var lastProperty = this.propertyStack.pop();
	this.targetName = this.targetName.slice(0, -(lastProperty.name.length + 1));
	this.failureStack.pop();
	this.target = this.propertyStack[this.propertyStack.length - 1].val;
	this.validatedPropertiesStack.pop();
	return this;
};

ValidationChain.prototype.whitelist = function(allowedKeys) {
	whitelistProperties(this.validator.internalTarget, this.validatedProperties, allowedKeys);
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

function whitelistProperties(o, keyObj, allowedKeys) {
	if(typeof o !== 'object' || o === null) {
		return o;
	}
	for(var p in o) {
		if((keyObj && keyObj.hasOwnProperty(p)) || (allowedKeys && allowedKeys.hasOwnProperty(p))) {
			if(allowedKeys && allowedKeys[p] !== true) {
				whitelistProperties(o[p], keyObj ? keyObj[p] : undefined, allowedKeys ? allowedKeys[p] : undefined);
			}
		}
		else {
			delete o[p];
		}
	}
	return o;
}

module.exports = {
	Validator: Validator,
	ValidationChain: ValidationChain
};
