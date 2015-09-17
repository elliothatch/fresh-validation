var validators = [
	//type checks
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
	{
		name: 'object',
		continueOnFail: false,
		errorMessage: '{name} ({val}) must{not} be a object',
		validationFunction: function(target) {
				return target === Object(obj);
			}
	},
	{
		name: 'string',
		continueOnFail: false,
		errorMessage: '{name} ({val}) must{not} be a string',
		validationFunction: function(target) {
				return (typeof target === 'string' || target instanceof String);
			}
	},
	{
		name: 'number',
		continueOnFail: false,
		errorMessage: '{name} ({val}) must{not} be a number',
		validationFunction: function(target) {
				return isNumber(target);
			}
	},
	{
		name: 'integer',
		continueOnFail: false,
		errorMessage: '{name} ({val}) must{not} be a integer',
		validationFunction: function(target) {
			return isNumber(target) && target % 1 === 0;
		}
	},
	{
		name: 'array',
		continueOnFail: false,
		errorMessage: '{name} ({val}) must{not} be a array',
		validationFunction: function(target) {
			return isArray(target);
		}
	},
	{
		name: 'contains',
		continueOnFail: false,
		errorMessage: '{name} ({val}) must{not} contain the element {1}',
		validationFunction: function(target, other) {
			if(isArray(target)) {
				return target.indexOf(other) !== -1;
			}
			return other in obj;
		}
	},
	//TODO: date (allow one or more input format, e.g. MM-DD-YYYY)
	//value checks
	{
		name: 'equalTo',
		continueOnFail: true,
		errorMessage: '{name} ({val}) must{not} be equal to {1}',
		validationFunction: function(target, other) {
			return target === other;
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

function isArray(target) {
	return Array.isArray(target);
}

function isNumber(target) {
	return !isNaN(parseFloat(target)) && isFinite(target);
}

module.exports = { validators: validators};
