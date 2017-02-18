'use strict';

require('mocha');
var assert = require('assert');
var Rewriter = require('..');
var rewriter;

describe('Rewriter', function() {
  describe('ctor', function() {
    beforeEach(function() {
      rewriter = new Rewriter();
    });

    it('should export a function', function() {
      assert.equal(typeof Rewriter, 'function');
    });

    it('should instantiate', function() {
      assert(new Rewriter() instanceof Rewriter);
    });

    it('should expose a static .Rule method', function() {
      assert.equal(typeof Rewriter.Rule, 'function');
    });

    it('should expose a .Rule method on the instance', function() {
      assert.equal(typeof rewriter.Rule, 'function');
    });

    it('should expose a .rule method', function() {
      assert.equal(typeof rewriter.rule, 'function');
    });

    it('should expose a .match method', function() {
      assert.equal(typeof rewriter.match, 'function');
    });

    it('should expose a .rewrite method', function() {
      assert.equal(typeof rewriter.rewrite, 'function');
    });
  });

  describe('.rule', function() {
    beforeEach(function() {
      rewriter = new Rewriter();
    });

    it('should add a rule to rewriter.rules', function() {
      rewriter.rule('a', 'b');
      rewriter.rule('c', 'd');
      assert.equal(rewriter.rules.length, 2);
    });

    it('should add rules passed on ctor options to rewriter.rules', function() {
      rewriter = new Rewriter({
        rules: [
          new rewriter.Rule('a', 'b'),
          new rewriter.Rule('c', 'd')
        ]
      });
      assert.equal(rewriter.rules.length, 2);
    });
  });

  describe('.match', function() {
    beforeEach(function() {
      rewriter = new Rewriter({strict: true});
    });

    function isMatch(pattern, structure, filepath, fn) {
      var file = rewriter.normalizeFile(filepath, rewriter.options);
      return rewriter.match(new rewriter.Rule(pattern, structure, fn), file);
    }

    it('should return true if a path matches a rule pattern', function() {
      assert(isMatch('*', ':stem', 'foo/bar'));
      assert(isMatch('foo/*', ':stem', 'foo/bar'));
      assert(isMatch('*/*', ':stem', 'foo/bar'));
      assert(isMatch(':a/:b', ':stem', 'foo/bar'));
    });

    it('should return true if a validation function returns true', function() {
      assert(isMatch('*', ':stem', 'foo/bar', function() {
        return true;
      }));
      assert(isMatch('foo/*', ':stem', 'foo/bar', function() {
        return true;
      }));
      assert(isMatch('*/*', ':stem', 'foo/bar', function() {
        return true;
      }));
      assert(isMatch(':a/:b', ':stem', 'foo/bar', function() {
        return true;
      }));
    });

    it('should return false if a validation function returns false', function() {
      assert(!isMatch('*', ':stem', 'foo/bar', function() {
        return false;
      }));
      assert(!isMatch('foo/*', ':stem', 'foo/bar', function() {
        return false;
      }));
      assert(!isMatch('*/*', ':stem', 'foo/bar', function() {
        return false;
      }));
      assert(!isMatch(':a/:b', ':stem', 'foo/bar', function() {
        return false;
      }));
    });

    it('should return false if a path does not match a rule pattern', function() {
      assert(!isMatch('abc', ':stem', 'foo/bar'));
      assert(!isMatch('bar/foo', ':stem', 'foo/bar'));
      assert(!isMatch('*/*/', ':stem', 'foo/bar'));
      assert(!isMatch(':a/:b/:c', ':stem', 'foo/bar'));
    });
  });

  describe('.rewrite', function() {
    beforeEach(function() {
      rewriter = new Rewriter({strict: true});
    });

    it('should rewrite a file.path using a rule with regex', function() {
      rewriter.rule(/\/content\/posts/, 'blog/:stem/index.html');
      var actual = rewriter.rewrite({path: '/content/posts/first-post.md'});
      assert.equal(actual, 'blog/first-post/index.html');
    });

    it('should expose match params as the second argument', function() {
      rewriter.rule('/content/:folder/*', ':folder/:stem/index.html', function(file, params) {
        assert.deepEqual(params, {0: 'first-post.md', folder: 'posts'});
        file.data = Object.assign({}, file.data, params);
        return true;
      });

      var actual = rewriter.rewrite({path: '/content/posts/first-post.md'});
      assert.equal(actual, 'posts/first-post/index.html');
    });

    it('should expose match params as the second argument', function() {
      rewriter.rule('/content/:folder/*/*.md', ':folder/:0/:stem/index.html', function(file, params) {
        assert.deepEqual(params, {0: 'abc', 1: 'first-post', folder: 'posts'});
        file.data = Object.assign({}, file.data, params);
        return true;
      });

      var actual = rewriter.rewrite({path: '/content/posts/abc/first-post.md'});
      assert.equal(actual, 'posts/abc/first-post/index.html');
    });

    it('should add data to the context in the callback', function() {
      rewriter.rule('/content/:folder/*/*.md', ':folder/:foo/:stem/index.html', function(file, params) {
        assert.deepEqual(params, {0: 'abc', 1: 'first-post', folder: 'posts'});
        params.foo = params[0];
        file.data = Object.assign({}, file.data, params);
        return true;
      });

      var actual = rewriter.rewrite({path: '/content/posts/abc/first-post.md'});
      assert.equal(actual, 'posts/abc/first-post/index.html');
    });

    it('should add data to the context in the callback', function() {
      rewriter.rule('/content/:folder/*/*.md', ':folder/:foo/:stem/index.html', function(file, params) {
        assert.deepEqual(params, {0: 'abc', 1: 'first-post', folder: 'posts'});
        params.foo = params[0];
        file.data = Object.assign({}, file.data, params);
        return true;
      });

      var actual = rewriter.rewrite({path: '/content/posts/abc/first-post.md'});
      assert.equal(actual, 'posts/abc/first-post/index.html');
    });

    it('should use helpers', function() {
      rewriter.data.xyz = 'abc';
      rewriter.helper('foo', function(options) {
        return this.context.xyz;
      });

      rewriter.rule('posts/:one/:two.md', ':foo/:stem/index.html', function(file, params) {
        assert.deepEqual(params, {one: 'a', two: 'b'});
        file.data = Object.assign({}, file.data, params);
        return true;
      });

      var actual = rewriter.rewrite({path: 'posts/a/b.md'});
      assert.equal(actual, 'abc/b/index.html');
    });

    it('should use hash arguments', function() {
      rewriter.data.whatever = 'abc';
      rewriter.helper('foo', function(options) {
        return options.hash.name;
      });

      rewriter.rule('posts/:one/:two.md', ':foo(name=whatever)/:stem/index.html', function(file, params) {
        assert.deepEqual(params, {one: 'a', two: 'b'});
        file.data = Object.assign({}, file.data, params);
        return true;
      });

      var actual = rewriter.rewrite({path: 'posts/a/b.md'});
      assert.equal(actual, 'abc/b/index.html');
    });

    it('should rewrite a file.path using match params', function() {
      rewriter.rule('/content/:folder/*', ':folder/:stem/index.html', function(file, params) {
        file.data = Object.assign({}, file.data, params);
      });
      var actual = rewriter.rewrite({path: '/content/posts/first-post.md'});
      assert.equal(actual, 'posts/first-post/index.html');
    });

    it('should now rewrite a file.path when the function returns false', function() {
      rewriter.rule('/content/:folder/*', ':folder/:stem/index.html', function(file) {
        return false;
      });
      var actual = rewriter.rewrite({path: '/content/posts/first-post.md'});
      assert.equal(actual, '/content/posts/first-post.md');
    });

    it('should rewrite a file.path using a preset', function() {
      rewriter.preset('blog', ':folder/:stem/index.html');

      rewriter.rule('/content/:folder/*', 'blog', function(file, params) {
        file.data = Object.assign({}, file.data, params);
      });

      var actual = rewriter.rewrite({path: '/content/posts/first-post.md'});
      assert.equal(actual, 'posts/first-post/index.html');
    });

    it('should create params from path segments', function() {
      rewriter.preset('blog', ':b/:stem/index.html');

      rewriter.rule('/content/:a/:b/:c/*', 'blog', function(file, params) {
        file.data = Object.assign({}, file.data, params);
      });

      var actual = rewriter.rewrite({path: '/content/foo/bar/baz/first-post.md'});
      assert.equal(actual, 'bar/first-post/index.html');
    });

    it('should use the last match when there are duplicate match groups', function() {
      rewriter.preset('blog', ':a/:stem/index.html');

      rewriter.rule('/content/:a/:a/:a/*', 'blog', function(file, params) {
        file.data = Object.assign({}, file.data, params);
      });

      var actual = rewriter.rewrite({path: '/content/foo/bar/baz/first-post.md'});
      assert.equal(actual, 'baz/first-post/index.html');
    });
  });
});
