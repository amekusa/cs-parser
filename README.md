# [![CS Parser](https://raw.githubusercontent.com/amekusa/cs-parser/master/logo.png "Context Sensitive Parser")](https://github.com/amekusa/cs-parser)

[![npm version](https://badge.fury.io/js/cs-parser.svg)](https://badge.fury.io/js/cs-parser) [![Apache License 2.0](http://img.shields.io/badge/license-Apache_2.0-blue.svg?style=flat)](LICENSE)

<!-- TOC depthfrom:2 depthto:3 -->

- [Write Your Own Parser](#write-your-own-parser)
- [Getting Started](#getting-started)
- [Examples](#examples)
- [Basics](#basics)
- [Defining a rule](#defining-a-rule)
    - [Callback methods](#callback-methods)
- [Let's parse!](#lets-parse)
    - [Root context](#root-context)
    - [Basic example](#basic-example)
- [How do I debug my parser?](#how-do-i-debug-my-parser)
- [Links](#links)

<!-- /TOC -->

---


## Write Your Own Parser
CS Parser is a tiny JS framework that gives you the power to easily write a parser for code in any language or data in any format.
It also can help you to develop your own languages or data formats.

Since the mechanics of CS Parser is pretty simple and straightforward, its APIs are very easy to learn and use.
With the help of them, and if you have a basic knowledge of JavaScript, you can write a clean and readable parser for your specific needs without extensive coding.


## Getting Started
First, you have to install `cs-parser` via `npm`.

```sh
npm i cs-parser
```

Next, `import` (ESM) or `require` (CJS) it in your JS.

```js
// ES Module
import csp from 'cs-parser'

// CommonJS
const csp = require('cs-parser')
```

Then, call `create` method to get a [Parser](https://amekusa.github.io/cs-parser/latest/Parser.html) object which is the main API provider.

```js
let parser = csp.create()
```


## Examples
Before we proceed to explain the basics, here are some working examples if you want to take a quick look first:
- [examples/employees.js](https://github.com/amekusa/cs-parser/blob/master/examples/employees.js)
- [examples/docblocks.js](https://github.com/amekusa/cs-parser/blob/master/examples/docblocks.js)


## Basics
The workflow is as follows:

#### 1. Define rules with `addRule` method.
```js
parser.addRule({ /* 1st rule definition */ })
parser.addRule({ /* 2nd rule definition */ })
  // You can add rules as many as you want.
```

#### 2. Parse data with `parse` or `parseFile` methods.
```js
// For data as a string
let results = parser.parse(data)

// For data in a file
let results = await parser.parseFile('file/to/parse')
```

#### 3. Use the results, scanning with `traverse` method.
```js
results.traverse(each => {
  console.log(each.data)
})
```


## Defining a rule
A rule definition that you pass to `addRule()` has to be an object with some specific properties and methods.

```js
parser.addRule({
  from: '{',
  to:   '}'
})
```

`from` and `to` properties determine **where the rule applies to in data**.
So the above rule means:
- Activate this rule if the parser reached at `{`
- Deactivate this rule if the parser reached at `}`

You can also use regex like this:

```js
parser.addRule({
  from: /(\w).* {/,
  to:   '}'
})
```

This rule will be activated when the current reading buffer matches with
the pattern like: `something {` .

### Callback methods
A rule has to have at least one of `init`, `parse`, and `fin` callback methods.

```js
parser.addRule({
  from: /(\w).* {/,
  to:   '}',
  init(cx, chunk, matches) { ... },
  parse(cx, chunk) { ... },
  fin(cx, chunk, matches) { ... }
})
```

- `init` will be called once when the rule is activated.
- `parse` will be called for **every chunk** when the rule is active.
- `fin`  will be called once when the rule is deactivated.

The 1st parameter `cx` is **a context object** (explained later) that is currently associated with this rule.<br>
The 2nd parameter `chunk` is **the current chunk** (explained later) of data that the parser has just processed at the time.<br>
The 3rd parameter of `init` / `fin` is optional, that are **results of regex matching** of `from` / `to` if they are regex.

#### Chunk
By default, the parser processes the data **line-by-line**, and each line is passed to the 2nd parameter of the callback methods as "chunk". However, you can change this behavior if you want to, by setting `splitter` property to any string other than `\n` (linebreak).

#### Context object
When a rule got activated, the parser generates a context object for it and also adds it to the context stack (the root context).
The rule can manipulate the associated context object with its callback methods however you want.
It can be said that the relationship between a rule and a context object is similar to the one between **a class and its instance**.

For convenience, a context object has `data` property which is just a plain object, so you can store any kinds of data in it, like this:

```js
init(cx, chunk, matches) {
  cx.data.name  = matches[1]
  cx.data.lines = []

  // Or you can just reassign a new value
  cx.data = {
    name:  matches[1],
    lines: []
  }
}
```

Via their 1st parameter, `init`, `parse`, and `fin` callback methods can share the same instance of context object, like this:

```js
parse(cx, chunk) {
  cx.data.lines.push(chunk)
},
fin(cx) {
  console.log('Block: ' + cx.data.name)
  console.log('Total Lines: ' + cx.data.lines.length)
}
```


## Let's parse!
Once you've done with defining all the necessary rules, it's time to actually parse data and use the results for your purpose.

If you have a data as a string or a `Buffer` object, pass it to `parse()` method.

```js
let data = '...' // Data to parse
let results = parser.parse(data)
```

As a result, it returns **the "root" context** (explained later) which contains all the contexts that were generated throughout the entire parsing process.

There is another option: `parseFile()`, which parses the content of other file asynchronously.

```js
// With 'await'
let results = await parser.parseFile('path/to/file')

// Or in the 'Promise' way
parser.parseFile('path/to/file').then(results => {
  ...
});
```

Since its process is implemented as in a *streaming* manner, it is recommended over `parse()` method if the data is large.

### Root context
Root context is a top-level context object that contains all the context objects generated throughout the entire parsing process.

To access to each context individually, pass a callback to `traverse` method of the root context.

```js
let results = parser.parse(data)
results.traverse(each => {
  console.log('Block: ' + each.data.name)
})
```

Each context is passed to the 1st parameter of the callback you passed.

### Basic example
Now it's a good time for you to take a closer look at the 1st example: [employees.js](https://github.com/amekusa/cs-parser/blob/master/examples/employees.js).<br>
We also recommend to download the file (or clone this repo) and see it running with `node`, and do some experiments by yourself.

```sh
node employees.js
```

There are more cool features like **nesting contexts**, which we cannot cover in this README because it would be too long.<br>
If you are interested, see this example: [docblocks.js](https://github.com/amekusa/cs-parser/blob/master/examples/docblocks.js)<br>
Also please check the [full documentations](https://amekusa.github.io/cs-parser/latest/).


## How do I debug my parser?
Use `outline()` method of [Context](https://amekusa.github.io/cs-parser/latest/Context.html) that outputs the outline of the structure of a context and all the sub-contexts of it.

This would be helpful to ensure if your parser correctly analyzed the structure of the data. Let's see the outline of the result of [employees.js](https://github.com/amekusa/cs-parser/blob/master/examples/employees.js).

```js
let result = parser.parse(data)
console.debug(result.outline())
```

The output:

```sh
root
  anonymous
  anonymous
  anonymous
  anonymous
```

The reason it shows `anonymous` is, the rule associated with them doesn't have `name` property.

Let's add `name: 'employee',` to the rule, and see the difference of `outline()`.

```js
parser.addRule({
	name: 'employee', // <-Added
	from: /(\w+) {/, // Starts with '(word) {'
	to:   '}',       //   Ends with '}'
...
```

The output:

```sh
root
  employee
  employee
  employee
  employee
```

It's somewhat better. But you can improve this output even more.

With `express` callback, you can totally customize how a context is expressed by `outline()`.

```js
parser.addRule({
	from: /(\w+) {/, // Starts with '(word) {'
	to:   '}',       //   Ends with '}'
	...
	express(cx) { // <-Added
		return 'employee: ' + cx.data.name
	}
})
```

The output:

```sh
root
  employee: Alice
  employee: Bob
  employee: Charlie
  employee: Dolly
```

Now you can get much better outline!


## Links
+ [Documentations](https://amekusa.github.io/cs-parser/latest/)
+ [GitHub](https://github.com/amekusa/cs-parser)


<!--TRUNCATE:START-->
---

&copy; 2018 Satoshi Soma ([amekusa.com](https://amekusa.com))
CS Parser is licensed under the Apache License, Version 2.0
<!--TRUNCATE:END-->
