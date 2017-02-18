'use strict';

var File = require('vinyl');
var Rewriter = require('..');
var rewriter = new Rewriter();
var Rule = Rewriter.Rule;

rewriter.helper('foo', function() {
  console.log(this.file.match);
});

// rewriter.rule(/([^\/]+)\/(\w+)\.hbs$/, ':dirname/:foo/:stem.html');
rewriter.rule(/\.hbs$/, ':dirname/:stem.html');
rewriter.rule(/\.md$/, 'blog/:stem/index.html', function(file) {
  return !/draft/.test(file.dirname);
});

// console.log(rewriter.rewrite('foo/bar/a/b/c/d/e/folder/baz.hbs'))
// console.log(rewriter.rewrite('foo/bar/baz.md'))

var fileA = new File({path: 'blog/drafts/about.hbs'});
var fileB = new File({path: 'blog/content/about.hbs'});

var ruleA = new Rule(/blog\//, ':stem/index.html');
var ruleB = new Rule(/blog\//, ':stem/index.html', function(file) {
  return !/drafts/.test(file.path);
});

console.log(rewriter.match(ruleA, fileA)); //<= true
console.log(rewriter.match(ruleB, fileA)); //<= false

console.log(rewriter.match(ruleA, fileB)); //<= true
console.log(rewriter.match(ruleB, fileB)); //<= true


// new Rule(/(blog)\/(.*)\//, ':stem/index.html');
// new Rule('blog/:folder', ':stem/index.html');

var rewriter = new Rewriter()
  .rule(/posts/, 'blog/:stem/index.html')
  .rule(/docs/, 'docs/:stem/index.html')

console.log(rewriter.rewrite({path: 'content/posts/first-post.md'}));
//=> 'blog/first-post/index.html'

console.log(rewriter.rewrite({path: 'content/posts/other-post.md'}));
//=> 'blog/other-post/index.html'

console.log(rewriter.rewrite({path: 'content/docs/api.md'}));
//=> 'docs/api/index.html'
