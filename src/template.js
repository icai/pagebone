import _ from 'underscore';
import Events from './events';
// Pagebone.Template
// ---------------






var Template = function() {
  options || (options = {});
  this.preinitialize(...arguments);
  if (options.templates) this.templates = options.templates;
  this.initialize(...arguments);
};


_.extend(Template.prototype, Events, {

	// preinitialize is an empty function by default. You can override it with a function
	// or object.  preinitialize will run before any instantiation logic is run in the Router.
  preinitialize() {},

	// Initialize is an empty function by default. Override it with your own
	// initialization logic.
  initialize() {},

  mount(){},

  // set up the template engine
  setup(){},
});