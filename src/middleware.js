import _ from 'underscore';
import Events from './events';
// Pagebone.Middleware
// ---------------

var Middleware = function(middlewares, options) {
	this.handlers = [];
  options || (options = {});
  this.preinitialize(...arguments);

  this.initialize(...arguments);
  if (middlewares) this.push(middlewares);
};
var slice = Array.prototype.slice;

_.extend(Middleware.prototype, Events, {
  // preinitialize is an empty function by default. You can override it with a function
  // or object.  preinitialize will run before any instantiation logic is run in the Middleware.
  preinitialize() {},

  // Initialize is an empty function by default. Override it with your own
  // initialization logic.
  initialize() {},

  // push a or some middlewares method to handlers collection
	push() {
		var args = slice.call(arguments, 0);
		this.set(args);
	},

	// wrapper the function as the middleware function, prevent avoidable parameters
	// process func(ctx, next)
  middleware(fn) {
    return function (ctx, next) {
    	fn.apply(this, [ctx, next]);
    };
  },

  // set middlewares, This is
  // the core primitive operation of middleware.
  set(middlewares, options){
  	options || (options = {});
		if(options.reset){
		  	this.handlers = [];
		}
		if(_.isFunction(middlewares)){
			middlewares = [middlewares];
		}
		if(middlewares && middlewares.length){
			_.each(_.flatten(middlewares), function(item){
						this.handlers.push(this.middleware(item));
			}, this)
		}
  },

  // reset middlewares
  reset(middlewares){
  	this.set(middlewares, {reset: true});
  },

  // middleware method execute, 
  // The `context` is middleware function execute context.
  // `args` in process is func({ params: args ...}, next)
  start(context, args){
  	var middle = this;
    ((funcs => {
        (function next(){
          if (funcs.length > 0) {
            var func = funcs.shift();
            var merge = args ? {params: args} : {};
            var firstObj = slice.call(arguments,0)[0];
            var nextArgs = _.isObject(firstObj) && !_.isArray(firstObj) ? firstObj 
            : (firstObj ? { prevArgs: firstObj} : {});
            var passArgs = _.extend({}, nextArgs, merge);
            middle.execute(func, [passArgs].concat([next]), context);
          }
        })();
    }))(this.handlers);
  },

  // Execute a middleware handler with the provided parameters.  This is an
  // excellent place to do pre-middleware setup or post-middleware cleanup.
  execute(callback, args, context) {
    if (callback) callback.apply(context || this, args);
  }
})

export default Middleware;