import _ from 'underscore';
import Events from './events';
// Pagebone.View
// -------------

// Pagebone Views are almost more convention than they are actual code. A View
// is simply a JavaScript object that represents a logical chunk of UI in the
// DOM. This might be a single item, an entire list, a sidebar or panel, or
// even the surrounding frame which wraps your whole app. Defining a chunk of
// UI as a **View** allows you to define your DOM events declaratively, without
// having to worry about render order ... and makes it easy for the view to
// react to specific changes in the state of your models.

// Creating a Pagebone.View creates its initial element outside of the DOM,
// if an existing element is not provided...
var View = function(options) {
  this.cid = _.uniqueId('view');
  this.preinitialize(...arguments);
  _.extend(this, _.pick(options, viewOptions));
  this._ensureElement();
  this.initialize(...arguments);
};

// Cached regex to split keys for `delegate`.
var delegateEventSplitter = /^(\S+)\s*(.*)$/;

// List of view options to be set as properties.
var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

// Set up all inheritable **Pagebone.View** properties and methods.
_.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"div"`.
  tagName: 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be preferred to global lookups where possible.
  $(selector) {
    return this.$el.find(selector);
  },

    // preinitialize is an empty function by default. You can override it with a function
    // or object.  preinitialize will run before any instantiation logic is run in the View
  preinitialize() {},

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
  initialize() {},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
  render() {
    return this;
  },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Pagebone.Events listeners.
  remove() {
    this._removeElement();
    this.stopListening();
    return this;
  },

    // Remove this view's element from the document and all event listeners
    // attached to it. Exposed for subclasses using an alternative DOM
    // manipulation API.
  _removeElement() {
    this.$el.remove();
  },

    // Change the view's element (`this.el` property) and re-delegate the
    // view's events on the new element.
  setElement(element) {
    this.undelegateEvents();
    this._setElement(element);
    this.delegateEvents();
    return this;
  },

    // Creates the `this.el` and `this.$el` references for this view using the
    // given `el`. `el` can be a CSS selector or an HTML string, a jQuery
    // context or an element. Subclasses can override this to utilize an
    // alternative DOM manipulation API and are only required to set the
    // `this.el` property.
  _setElement(el) {
    this.$el = el instanceof Pagebone.$ ? el : Pagebone.$(el);
    this.el = this.$el[0];
  },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save',
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
  delegateEvents(events) {
    events || (events = _.result(this, 'events'));
    if (!events) return this;
    this.undelegateEvents();
    for (var key in events) {
      var method = events[key];
      if (!_.isFunction(method)) method = this[method];
      if (!method) continue;
      var match = key.match(delegateEventSplitter);
      this.delegate(match[1], match[2], _.bind(method, this));
    }
    return this;
  },

    // Add a single event listener to the view's element (or a child element
    // using `selector`). This only works for delegate-able events: not `focus`,
    // `blur`, and not `change`, `submit`, and `reset` in Internet Explorer.
  delegate(eventName, selector, listener) {
    this.$el.on(eventName + '.delegateEvents' + this.cid, selector, listener);
    return this;
  },

    // Clears all callbacks previously bound to the view by `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Pagebone views attached to the same DOM element.
  undelegateEvents() {
    if (this.$el) this.$el.off('.delegateEvents' + this.cid);
    return this;
  },

    // A finer-grained `undelegateEvents` for removing a single delegated event.
    // `selector` and `listener` are both optional.
  undelegate(eventName, selector, listener) {
    this.$el.off(eventName + '.delegateEvents' + this.cid, selector, listener);
    return this;
  },

    // Produces a DOM element to be assigned to your view. Exposed for
    // subclasses using an alternative DOM manipulation API.
  _createElement(tagName) {
    return document.createElement(tagName);
  },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
  _ensureElement() {
    if (!this.el) {
      var attrs = _.extend({}, _.result(this, 'attributes'));
      if (this.id) attrs.id = _.result(this, 'id');
      if (this.className) attrs['class'] = _.result(this, 'className');
      this.setElement(this._createElement(_.result(this, 'tagName')));
      this._setAttributes(attrs);
    } else {
      this.setElement(_.result(this, 'el'));
    }
  },

    // Set attributes from a hash on this view's element.  Exposed for
    // subclasses using an alternative DOM manipulation API.
  _setAttributes(attributes) {
    this.$el.attr(attributes);
  }

});


export default View;
