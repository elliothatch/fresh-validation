var validators = [
	{
		//note: required has special case logic in _validate
		name: 'required',
		continueOnFail: false,
		errorMessage: '{name} ({val}) is{not} required',
		validationFunction: function(target) {
			return target !== undefined && target !== null;
		}
	},
	{
		name: 'defined',
		continueOnFail: false,
		errorMessage: '{name} ({val}) must{not} be defined',
		validationFunction: function(target) {
			return target !== undefined && target !== null;
		}
	},
	{
		name: 'instanceof',
		continueOnFail: false,
		errorMessage: '{name} ({val}) must{not} be an instance of {1}',
		validationFunction: function(target, instance) {
				return target instanceof instance;
			}
	},
	//type checks and conversions
	{
		name: 'object',
		continueOnFail: false,
		errorMessage: '{name} ({val}) must{not} be a object',
		validationFunction: function(target) {
			if(target === Object(target)) {
				return true;
			}
			else if(isString(target)) {
				try {
					var o = JSON.parse(target);
					return o && typeof o === 'object' && o !== null;
				}
				catch(e) {
					return false;
				}
			}
			return false;
		},
		transformationFunction: function(target) {
			if(target === Object(target)) {
				return target;
			}
			return JSON.parse(target);
		}
	},
	{
		name: 'string',
		continueOnFail: false,
		errorMessage: '{name} ({val}) must{not} be a string',
		validationFunction: function(target) {
			return isString(target);
		}
	},
	{
		name: 'number',
		continueOnFail: false,
		errorMessage: '{name} ({val}) must{not} be a number',
		validationFunction: function(target) {
			return isNumber(target);
		},
		transformationFunction: function(target) {
			return Number(target);
		}
	},
	{
		name: 'integer',
		continueOnFail: false,
		errorMessage: '{name} ({val}) must{not} be a integer',
		validationFunction: function(target) {
			return isNumber(target) && target % 1 === 0;
		},
		transformationFunction: function(target) {
			return parseInt(target);
		}
	},
	{
		name: 'array',
		continueOnFail: false,
		errorMessage: '{name} ({val}) must{not} be a array',
		validationFunction: function(target) {
			return isArray(target);
		},
		transformationFunction: function(target) {
			if(isArray(target)) {
				return target;
			}
			return JSON.parse(target);
		}
	},
	//TODO: date (allow one or more input format, e.g. MM-DD-YYYY)
	//value checks
	{
		name: 'contains',
		continueOnFail: false,
		errorMessage: '{name} ({val}) must{not} contain the element {1}',
		validationFunction: function(target, other) {
			if(isArray(target)) {
				return target.indexOf(other) !== -1;
			}
			return other in target;
		}
	},
	{
		name: 'equalTo',
		continueOnFail: true,
		errorMessage: '{name} ({val}) must{not} be equal to {1}',
		validationFunction: function(target, other) {
			return target === other;
		}
	},
	{
		name: 'deepEqualTo',
		continueOnFail: true,
		errorMessage: '{name} ({val}) must{not} be deeply equal to {1}',
		validationFunction: function(target, other) {
			return isDeepEqual(target, other);
		}
	},
	{
		name: 'greaterThan',
		continueOnFail: true,
		errorMessage: '{name} ({val}) must{not} be greater than {1}',
		validationFunction: function(target, other) {
			return target > other;
		}
	},
	{
		name: 'lessThan',
		continueOnFail: true,
		errorMessage: '{name} ({val}) must{not} be less than {1}',
		validationFunction: function(target, other) {
			return target < other;
		}
	},
];

function isString(target) {
	return (typeof target === 'string' || target instanceof String);
}
function isArray(target) {
	return Array.isArray(target);
}

function isNumber(target) {
	return !isNaN(parseFloat(target)) && isFinite(target);
}

function isDeepEqual(target, other) {
	if(target === other) {
		return true;
	}
	if(typeof target === 'object' && typeof other === 'object') {
		var targetKeys = Object.keys(target).sort();
		var otherKeys = Object.keys(other).sort();
		if(targetKeys.length !== otherKeys.length) {
			return false;
		}
		for(var i = 0; i < targetKeys.length; i++) {
			if(targetKeys[i] !== otherKeys[i]) {
				return false;
			}
		}
		for(var p in target) {
			if(!isDeepEqual(target[p], other[p])) {
				return false;
			}
		}
		return true;
	}
	return false;
}

module.exports = { validators: validators};
