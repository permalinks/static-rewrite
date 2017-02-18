# static-rewrite [![NPM version](https://img.shields.io/npm/v/static-rewrite.svg?style=flat)](https://www.npmjs.com/package/static-rewrite) [![NPM monthly downloads](https://img.shields.io/npm/dm/static-rewrite.svg?style=flat)](https://npmjs.org/package/static-rewrite)  [![NPM total downloads](https://img.shields.io/npm/dt/static-rewrite.svg?style=flat)](https://npmjs.org/package/static-rewrite) [![Linux Build Status](https://img.shields.io/travis/jonschlinkert/static-rewrite.svg?style=flat&label=Travis)](https://travis-ci.org/jonschlinkert/static-rewrite)

> Easily generate destination paths or static URLs by mapping user-friendly patterns to server-side build paths.

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install --save static-rewrite
```

## What does this do?

This module does something similar to [URL rewriting](#url-rewriting), but for static paths at build-time. The goal is consistently and easily generate correct destination paths during development, regardless of the source paths.

**Examples**

Let's say we have a blog, and we want to:

* automatically write blog posts to the root of our site
* use the slugified `title` from front-matter as the folder name (for "pretty" permalinks)
* append `/index.html` to the path (also for "pretty" permalinks)

In other words, we want this source path:

```
src/content/posts/2017-02-14.md
```

To be written to a destination path that looks something like:

```
blog/how-to-create-effective-permalinks/index.html
```

You can either manually parse and reformat your destination paths, or use this library with simple rewrite rules.

**Example rewrite rule**

The following rule(s) will match any files in the `posts` directory, and rewrite the path using the given [structure](https://github.com/jonschlinkert/permalinks#structure).

```js
rewriter.rule(/posts\//, 'blog/:slugify(title)/index.html');
// add extra validation if necessary
rewriter.rule(/posts\//, 'blog/:slugify(title)/index.html', function(file) {
  return file.extname === '.md';
});
```

<a name="url-rewriting"></a>
<details>
<summary><strong>URL rewriting</strong></summary>
URL rewriting is used for replacing semantic, user-friendly URLs with server-friendly URLs.

For example, when a user enters a URL like the following to go to a page on wikipedia:

```
https://en.wikipedia.org/wiki/Business
```

The URL might be rewritten by wikipedia to something like:

```
https://en.wikipedia.org/w/index.php?title=Business
```
</details>

## Usage
Add this library to your JavaScript application with the following line of code:

```js
var Rewriter = require('static-rewrite');
```

## API

### [Rewriter](index.js#L30)

Create an instance of `Rewriter` with the given `options`.

**Params**

* `options` **{Object}**

**Example**

```js
var rewriter = new Rewriter()
  .rule(/posts/, 'blog/:stem/index.html')
  .rule(/docs/, 'docs/:stem/index.html')

console.log(rewriter.rewrite({path: 'content/posts/first-post.md'}));
//=> 'blog/first-post/index.html'

console.log(rewriter.rewrite({path: 'content/posts/other-post.md'}));
//=> 'blog/other-post/index.html'

console.log(rewriter.rewrite({path: 'content/docs/api.md'}));
//=> 'docs/api/index.html'
```

### [.rule](index.js#L69)

Register a rewrite rule with a `regex` to use for matching paths, a `structure` to use for the replacement patter, and an optional validation `fn` to supplement the regex when matching.

**Params**

* `regex` **{RegExp}**
* `structure` **{String}**
* `fn` **{Function}**: Optionally pass a function to do further validation on the file (return `false` if the rule shouldn't be used) and/or to update the context to be used for resolving placeholders in the rule `structure`.
* `returns` **{Object}**: Returns the Rewriter instance for chaining.

**Example**

```js
rewriter.rule(':folder/([^\\/]+)/(.*)', ':dirname/:foo/:stem.html');
rewriter.rule(/([^\\/]+)\/*\.hbs$/, ':dirname/:foo/:stem.html');
rewriter.rule(/\.hbs$/, ':dirname/:stem.html');
rewriter.rule(/\.md$/, 'blog/:stem/index.html', function(file) {
  return file.dirname !== 'foo/bar';
});
```

### [.rewrite](index.js#L85)

Run rewrite [rules](#rule) on the given `file`. If a rule matches
the file, the `file.path` will be rewritten using `locals`, and values
from the `file` and `file.data`.

**Params**

* `file` **{Object}**
* `locals` **{Object}**
* `returns` **{String}**: Returns the formatted path or the original `file.path` if no rewrite rules match the file.

### [.match](index.js#L122)

Calls `RegExp.exec()` on `file.path`, using the regex from the given rewrite `rule`. If the file matches, the match arguments are returned, otherwise `null`.

**Params**

* `rule` **{Object}**
* `file` **{Object}**
* `returns` **{Boolean}**

**Example**

```js
var fileA = new File({path: 'blog/drafts/about.hbs'});
var fileB = new File({path: 'blog/content/about.hbs'});

var ruleA = new rewriter.Rule(/blog\//, ':stem/index.html');
var ruleB = new rewriter.Rule(/blog\//, ':stem/index.html', function(file) {
  return !/drafts/.test(file.path);
});

console.log(rewriter.match(ruleA, fileA)); //<= true
console.log(rewriter.match(ruleB, fileA)); //<= false

console.log(rewriter.match(ruleA, fileB)); //<= true
console.log(rewriter.match(ruleB, fileB)); //<= true
```

### [Rule](index.js#L174)

Create a new `Rule` with the given `pattern`, `structure` and optional function for validating or adding data to the context

**Params**

* `pattern` **{String}**
* `structure` **{String}**
* `fn` **{Function}**

**Example**

```js
var rule = new Rule(/posts/, 'blog/:stem/index.html');
var rule = new Rule(/posts/, 'blog/:stem/index.html', function(file) {
  return file.extname !== '.foo';
});
var rule = new Rule(/posts/, 'blog/:stem/index.html', function(file, params) {
  file.data = Object.assign({}, file.data, params);
});
```

## About

### Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](../../issues/new).

Please read the [contributing guide](.github/contributing.md) for advice on opening issues, pull requests, and coding standards.

### Building docs

_(This project's readme.md is generated by [verb](https://github.com/verbose/verb-generate-readme), please don't edit the readme directly. Any changes to the readme must be made in the [.verb.md](.verb.md) readme template.)_

To generate the readme, run the following command:

```sh
$ npm install -g verbose/verb#dev verb-generate-readme && verb
```

### Running tests

Running and reviewing unit tests is a great way to get familiarized with a library and its API. You can install dependencies and run tests with the following command:

```sh
$ npm install && npm test
```

### Author

**Jon Schlinkert**

* [github/jonschlinkert](https://github.com/jonschlinkert)
* [twitter/jonschlinkert](https://twitter.com/jonschlinkert)

### License

Copyright © 2017, [Jon Schlinkert](https://github.com/jonschlinkert).
MIT

***

_This file was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme), v0.4.2, on February 18, 2017._