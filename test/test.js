/* jshint expr: true */
var expect = require('chai').expect;

var Validator = require('../lib');

describe('Validator', function() {
		
	it('should initialize with no errors', function() {
		var validator = new Validator();
		expect(validator.errors).to.be.empty;
	});
	describe('is', function() {
		it('should have no errors when a single check is valid', function() {
				
		});
	});
	
	describe('standard validator function', function() {
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
	});
});