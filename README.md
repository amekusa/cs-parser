# [![Context Sensitive Parser](https://amekusa.github.io/cs-parser/1.0.0/images/cs-parser-logo@3x.png "Context Sensitive Parser")](https://github.com/amekusa/cs-parser)

[![npm version](https://badge.fury.io/js/cs-parser.svg)](https://badge.fury.io/js/cs-parser) [![dependencies Status](https://david-dm.org/amekusa/cs-parser/status.svg)](https://david-dm.org/amekusa/cs-parser) [![Apache License 2.0](http://img.shields.io/badge/license-Apache_2.0-blue.svg?style=flat)](LICENSE)

## Write your own parser LIKE A BOSS
CS Parser provides you the power to write parser for your code, data, or anything in any language, any format without hardcore coding.  

You can write the best parser that exactly matches your need even in 120 lines or less.
And it will also be clean, semantic, and completely readable like this example:

```js
const csp = require('cs-parser')

let parser = csp.create({
  // The rule of doc block
  $doc: {
    start: /\/\*\*$/, // Starts with '/**'
    end:   /\*\/$/,   //   Ends with '*/'
    // Initialize Callback
    // This is called when the parser reached at '/**'
    init(cx, chunk, matches) {
      cx.results.add(`<section class="docblock">`)
    },
    // Parse Callback
    // This is called for every line after init() untill fin().
    // The current line is passed as 'chunk'
    parse(cx, chunk) {
      let strip = chunk.match(/(\w.*)$/) // Strip indents
      cx.results.add('  ' + strip[1])
    },
    // Finalize Callback
    // This is called when the parser reached at '*/'
    fin(cx, chunk, matches) {  // Finalize
      cx.results.add(`</section>`)
    },

    // The rule of @param
    // This is so a sub-rule of doc block in the above
    //   that it only be applied in doc blocks.
    // The name of sub-rule must start with '$'
    $param: {
      start: /@param {(\w+)} (\w+)/, // Starts with '@param {type} name'
      end:   /@\w+/,                 // Ends with any other keyword that starts with '@'
      endsWithParent: true, // This means that this rule also ends with doc block
      // Initialize Callback
      // 'cx' is the context object that can hold any data
      //   during the period of this rule working.
      // 'matches' is the result of regex matching of the 'start' specified in the above
      init(cx, chunk, matches) {
        cx.data = {
          type: matches[1], // Save the parameter type
          name: matches[2]  // Save the parameter name
        }
        cx.results.add(`  <div class="param">`)
      },
      // Parse Callback
      // 'cx' is the same instance as the one which has been passed to 'init()'
      parse(cx, chunk) {
        let strip = chunk.match(/(\w.*)$/) // Strip indents
        cx.results.add('    ' + strip[1])
      },
      // Finalize Callback
      fin(cx, chunk, matches) {
        cx.results.add(`    <dl class="specs">`)
        cx.results.add(`      <dt>Type</dt>`)
        cx.results.add(`      <dd>${cx.data.type}</dd>`)
        cx.results.add(`      <dt>Name</dt>`)
        cx.results.add(`      <dd>${cx.data.name}</dd>`)
        cx.results.add(`    </dl>`)
        cx.results.add(`  </div>`)
        return false // Returning false makes the parser read the same chunk twice
      }
    },

    // The rule of @example
    // This is another sub-rule of doc block
    $example: {
      start: /@example (.+)/, // Starts with '* @example title'
      end:   /@\w+/,          //   Ends with any other keyword that starts with '@'
      endsWithParent: true, // This means that this rule also ends with doc block
      // Initialize Callback
      init(cx, chunk, matches) {
        cx.data = {
          title: matches[1]
        }
        cx.results.add(`  <section class="example">`)
        cx.results.add(`    <h1>${cx.data.title}</h1>`)
      },
      // Parse Callback
      parse(cx, chunk) {
        let strip = chunk.match(/(\w.*)$/) // Strip indents
        cx.results.add('    ' + strip[1])
      },
      // Finalize Callback
      fin(cx, chunk, matches) {
        cx.results.add(`  </section>`)
        return false
      },

      // The rule of code example
      // This rule formats a fenced code block as <pre><code>...</pre></code>
      // This is a sub-rule of @example
      $code: {
        start: /`{3}(\w+)?/, // Starts with '```' (triple backticks)
                             // Also supports language notation like '```js'
        end:   /`{3}$/,      // Ends with '```'
        // Initialize Callback
        init(cx, chunk, matches) {
          cx.data = {
            lang: matches[1] || 'unknown'
          }
          cx.results.add(`    <pre>`)
          cx.results.add(`      <code class="lang-${cx.data.lang}">`)
        },
        // Parse Callback
        parse(cx, chunk) {
          let strip = chunk.match(/(\w.*)$/) // Strip indents
          cx.results.add('        ' + strip[1])
        },
        // Finalize Callback
        fin(cx, chunk, matches) {
          cx.results.add(`      </code>`)
          cx.results.add(`    </pre>`)
        }
      }
    }
  }
})
```

This example illustrates how to define rules for formatting doc blocks.  
As you can see, you can pass nested rule definitions along with the structure of the language you want to parse.  

In this case, the outline of the structure can be described like this:

```
doc
 ├─ param
 └─ example
     └─ code
```

Let's demonstrate parsing actual JavaScript code with the example rules.

`examples/GameObject.js`:
<pre><code class="lang-js">
/**
 * Represents an object in the game
 */
class GameObject {

  /**
   * Creates an instance with specific name and health
   * @param {string} name
   *   The name of the object
   * @param {number} health
   *   The health of the object
   */
  constructor(name, health) {
    this.name = name
    this.health = health
    this.state = 'alive'
  }

  /**
   * Takes specific amount of damage
   * @param {number} amount
   *   Amount of damage to take
   * @example Attack a kobold
   * ```js
   * var enemy = new GameObject('Kobold', 10)
   * enemy.takeDamage(5)
   * console.log(`Health lefts ${this.health}`)
   * ```
   * @example Attack a rat and kill it
   * ```js
   * var enemy = new GameObject('Rat', 3)
   * enemy.takeDamage(5)
   * console.log(`${this.name} must be dead`)
   * ```
   */
  takeDamage(amount) {
    this.health -= amount
    console.log(`${this.name} took ${amount} damage`)
    if (this.health < 0) this.die()
  }

  die() {
    this.state = 'dead'
    console.log(`${this.name} is killed`)
  }
}
</code></pre>

This is the example code to be parsed.
There are two doc blocks in this code as you can see.

To start parsing, pass the file URL to `parseFile()` like below:

```js
parser.parseFile(__dirname +'/examples/GameObject.js') // This returns a Promise object
.then(cx => {
  // 'cx' is the root context that contains all the sub-contexts
  // which are generated through the parsing process
  cx.results.traverse(result => {
    console.log(result) // Output the result
  })
})
```

So the reading & parsing runs asynchronously, `parseFile()` returns a `Promise` object. This `Promise` resolves when the parsing completed.

If this way is not comfortable for you, there is the synchronous version here:

```js
let content = fs.readFileSync(__dirname +'/examples/GameObject.js')
let cx = parser.parse(content)
cx.results.traverse(result => {
  console.log(result)
})
```

And here is the output:

```html
<section class="docblock">
  Represents an object in the game
</section>
<section class="docblock">
  Creates an instance with specific name and health
  <div class="param">
    The name of the object
    <dl class="specs">
      <dt>Type</dt>
      <dd>string</dd>
      <dt>Name</dt>
      <dd>name</dd>
    </dl>
  </div>
  <div class="param">
    The health of the object
    <dl class="specs">
      <dt>Type</dt>
      <dd>number</dd>
      <dt>Name</dt>
      <dd>health</dd>
    </dl>
  </div>
</section>
<section class="docblock">
  Takes specific amount of damage
  <div class="param">
    Amount of damage to take
    <dl class="specs">
      <dt>Type</dt>
      <dd>number</dd>
      <dt>Name</dt>
      <dd>amount</dd>
    </dl>
  </div>
  <section class="example">
    <h1>Attack a kobold</h1>
    <pre>
      <code class="lang-js">
        var enemy = new GameObject('Kobold', 10)
        enemy.takeDamage(5)
        console.log(`Health lefts ${this.health}`)
      </code>
    </pre>
  </section>
  <section class="example">
    <h1>Attack a rat and kill it</h1>
    <pre>
      <code class="lang-js">
        var enemy = new GameObject('Rat', 3)
        enemy.takeDamage(5)
        console.log(`${this.name} must be dead`)
      </code>
    </pre>
  </section>
</section>
```

You can run this example in your console with:

```sh
npm run test:examples
```

## Usage & APIs
At first, you need to install CS Parser via NPM in your console.

```sh
npm i cs-parser --save
```

Then, you can access the APIs of CS Parser by `require()`.

```js
const csp = require('cs-parser')
```

The `csp` is the [Main](https://amekusa.github.io/cs-parser/1.0.0/Main.html) object that provides few basic methods.

`create()` method creates a [Parser](https://amekusa.github.io/cs-parser/1.0.0/Parser.html) object which performs parsing along the rules provided for the parameter.

```js
let parser = csp.create({
  // Rules
  ...
})
```

`newRule()` method creates a [Rule](https://amekusa.github.io/cs-parser/1.0.0/Rule.html) object.

```js
let rule = csp.newRule({
  // Rule definition
  ...
})
```

The format of the object for the parameter is the same as `create()` explained in the first example.

But you can also pass the Rule object to `create()`.

```js
let rule = csp.newRule({ ... })
csp.create(rule)
```

### The ES6 way
You can get the [Main](https://amekusa.github.io/cs-parser/1.0.0/Main.html) object with `import`.

```js
import CSParser from 'cs-parser'
let rule = CSParser.newRule({ ... })
let parser = CSParser.create(rule)
```

Or you can also import [Parser](https://amekusa.github.io/cs-parser/1.0.0/Parser.html) and [Rule](https://amekusa.github.io/cs-parser/1.0.0/Rule.html) classes directly.

```js
import Parser from 'cs-parser/lib/Parser'
import Rule   from 'cs-parser/lib/Rule'
let rule = new Rule({ ... })
let parser = new Parser(rule)
```

## Links
+ [Documentations](https://amekusa.github.io/cs-parser/1.0.0/)
+ [GitHub](https://github.com/amekusa/cs-parser)

Pull requests, issue reports, or any other feedbacks are very helpful for further development! :joy:

---

&copy; 2018 Satoshi Soma ([amekusa.com](https://amekusa.com))  
CS Parser is licensed under the Apache License, Version 2.0  
