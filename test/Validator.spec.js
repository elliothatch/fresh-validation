/* jshint expr: true */
var expect = require('chai').expect;
var sinon = require('sinon');

var sandbox;

var Validator = require('../lib').Validator;
var StandardValidators = require('../lib/StandardValidators').validators;
var Errors = require('../lib/Errors');

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

	describe('or', function() {
		it('should have no errors if any value in the expression is valid', function() {
			var validator1 = new Validator();
			validator1.is('a').equalTo('a').or.equalTo('b').or.equalTo('c');
			expect(validator1.errors).to.be.empty;
		
			var validator2 = new Validator();
			validator2.is('b').equalTo('a').or.equalTo('b').or.equalTo('c');
			expect(validator2.errors).to.be.empty;
		
			var validator3 = new Validator();
			validator3.is('c').equalTo('a').or.equalTo('b').or.equalTo('c');
			expect(validator3.errors).to.be.empty;

			var validator4 = new Validator();
			validator4.is('a').equalTo('a').or.equalTo('a').or.equalTo('c');
			expect(validator4.errors).to.be.empty;

			var validator5 = new Validator();
			validator5.is('a').equalTo('a').or.equalTo('b').or.equalTo('a');
			expect(validator5.errors).to.be.empty;

			var validator6 = new Validator();
			validator6.is('a').equalTo('b').or.equalTo('a').or.equalTo('a');
			expect(validator6.errors).to.be.empty;

			var validator7 = new Validator();
			validator7.is('a').equalTo('a').or.equalTo('a').or.equalTo('a');
			expect(validator7.errors).to.be.empty;
		});

		it('should work with complex validations', function() {
			var validator = new Validator();
			validator.is('b').string().equalTo('a').or.equalTo('b').or.not.equalTo('c').not.number();
			expect(validator.errors).to.be.empty;
		});

		it('should have one error if no values are valid', function() {
			var validator = new Validator();
			validator.is('z').equalTo('a').or.equalTo('b').or.equalTo('c');
			expect(validator.errors).to.have.length(1);
		});

		it('should report errors correctly in complex validations', function() {
			var validator1 = new Validator();
			validator1.is('a').equalTo('y').equalTo('x').equalTo('a').or.equalTo('b').or.equalTo('c').equalTo('w').equalTo('v').equalTo(1).or.equalTo(2);
			expect(validator1.errors).to.have.length(5);

			var validator2 = new Validator();
			validator2.is('b').equalTo('y').equalTo('x').equalTo('a').or.equalTo('b').or.equalTo('c').equalTo('w').equalTo('v').equalTo(1).or.equalTo(2);
			expect(validator2.errors).to.have.length(5);

			var validator3 = new Validator();
			validator3.is('c').equalTo('y').equalTo('x').equalTo('a').or.equalTo('b').or.equalTo('c').equalTo('w').equalTo('v').equalTo(1).or.equalTo(2);
			expect(validator3.errors).to.have.length(5);

			var validator4 = new Validator();
			validator4.is('z').equalTo('y').equalTo('x').equalTo('a').or.equalTo('b').or.equalTo('c').equalTo('w').equalTo('v');
			expect(validator4.errors).to.have.length(5);
		});

		it('should work with required', function() {
			var validator1 = new Validator();
			validator1.is('a').required().or.equalTo('b').or.equalTo('c');
			expect(validator1.errors).to.be.empty;
		
			var validator2 = new Validator();
			validator2.is('b').equalTo('a').or.required().or.equalTo('c');
			expect(validator2.errors).to.be.empty;
		
			var validator3 = new Validator();
			validator3.is('c').equalTo('a').or.equalTo('b').or.required();
			expect(validator3.errors).to.be.empty;

			var validator4 = new Validator();
			validator4.is(null).required().or.equalTo(null);
			expect(validator4.errors).to.be.empty;

			var validator5 = new Validator();
			validator5.is(null).equalTo('a').or.required().or.equalTo(null);
			expect(validator5.errors).to.be.empty;

			var validator6 = new Validator();
			validator5.is(null).equalTo(null).or.required().or.equalTo('b');
			expect(validator6.errors).to.be.empty;

			var validator7 = new Validator();
			validator7.is(null).required().or.not.required();
			validator7.is('a').required().or.not.required();
			expect(validator7.errors).to.be.empty;

			var validator8 = new Validator();
			validator8.is(null).required().or.equalTo('a').or.equalTo('b');
			expect(validator8.errors).to.have.length(1);

			var validator9 = new Validator();
			validator9.is(null).equalTo('a').or.required().or.equalTo('b');
			expect(validator9.errors).to.have.length(1);
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
				.property('c').deepEqualTo(cObj)
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
				.property('d').deepEqualTo(dObj)
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

	describe('transformation', function() {
		beforeEach(function() {
			this.input = {
				numStr: '5.2',
				obj: {
					a: '{"b":2}'
				}
			};
		});

		it('should make a copy in copy mode', function() {
			var validator = new Validator();
			validator.transformationMode = 'copy';
			validator.is(this.input)
				.property('numStr').number().equalTo(5.2).back()
				.property('obj').property('a').object().deepEqualTo({b:2});

			expect(validator.errors).to.be.empty;
			var output = validator.transformationOutput();
			expect(output).to.not.equal(this.input);
			expect(output).to.deep.equal({ numStr: 5.2, obj: {a:{b:2}} });
		});

		it('should mutate the object in mutate mode', function() {
			var validator = new Validator();
			validator.transformationMode = 'mutate';
			validator.is(this.input)
				.property('numStr').number().equalTo(5.2).back()
				.property('obj').property('a').object().deepEqualTo({b:2});

			expect(validator.errors).to.be.empty;
			var output = validator.transformationOutput();
			expect(output).to.equal(this.input);
			expect(this.input).to.deep.equal({ numStr: 5.2, obj: {a:{b:2}} });
		});

		it('should not perform transformations in \'none\' mode', function() {
			var validator = new Validator();
			validator.transformationMode = 'none';
			validator.is(this.input)
				.property('numStr').number().equalTo('5.2').back()
				.property('obj').property('a').object().deepEqualTo('{"b":2}');

			expect(validator.errors).to.be.empty;
			var output = validator.transformationOutput();
			expect(output).to.deep.equal({ numStr: '5.2', obj: {a:'{"b":2}'} });
		});
	});
	describe('errors', function() {
		describe('InvalidValidatorError', function() {
			it('should be thrown when an invalid validator is passed to addValiator', function() {
				var validator = new Validator();
				expect(function() { validator.addValidator(5); }).to.throw(Errors.InvalidValidatorError);
				expect(function() { validator.addValidator('a'); }).to.throw(Errors.InvalidValidatorError);
				expect(function() { validator.addValidator([]); }).to.throw(Errors.InvalidValidatorError);
				expect(function() { validator.addValidator({}); }).to.throw(Errors.InvalidValidatorError);
			});
		});
		describe('InvalidTransformationModeError', function() {
			it('should be thrown when the transformation mode is invalid', function() {
				var validator = new Validator();
				validator.transformationMode = 'bad mode';
				expect(function() { validator.is('a').equalTo('a'); }).to.throw(Errors.InvalidTransformationModeError);
			});
		});
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
		
		function testInputs(validator, func, inputs) {
			var outputs = [];
			for(var i = 0; i < inputs.length; i++) {
					validator.is(inputs[i])[func]();
					outputs.push(validator.transformationOutput());
			}
			return outputs;
		}
		describe('required', function() {
			it('should be valid for basic types', function() {
				var inputs = [
					1,
					'a',
					[],
					{a: 'b'}
			];
				var validator = new Validator();
				testInputs(validator, 'required', inputs);
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
		describe('defined', function() {
			it('should be valid for basic types', function() {
				var inputs = [
					1,
					'a',
					[],
					{a: 'b'}
			];
				var validator = new Validator();
				testInputs(validator, 'required', inputs);
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
		//describe('instanceof', function() {
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
				testInputs(validator, 'number', inputs);
				
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
				testInputs(validator, 'number', inputs);
				
				expect(validator.errors).to.have.length(inputs.length);
			});
			it('should transform values into numbers', function() {
				// NOTE: octal notation is not supported in ES5, so 040 is cast to 40, not 32
				// This is intended behavior.
				var inputs = [
					"-10",
					"0",
					"5",
					-16,
					0,
					32,
					//"040",
					"0xFF",
					0xFFF,
					"-1.6",
					"4.536",
					-2.6,
					3.1415,
					8e5,
					"123e-2"
				];
				var outputs = [
					-10,
					0,
					5,
					-16,
					0,
					32,
					//040,
					0xFF,
					0xFFF,
					-1.6,
					4.536,
					-2.6,
					3.1415,
					8e5,
					123e-2
				];
				var validator = new Validator();
				var outs = testInputs(validator, 'number', inputs);

				expect(validator.errors).to.be.empty;
				expect(outs).to.deep.equal(outputs);
			});
		});
		describe('integer', function() {
			it('should succeed if the input can be interpreted as an integer', function() {
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
					8e5,
				];
				var validator = new Validator();
				testInputs(validator, 'number', inputs);
				
				expect(validator.errors).to.be.empty;
			});
			it('should fail if the input cannot be interpreted as a integer', function() {
				
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
					function(){},
					"-1.6",
					"4.536",
					-2.6,
					3.1415,
					"123e-2"
				];
				var validator = new Validator();
				testInputs(validator, 'integer', inputs);
				
				expect(validator.errors).to.have.length(inputs.length);
			});
			it('should transform values into integers', function() {
				var inputs = [
					"-10",
					"0",
					"5",
					-16,
					0,
					32,
					"0xFF",
					0xFFF,
					8e5
				];
				var outputs = [
					-10,
					0,
					5,
					-16,
					0,
					32,
					0xFF,
					0xFFF,
					8e5
				];
				var validator = new Validator();
				var outs = testInputs(validator, 'integer', inputs);

				expect(validator.errors).to.be.empty;
				expect(outs).to.deep.equal(outputs);
			});
		});
		describe('array', function() {
			it('should succeed if the input can be interpreted as an array', function() { 
				var inputs = [
					[],
					[1, 'a', [{a: 'b'}]],
					'[]',
					'[1, "a", [{"a": "c"}]]'
				];
				var validator = new Validator();
				testInputs(validator, 'array', inputs);
				
				expect(validator.errors).to.be.empty;
			});
			it('should fail if the input cannot be interpreted as an array', function() { 
				var inputs = [
					1,
					'a',
					{a: 'b'},
					'{ "a": ["b"]}'
				];
				var validator = new Validator();
				testInputs(validator, 'array', inputs);
				
				expect(validator.errors).to.have.length(inputs.length);
			});
			it('should transform values into arrays', function() {
				var inputs = [
					[],
					[1, 'a', [{a: 'b'}]],
					'[]',
					'[1, "a", [{"a": "c"}]]'
				];
				var outputs = [
					[],
					[1, 'a', [{a: 'b'}]],
					[],
					[1, 'a', [{a: 'c'}]]
				];
				var validator = new Validator();
				var outs = testInputs(validator, 'array', inputs);

				expect(validator.errors).to.be.empty;
				expect(outs).to.deep.equal(outputs);
			});
		});

	});
});
var input = { color: 'orange', param: { b: 'hello' }, position: {x: 10, y: 20} };
var validator = new Validator();
validator.is(input, 'input')
		.property('color')
			.string().equalTo('orange')                            // valid
		.back()
		.property('param').instanceOf(Error)                       // invalid
			.property('message').string().back()                  // not executed
		.back()
		.property('position')
			.property('x').number().lessThan(15).back()            // valid
			.property('y').number().lessThan(15).back();            // valid

console.log(validator.errors);
