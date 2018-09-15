# fresh-validation
## keeps your data fresh

Provides `validateData(data, Class)`, which throws a TypeError if the runtime types of any properties
annotated with `@validate()` do not match their Typescript types

## Version 3
Version 3 is a complete rewrite in typescript. Use `@validate()` decorators to automatically tag class members that should be validated at runtime, using reflected type metadata.

# Usage
```javascript
import { validate } from 'fresh-validation';

class A {
   @validate()
   count: number;

   @validate() // deep typechecking on decorated classes
   options: Position;

   @validate() //only validates if add is a function (no parameter checking)
   add: (a: number, b: number) => number;

   @validate(true) // optional
   name?: string;

   @validate(false, string) // array element type must be passed
   names: string[];

   @validate(false, number, true) // array elements may be unefined/null
   sums: number[];
}

class Position {
    @validate()
    x: number;

    @validate()
    y: number;
}

 
const a: A = validateData({
    count: 10,

    }, A);
```

Uses emitDecoratorMetadata to provide Typescript type information at runtime

Caveats
 - limited type information
 - additional type data must be passed to @validate for some types.
    - optional types
    - arrays
    - unions
    - discriminated unions

# Install
```javascript
npm install fresh-validation
```

# Development

## Build
```
yarn install
yarn build
```

## Test
```
yarn test
```

## Generate Documentation
```
yarn docs
```
