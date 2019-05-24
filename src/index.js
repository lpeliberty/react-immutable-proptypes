import Immutable from 'immutable';

const ANONYMOUS = '<<anonymous>>';
let ImmutablePropTypes;

function getPropType(propValue) {
  const propType = typeof propValue;
  if (Array.isArray(propValue)) {
    return 'array';
  }
  if (propValue instanceof RegExp) {
    // Old webkits (at least until Android 4.0) return 'function' rather than
    // 'object' for typeof a RegExp. We'll normalize this here so that /bla/
    // passes PropTypes.object.
    return 'object';
  }
  if (propValue instanceof Immutable.Iterable) {
    return `Immutable.${propValue.toSource().split(' ')[0]}`;
  }
  return propType;
}

function createChainableTypeChecker(validate) {
  function checkType(isRequired, props, propName, componentName, location, propFullName, ...rest) {
    const property = propFullName || propName;
    const component = componentName || ANONYMOUS;
    if (props[propName] == null) {
      if (isRequired) {
        return new Error(
          `Required ${location} \`${property}\` was not specified in `
          + `\`${component}\`.`,
        );
      }
      return null;
    }
    return validate(props, propName, component, location, property, ...rest);
  }

  const chainedCheckType = checkType.bind(null, false);
  chainedCheckType.isRequired = checkType.bind(null, true);

  return chainedCheckType;
}

function createImmutableTypeChecker(immutableClassName, immutableClassTypeValidator) {
  function validate(props, propName, componentName, location, propFullName) {
    /* eslint-disable-next-line */
    const propValue = props[propName];
    if (!immutableClassTypeValidator(propValue)) {
      const propType = getPropType(propValue);
      return new Error(
        `Invalid ${location} \`${propFullName}\` of type \`${propType}\` `
        + `supplied to \`${componentName}\`, expected \`${immutableClassName}\`.`,
      );
    }
    return null;
  }
  return createChainableTypeChecker(validate);
}

// there is some irony in the fact that shapeTypes is a standard hash and not an immutable collection
function createShapeTypeChecker(shapeTypes, immutableClassName = 'Map', immutableClassTypeValidator = Immutable.Iterable.isIterable) {
  function validate(props, propName, componentName, location, propFullName /* , ...rest */) {
    /* eslint-disable-next-line */
    const propValue = props[propName];
    if (!immutableClassTypeValidator(propValue)) {
      const propType = getPropType(propValue);
      return new Error(
        `Invalid ${location} \`${propFullName}\` of type \`${propType}\` `
        + `supplied to \`${componentName}\`, expected an Immutable.js ${immutableClassName}.`,
      );
    }
    // const mutablePropValue = propValue.toObject();
    // for (const [key, value] of Object.entries(shapeTypes)) {
    //   if (value) {
    //     const checker = shapeTypes[key];
    //     const error = checker(mutablePropValue, key, componentName, location, `${propFullName}.${key}`, ...rest);
    //     if (error) {
    //       return error;
    //     }
    //   }
    // }
    return null;
  }
  return createChainableTypeChecker(validate);
}

function createMapContainsChecker(shapeTypes) {
  return createShapeTypeChecker(shapeTypes, 'Map', Immutable.Map.isMap);
}

function createIsChecker(shapeTypes) {
  console.log('index::shapeTypes -> ', shapeTypes);
  // return createShapeTypeChecker(shapeTypes, 'Map', Immutable.Map.isMap);
}

console.log(process.env);

if (process.env.NODE_ENV !== 'production') {
  ImmutablePropTypes = {
    mapContains: createMapContainsChecker,
    is: createIsChecker,
    // Primitive Types
    map: createImmutableTypeChecker('Map', Immutable.Map.isMap),
  };
} else {
  const productionTypeChecker = () => {
    console.log('ImmutablePropTypes type checking code is stripped in production.');
  };
  productionTypeChecker.isRequired = productionTypeChecker;
  const getProductionTypeChecker = () => productionTypeChecker;

  ImmutablePropTypes = {
    mapContains: getProductionTypeChecker,
    // Primitive Types
    map: productionTypeChecker,
  };
}

module.exports = ImmutablePropTypes;
