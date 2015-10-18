# CHANGES

## 0.2

### 0.2.2 - 10-18-2015

 - fix:
    - republish to try and fix npm "shasum check failed" issue

### 0.2.1 - 10-18-2015
 - add:
    - `elementOf` standard validator
    - `whitelist` now accepts an object parameter to specify properties that
                  should be whitelisted even if they weren't valiidated
 - fix:
    - `whitelist` no longer deletes array elements
    - `contains` validator now has `continueOnFail` = true
 - bug:
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
