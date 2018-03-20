# [![Context Sensitive Parser](https://amekusa.github.io/cs-parser/1.3.0/images/logo-cs-parser@3x.png "Context Sensitive Parser")](https://github.com/amekusa/cs-parser)

[![npm version](https://badge.fury.io/js/cs-parser.svg)](https://badge.fury.io/js/cs-parser) [![dependencies Status](https://david-dm.org/amekusa/cs-parser/status.svg)](https://david-dm.org/amekusa/cs-parser) [![Apache License 2.0](http://img.shields.io/badge/license-Apache_2.0-blue.svg?style=flat)](LICENSE)

## Write your own parser LIKE A BOSS
CS Parser provides you the power to write parser for your code, data, or anything in any language, any format without hardcore coding.  

You can write the best parser that exactly matches your need even in 120 lines or less.
And it will also be clean, semantic, and completely readable! Let's take a short tour.

At first, you need to install CS Parser via NPM.

```sh
npm i cs-parser --save
```

Now you can access the APIs of CS Parser with `require()`.

```js
const csp = require('cs-parser')
```

The `csp` is the [Main](https://amekusa.github.io/cs-parser/1.3.0/Main.html) object that provides a few basic methods.  
Use `create` method to get a [Parser](https://amekusa.github.io/cs-parser/1.3.0/Parser.html) object.

```js
let parser = csp.create()
```

Next, add some parsing rules to the parser with `parser.addRule`.
Of course you can add any number of rules as you want.

```js
parser.addRule({ /* A rule definition */ })
parser.addRule({ /* Another rule definition */ })
```

### Defining a rule
A rule definition is an object contains some specific properties.
I will show you only a few essential ones here.  
(If you want to see the full specs, see the [doc](https://amekusa.github.io/cs-parser/1.3.0/Rule.html#Rule).)

```js
parser.addRule({
  from: '{',
  to:   '}'
})
```

The options `from` & `to` determines **where the rule applies to**.
So the rule in the above will be activated when the parser reaches at `{`,  
and will be deactivated when the parser reaches at `}`.

You can also use **regex** like this:

```js
parser.addRule({
  from: /(\w).* {/,
  to:   '}'
})
```

This rule will be activated when the current reading buffer matches with
the pattern like `something {`. Simple isn't it?

Now's the time to define how the rule actually works while it is active.  
Let us introduce `init`, `parse`, `fin` callbacks.

```js
parser.addRule({
  from: /(\w).* {/,
  to:   '}',
  init(cx, chunk, matches) { ... },
  parse(cx, chunk) { ... },
  fin(cx, chunk, matches) { ... }
})
```

In short:
+ `init` will be called once when the rule is activated.
+ `parse` will be called for **every chunk** while the rule is active
+ `fin`  will be called once when the rule is deactivated.

The **3rd** parameter: `matches` is optional that is passed an array of **matching results** of `from`/`to` if these are regex.

#### What is “chunk”?
For the default, every rule processes the data **line-by-line**, And each line will be passed as a “chunk” to the **2nd** parameter.
(This behavior is determined with `splitter` option. The default value is `\n`.)  

So in other words, the `parse` callback will be executed **every time the parser reaches at a line-break**.

#### Context?
The **1st** parameter: `cx` is a “**context**” object which will be **generated when the rule is activated**.
The relationship between a rule and a context is similar to **a class and its instance**.

With a context, you can store any data into its `data` property like this:

```js
init(cx, chunk, matches) {
  // cx.data is a plain object
  cx.data.name  = matches[1]
  cx.data.lines = []
  // You can also set another object
  cx.data = {
    name:  matches[1],
    lines: []
  }
},
```

`cx` through `init`, `parse`, `fin` callbacks is guaranteed to be **the same instance**,
so that you can use the data you stored into `data` property in another callback like this:

```js
parse(cx, chunk) {
  cx.data.lines.push(chunk)
},
fin(cx) {
  console.log('Block: ' + cx.data.name)
  console.log('Body:')
  for (let line of cx.data.lines) console.log(line)
  console.log('Total Lines: ' + cx.data.lines.length)
}
```

### Let's parse!
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

## Links
+ [Documentations](https://amekusa.github.io/cs-parser/1.3.0/)
+ [GitHub](https://github.com/amekusa/cs-parser)

Pull requests, issue reports, or any other feedbacks are very helpful for further development! :joy:

---

&copy; 2018 Satoshi Soma ([amekusa.com](https://amekusa.com))  
CS Parser is licensed under the Apache License, Version 2.0  
