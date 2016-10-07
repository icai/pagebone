((QUnit => {

  var view;

  QUnit.module('Pagebone.View', {

    beforeEach() {
      $('#qunit-fixture').append(
        '<div id="testElement"><h1>Test</h1></div>'
     );

      view = new Pagebone.View({
        id: 'test-view',
        className: 'test-view',
        other: 'non-special-option'
      });
    },

    afterEach() {
      $('#testElement').remove();
      $('#test-view').remove();
    }

  });

  QUnit.test('constructor', assert => {
    assert.expect(3);
    assert.equal(view.el.id, 'test-view');
    assert.equal(view.el.className, 'test-view');
    assert.equal(view.el.other, void 0);
  });

  QUnit.test('$', assert => {
    assert.expect(2);
    var myView = new Pagebone.View;
    myView.setElement('<p><a><b>test</b></a></p>');
    var result = myView.$('a b');

    assert.strictEqual(result[0].innerHTML, 'test');
    assert.ok(result.length === +result.length);
  });

  QUnit.test('$el', assert => {
    assert.expect(3);
    var myView = new Pagebone.View;
    myView.setElement('<p><a><b>test</b></a></p>');
    assert.strictEqual(myView.el.nodeType, 1);

    assert.ok(myView.$el instanceof Pagebone.$);
    assert.strictEqual(myView.$el[0], myView.el);
  });

  QUnit.test('initialize', assert => {
    assert.expect(1);
    var View = Pagebone.View.extend({
      initialize() {
        this.one = 1;
      }
    });

    assert.strictEqual(new View().one, 1);
  });

  QUnit.test('preinitialize', assert => {
    assert.expect(1);
    var View = Pagebone.View.extend({
      preinitialize() {
        this.one = 1;
      }
    });

    assert.strictEqual(new View().one, 1);
  });

  QUnit.test('preinitialize occurs before the view is set up', assert => {
    assert.expect(2);
    var View = Pagebone.View.extend({
      preinitialize() {
        assert.equal(this.el, undefined);
      }
    });
    var _view = new View({});
    assert.notEqual(_view.el, undefined);
  });

  QUnit.test('render', assert => {
    assert.expect(1);
    var myView = new Pagebone.View;
    assert.equal(myView.render(), myView, '#render returns the view instance');
  });

  QUnit.test('delegateEvents', assert => {
    assert.expect(6);
    var counter1 = 0, counter2 = 0;

    var myView = new Pagebone.View({el: '#testElement'});
    myView.increment = () => { counter1++; };
    myView.$el.on('click', () => { counter2++; });

    var events = {'click h1': 'increment'};

    myView.delegateEvents(events);
    myView.$('h1').trigger('click');
    assert.equal(counter1, 1);
    assert.equal(counter2, 1);

    myView.$('h1').trigger('click');
    assert.equal(counter1, 2);
    assert.equal(counter2, 2);

    myView.delegateEvents(events);
    myView.$('h1').trigger('click');
    assert.equal(counter1, 3);
    assert.equal(counter2, 3);
  });

  QUnit.test('delegate', assert => {
    assert.expect(3);
    var myView = new Pagebone.View({el: '#testElement'});
    myView.delegate('click', 'h1', () => {
      assert.ok(true);
    });
    myView.delegate('click', () => {
      assert.ok(true);
    });
    myView.$('h1').trigger('click');

    assert.equal(myView.delegate(), myView, '#delegate returns the view instance');
  });

  QUnit.test('delegateEvents allows functions for callbacks', assert => {
    assert.expect(3);
    var myView = new Pagebone.View({el: '<p></p>'});
    myView.counter = 0;

    var events = {
      click() {
        this.counter++;
      }
    };

    myView.delegateEvents(events);
    myView.$el.trigger('click');
    assert.equal(myView.counter, 1);

    myView.$el.trigger('click');
    assert.equal(myView.counter, 2);

    myView.delegateEvents(events);
    myView.$el.trigger('click');
    assert.equal(myView.counter, 3);
  });

  QUnit.test('delegateEvents ignore undefined methods', assert => {
    assert.expect(0);
    var myView = new Pagebone.View({el: '<p></p>'});
    myView.delegateEvents({click: 'undefinedMethod'});
    myView.$el.trigger('click');
  });

  QUnit.test('undelegateEvents', assert => {
    assert.expect(7);
    var counter1 = 0, counter2 = 0;

    var myView = new Pagebone.View({el: '#testElement'});
    myView.increment = () => { counter1++; };
    myView.$el.on('click', () => { counter2++; });

    var events = {'click h1': 'increment'};

    myView.delegateEvents(events);
    myView.$('h1').trigger('click');
    assert.equal(counter1, 1);
    assert.equal(counter2, 1);

    myView.undelegateEvents();
    myView.$('h1').trigger('click');
    assert.equal(counter1, 1);
    assert.equal(counter2, 2);

    myView.delegateEvents(events);
    myView.$('h1').trigger('click');
    assert.equal(counter1, 2);
    assert.equal(counter2, 3);

    assert.equal(myView.undelegateEvents(), myView, '#undelegateEvents returns the view instance');
  });

  QUnit.test('undelegate', assert => {
    assert.expect(1);
    var myView = new Pagebone.View({el: '#testElement'});
    myView.delegate('click', () => { assert.ok(false); });
    myView.delegate('click', 'h1', () => { assert.ok(false); });

    myView.undelegate('click');

    myView.$('h1').trigger('click');
    myView.$el.trigger('click');

    assert.equal(myView.undelegate(), myView, '#undelegate returns the view instance');
  });

  QUnit.test('undelegate with passed handler', assert => {
    assert.expect(1);
    var myView = new Pagebone.View({el: '#testElement'});
    var listener = () => { assert.ok(false); };
    myView.delegate('click', listener);
    myView.delegate('click', () => { assert.ok(true); });
    myView.undelegate('click', listener);
    myView.$el.trigger('click');
  });

  QUnit.test('undelegate with selector', assert => {
    assert.expect(2);
    var myView = new Pagebone.View({el: '#testElement'});
    myView.delegate('click', () => { assert.ok(true); });
    myView.delegate('click', 'h1', () => { assert.ok(false); });
    myView.undelegate('click', 'h1');
    myView.$('h1').trigger('click');
    myView.$el.trigger('click');
  });

  QUnit.test('undelegate with handler and selector', assert => {
    assert.expect(2);
    var myView = new Pagebone.View({el: '#testElement'});
    myView.delegate('click', () => { assert.ok(true); });
    var handler = () => { assert.ok(false); };
    myView.delegate('click', 'h1', handler);
    myView.undelegate('click', 'h1', handler);
    myView.$('h1').trigger('click');
    myView.$el.trigger('click');
  });

  QUnit.test('tagName can be provided as a string', assert => {
    assert.expect(1);
    var View = Pagebone.View.extend({
      tagName: 'span'
    });

    assert.equal(new View().el.tagName, 'SPAN');
  });

  QUnit.test('tagName can be provided as a function', assert => {
    assert.expect(1);
    var View = Pagebone.View.extend({
      tagName() {
        return 'p';
      }
    });

    assert.ok(new View().$el.is('p'));
  });

  QUnit.test('_ensureElement with DOM node el', assert => {
    assert.expect(1);
    var View = Pagebone.View.extend({
      el: document.body
    });

    assert.equal(new View().el, document.body);
  });

  QUnit.test('_ensureElement with string el', assert => {
    assert.expect(3);
    var View = Pagebone.View.extend({
      el: 'body'
    });
    assert.strictEqual(new View().el, document.body);

    View = Pagebone.View.extend({
      el: '#testElement > h1'
    });
    assert.strictEqual(new View().el, $('#testElement > h1').get(0));

    View = Pagebone.View.extend({
      el: '#nonexistent'
    });
    assert.ok(!new View().el);
  });

  QUnit.test('with className and id functions', assert => {
    assert.expect(2);
    var View = Pagebone.View.extend({
      className() {
        return 'className';
      },
      id() {
        return 'id';
      }
    });

    assert.strictEqual(new View().el.className, 'className');
    assert.strictEqual(new View().el.id, 'id');
  });

  QUnit.test('with attributes', assert => {
    assert.expect(2);
    var View = Pagebone.View.extend({
      attributes: {
        'id': 'id',
        'class': 'class'
      }
    });

    assert.strictEqual(new View().el.className, 'class');
    assert.strictEqual(new View().el.id, 'id');
  });

  QUnit.test('with attributes as a function', assert => {
    assert.expect(1);
    var View = Pagebone.View.extend({
      attributes() {
        return {'class': 'dynamic'};
      }
    });

    assert.strictEqual(new View().el.className, 'dynamic');
  });

  QUnit.test('should default to className/id properties', assert => {
    assert.expect(4);
    var View = Pagebone.View.extend({
      className: 'backboneClass',
      id: 'backboneId',
      attributes: {
        'class': 'attributeClass',
        'id': 'attributeId'
      }
    });

    var myView = new View;
    assert.strictEqual(myView.el.className, 'backboneClass');
    assert.strictEqual(myView.el.id, 'backboneId');
    assert.strictEqual(myView.$el.attr('class'), 'backboneClass');
    assert.strictEqual(myView.$el.attr('id'), 'backboneId');
  });

  QUnit.test('multiple views per element', assert => {
    assert.expect(3);
    var count = 0;
    var $el = $('<p></p>');

    var View = Pagebone.View.extend({
      el: $el,
      events: {
        click() {
          count++;
        }
      }
    });

    var view1 = new View;
    $el.trigger('click');
    assert.equal(1, count);

    var view2 = new View;
    $el.trigger('click');
    assert.equal(3, count);

    view1.delegateEvents();
    $el.trigger('click');
    assert.equal(5, count);
  });

  QUnit.test('custom events', assert => {
    assert.expect(2);
    var View = Pagebone.View.extend({
      el: $('body'),
      events: {
        fake$event() { assert.ok(true); }
      }
    });

    var myView = new View;
    $('body').trigger('fake$event').trigger('fake$event');

    $('body').off('fake$event');
    $('body').trigger('fake$event');
  });

  QUnit.test('#1048 - setElement uses provided object.', assert => {
    assert.expect(2);
    var $el = $('body');

    var myView = new Pagebone.View({el: $el});
    assert.ok(myView.$el === $el);

    myView.setElement($el = $($el));
    assert.ok(myView.$el === $el);
  });

  QUnit.test('#986 - Undelegate before changing element.', assert => {
    assert.expect(1);
    var button1 = $('<button></button>');
    var button2 = $('<button></button>');

    var View = Pagebone.View.extend({
      events: {
        click(e) {
          assert.ok(myView.el === e.target);
        }
      }
    });

    var myView = new View({el: button1});
    myView.setElement(button2);

    button1.trigger('click');
    button2.trigger('click');
  });

  QUnit.test('#1172 - Clone attributes object', assert => {
    assert.expect(2);
    var View = Pagebone.View.extend({
      attributes: {foo: 'bar'}
    });

    var view1 = new View({id: 'foo'});
    assert.strictEqual(view1.el.id, 'foo');

    var view2 = new View();
    assert.ok(!view2.el.id);
  });

  QUnit.test('views stopListening', assert => {
    assert.expect(0);
    var View = Pagebone.View.extend({
      initialize() {
        this.listenTo(this.model, 'all x', () => { assert.ok(false); });
        this.listenTo(this.collection, 'all x', () => { assert.ok(false); });
      }
    });

    var myView = new View({
      model: new Pagebone.Model,
      collection: new Pagebone.Collection
    });

    myView.stopListening();
    myView.model.trigger('x');
    myView.collection.trigger('x');
  });

  QUnit.test('Provide function for el.', assert => {
    assert.expect(2);
    var View = Pagebone.View.extend({
      el() {
        return '<p><a></a></p>';
      }
    });

    var myView = new View;
    assert.ok(myView.$el.is('p'));
    assert.ok(myView.$el.has('a'));
  });

  QUnit.test('events passed in options', assert => {
    assert.expect(1);
    var counter = 0;

    var View = Pagebone.View.extend({
      el: '#testElement',
      increment() {
        counter++;
      }
    });

    var myView = new View({
      events: {
        'click h1': 'increment'
      }
    });

    myView.$('h1').trigger('click').trigger('click');
    assert.equal(counter, 2);
  });

  QUnit.test('remove', assert => {
    assert.expect(2);
    var myView = new Pagebone.View;
    document.body.appendChild(view.el);

    myView.delegate('click', () => { assert.ok(false); });
    myView.listenTo(myView, 'all x', () => { assert.ok(false); });

    assert.equal(myView.remove(), myView, '#remove returns the view instance');
    myView.$el.trigger('click');
    myView.trigger('x');

    // In IE8 and below, parentNode still exists but is not document.body.
    assert.notEqual(myView.el.parentNode, document.body);
  });

  QUnit.test('setElement', assert => {
    assert.expect(3);
    var myView = new Pagebone.View({
      events: {
        click() { assert.ok(false); }
      }
    });
    myView.events = {
      click() { assert.ok(true); }
    };
    var oldEl = myView.el;
    var $oldEl = myView.$el;

    myView.setElement(document.createElement('div'));

    $oldEl.click();
    myView.$el.click();

    assert.notEqual(oldEl, myView.el);
    assert.notEqual($oldEl, myView.$el);
  });

}))(QUnit);
