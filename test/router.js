((QUnit => {

  var router = null;
  var location = null;
  var lastRoute = null;
  var lastArgs = [];

  var onRoute = (routerParam, route, args) => {
    lastRoute = route;
    lastArgs = args;
  };

  var Location = function(href) {
    this.replace(href);
  };

  _.extend(Location.prototype, {

    parser: document.createElement('a'),

    replace(href) {
      this.parser.href = href;
      _.extend(this, _.pick(this.parser,
        'href',
        'hash',
        'host',
        'search',
        'fragment',
        'pathname',
        'protocol'
     ));

      // In IE, anchor.pathname does not contain a leading slash though
      // window.location.pathname does.
      if (!/^\//.test(this.pathname)) this.pathname = '/' + this.pathname;
    },

    toString() {
      return this.href;
    }

  });

  QUnit.module('Pagebone.Router', {

    beforeEach() {
      location = new Location('http://example.com');
      Pagebone.history = _.extend(new Pagebone.History, {location});
      router = new Router({testing: 101});
      Pagebone.history.interval = 9;
      Pagebone.history.start({pushState: false});
      lastRoute = null;
      lastArgs = [];
      Pagebone.history.on('route', onRoute);
    },

    afterEach() {
      Pagebone.history.stop();
      Pagebone.history.off('route', onRoute);
    }

  });

  var ExternalObject = {
    value: 'unset',

    routingFunction(value) {
      this.value = value;
    }
  };
  ExternalObject.routingFunction = _.bind(ExternalObject.routingFunction, ExternalObject);

  var Router = Pagebone.Router.extend({

    count: 0,

    routes: {
      'noCallback': 'noCallback',
      'counter': 'counter',
      'search/:query': 'search',
      'search/:query/p:page': 'search',
      'charñ': 'charUTF',
      'char%C3%B1': 'charEscaped',
      'contacts': 'contacts',
      'contacts/new': 'newContact',
      'contacts/:id': 'loadContact',
      'route-event/:arg': 'routeEvent',
      'optional(/:item)': 'optionalItem',
      'named/optional/(y:z)': 'namedOptional',
      'splat/*args/end': 'splat',
      ':repo/compare/*from...*to': 'github',
      'decode/:named/*splat': 'decode',
      '*first/complex-*part/*rest': 'complex',
      'query/:entity': 'query',
      'function/:value': ExternalObject.routingFunction,
      '*anything': 'anything'
    },

    preinitialize(options) {
      this.testpreinit = 'foo';
    },

    initialize(options) {
      this.testing = options.testing;
      this.route('implicit', 'implicit');
    },

    counter() {
      this.count++;
    },

    implicit() {
      this.count++;
    },

    search(query, page) {
      this.query = query;
      this.page = page;
    },

    charUTF() {
      this.charType = 'UTF';
    },

    charEscaped() {
      this.charType = 'escaped';
    },

    contacts() {
      this.contact = 'index';
    },

    newContact() {
      this.contact = 'new';
    },

    loadContact() {
      this.contact = 'load';
    },

    optionalItem(arg) {
      this.arg = arg !== void 0 ? arg : null;
    },

    splat(args) {
      this.args = args;
    },

    github(repo, from, to) {
      this.repo = repo;
      this.from = from;
      this.to = to;
    },

    complex(first, part, rest) {
      this.first = first;
      this.part = part;
      this.rest = rest;
    },

    query(entity, args) {
      this.entity    = entity;
      this.queryArgs = args;
    },

    anything(whatever) {
      this.anything = whatever;
    },

    namedOptional(z) {
      this.z = z;
    },

    decode(named, path) {
      this.named = named;
      this.path = path;
    },

    routeEvent(arg) {
    }

  });

  QUnit.test('initialize', assert => {
    assert.expect(1);
    assert.equal(router.testing, 101);
  });

  QUnit.test('preinitialize', assert => {
    assert.expect(1);
    assert.equal(router.testpreinit, 'foo');
  });

  QUnit.test('routes (simple)', assert => {
    assert.expect(4);
    location.replace('http://example.com#search/news');
    Pagebone.history.checkUrl();
    assert.equal(router.query, 'news');
    assert.equal(router.page, void 0);
    assert.equal(lastRoute, 'search');
    assert.equal(lastArgs[0], 'news');
  });

  QUnit.test('routes (simple, but unicode)', assert => {
    assert.expect(4);
    location.replace('http://example.com#search/тест');
    Pagebone.history.checkUrl();
    assert.equal(router.query, 'тест');
    assert.equal(router.page, void 0);
    assert.equal(lastRoute, 'search');
    assert.equal(lastArgs[0], 'тест');
  });

  QUnit.test('routes (two part)', assert => {
    assert.expect(2);
    location.replace('http://example.com#search/nyc/p10');
    Pagebone.history.checkUrl();
    assert.equal(router.query, 'nyc');
    assert.equal(router.page, '10');
  });

  QUnit.test('routes via navigate', assert => {
    assert.expect(2);
    Pagebone.history.navigate('search/manhattan/p20', {trigger: true});
    assert.equal(router.query, 'manhattan');
    assert.equal(router.page, '20');
  });

  QUnit.test('routes via navigate with params', assert => {
    assert.expect(1);
    Pagebone.history.navigate('query/test?a=b', {trigger: true});
    assert.equal(router.queryArgs, 'a=b');
  });

  QUnit.test('routes via navigate for backwards-compatibility', assert => {
    assert.expect(2);
    Pagebone.history.navigate('search/manhattan/p20', true);
    assert.equal(router.query, 'manhattan');
    assert.equal(router.page, '20');
  });

  QUnit.test('reports matched route via nagivate', assert => {
    assert.expect(1);
    assert.ok(Pagebone.history.navigate('search/manhattan/p20', true));
  });

  QUnit.test('route precedence via navigate', assert => {
    assert.expect(6);

    // Check both 0.9.x and backwards-compatibility options
    _.each([{trigger: true}, true], options => {
      Pagebone.history.navigate('contacts', options);
      assert.equal(router.contact, 'index');
      Pagebone.history.navigate('contacts/new', options);
      assert.equal(router.contact, 'new');
      Pagebone.history.navigate('contacts/foo', options);
      assert.equal(router.contact, 'load');
    });
  });

  QUnit.test('loadUrl is not called for identical routes.', assert => {
    assert.expect(0);
    Pagebone.history.loadUrl = () => { assert.ok(false); };
    location.replace('http://example.com#route');
    Pagebone.history.navigate('route');
    Pagebone.history.navigate('/route');
    Pagebone.history.navigate('/route');
  });

  QUnit.test('use implicit callback if none provided', assert => {
    assert.expect(1);
    router.count = 0;
    router.navigate('implicit', {trigger: true});
    assert.equal(router.count, 1);
  });

  QUnit.test('routes via navigate with {replace: true}', assert => {
    assert.expect(1);
    location.replace('http://example.com#start_here');
    Pagebone.history.checkUrl();
    location.replace = href => {
      assert.strictEqual(href, new Location('http://example.com#end_here').href);
    };
    Pagebone.history.navigate('end_here', {replace: true});
  });

  QUnit.test('routes (splats)', assert => {
    assert.expect(1);
    location.replace('http://example.com#splat/long-list/of/splatted_99args/end');
    Pagebone.history.checkUrl();
    assert.equal(router.args, 'long-list/of/splatted_99args');
  });

  QUnit.test('routes (github)', assert => {
    assert.expect(3);
    location.replace('http://example.com#backbone/compare/1.0...braddunbar:with/slash');
    Pagebone.history.checkUrl();
    assert.equal(router.repo, 'backbone');
    assert.equal(router.from, '1.0');
    assert.equal(router.to, 'braddunbar:with/slash');
  });

  QUnit.test('routes (optional)', assert => {
    assert.expect(2);
    location.replace('http://example.com#optional');
    Pagebone.history.checkUrl();
    assert.ok(!router.arg);
    location.replace('http://example.com#optional/thing');
    Pagebone.history.checkUrl();
    assert.equal(router.arg, 'thing');
  });

  QUnit.test('routes (complex)', assert => {
    assert.expect(3);
    location.replace('http://example.com#one/two/three/complex-part/four/five/six/seven');
    Pagebone.history.checkUrl();
    assert.equal(router.first, 'one/two/three');
    assert.equal(router.part, 'part');
    assert.equal(router.rest, 'four/five/six/seven');
  });

  QUnit.test('routes (query)', assert => {
    assert.expect(5);
    location.replace('http://example.com#query/mandel?a=b&c=d');
    Pagebone.history.checkUrl();
    assert.equal(router.entity, 'mandel');
    assert.equal(router.queryArgs, 'a=b&c=d');
    assert.equal(lastRoute, 'query');
    assert.equal(lastArgs[0], 'mandel');
    assert.equal(lastArgs[1], 'a=b&c=d');
  });

  QUnit.test('routes (anything)', assert => {
    assert.expect(1);
    location.replace('http://example.com#doesnt-match-a-route');
    Pagebone.history.checkUrl();
    assert.equal(router.anything, 'doesnt-match-a-route');
  });

  QUnit.test('routes (function)', assert => {
    assert.expect(3);
    router.on('route', name => {
      assert.ok(name === '');
    });
    assert.equal(ExternalObject.value, 'unset');
    location.replace('http://example.com#function/set');
    Pagebone.history.checkUrl();
    assert.equal(ExternalObject.value, 'set');
  });

  QUnit.test('Decode named parameters, not splats.', assert => {
    assert.expect(2);
    location.replace('http://example.com#decode/a%2Fb/c%2Fd/e');
    Pagebone.history.checkUrl();
    assert.strictEqual(router.named, 'a/b');
    assert.strictEqual(router.path, 'c/d/e');
  });

  QUnit.test('fires event when router doesn\'t have callback on it', assert => {
    assert.expect(1);
    router.on('route:noCallback', () => { assert.ok(true); });
    location.replace('http://example.com#noCallback');
    Pagebone.history.checkUrl();
  });

  QUnit.test('No events are triggered if #execute returns false.', assert => {
    assert.expect(1);
    var MyRouter = Pagebone.Router.extend({

      routes: {
        foo() {
          assert.ok(true);
          return false;
        }
      },
      execute(callback, args) {
        callback.apply(this, args);
        return false;
      }

    });

    var myRouter = new MyRouter;

    myRouter.on('route route:foo', () => {
      assert.ok(false);
    });

    Pagebone.history.on('route', () => {
      assert.ok(false);
    });

    location.replace('http://example.com#foo');
    Pagebone.history.checkUrl();
  });

  QUnit.test('#933, #908 - leading slash', assert => {
    assert.expect(2);
    location.replace('http://example.com/root/foo');

    Pagebone.history.stop();
    Pagebone.history = _.extend(new Pagebone.History, {location});
    Pagebone.history.start({root: '/root', hashChange: false, silent: true});
    assert.strictEqual(Pagebone.history.getFragment(), 'foo');

    Pagebone.history.stop();
    Pagebone.history = _.extend(new Pagebone.History, {location});
    Pagebone.history.start({root: '/root/', hashChange: false, silent: true});
    assert.strictEqual(Pagebone.history.getFragment(), 'foo');
  });

  QUnit.test('#967 - Route callback gets passed encoded values.', assert => {
    assert.expect(3);
    var route = 'has%2Fslash/complex-has%23hash/has%20space';
    Pagebone.history.navigate(route, {trigger: true});
    assert.strictEqual(router.first, 'has/slash');
    assert.strictEqual(router.part, 'has#hash');
    assert.strictEqual(router.rest, 'has space');
  });

  QUnit.test('correctly handles URLs with % (#868)', assert => {
    assert.expect(3);
    location.replace('http://example.com#search/fat%3A1.5%25');
    Pagebone.history.checkUrl();
    location.replace('http://example.com#search/fat');
    Pagebone.history.checkUrl();
    assert.equal(router.query, 'fat');
    assert.equal(router.page, void 0);
    assert.equal(lastRoute, 'search');
  });

  QUnit.test('#2666 - Hashes with UTF8 in them.', assert => {
    assert.expect(2);
    Pagebone.history.navigate('charñ', {trigger: true});
    assert.equal(router.charType, 'UTF');
    Pagebone.history.navigate('char%C3%B1', {trigger: true});
    assert.equal(router.charType, 'UTF');
  });

  QUnit.test('#1185 - Use pathname when hashChange is not wanted.', assert => {
    assert.expect(1);
    Pagebone.history.stop();
    location.replace('http://example.com/path/name#hash');
    Pagebone.history = _.extend(new Pagebone.History, {location});
    Pagebone.history.start({hashChange: false});
    var fragment = Pagebone.history.getFragment();
    assert.strictEqual(fragment, location.pathname.replace(/^\//, ''));
  });

  QUnit.test('#1206 - Strip leading slash before location.assign.', assert => {
    assert.expect(1);
    Pagebone.history.stop();
    location.replace('http://example.com/root/');
    Pagebone.history = _.extend(new Pagebone.History, {location});
    Pagebone.history.start({hashChange: false, root: '/root/'});
    location.assign = pathname => {
      assert.strictEqual(pathname, '/root/fragment');
    };
    Pagebone.history.navigate('/fragment');
  });

  QUnit.test('#1387 - Root fragment without trailing slash.', assert => {
    assert.expect(1);
    Pagebone.history.stop();
    location.replace('http://example.com/root');
    Pagebone.history = _.extend(new Pagebone.History, {location});
    Pagebone.history.start({hashChange: false, root: '/root/', silent: true});
    assert.strictEqual(Pagebone.history.getFragment(), '');
  });

  QUnit.test('#1366 - History does not prepend root to fragment.', assert => {
    assert.expect(2);
    Pagebone.history.stop();
    location.replace('http://example.com/root/');
    Pagebone.history = _.extend(new Pagebone.History, {
      location,
      history: {
        pushState(state, title, url) {
          assert.strictEqual(url, '/root/x');
        }
      }
    });
    Pagebone.history.start({
      root: '/root/',
      pushState: true,
      hashChange: false
    });
    Pagebone.history.navigate('x');
    assert.strictEqual(Pagebone.history.fragment, 'x');
  });

  QUnit.test('Normalize root.', assert => {
    assert.expect(1);
    Pagebone.history.stop();
    location.replace('http://example.com/root');
    Pagebone.history = _.extend(new Pagebone.History, {
      location,
      history: {
        pushState(state, title, url) {
          assert.strictEqual(url, '/root/fragment');
        }
      }
    });
    Pagebone.history.start({
      pushState: true,
      root: '/root',
      hashChange: false
    });
    Pagebone.history.navigate('fragment');
  });

  QUnit.test('Normalize root.', assert => {
    assert.expect(1);
    Pagebone.history.stop();
    location.replace('http://example.com/root#fragment');
    Pagebone.history = _.extend(new Pagebone.History, {
      location,
      history: {
        pushState(state, title, url) {},
        replaceState(state, title, url) {
          assert.strictEqual(url, '/root/fragment');
        }
      }
    });
    Pagebone.history.start({
      pushState: true,
      root: '/root'
    });
  });

  QUnit.test('Normalize root.', assert => {
    assert.expect(1);
    Pagebone.history.stop();
    location.replace('http://example.com/root');
    Pagebone.history = _.extend(new Pagebone.History, {location});
    Pagebone.history.loadUrl = () => { assert.ok(true); };
    Pagebone.history.start({
      pushState: true,
      root: '/root'
    });
  });

  QUnit.test('Normalize root - leading slash.', assert => {
    assert.expect(1);
    Pagebone.history.stop();
    location.replace('http://example.com/root');
    Pagebone.history = _.extend(new Pagebone.History, {
      location,
      history: {
        pushState() {},
        replaceState() {}
      }
    });
    Pagebone.history.start({root: 'root'});
    assert.strictEqual(Pagebone.history.root, '/root/');
  });

  QUnit.test('Transition from hashChange to pushState.', assert => {
    assert.expect(1);
    Pagebone.history.stop();
    location.replace('http://example.com/root#x/y');
    Pagebone.history = _.extend(new Pagebone.History, {
      location,
      history: {
        pushState() {},
        replaceState(state, title, url) {
          assert.strictEqual(url, '/root/x/y');
        }
      }
    });
    Pagebone.history.start({
      root: 'root',
      pushState: true
    });
  });

  QUnit.test('#1619: Router: Normalize empty root', assert => {
    assert.expect(1);
    Pagebone.history.stop();
    location.replace('http://example.com/');
    Pagebone.history = _.extend(new Pagebone.History, {
      location,
      history: {
        pushState() {},
        replaceState() {}
      }
    });
    Pagebone.history.start({root: ''});
    assert.strictEqual(Pagebone.history.root, '/');
  });

  QUnit.test('#1619: Router: nagivate with empty root', assert => {
    assert.expect(1);
    Pagebone.history.stop();
    location.replace('http://example.com/');
    Pagebone.history = _.extend(new Pagebone.History, {
      location,
      history: {
        pushState(state, title, url) {
          assert.strictEqual(url, '/fragment');
        }
      }
    });
    Pagebone.history.start({
      pushState: true,
      root: '',
      hashChange: false
    });
    Pagebone.history.navigate('fragment');
  });

  QUnit.test('Transition from pushState to hashChange.', assert => {
    assert.expect(1);
    Pagebone.history.stop();
    location.replace('http://example.com/root/x/y?a=b');
    location.replace = url => {
      assert.strictEqual(url, '/root#x/y?a=b');
    };
    Pagebone.history = _.extend(new Pagebone.History, {
      location,
      history: {
        pushState: null,
        replaceState: null
      }
    });
    Pagebone.history.start({
      root: 'root',
      pushState: true
    });
  });

  QUnit.test('#1695 - hashChange to pushState with search.', assert => {
    assert.expect(1);
    Pagebone.history.stop();
    location.replace('http://example.com/root#x/y?a=b');
    Pagebone.history = _.extend(new Pagebone.History, {
      location,
      history: {
        pushState() {},
        replaceState(state, title, url) {
          assert.strictEqual(url, '/root/x/y?a=b');
        }
      }
    });
    Pagebone.history.start({
      root: 'root',
      pushState: true
    });
  });

  QUnit.test('#1746 - Router allows empty route.', assert => {
    assert.expect(1);
    var MyRouter = Pagebone.Router.extend({
      routes: {'': 'empty'},
      empty() {},
      route(route) {
        assert.strictEqual(route, '');
      }
    });
    new MyRouter;
  });

  QUnit.test('#1794 - Trailing space in fragments.', assert => {
    assert.expect(1);
    var history = new Pagebone.History;
    assert.strictEqual(history.getFragment('fragment   '), 'fragment');
  });

  QUnit.test('#1820 - Leading slash and trailing space.', assert => {
    assert.expect(1);
    var history = new Pagebone.History;
    assert.strictEqual(history.getFragment('/fragment '), 'fragment');
  });

  QUnit.test('#1980 - Optional parameters.', assert => {
    assert.expect(2);
    location.replace('http://example.com#named/optional/y');
    Pagebone.history.checkUrl();
    assert.strictEqual(router.z, undefined);
    location.replace('http://example.com#named/optional/y123');
    Pagebone.history.checkUrl();
    assert.strictEqual(router.z, '123');
  });

  QUnit.test('#2062 - Trigger "route" event on router instance.', assert => {
    assert.expect(2);
    router.on('route', (name, args) => {
      assert.strictEqual(name, 'routeEvent');
      assert.deepEqual(args, ['x', null]);
    });
    location.replace('http://example.com#route-event/x');
    Pagebone.history.checkUrl();
  });

  QUnit.test('#2255 - Extend routes by making routes a function.', assert => {
    assert.expect(1);
    var RouterBase = Pagebone.Router.extend({
      routes() {
        return {
          home: 'root',
          index: 'index.html'
        };
      }
    });

    var RouterExtended = RouterBase.extend({
      routes() {
        var _super = RouterExtended.__super__.routes;
        return _.extend(_super(), {show: 'show', search: 'search'});
      }
    });

    var myRouter = new RouterExtended();
    assert.deepEqual({home: 'root', index: 'index.html', show: 'show', search: 'search'}, myRouter.routes);
  });

  QUnit.test('#2538 - hashChange to pushState only if both requested.', assert => {
    assert.expect(0);
    Pagebone.history.stop();
    location.replace('http://example.com/root?a=b#x/y');
    Pagebone.history = _.extend(new Pagebone.History, {
      location,
      history: {
        pushState() {},
        replaceState() { assert.ok(false); }
      }
    });
    Pagebone.history.start({
      root: 'root',
      pushState: true,
      hashChange: false
    });
  });

  QUnit.test('No hash fallback.', assert => {
    assert.expect(0);
    Pagebone.history.stop();
    Pagebone.history = _.extend(new Pagebone.History, {
      location,
      history: {
        pushState() {},
        replaceState() {}
      }
    });

    var MyRouter = Pagebone.Router.extend({
      routes: {
        hash() { assert.ok(false); }
      }
    });
    var myRouter = new MyRouter;

    location.replace('http://example.com/');
    Pagebone.history.start({
      pushState: true,
      hashChange: false
    });
    location.replace('http://example.com/nomatch#hash');
    Pagebone.history.checkUrl();
  });

  QUnit.test('#2656 - No trailing slash on root.', assert => {
    assert.expect(1);
    Pagebone.history.stop();
    Pagebone.history = _.extend(new Pagebone.History, {
      location,
      history: {
        pushState(state, title, url) {
          assert.strictEqual(url, '/root');
        }
      }
    });
    location.replace('http://example.com/root/path');
    Pagebone.history.start({pushState: true, hashChange: false, root: 'root'});
    Pagebone.history.navigate('');
  });

  QUnit.test('#2656 - No trailing slash on root.', assert => {
    assert.expect(1);
    Pagebone.history.stop();
    Pagebone.history = _.extend(new Pagebone.History, {
      location,
      history: {
        pushState(state, title, url) {
          assert.strictEqual(url, '/');
        }
      }
    });
    location.replace('http://example.com/path');
    Pagebone.history.start({pushState: true, hashChange: false});
    Pagebone.history.navigate('');
  });

  QUnit.test('#2656 - No trailing slash on root.', assert => {
    assert.expect(1);
    Pagebone.history.stop();
    Pagebone.history = _.extend(new Pagebone.History, {
      location,
      history: {
        pushState(state, title, url) {
          assert.strictEqual(url, '/root?x=1');
        }
      }
    });
    location.replace('http://example.com/root/path');
    Pagebone.history.start({pushState: true, hashChange: false, root: 'root'});
    Pagebone.history.navigate('?x=1');
  });

  QUnit.test('#2765 - Fragment matching sans query/hash.', assert => {
    assert.expect(2);
    Pagebone.history.stop();
    Pagebone.history = _.extend(new Pagebone.History, {
      location,
      history: {
        pushState(state, title, url) {
          assert.strictEqual(url, '/path?query#hash');
        }
      }
    });

    var MyRouter = Pagebone.Router.extend({
      routes: {
        path() { assert.ok(true); }
      }
    });
    var myRouter = new MyRouter;

    location.replace('http://example.com/');
    Pagebone.history.start({pushState: true, hashChange: false});
    Pagebone.history.navigate('path?query#hash', true);
  });

  QUnit.test('Do not decode the search params.', assert => {
    assert.expect(1);
    var MyRouter = Pagebone.Router.extend({
      routes: {
        path(params) {
          assert.strictEqual(params, 'x=y%3Fz');
        }
      }
    });
    var myRouter = new MyRouter;
    Pagebone.history.navigate('path?x=y%3Fz', true);
  });

  QUnit.test('Navigate to a hash url.', assert => {
    assert.expect(1);
    Pagebone.history.stop();
    Pagebone.history = _.extend(new Pagebone.History, {location});
    Pagebone.history.start({pushState: true});
    var MyRouter = Pagebone.Router.extend({
      routes: {
        path(params) {
          assert.strictEqual(params, 'x=y');
        }
      }
    });
    var myRouter = new MyRouter;
    location.replace('http://example.com/path?x=y#hash');
    Pagebone.history.checkUrl();
  });

  QUnit.test('#navigate to a hash url.', assert => {
    assert.expect(1);
    Pagebone.history.stop();
    Pagebone.history = _.extend(new Pagebone.History, {location});
    Pagebone.history.start({pushState: true});
    var MyRouter = Pagebone.Router.extend({
      routes: {
        path(params) {
          assert.strictEqual(params, 'x=y');
        }
      }
    });
    var myRouter = new MyRouter;
    Pagebone.history.navigate('path?x=y#hash', true);
  });

  QUnit.test('unicode pathname', assert => {
    assert.expect(1);
    location.replace('http://example.com/myyjä');
    Pagebone.history.stop();
    Pagebone.history = _.extend(new Pagebone.History, {location});
    var MyRouter = Pagebone.Router.extend({
      routes: {
        myyjä() {
          assert.ok(true);
        }
      }
    });
    new MyRouter;
    Pagebone.history.start({pushState: true});
  });

  QUnit.test('unicode pathname with % in a parameter', assert => {
    assert.expect(1);
    location.replace('http://example.com/myyjä/foo%20%25%3F%2f%40%25%20bar');
    location.pathname = '/myyj%C3%A4/foo%20%25%3F%2f%40%25%20bar';
    Pagebone.history.stop();
    Pagebone.history = _.extend(new Pagebone.History, {location});
    var MyRouter = Pagebone.Router.extend({
      routes: {
        'myyjä/:query'(query) {
          assert.strictEqual(query, 'foo %?/@% bar');
        }
      }
    });
    new MyRouter;
    Pagebone.history.start({pushState: true});
  });

  QUnit.test('newline in route', assert => {
    assert.expect(1);
    location.replace('http://example.com/stuff%0Anonsense?param=foo%0Abar');
    Pagebone.history.stop();
    Pagebone.history = _.extend(new Pagebone.History, {location});
    var MyRouter = Pagebone.Router.extend({
      routes: {
        'stuff\nnonsense'() {
          assert.ok(true);
        }
      }
    });
    new MyRouter;
    Pagebone.history.start({pushState: true});
  });

  QUnit.test('Router#execute receives callback, args, name.', assert => {
    assert.expect(3);
    location.replace('http://example.com#foo/123/bar?x=y');
    Pagebone.history.stop();
    Pagebone.history = _.extend(new Pagebone.History, {location});
    var MyRouter = Pagebone.Router.extend({
      routes: {'foo/:id/bar': 'foo'},
      foo() {},
      execute(callback, args, name) {
        assert.strictEqual(callback, this.foo);
        assert.deepEqual(args, ['123', 'x=y']);
        assert.strictEqual(name, 'foo');
      }
    });
    var myRouter = new MyRouter;
    Pagebone.history.start();
  });

  QUnit.test('pushState to hashChange with only search params.', assert => {
    assert.expect(1);
    Pagebone.history.stop();
    location.replace('http://example.com?a=b');
    location.replace = url => {
      assert.strictEqual(url, '/#?a=b');
    };
    Pagebone.history = _.extend(new Pagebone.History, {
      location,
      history: null
    });
    Pagebone.history.start({pushState: true});
  });

  QUnit.test('#3123 - History#navigate decodes before comparison.', assert => {
    assert.expect(1);
    Pagebone.history.stop();
    location.replace('http://example.com/shop/search?keyword=short%20dress');
    Pagebone.history = _.extend(new Pagebone.History, {
      location,
      history: {
        pushState() { assert.ok(false); },
        replaceState() { assert.ok(false); }
      }
    });
    Pagebone.history.start({pushState: true});
    Pagebone.history.navigate('shop/search?keyword=short%20dress', true);
    assert.strictEqual(Pagebone.history.fragment, 'shop/search?keyword=short dress');
  });

  QUnit.test('#3175 - Urls in the params', assert => {
    assert.expect(1);
    Pagebone.history.stop();
    location.replace('http://example.com#login?a=value&backUrl=https%3A%2F%2Fwww.msn.com%2Fidp%2Fidpdemo%3Fspid%3Dspdemo%26target%3Db');
    Pagebone.history = _.extend(new Pagebone.History, {location});
    var myRouter = new Pagebone.Router;
    myRouter.route('login', params => {
      assert.strictEqual(params, 'a=value&backUrl=https%3A%2F%2Fwww.msn.com%2Fidp%2Fidpdemo%3Fspid%3Dspdemo%26target%3Db');
    });
    Pagebone.history.start();
  });

  QUnit.test('Middleware support - Urls in the params', assert => {
    assert.expect(3);
    var done = assert.async();
    Pagebone.history.stop();
    location.replace('http://example.com#login?a=value&backUrl=https%3A%2F%2Fwww.msn.com%2Fidp%2Fidpdemo%3Fspid%3Dspdemo%26target%3Db');
    Pagebone.history = _.extend(new Pagebone.History, {location});
    var myRouter = new Pagebone.Router;
    myRouter.route('login',function(params, next){
      next({login: true});
    }, function (ctx, next) {
      assert.strictEqual(ctx.login, true);
      setTimeout(function(){
        next({ user: 'Terry Cai'});
      }, 1000)
    }, function(params, prev){
      assert.strictEqual(params, 'a=value&backUrl=https%3A%2F%2Fwww.msn.com%2Fidp%2Fidpdemo%3Fspid%3Dspdemo%26target%3Db');
      assert.strictEqual(prev.user, 'Terry Cai');
      done();
    });
    Pagebone.history.start();
  });


  QUnit.test('#3358 - pushState to hashChange transition with search params', assert => {
    assert.expect(1);
    Pagebone.history.stop();
    location.replace('http://example.com/root?foo=bar');
    location.replace = url => {
      assert.strictEqual(url, '/root#?foo=bar');
    };
    Pagebone.history = _.extend(new Pagebone.History, {
      location,
      history: {
        pushState: undefined,
        replaceState: undefined
      }
    });
    Pagebone.history.start({root: '/root', pushState: true});
  });

  QUnit.test('Paths that don\'t match the root should not match no root', assert => {
    assert.expect(0);
    location.replace('http://example.com/foo');
    Pagebone.history.stop();
    Pagebone.history = _.extend(new Pagebone.History, {location});
    var MyRouter = Pagebone.Router.extend({
      routes: {
        foo() {
          assert.ok(false, 'should not match unless root matches');
        }
      }
    });
    var myRouter = new MyRouter;
    Pagebone.history.start({root: 'root', pushState: true});
  });

  QUnit.test('Paths that don\'t match the root should not match roots of the same length', assert => {
    assert.expect(0);
    location.replace('http://example.com/xxxx/foo');
    Pagebone.history.stop();
    Pagebone.history = _.extend(new Pagebone.History, {location});
    var MyRouter = Pagebone.Router.extend({
      routes: {
        foo() {
          assert.ok(false, 'should not match unless root matches');
        }
      }
    });
    var myRouter = new MyRouter;
    Pagebone.history.start({root: 'root', pushState: true});
  });

  QUnit.test('roots with regex characters', assert => {
    assert.expect(1);
    location.replace('http://example.com/x+y.z/foo');
    Pagebone.history.stop();
    Pagebone.history = _.extend(new Pagebone.History, {location});
    var MyRouter = Pagebone.Router.extend({
      routes: {foo() { assert.ok(true); }}
    });
    var myRouter = new MyRouter;
    Pagebone.history.start({root: 'x+y.z', pushState: true});
  });

  QUnit.test('roots with unicode characters', assert => {
    assert.expect(1);
    location.replace('http://example.com/®ooτ/foo');
    Pagebone.history.stop();
    Pagebone.history = _.extend(new Pagebone.History, {location});
    var MyRouter = Pagebone.Router.extend({
      routes: {foo() { assert.ok(true); }}
    });
    var myRouter = new MyRouter;
    Pagebone.history.start({root: '®ooτ', pushState: true});
  });

  QUnit.test('roots without slash', assert => {
    assert.expect(1);
    location.replace('http://example.com/®ooτ');
    Pagebone.history.stop();
    Pagebone.history = _.extend(new Pagebone.History, {location});
    var MyRouter = Pagebone.Router.extend({
      routes: {''() { assert.ok(true); }}
    });
    var myRouter = new MyRouter;
    Pagebone.history.start({root: '®ooτ', pushState: true});
  });

  QUnit.test('#4025 - navigate updates URL hash as is', assert => {
    assert.expect(1);
    var route = 'search/has%20space';
    Pagebone.history.navigate(route);
    assert.strictEqual(location.hash, '#' + route);
  });

}))(QUnit);
