((QUnit => {
  var sync = Pagebone.sync;
  var ajax = Pagebone.ajax;
  var emulateHTTP = Pagebone.emulateHTTP || false;
  var emulateJSON = Pagebone.emulateJSON  || false;
  var history = window.history;
  var pushState = history.pushState;
  var replaceState = history.replaceState;


  QUnit.config.noglobals = true;

  QUnit.testStart(() => {
    var env = QUnit.config.current.testEnvironment;

    // We never want to actually call these during tests.
    history.pushState = history.replaceState = () => {};

    // Capture ajax settings for comparison.
    Pagebone.ajax = settings => {
      env.ajaxSettings = settings;
    };

    // Capture the arguments to Pagebone.sync for comparison.
    Pagebone.sync = function(method, model, options) {
      env.syncArgs = {
        method,
        model,
        options
      };
      sync.apply(this, arguments);
    };

  });

  QUnit.testDone(() => {
    Pagebone.sync = sync;
    Pagebone.ajax = ajax;
    Pagebone.emulateHTTP = emulateHTTP;
    Pagebone.emulateJSON = emulateJSON;
    history.pushState = pushState;
    history.replaceState = replaceState;
  });

}))(QUnit);
