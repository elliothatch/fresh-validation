# fresh-validation
## chainable validation to ensure those inputs are fresh

# Introduction

fresh-validation is an input validation library that supports custom validators
and data transformations with a simple chainable interface.  

Validation code doesn't exit early, so you get all your validation errors in one
batch, rather than one at a time as you fix each error.

# Topics
 - [Features](#features)
 - [Quick start](#quick-start)
 - [Examples](#examples)
 - [API Reference](#api)
    - [Standard Validators](#standard-validators)
 - [License](#license)
 - [Changelog](CHANGELOG.md)

# Features

 - Input validation with modifiers and property selection
 - Input transformations
 - Chainable interface
 - Common validators
 - Custom validator support
 - Error message string interpolation

<hr>

# Quick start

## Node.js
    npm install fresh-validation

Then:

```js
var Validator = require('fresh-validation').Validator;
var ValidatorErrors = require('fresh-validation').Errors;
```

<hr>

# Examples

## Basic usage

```js
var validator = new Validator();
validator.is('elliot', 'name').string()                           // valid
	.is(4, 'count').number().greaterThan(5)                       // invalid
	.is(undefined, 'width').number().equalTo(2);                  // invalid

var errors = validator.errors;
```

`errors` is an array of `ValidationError` objects:
```js
[
	{ [ValidationError: count (4) must be greater than 5]
		message: 'count (4) must be greater than 5',
		targetName: 'count',
		targetValue: 4,
		parameters: [ 5 ]
	},
	{ [ValidationError: width (undefined) must be a number]
		message: 'width (undefined) must be a number',
		targetName: 'width',
		targetValue: undefined,
		parameters: []
	}
]
```

## Modifiers

```js
var validator = new Validator();
validator.is('a').not.equalTo('b')                                 // valid
	.is(6).equalTo(1).or.greaterThan(5)                            // valid
	.is('b').number().or.string().lessThan(150).or.lessThan('b')   // valid
	.is(100).number().or.string().lessThan(150).or.lessThan('b')   // valid
```

## Property selection

```js
var input = { color: 'orange', param: { b: 'hello' }, position: {x: 10, y: 20} };
var validator = new Validator();
validator.is(input, 'input')
		.property('color')
			.string().equalTo('orange')                            // valid
		.back()
		.property('param').instanceOf(Error)                       // invalid
			.property('message').string().back()                   // not executed
		.back()
		.property('position')
			.property('x').number().lessThan(15).back()            // valid
			.property('y').number().lessThan(15).back();           // invalid
```

If a validator with `continueOnFail` set to false fails, no more validators are
executed on that input or any child properties. Validators are still executed
 when going `back()` to valid parent properties.

In this example, `validator.errors` contains two errors:

```js
[
	{ [ValidationError: input.param ([object Object]) must be an instance of function Error() { [native code] }]
		message: 'input.param ([object Object]) must be an instance of function Error() { [native code] }',
		targetName: 'input.param',
		targetValue: {},
		parameters: [ [Object] ]
	},
	{ [ValidationError: input.position.y (20) must be less than 15]
		message: 'input.position.y (20) must be less than 15',
		targetName: 'input.position.y',
		targetValue: 20,
		parameters: [ 15 ]
	}
]
```

## Transformation

Optionally, a validator can define a transformation function. If the validator
function succeeds, the transformation function is executed and the returned
value replaces the original input for future validations.

Transformations are often defined on "type checking" validators, like `number()`,
which parses string inputs and returns them as a numbers.


```js
var input = {
	numStr: '5.2',
	obj: {
		a: '{"b":2}'
	}
};

var validator = new Validator();
validator.is(this.input)
	.property('numStr').number().equalTo(5.2).back()
	.property('obj').property('a').object().deepEqualTo({b:2});

validator.transformationOutput(); // { numStr: 5.2, obj: {a:{b:2}} }
```
The validator has three "transformation modes":
 - `copy` *(default)*: Makes a deep copy of the input passed to `is()`. All
	validations and transformations are made on the copy, leaving the original
	input unchanged. The post-transformation value can be accessed with
	`validator.transformationOutput()`.
 - `mutate`: Performs transformations directly on the input value. Value types
	like number won't be mutated, while object properties are mutated.
 - `none`: Does not execute any transformation functions.
```

## Required

validator.is(undefined, 'height').not.required().number().equalTo(0)   //valid

## Custom validator

```js
var halfOfValidator = {
		name: 'halfOf',
		continueOnFail: true,
		errorMessage: '{name} {val} {1}',
		validationFunction: function(target, other) {
			return target === other / 2;
		}
};

var validator = new Validator();
validator.addValidator(halfOfValidator);
validator.is(8).halfOf(16);                                    // valid
```

chainable validation

each error is a ValidationChainError pushed to the errors array
all is() calls will be run even if previous is() failed
remaining validations in the is() call will only be run if the validator has 'continueOnFail' set
type checks and notRequired have 'continueOnFail' set to false, while equalTo(), etc. is set to true
the 'failed' flag is reset on every is()
'failed' is also reset on back() if the error occured in the child property
custom validation functions can be added to each validator instance, or to a specific validation (is) instance
custom validation functions will override built-in validation functions
validation functions must return true if the validation succeeded and false if it failed

validator.addValidator('isInArray', true, 'must be an element in the array',
	function(target, param) {
		return param.indexOf(target) !== -1;
	});

validator
 {
 		name: string
 		continueOnFail: boolean
 		errorMessage: string
 		validationFunction: function
 }
error message interpolated strings:
{name}: target name
{val}: target val
{not}: 'not' when negated, '' otherwise
{1}...{n}: nth parameter value
