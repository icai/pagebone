import _ from 'underscore';
import Events from './events';
// Pagebone.Controller
// ---------------






var Controller = function() {
  options || (options = {});
  this.preinitialize(...arguments);
  if (options.controllers) this.controllers = options.controllers;
  this.initialize(...arguments);
};


_.extend(Controller.prototype, Events, {

	// preinitialize is an empty function by default. You can override it with a function
	// or object.  preinitialize will run before any instantiation logic is run in the Router.
  preinitialize() {},

	// Initialize is an empty function by default. Override it with your own
	// initialization logic.
  initialize() {}
});