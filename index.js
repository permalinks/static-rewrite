'use strict';

var util = require('util');
var isObject = require('isobject');
var Permalinks = require('permalinks');
var toRegex = require('path-to-regexp');
var define = require('define-property');

/**
 * Create an instance of `Rewriter` with the given `options`.
 *
 * ```js
 * var rewriter = new Rewriter()
 *   .rule(/posts/, 'blog/:stem/index.html')
 *   .rule(/docs/, 'docs/:stem/index.html')
 *
 * console.log(rewriter.rewrite({path: 'content/posts/first-post.md'}));
 * //=> 'blog/first-post/index.html'
 *
 * console.log(rewriter.rewrite({path: 'content/posts/other-post.md'}));
 * //=> 'blog/other-post/index.html'
 *
 * console.log(rewriter.rewrite({path: 'content/docs/api.md'}));
 * //=> 'docs/api/index.html'
 * ```
 * @param {Object} `options`
 * @api public
 */

var Rewriter = module.exports = function Rewriter(options) {
  Permalinks.call(this, (this.options = options || {}));
  this.rules = this.options.rules || [];
  this.Rule = this.options.Rule || Rule;
  define(this, 'isRewriter', true);
};

/**
 * Inherit Permalinks
 */

util.inherits(Rewriter, Permalinks);

/**
 * Expose static `.Rule` method
 */

Rewriter.Rule = Rule;

/**
 * Register a rewrite rule with a `regex` to use for matching paths,
 * a `structure` to use for the replacement patter, and an optional
 * validation `fn` to supplement the regex when matching.
 *
 * ```js
 * rewriter.rule(':folder/([^\\/]+)/(.*)', ':dirname/:foo/:stem.html');
 * rewriter.rule(/([^\\/]+)\/*\.hbs$/, ':dirname/:foo/:stem.html');
 * rewriter.rule(/\.hbs$/, ':dirname/:stem.html');
 * rewriter.rule(/\.md$/, 'blog/:stem/index.html', function(file) {
 *   return file.dirname !== 'foo/bar';
 * });
 * ```
 * @param {RegExp} `regex`
 * @param {String} `structure`
 * @param {Function} `fn` Optionally pass a function to do further validation on the file (return `false` if the rule shouldn't be used) and/or to update the context to be used for resolving placeholders in the rule `structure`.
 * @return {Object} Returns the Rewriter instance for chaining.
 * @api public
 */

Rewriter.prototype.rule = function(pattern, structure, fn) {
  this.rules.push(new this.Rule(pattern, structure, fn));
  return this;
};

/**
 * Run rewrite [rules](#rule) on the given `file`. If a rule matches
 * the file, the `file.path` will be rewritten using `locals`, and values
 * from the `file` and `file.data`.
 *
 * @param {Object} `file`
 * @param {Object} `locals`
 * @return {String} Returns the formatted path or the original `file.path` if no rewrite rules match the file.
 * @api public
 */

Rewriter.prototype.rewrite = function(val, locals) {
  var file = this.normalizeFile(val, this.options);
  for (var i = 0; i < this.rules.length; i++) {
    var rule = this.rules[i];
    if (this.match(rule, file) !== false) {
      return this.format(rule.structure, file, locals);
    }
  }
  return file.path;
};

/**
 * Calls `RegExp.exec()` on `file.path`, using the regex from the given
 * rewrite `rule`. If the file matches, the match arguments are returned,
 * otherwise `null`.
 *
 * ```js
 * var fileA = new File({path: 'blog/drafts/about.hbs'});
 * var fileB = new File({path: 'blog/content/about.hbs'});
 *
 * var ruleA = new rewriter.Rule(/blog\//, ':stem/index.html');
 * var ruleB = new rewriter.Rule(/blog\//, ':stem/index.html', function(file) {
 *   return !/drafts/.test(file.path);
 * });
 *
 * console.log(rewriter.match(ruleA, fileA)); //<= true
 * console.log(rewriter.match(ruleB, fileA)); //<= false
 *
 * console.log(rewriter.match(ruleA, fileB)); //<= true
 * console.log(rewriter.match(ruleB, fileB)); //<= true
 * ```
 * @param {Object} `rule`
 * @param {Object} `file`
 * @return {Boolean}
 * @api public
 */

Rewriter.prototype.match = function(rule, file) {
  if (!isObject(file)) {
    throw new TypeError('expected file to be an object');
  }
  if (!isObject(rule) || !rule.isRule) {
    throw new Error('expected a rule as the first argument');
  }

  let match = rule.regex.exec(file.path);
  if (match) {
    // create params from rule pattern
    for (let i = 1; i < match.length; ++i) {
      let param = rule.keys[i - 1];
      rule.params[param.name] = match[i];
    }

    if (typeof rule.fn === 'function') {
      return rule.fn.call(this, file, rule.params, match);
    }
    return true;
  }
  return false;
};

/**
 * Create a new `Rule` with the given `pattern`, `structure` and
 * optional function for validating or adding data to the context
 *
 * ```js
 * var rule = new Rule(/posts/, 'blog/:stem/index.html');
 * var rule = new Rule(/posts/, 'blog/:stem/index.html', function(file) {
 *   return file.extname !== '.foo';
 * });
 * var rule = new Rule(/posts/, 'blog/:stem/index.html', function(file, params) {
 *   file.data = Object.assign({}, file.data, params);
 * });
 * ```
 *
 * @param {String} `pattern`
 * @param {String} `structure`
 * @param {Function} `fn`
 * @api public
 */

function Rule(pattern, structure, fn) {
  if (typeof structure !== 'string') {
    throw new TypeError('expected structure to be a string');
  }
  if (fn && typeof fn !== 'function') {
    throw new TypeError('expected fn to be a function or undefined');
  }

  define(this, 'isRule', true);
  this.keys = [];
  this.params = {};
  this.pattern = pattern;
  this.structure = structure;
  this.options = {strict: true};
  this.fn = fn;
  var regex;

  Object.defineProperty(this, 'regex', {
    configurable: true,
    enumberable: true,
    set: function(val) {
      regex = val;
    },
    get: function() {
      return regex || (regex = toRegex(this.pattern, this.keys, this.options));
    }
  });
}

/**
 * Expose `Rewriter`
 */

module.exports = Rewriter;
