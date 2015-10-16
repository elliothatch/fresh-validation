[![Build Status](https://travis-ci.org/elliothatch/fresh-validation.svg?branch=master)](https://travis-ci.org/elliothatch/fresh-validation)
[![Coverage Status](https://coveralls.io/repos/elliothatch/fresh-validation/badge.svg?branch=master&service=github)](https://coveralls.io/github/elliothatch/fresh-validation?branch=master)

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
 - [API Reference](#api-reference)
    - [Modifiers](#modifiers)
    - [Standard Validators](#standard-validators)
 - [Contributing](#contributing)
 - [License](#license)
 - [Changelog](CHANGES.md)

# Features

 - Input validation with modifiers and property selection
 - Input transformations
 - Chainable interface
 - Common validators
 - Custom validator/transformer support
 - Input whitelisting

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
validator.is('elliot', 'name').a.string()                           // valid
	.is(4, 'count').a.number().greaterThan(5)                       // invalid
	.is(undefined, 'width').a.number().equalTo(2);                  // invalid

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

Validator functions have a `continueOnFail` flag. This flag determines whether
the validator should continue to run validations on the input after it fails a
validation (until the next `is()`).

For example, `string()` and `number()` have `continueOnFail` set to false, while
`greaterThan` has it set to true. This is why
`is(undefined, 'width').number().equalTo(2)` only produces one error.

## Modifiers

```js
var validator = new Validator();
validator.is('a').not.equalTo('b')                                   // valid
	.is(6).equalTo(1).or.greaterThan(5)                              // valid
	.is('a').a.number().or.string().lessThan(150).or.lessThan('b')   // valid
	.is(100).a.number().or.string().lessThan(150).or.lessThan('b')   // valid
```

## Property selection

```js
var input = {
	color: 'orange',
	param: {
		b: 'hello'
	},
	position: {
		x: 10,
		y: 20
	}
};

var validator = new Validator();
validator.is(input, 'input')
		.property('color')
			.a.string().equalTo('orange')                        // valid
		.back()
		.property('param').an.instanceOf(Error)                  // invalid
			.property('message').a.string().back()               // not executed
		.back()
		.property('position')
			.property('x').a.number().lessThan(15).back()        // valid
			.property('y').a.number().lessThan(15).back();       // invalid
```

If a validation fails and has `continueOnFail` set to false, no more validations
are executed on that input *or any child properties*. Validations resume
execution after going `back()` to a valid parent property.

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
validator.transformationMode = 'copy';   // default
validator.is(input)
	.property('numStr').a.number().equalTo(5.2).back()               // valid
	.property('obj').property('a').an.object().deepEqualTo({b:2});   // valid

validator.transformationOutput(); // { numStr: 5.2, obj: {a:{b:2}} }
```

## Whitelist

Use `whitelist()` to automatically strip properties off an object that weren't
explicitly validated.

```js
var input = {
	num: 1,
	obj: {
		numA: 2,
		badA: 3
	},
	badB: 4
};

var validator = new Validator();
validator.is(input)
	.property('num').a.number().equalTo(1).back()     // invalid
	.property('obj')
		.property('numA').a.number().equalTo(2)       // invalid

validator.whitelist();
validator.transformationOutput(); // { num: 1, obj: {numA:2} }
```
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

See [`addValidator`](#addValidator-validator).

# API Reference

### `new Validator()` => `Validator`

Create a new Validator.

### `is(input, name)`

Begin a validation chain for `input`. `name` is used in error messages.

### `errors`

An array of `ValidationError`.

### `resetErrors()`

Clear out the `errors` array.

### `throwErrors()`

Combines all errors into one 'compound error', clears the `errors` array, then
throws the compound error.

Errors created with this function are an instance of `ValidationError`. The
`message` property is a concatenation of all individual error messages,
`target`, `targetName`, and `parameters` are arrays containing the corresponding
values from each individual error. Additionally, the `compoundError` property is
set to true.

### `property(name)`

Begin a validation chain on the property `name`.

### `back()`

Return validation to the parent object. Must not be used before `property()`.

### `transformationMode`

Set this to the name of a transformation mode to describe how transformations
should process inputs passed to this validator.

Valid transformation modes:
 - `'copy'` *(default)*: Makes a deep copy of the input passed to `is()`. All
	validations and transformations are made on the copy, leaving the original
	input unchanged. The post-transformation value can be accessed with
	`validator.transformationOutput()`.
 - `'mutate'`: Performs transformations directly on the input value. Value types
	like number won't be mutated, while objects and their properties are mutated.
 - `'none'`: Does not execute any transformation functions.

### `transformationOutput()`

Get the input from the last `is()` call, after transformations have been applied.
In modes `'mutate'` and `'none'`, this is strictly equal (`===`) to the input.

### `whitelist()`

If the input was an object, delete every property off the transformation output
that was not explicitly validated with `property()`.

**WARNING: Whitelisted properties are tracked when they are validated through
`property()` calls. Manually validating nested objects with `equalTo()` or
`deepEqualTo()` will not track their properties, and may result in unwanted
deletions.**

### `addValidator(validator)`

Add a custom validator to this `Validator` instance. To add a validator to all
instances of `Validator`, use
[`Validator.addGlobalValidator()`](#Validator.addGlobalValidator-validator),

**NOTE: Adding a validator with the same name as an existing validator will
overwrite the old validator.**

Validator must be an object with properties:
 - `name` *(required)*: string
 - `continueOnFail` *(required)*: boolean
 - `errorMessage` *(required)*: string
 - `validationFunction` *(required)*: function(target, param1, param2, ...paramN) => boolean
 - `transformationFunction`: function(target) => targetOut

`errorMessage` supports string interpolation with the following values:
 - `{name}`: Target name
 - `{val}`: Target value
 - `{not}`: The string 'not' when negated. Otherwise, the empty string
 - `{1}...{N}`: Nth parameter value

### `Validator.addGlobalValidator(validator)`

Add a custom validator to all instances of `Validator`, by adding it to the
`Validator` prototype.

**NOTE: Adding a validator with the same name as an existing validator will
overwrite the old validator.**

## Modifiers

### `a` and `an`

Chainable properties for readability. Does nothing.

### `not`

Negate the next validation. Has special behavior for [`required()`](#required).

### `or`

Perform a logical OR with the next validation.

Example:
```js
// valid when input === 'a' || input === 'b' || input === 'c'
validator.is(input).equalTo('a').or.equalTo('b').or.equalTo('c');
```

## Standard Validators

### `required`
continueOnFail: false

### `defined`
continueOnFail: false

### `instanceOf`
continueOnFail: false

### `object`
continueOnFail: false
transfomations:
 - JSON object string -> object

### `string`
continueOnFail: false

### `number`
continueOnFail: false
transfomations:
 - string -> number

### `integer`
continueOnFail: false
transfomations:
 - string -> number

### `array`
continueOnFail: false
transfomations:
 - JSON array string -> array

### `contains`
continueOnFail: false

### `equalTo`
continueOnFail: true

### `deepEqualTo`
continueOnFail: true

### `greaterThan`
continueOnFail: true

### `lessThan`
continueOnFail: true

# Contributing
Add your changes to a new branch. If adding a feature, make sure to add unit tests.
Builds will fail if code coverage is less than 90%, but in general, contributions
should have 100% code coverage.

When your branch is ready, make a pull request.

# License
MIT License

