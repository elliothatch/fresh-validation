# CHANGES

## 0.2

### 0.2.1 - 10-17-2015
 - Change:
    - Transformations and whitelisted properties are now remembered if you
      validate the same object multiple times in a row (call `is` on the same
      object successively)
    - `resetErrors` changed to `endValidation`. In addition to resetting
      errors, it now also resets transformations and whitelisted properties,
      which could be remembered if the same object is validated more than once.
 - Add:
    - `elementOf` standard validator
    - `whitelist` now accepts an object parameter to specify properties that
                  should be whitelisted even if they weren't valiidated
 - Fix:
    - `contains` validator now has `continueOnFail` = true
 - Bug:
    - [won't fix] `string` validator no longer works on `new String()` objects

### 0.2.0 - 10-15-2015
 - fix:
    - added missing 'main' property in package.json
 - add:
    - throwErrors: combine errors into one error object and throw it
    - whitelist: delete all object properties not validated with 'property'

## 0.1

### 0.1.1 - 9-20-15
 - build:
    - Add coveralls support
    - Add automated npm publishing

 - Update README with API reference, contributing, and license

### 0.1.0 - 9-20-15
Initial version
