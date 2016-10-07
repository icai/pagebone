import $ from 'jquery';
import _ from 'underscore';
import Events from './events';
import utils from './utils';
import View from './view';
import Model from './model';
import Collection from './collection';
import Router from './router';
import History from './history';
import Middleware from './middleware';
import {sync, ajax} from './sync';



var root = typeof self == 'object' && self.self === self && self ||
        typeof global == 'object' && global.global === global && global;

var previousPagebone = root.Pagebone;

var Pagebone = {};
Model.extend =
Collection.extend =
Router.extend =
Middleware.extend = 
View.extend =
History.extend = utils.extend;

Pagebone.version = '1.3.3';
Pagebone.$ = $;
Pagebone.View = View;
Pagebone.Events = Events;
Pagebone.Model = Model;
Pagebone.Collection = Collection;
Pagebone.Router = Router;
Pagebone.History = History;
Pagebone.Middleware = Middleware;
Pagebone.history = new History();
// Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
// will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
// set a `X-Http-Method-Override` header.
Pagebone.emulateHTTP = false;

// Turn on `emulateJSON` to support legacy servers that can't deal with direct
// `application/json` requests ... this will encode the body as
// `application/x-www-form-urlencoded` instead and will send the model in a
// form param named `model`.
Pagebone.emulateJSON = false;
Pagebone.sync = sync;
Pagebone.ajax = ajax;

_.extend(Pagebone, Events);


// Runs Pagebone.js in *noConflict* mode, returning the `Pagebone` variable
// to its previous owner. Returns a reference to this Pagebone object.
Pagebone.noConflict = function() {
  root.Pagebone = previousPagebone;
  return this;
};

export default Pagebone;
