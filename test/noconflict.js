((QUnit => {

  QUnit.module('Pagebone.noConflict');

  QUnit.test('noConflict', assert => {
    assert.expect(2);
    var noconflictPagebone = Pagebone.noConflict();
    assert.equal(window.Pagebone, undefined, 'Returned window.Pagebone');
    window.Pagebone = noconflictPagebone;
    assert.equal(window.Pagebone, noconflictPagebone, 'Pagebone is still pointing to the original Pagebone');
  });

}))(QUnit);
