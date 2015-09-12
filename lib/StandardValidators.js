var validators = [
	{
		name: 'required',
		continueOnFail: false,
		errorMessage: '{name} ({val}) is required',
		validationFunction: function(target) {
			return target !== undefined && target !== null;
		}
	},
	{
		name: 'equalTo',
		continueOnFail: true,
		errorMessage: '{name} ({val}) must be equal to {1}',
		validationFunction: function(target, other) {
			return target === other;
		}
	},
	{
		name: 'greaterThan',
		continueOnFail: true,
		errorMessage: '{name} ({val}) must be greater than {1}',
		validationFunction: function(target, other) {
			return target > other;
		}
	},
	{
		name: 'lessThan',
		continueOnFail: true,
		errorMessage: '{name} ({val}) must be less than {1}',
		validationFunction: function(target, other) {
			return target < other;
		}
	},
	{
		name: 'instanceof',
		continueOnFail: false,
		errorMessage: '{name} ({val}) must be an instance of {1}',
		validationFunction: function(target, instance) {
				return target instanceof instance;			
			}
	},
	{
		name: 'string',
		continueOnFail: false,
		errorMessage: '{name} ({val}) must be a string',
		validationFunction: function(target) {
				return (typeof target === 'string' || target instanceof String);			
			}
	},
	{
		name: 'number',
		continueOnFail: false,
		errorMessage: '{name} ({val}) must be a string',
		validationFunction: function(target) {
				return !isNaN(parseFloat(target)) && isFinite(target);			
			}
	}
];

module.exports = { validators: validators};
