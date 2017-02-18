'use strict';

require('mocha');
var assert = require('assert');
var Rewrite = require('..');
var Rule = Rewrite.Rule;

describe('Rule', function() {
  it('should be a function', function() {
    assert.equal(typeof Rule, 'function');
  });

  it('should throw an error when invalid args are passed', function(cb) {
    try {
      new Rule();
      cb(new Error('expected an error'));
    } catch (err) {
      assert(err);
      assert.equal(err.message, 'expected structure to be a string');
      cb();
    }
  });

  it('should instantiate', function() {
    assert(new Rule('foo', 'bar') instanceof Rule);
  });

  it('should expose a "pattern" property', function() {
    var rule = new Rule('foo', 'bar');
    assert.equal(typeof rule.pattern, 'string');
    assert.equal(rule.pattern, 'foo');
  });

  it('should expose a "structure" property', function() {
    var rule = new Rule('foo', 'bar');
    assert.equal(typeof rule.structure, 'string');
    assert.equal(rule.structure, 'bar');
  });

  it('should expose a fn property when last arg is a function', function() {
    var rule = new Rule('foo', 'bar', function() {});
    assert.equal(typeof rule.fn, 'function');
  });
});
