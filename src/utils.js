

import _ from 'underscore';

var slice = Array.prototype.slice;

// Support `collection.sortBy('attr')` and `collection.findWhere({id: 1})`.
var cb = (iteratee, instance) => {
  if (_.isFunction(iteratee)) return iteratee;
  if (_.isObject(iteratee) && !instance._isModel(iteratee)) return modelMatcher(iteratee);
  if (_.isString(iteratee)) return model => model.get(iteratee);
  return iteratee;
};
var modelMatcher = attrs => {
  var matcher = _.matches(attrs);
  return model => matcher(model.attributes);
};

// Proxy Pagebone class methods to Underscore functions, wrapping the model's
// `attributes` object or collection's `models` array behind the scenes.
//
// collection.filter(function(model) { return model.get('age') > 10 });
// collection.each(this.addView);
//
// `Function#apply` can be slow so we use the method's arg count, if we know it.
var addMethod = (length, method, attribute) => {
  switch (length) {
    case 1:
      return function() {
        return _[method](this[attribute]);
      };
    case 2:
      return function(value) {
        return _[method](this[attribute], value);
      };
    case 3:
      return function(iteratee, context) {
        return _[method](this[attribute], cb(iteratee, this), context);
      };
    case 4:
      return function(iteratee, defaultVal, context) {
        return _[method](this[attribute], cb(iteratee, this), defaultVal, context);
      };
    default:
      return function() {
        var args = slice.call(arguments);
        args.unshift(this[attribute]);
        return _[method](...args);
      };
  }
};
var addUnderscoreMethods = (Class, methods, attribute) => {
  _.each(methods, (length, method) => {
    if (_[method]) Class.prototype[method] = addMethod(length, method, attribute);
  });
};


// Throw an error when a URL is needed, and none is supplied.
var urlError = () => {
  throw new Error('A "url" property or function must be specified');
};

// Wrap an optional error callback with a fallback error event.
var wrapError = (model, options) => {
  var error = options.error;
  options.error = resp => {
    if (error) error.call(options.context, model, resp, options);
    model.trigger('error', model, resp, options);
  };
};

// Helper function to correctly set up the prototype chain for subclasses.
// Similar to `goog.inherits`, but uses a hash of prototype properties and
// class properties to be extended.
var extend = function(protoProps, staticProps) {
  var parent = this;
  var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent constructor.
  if (protoProps && _.has(protoProps, 'constructor')) {
    child = protoProps.constructor;
  } else {
    child = function() {
      return parent.apply(this, arguments);
    };
  }

    // Add static properties to the constructor function, if supplied.
  _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function and add the prototype properties.
  child.prototype = _.create(parent.prototype, protoProps);
  child.prototype.constructor = child;

    // Set a convenience property in case the parent's prototype is needed
    // later.
  child.__super__ = parent.prototype;

  return child;
};

export default {
  addMethod,
  addUnderscoreMethods,
  urlError,
  wrapError,
  extend
};
