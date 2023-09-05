[![Context Sensitive Parser](https://amekusa.github.io/cs-parser/1.3.0/images/logo-cs-parser@3x.png "Context Sensitive Parser")](https://github.com/amekusa/cs-parser)

[![npm version](https://badge.fury.io/js/cs-parser.svg)](https://badge.fury.io/js/cs-parser) [![dependencies Status](https://david-dm.org/amekusa/cs-parser/status.svg)](https://david-dm.org/amekusa/cs-parser) [![Apache License 2.0](http://img.shields.io/badge/license-Apache_2.0-blue.svg?style=flat)](LICENSE)

---


## Write Your Own Parser
CSParser gives you the power to easily write a parser for your code or data in any language or any format.
It also can help you to develop your own languages or data formats.

The mechanics of CSParser is pretty simple and straightforward.
If you have a basic knowledge of JavaScript, you can write a clean and readable parser for your specific needs even in like 120 lines or less with the help of the APIs that CSParser provides, which are very easy to use.


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
Before we proceed to explain the basics, here are some quick, working examples if you want to take a look first:
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
A rule definition that you pass to `addRule()` has to be an object that should have some specific properties and methods.

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
By default, the parser processes the data **line-by-line**, and each line is passed to the 2nd parameter of the callback methods as "chunk". However, you can change this behavior if you want to, by setting `splitter` property to any string other than `\n` (linebreak) which is the default value.

#### Context object
When a rule got activated, the parser generates a context object for it and also adds it to the context stack.
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

Via their 1st parameter, `init`, `parse`, and `fin` methods can share the same instance of context object, like this:

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
After you defined rules, start parsing with `parse` method of the parser object.

```js
let data = ' ... ' // Data to be parsed
let cx = parser.parse(data)
```

You can pass a string or a `Buffer` object for the parameter.
`parse` method processes the data synchronously
and returns **the “root” context** (explained later) when the process completes.

There is another option: `parseFile` which parses another file content **asynchronously**.

```js
let url = ' ... '     // The URL of the file to be parsed
parser.parseFile(url) // This returns a Promise object
.then(cx => {         // cx is the root context
  console.log('Parsing Completed!')
})
```

`parseFile` returns a `Promise` object which will resolve when the process completes.

#### Working around the root context
As the final result of parsing, the root context contains
**all the contexts** which were generated through the entire process.

To access to each context individually, pass a callback to `traverse` method of the root context.

```js
let cx = parser.parse(data)
cx.traverse(each => {
  console.log('Block: ' + each.data.name)
})
```

Every generated context is passed to the 1st parameter of the callback which you passed to `traverse`.

<span id="demonstration"></span>
### Demonstration
Congraturations! You've learned the basics.
Now I'll show you a small demonstration.

Here is the sample data to be parsed.

```js
let data = `
*** Sample Data ***
Alice {
  gender > female
  age    > 24
}
Bill {
  gender > male
  age    > 32
}
Chase {
  gender > male
}
Domon {
  gender  > male
  species > dormouse
}
`
```

The parser and the rule:

```js
const csp = require('cs-parser')
let parser = csp.create()

parser.addRule({
  name: 'member', // Debug purpose only
  from: /(\w+) {/,
  to:   '}',
  init(cx, chunk, matches) {
    // Prepare the data container
    cx.data = {
      name:   matches[1],
      gender: 'unknown',
      age:    'unknown',
      errors: []
    }
  },
  parse(cx, chunk) {
    // Store properties
    let matches = chunk.match(/(\w+) +> +(\w+)/)
    if (matches) {
      let prop  = matches[1]
      let value = matches[2]
      if (cx.data[prop]) cx.data[prop] = value
      else cx.data.errors.push('Invalid Data: ' + prop)
    }
  },
  fin(cx) {
    // Print errors
    let errors = cx.data.errors
    if (errors.length) {
      console.error(errors.length + ' errors in ' + cx.data.name)
      for (let error of errors) console.error(error)
    }
  }
})
```

Do parsing and print the results.

```js
let cx = parser.parse(data)
let i = 0
cx.traverse(each => {
  if (!each.data.name) return
  i++
  console.log('\nMember #' + i + ': ' + each.data.name)
  console.log('--------------------')
  console.log('   Gender: ' + each.data.gender)
  console.log('      Age: ' + each.data.age)
})
```

The whole output:

```sh
1 errors in Domon
Invalid Data: species

Member #1: Alice
--------------------
   Gender: female
      Age: 24

Member #2: Bill
--------------------
   Gender: male
      Age: 32

Member #3: Chase
--------------------
   Gender: male
      Age: unknown

Member #4: Domon
--------------------
   Gender: male
      Age: unknown
```

Thats's it!
You can run this demonstration on your console by this command:

```sh
node examples/members.js
```

There are still a lot more advanced features remaining.
Check the [documentations](https://amekusa.github.io/cs-parser/1.3.0/) and feel free to modify [the sample data and the rule](examples/members.js) to test.

<span id="how-do-i-debug-my-parser"></span>
## How do I debug my parser?
`outline`, the one of methods of [Context](https://amekusa.github.io/cs-parser/1.3.0/Context.html) outputs **the outline of the tree structure** of a context and the all its sub-contexts.

This is helpful for ensuring whether your parser has correctly analyzed the structure of the data. Let's see the outline of the result of the demonstration.

```js
let cx = parser.parse(data)
console.log(cx.outline())
```

The output:

```sh
root
  member
  member
  member
  member
```

What you can get from this outline is:
4 contexts have been generated by the rule named `member`.

To get more specific information from `outline`,
you can customize the expression of each context with `express` callback.

```js
parser.addRule({
  name: 'member', // Debug purpose only
  from: /(\w+) {/,
  to:   '}',
  init(cx, chunk, matches) {
    // Prepare the data container
    cx.data = {
      name:   matches[1],
      gender: 'unknown',
      age:    'unknown',
      errors: []
    }
  },
  ...
  express(cx) {
    return 'member: ' + cx.data.name
  }
})

let cx = parser.parse(data)
console.log(cx.outline())
```

The output:

```sh
root
  member: Alice
  member: Bill
  member: Chase
  member: Domon
```

Now you can get much better outline!

<span id="the-es6-way"></span>
## The ES6 way
Instead of `require()`, you can use `import` to get the [Main](https://amekusa.github.io/cs-parser/1.3.0/Main.html) object.

```js
import CSParser from 'cs-parser'
let rule = CSParser.newRule({ ... })
let parser = CSParser.create(rule)
```

Or you can also import [Parser](https://amekusa.github.io/cs-parser/1.3.0/Parser.html) and [Rule](https://amekusa.github.io/cs-parser/1.3.0/Rule.html) classes directly.

```js
import Parser from 'cs-parser/lib/Parser'
import Rule   from 'cs-parser/lib/Rule'
let rule = new Rule({ ... })
let parser = new Parser(rule)
```

<span id="links"></span>
## Links
+ [Documentations](https://amekusa.github.io/cs-parser/1.3.0/)
+ [GitHub](https://github.com/amekusa/cs-parser)

Pull requests, issue reports, or any other feedbacks are very helpful for further development! :joy:

<!--TRUNCATE:START-->
---

&copy; 2018 Satoshi Soma ([amekusa.com](https://amekusa.com))
CS Parser is licensed under the Apache License, Version 2.0
<!--TRUNCATE:END-->
