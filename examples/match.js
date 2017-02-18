'use strict';

var File = require('vinyl');
var Rewriter = require('..');
var Rule = Rewriter.Rule;
var rewriter = new Rewriter();

var fileA = new File({path: 'blog/drafts/about.hbs'});
var fileB = new File({path: 'blog/content/about.hbs'});
var fileC = new File({path: 'posts/89'});
var fileD = new File({path: 'posts/2013/hello-world'});

var ruleA = new Rule('blog/:folder/:foo.:bar', ':stem/index.html');
var ruleB = new Rule(/blog\//, ':stem/index.html', function(file) {
  return !/drafts/.test(file.path);
});
var ruleC = new Rule('posts/:id', ':stem/index.html');
var ruleD = new Rule('posts/:year/*', ':stem/index.html');

console.log(rewriter.match(ruleA, fileA));
console.log(rewriter.match(ruleB, fileB));
console.log(rewriter.match(ruleC, fileC));
console.log(rewriter.match(ruleD, fileD));
// {0: 'posts/2013/hello-world', 1: '2013/hello-world', path: '2013/hello-world'}

