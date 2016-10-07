import _ from 'underscore';
import $ from 'jquery';
import Events from './events';
import Middleware from './middleware';
// Pagebone.Router
// ---------------

// Routers map faux-URLs to actions, and fire events when routes are
// matched. Creating a new one sets its `routes` hash, if not set statically.
var Router = function(options) {
  options || (options = {});
  this.preinitialize(...arguments);
  if (options.routes) this.routes = options.routes;
  this._bindRoutes();
  this.initialize(...arguments);
};

// Cached regular expressions for matching named param parts and splatted
// parts of route strings.
var optionalParam = /\((.*?)\)/g;
var namedParam = /(\(\?)?:\w+/g;
var splatParam = /\*\w+/g;
var escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;
var slice = Array.prototype.slice;

// Set up all inheritable **Pagebone.Router** properties and methods.
_.extend(Router.prototype, Events, {

    // preinitialize is an empty function by default. You can override it with a function
    // or object.  preinitialize will run before any instantiation logic is run in the Router.
  preinitialize() {},

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
  initialize() {},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
  route(route, name, callback) {
    var router = this;
    var routeArgs = slice.call(arguments, 0);
    if (!_.isRegExp(route)) route = this._routeToRegExp(route);
    var start = 2;
    if (_.isFunction(name)) {
      start = 1;
      name = '';
    }
    var last = routeArgs.length - 1;
    var lastCalback = _.isFunction(routeArgs[last]) ? routeArgs[last] : this[name];
    Pagebone.history.route(route, fragment => {
      var args = router._extractParameters(route, fragment);
      var middleware = new Middleware();
      middleware.push(routeArgs.slice(start, last))
      middleware.push((ctx) => {
          if(router.execute(lastCalback, args.concat(ctx), name) !== false){
            router.trigger(...['route:' + name].concat(args));
            router.trigger('route', name, args);
            Pagebone.history.trigger('route', router, name, args);
          }
      });
      middleware.start(router, args);
    });
    return this;
  },
    // Execute a route handler with the provided parameters.  This is an
    // excellent place to do pre-route setup or post-route cleanup.
  execute(callback, args, name) {
    if (callback) callback.apply(this, args);
  },

    // Simple proxy to `Pagebone.history` to save a fragment into the history.
  navigate(fragment, options) {
    Pagebone.history.navigate(fragment, options);
    return this;
  },
  replace(fragment) {
    Pagebone.history.navigate(fragment, {replace: true});
    return this;
  },

    // Bind all defined routes to `Pagebone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
  _bindRoutes() {
    if (!this.routes) return;
    this.routes = _.result(this, 'routes');
    var route, routes = _.keys(this.routes);
    while ((route = routes.pop()) != null) {
      this.route(route, this.routes[route]);
    }
  },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
  _routeToRegExp(route) {
    route = route.replace(escapeRegExp, '\\$&')
            .replace(optionalParam, '(?:$1)?')
            .replace(namedParam, (match, optional) => optional ? match : '([^/?]+)')
            .replace(splatParam, '([^?]*?)');
    return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
  },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
  _extractParameters(route, fragment) {
    var params = route.exec(fragment).slice(1);
    return _.map(params, (param, i) => {
            // Don't decode the search params.
      if (i === params.length - 1) return param || null;
      return param ? decodeURIComponent(param) : null;
    });
  }

});

export default Router;
