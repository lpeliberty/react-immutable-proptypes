import Immutable from 'immutable';

const ANONYMOUS = '<<anonymous>>';
let ImmutablePropTypes;

if (process.env.NODE_ENV !== 'production') {
  ImmutablePropTypes = {
    mapContains: createMapContainsChecker,
    is: createIsChecker,
    // Primitive Types
    map: createImmutableTypeChecker('Map', Immutable.Map.isMap),
  };
} else {
  const productionTypeChecker = function () {
    console.log('ImmutablePropTypes type checking code is stripped in production.');
  };
  productionTypeChecker.isRequired = productionTypeChecker;
  const getProductionTypeChecker = function () { return productionTypeChecker; };

  ImmutablePropTypes = {
    mapContains: getProductionTypeChecker,
    // Primitive Types
    map: productionTypeChecker,
  };
}

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
    propFullName = propFullName || propName;
    componentName = componentName || ANONYMOUS;
    if (props[propName] == null) {
      const locationName = location;
      if (isRequired) {
        return new Error(
          `Required ${locationName} \`${propFullName}\` was not specified in `
          + `\`${componentName}\`.`,
        );
      }
    } else {
      return validate(props, propName, componentName, location, propFullName, ...rest);
    }
  }

  const chainedCheckType = checkType.bind(null, false);
  chainedCheckType.isRequired = checkType.bind(null, true);

  return chainedCheckType;
}

function createImmutableTypeChecker(immutableClassName, immutableClassTypeValidator) {
  function validate(props, propName, componentName, location, propFullName) {
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
  function validate(props, propName, componentName, location, propFullName, ...rest) {
    const propValue = props[propName];
    if (!immutableClassTypeValidator(propValue)) {
      const propType = getPropType(propValue);
      return new Error(
        `Invalid ${location} \`${propFullName}\` of type \`${propType}\` `
        + `supplied to \`${componentName}\`, expected an Immutable.js ${immutableClassName}.`,
      );
    }
    const mutablePropValue = propValue.toObject();
    for (const key in shapeTypes) {
      const checker = shapeTypes[key];
      if (!checker) {
        continue;
      }
      const error = checker(mutablePropValue, key, componentName, location, `${propFullName}.${key}`, ...rest);
      if (error) {
        return error;
      }
    }
  }
  return createChainableTypeChecker(validate);
}

function createMapContainsChecker(shapeTypes) {
  return createShapeTypeChecker(shapeTypes, 'Map', Immutable.Map.isMap);
}

function createIsChecker(shapeTypes) {
  return createShapeTypeChecker(shapeTypes, 'Map', Immutable.Map.isMap);
}

module.exports = ImmutablePropTypes;
