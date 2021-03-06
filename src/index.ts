import 'reflect-metadata';

/** we add these properties to class constructors that have @validate() properties
 * Alias the symbols as strings to silence type errors in hasOwnProperty/defineProperty
 */
/** store a map of property names that need to be validated */
const validateProps = Symbol('_validateProps');
const validatePropsStr = (validateProps as any) as string;
/** track if we have already added the validate properties from the superclass */
const protoValidatePropsAdded = Symbol('_protoValidatePropsAdded');
const protoValidatePropsAddedStr = (protoValidatePropsAdded as any) as string;

export interface Constructor<T> {
    new(): T;
}

export interface TypeInfo {
    typeConstructor: Constructor<any>;
    /** if true, null/undefined values will not throw a TypeError */
    optional?: boolean;
    /** if annotating an array, this must be the type array element type */
    arrayType?: Constructor<any>;
    /* if annotating an array and this argument is true, null/undefined elements of the array will not throw a
     * TypeError */
    arrayOptional?: boolean;
    /** if this property is a union type, you must provide extra information */
    union?: UnionTypeInfo;
}

export interface UnionTypeInfo {
    /** discriminant property name */
    discriminant?: string;
    /**
     * mapping from discriminant value to typeConstructor. if discriminant is not defined, kind is ignored
     * NOTE: with a little work the implementation could be changed so 'kind' doesn't need to be specified
     * for each constructor.
     */
    types: { [kind: string]: Constructor<any> };
}

/**
 * Marks the property to be checked when using validateData(). Property decorator factory
 * @param options - a TypeInfo object with extra information about the data type.
 *   For convenience, this can be a boolean specifying if this property is optional
 * @param arrayType - if options is boolean andthe annotated type is an array, this must be provided to specify the
 *   array element type. If options is a TypeInfo object, this parameter is ignored and the arrayType must be specified
 *   in options
 *
 *   Traverses the prototype chain so inherited properties are also validated.
 *   We do this once at startup, then validateData() looks up properties from a flat map
 *   This code assumes that if @validate() is called for a propety on a subclass,
 *   then all the @validate decorators were executed on the super class
 */
export function validate(options?: Partial<TypeInfo> | boolean, arrayType?: Constructor<any>) {
    if (typeof options === 'boolean') {
        options = {optional: options, arrayType};
    }

    return (target: any, propertyKey: string) => {
        let typeConstructor = Reflect.getMetadata('design:type', target, propertyKey);

        if (!target.hasOwnProperty(validatePropsStr)) {
            Object.defineProperty(target, validatePropsStr, {value: new Map<string, TypeInfo>()});
        }

        if (!target.hasOwnProperty(protoValidatePropsAddedStr)) {
            const targetProto = Object.getPrototypeOf(target);
            if (targetProto && targetProto[validateProps]) {
                for (const [key, typeInfo] of targetProto[validateProps]) {
                    target[validateProps].set(key, typeInfo);
                }
            }

            Object.defineProperty(target, protoValidatePropsAddedStr, {value: true});
        }

        target[validateProps].set(propertyKey, Object.assign({typeConstructor}, options));
    };
}

/**
 * Validate that a value matches the expected type.
 * Objects and arrays are recursively validated
 * @param data - The value to validate
 * @param expected - the expected type, or a TypeInfo object with the expected type and extra type information
 * @param variableName - name used in TypeError messages
 * @return - A deep copy of the data with only whitelisted (@validate) properties. cast to the expected type (note: not initialized with new, instaceof won't work)
 */
export function validateData<T, C extends Constructor<T>>(data: any, expected: C | TypeInfo, variableName: string): T {
    // if expected is missing typeConstructor, is must be of  type C--create a TypeInfo based on it
    if (data == null) {
        if (expected && (<any> expected).optional) {
            return data;
        }

        let expectedTypeName = (<C> expected).name ||
            ((<TypeInfo> expected).typeConstructor && (<TypeInfo> expected).typeConstructor.name);
        throw new TypeError(`required property ${variableName} is null; expected ${expectedTypeName}`);
    }

    let expectedTypeData: TypeInfo =
        (<any> expected).typeConstructor ? <TypeInfo> expected : {typeConstructor: <C> expected};

    switch (typeof data) {
        case 'boolean':
        case 'number':
        case 'string':
        case 'function':
            if (data.constructor !== expectedTypeData.typeConstructor) {
                throw new TypeError(`property ${variableName} is ${
                    data.constructor.name}; expected ${expectedTypeData.typeConstructor.name}`);
            }
            break;
        case 'object':
            if (data.constructor === Array) {
                if (data.constructor !== expectedTypeData.typeConstructor) {
                    throw new TypeError(`property ${variableName} is ${
                        data.constructor.name}; expected ${expectedTypeData.typeConstructor.name}`);
                }

                // check array elements
                if (!expectedTypeData.arrayType) {
                    throw new MissingTypeDataError(`property ${variableName} is an array, but no array type data was ` +
                        `provided (to fix this error, add the expected type of the array to the @validate decorator. ` +
                        `array of 'any' is not currently supported).`);
                }

                return data.map((element: any, i: number) => validateData(
                    element,
                    {
                        typeConstructor: expectedTypeData.arrayType!,
                        optional: expectedTypeData.arrayOptional
                    },
                    `${variableName}[${i}]`)
                );
            } else {
                let propertyTypeMap: Map<string, TypeInfo> = expectedTypeData.typeConstructor.prototype[validateProps];
                if (!propertyTypeMap) {
                    // no @validate properties
                    return data;
                }

                /* tslint:disable:max-line-length */
                for (let [pName, pTypeData] of propertyTypeMap) {
                    if (pTypeData.union) {
                        // union type
                        // if it is a discriminated UnionTypeInfo
                        // validate the discriminant and the matching properties recursively
                        // otherwise, accept first type in union that doesn't fail validation
                        // TODO: non-discriminant unions types are validated in an indeterminante order
                        // change the UnionTypeInfo to take an array of types. also just rewrite this
                        if (pTypeData.union.discriminant) {
                            let validated = Object.keys(pTypeData.union.types).reduce((validated, unionTypeName) => {
                                if (data[pName] && data[pName][pTypeData.union!.discriminant!] === unionTypeName) {
                                    let typeData = Object.assign({}, pTypeData, {typeConstructor: pTypeData.union!.types[unionTypeName]});
                                    validateData(data[pName], typeData, `${variableName}.${pName}`);
                                    return true;
                                }
                                return validated;
                            }, false);
                            if (!validated) {
                                throw new TypeError(`property ${
                                    variableName} is a discriminated union, but the descriminant ${
                                    variableName}.${pTypeData.union.discriminant} is an unknown value ${
                                    data[pName] && data[pName][pTypeData.union.discriminant]}`);
                            }
                        } else {
                            let validated = false;
                            for (const unionTypeName of Object.keys(pTypeData.union.types)) {
                                if (data[pName]) {
                                    let typeData = Object.assign({}, pTypeData, {typeConstructor: pTypeData.union!.types[unionTypeName]});
                                    try {
                                        validateData(data[pName], typeData, `${variableName}.${pName}`);
                                        validated = true;
                                        break;
                                    } catch (error) {
                                        if (!(error instanceof TypeError)) {
                                            throw error;
                                        }
                                    }
                                }
                            }
                            if (!validated) {
                                throw new TypeError(`property ${variableName} did not match any of its union types: ${Object.keys(pTypeData.union.types)}`);
                            }
                        }
                    } else {
                        validateData(data[pName], pTypeData, `${variableName}.${pName}`);
                    }
                }
            }
            break;
        default:
            throw new TypeError(`unrecognized typeof ${variableName}: ${typeof data}`);
    }
    return data;
}

/** The validator was missing type information required to fully validate the type.
 * Fix this error by passing needed information to the decorator for the type you are trying to validate.
 */
export class MissingTypeDataError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, MissingTypeDataError.prototype);
    }
}
