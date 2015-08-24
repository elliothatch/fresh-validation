/* jshint expr: true */
var expect = require('chai').expect;
var sinon = require('sinon');

var sandbox;

var Validator = require('../lib').Validator;
var StandardValidators = require('../lib/StandardValidators').validators;

function getStandardValidatorByName(name) {
	for(var i = 0; i < StandardValidators.length; i++) {
		var validator = StandardValidators[i];
		if(validator.name === name) {
			return validator;
		}
	}
	throw new Error('No Standard validator with name ' + name);
}

describe('Validator', function() {
	
	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});
	
	afterEach(function() {
		sandbox.restore();
	});
	
	it('should initialize with no errors', function() {
		var validator = new Validator();
		expect(validator.errors).to.be.empty;
	});
	describe('is', function() {
		it('should have no errors when a single check is valid', function() {
				
		});
	});
	
	describe('not', function() {
		it('should negate the next value', function() {
			var validator = new Validator();
			validator.is('a').not.number();
			expect(validator.errors).to.be.empty;
		});
		
		it('should not negate when used twice', function() {
			 var validator = new Validator();
			 validator.is(1).not.not.number();
			 expect(validator.errors).to.be.empty;
		});
	});
	
	describe('required', function() {
		it('should run validators when the value is defined', function() {
			var equalToValidator = getStandardValidatorByName('equalTo');
			sandbox.spy(equalToValidator, 'validationFunction');
			
			var validator = new Validator();
			validator.is('a').required().equalTo('a')
				.is('b').required().equalTo('b');
				
			expect(validator.errors).to.be.empty;
			expect(equalToValidator.validationFunction.callCount).to.equal(2);
		});
		
		it('should error and not run validators when the value is not defined', function() {
			var equalToValidator = getStandardValidatorByName('equalTo');
			sandbox.spy(equalToValidator, 'validationFunction');

			var validator = new Validator();
			validator.is(undefined).required().equalTo('a')
				.is(null).required().equalTo('b');
			
			expect(validator.errors).to.have.length(2);
			expect(equalToValidator.validationFunction.callCount).to.equal(0);			
		});
		
		it('should run validators when negated and the value is defined', function() {
			var equalToValidator = getStandardValidatorByName('equalTo');
			sandbox.spy(equalToValidator, 'validationFunction');
			
			var validator = new Validator();
			validator.is('a').not.required().equalTo('a')
				.is('b').not.required().equalTo('b');
				
			expect(validator.errors).to.be.empty;
			expect(equalToValidator.validationFunction.callCount).to.equal(2);
		});
		
		it('should not error and not run validators when negated and the value is not defined', function() {
			var equalToValidator = getStandardValidatorByName('equalTo');
			sandbox.spy(equalToValidator, 'validationFunction');
			
			var validator = new Validator();
			validator.is(undefined).not.required().equalTo('a')
				.is(null).not.required().equalTo('b');
			
			expect(validator.errors).to.be.empty;
			expect(equalToValidator.validationFunction.callCount).to.equal(0);			
		});
	});

	describe('property', function() {
		it('should validate the properties of an object', function() {
			var validator = new Validator();
			var cObj =  { 
				c1: 'hi', 
				c2: { 
					c2a: 'hello',
					c2b: { length: 5 }
				}
			};
			var dObj =  { 
				d1: 'hi2', 
				d2: { 
					d2a: 'hello2',
					d2b: { length: 6 }
				}
			};
			var obj = {
				a: 1,
				b: 2, 
				c: cObj,
				d: dObj
			};
			validator.is(obj)
				.property('a').equalTo(1).back()
				.property('b').equalTo(2).back()
				.property('c').equalTo(cObj)
					.property('c1').equalTo('hi')
						.property('length').equalTo(2).back()
					.back()
					.property('c2')
						.property('c2a').equalTo('hello').back()
						.property('c2b')
							.property('length').equalTo(5).back()
						.back()
					.back()
				.back()
				.property('d').equalTo(dObj)
					.property('d1').equalTo('hi2').back()
					.property('d2')
						.property('d2a').equalTo('hello2').back()
						.property('d2b')
							.property('length').equalTo(6);
							
			expect(validator.errors).to.be.empty;							
		});
		
		it('should error if a property fails validation', function() {
			var validator = new Validator();
			var cObj =  { 
				c1: 'hi', 
				c2: { 
					c2a: 'hello',
					c2b: { length: 5 }
				}
			};
			var dObj =  { 
				d1: 'hi2', 
				d2: { 
					d2a: 'hello2',
					d2b: { length: 6 }
				}
			};
			var obj = {
				a: 1,
				b: 2, 
				c: cObj,
				d: dObj
			};
			validator.is(obj)
				.property('a').equalTo(2).back()
				.property('b').equalTo(3).back()
				.property('c').equalTo('a')
					.property('c1').equalTo('a')
						.property('length').equalTo(1).back()
					.back()
					.property('c2')
						.property('c2a').equalTo(null).back()
						.property('c2b')
							.property('length').equalTo(6).back()
						.back()
					.back()
				.back()
				.property('d').equalTo('b')
					.property('d1').equalTo('a').back()
					.property('d2')
						.property('d2a').equalTo(null).back()
						.property('d2b')
							.property('length').equalTo(7);
							
				expect(validator.errors).to.have.length(11);
		});
		it('should not valiate child properties if a validator does not continue on fail ', function() {
			var equalToValidator = getStandardValidatorByName('equalTo');
			sandbox.spy(equalToValidator, 'validationFunction');
			
			var validator = new Validator();
			var obj = {
				a: {
					a2: {
						a2a: 1
					},
					a3: {
						a3a: {
							a3a1: 2
						}
					}
				}
			};
			validator.is(obj)
				.property('a')
					.property('a1').required()
						.property('a1a').equalTo(5)
						.back()
					.back()
					.property('a2').string()
						.property('a2a').equalTo(2)
						.back()
					.back()
					.property('a3').string()
						.property('a3a')
							.property('a3a1').equalTo(3).back()
							.property('a3a2').equalTo(3);
							
				expect(validator.errors).to.have.length(3);
				expect(equalToValidator.validationFunction.callCount).to.equal(0);
		});
			
		it('should validate properties as undefined on values that cannot have properties', function() {
			var validator = new Validator();
			validator
				.is(1).property('a').equalTo(undefined)
					.property('b').equalTo(undefined)
				.is(null).property('a').equalTo(undefined)
				.is(undefined).property('a').equalTo(undefined);
				
				expect(validator.errors).to.be.empty;
		});
	});

	describe('errors', function() {
		
	});
	
	describe('addValidator', function() {
		beforeEach(function() {
			this.halfOfValidator = {
				name: 'halfOf',
				continueOnFail: true,
				errorMessage: '{name} {val} {1}',
				validationFunction: function(target, other) {
					return target === other / 2;
				}
			};
		});
		it('should add the validator', function() {
			var validator = new Validator();
			validator.addValidator(this.halfOfValidator);
			validator.is(8).halfOf(16);
			expect(validator.errors).to.be.empty;
		});
	});

	describe('standard validator functions', function() {
		
		function testInputs(validator, inputs) {
			for(var i = 0; i < inputs.length; i++) {
					validator.is(inputs[i]).number();
			}
		}
		describe('required', function() {
			it('should be valid for basic types', function() {
				var validator = new Validator();
				validator.is(1).required()
					.is('a').required()
					.is([]).required()
					.is({a: 'b'}).required();
				expect(validator.errors).to.be.empty;
			});
			
			it('should fail on undefined and null', function() {
				var validator = new Validator();
				validator.is(null).required()
					.is(undefined).required()
					.is().required();
				expect(validator.errors).to.have.length(3);
			});
		});
		describe('string', function() {
			it('should succeed if the input is a string', function() {
				var validator = new Validator();
				validator.is('a').string()
					.is(new String('b')).string(); // jshint ignore:line
				expect(validator.errors).to.be.empty;
			});
			it('should fail if the input is not a string', function() {
				var validator = new Validator();
				validator.is(null).string()
					.is(undefined).string()
					.is(1).string()
					.is({ a: 'a'}).string();
				expect(validator.errors).to.have.length(4);
			});
		});
		describe('number', function() {
			it('should succeed if the input can be interpreted as a number', function() {
				var inputs = [
					"-10",
					"0",
					"5",
					-16,
					0,
					32,
					"040",
					"0xFF",
					0xFFF,
					"-1.6",
					"4.536",
					-2.6,
					3.1415,
					8e5,
					"123e-2"
				];
				var validator = new Validator();
				testInputs(validator, inputs);
				
				expect(validator.errors).to.be.empty;
			});
			it('should fail if the input cannot be interpreted as a number', function() {
				
				var inputs = [
					"",
					"        ",
					"\t\t",
					"abcdefghijklm1234567890",
					"xabcdefx",
					true,
					false,
					"bcfed5.2",
					"7.2acdgs",
					undefined,
					null,
					NaN,
					Infinity,
					Number.POSITIVE_INFINITY,
					Number.NEGATIVE_INFINITY,
					new Date(2009,1,1),
					new Object(), // jshint ignore:line
					function(){}
				];
				var validator = new Validator();
				testInputs(validator, inputs);
				
				expect(validator.errors).to.have.length(inputs.length);
			});
		});
	});
});