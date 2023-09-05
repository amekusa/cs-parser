/**
 * Parsing a JavaScript code and format all the DocBlocks in it to a simple HTML
 */

import path from 'node:path'
import csp from 'cs-parser'

// Base dir
let base = path.dirname(import.meta.url)

// File to parse
let file = `${base}/samples/GameObject.js`

// Initialize the parser
let parser = csp.create({
	// --- Rule definitions ---

	// DocBlock context
	$doc: {
		start: /\/\*\*$/, // Starts with '/**'
		end:   /\*\/$/,   //   Ends with '*/'

		// Context initializer
		// - This is called when the parser reached at '/**'
		// - 'cx' is a context object that persists throughout the parsing process
		// - 'chunk' is the current line
		// - 'matches' is the result of regex-matching of '$doc.start'
		init(cx, chunk, matches) {
			cx.results.add(`<section class="docblock">`)
		},

		// Chunk parser
		// - This is called for every line after init() untill fin().
		// - The current line is passed as 'chunk'
		parse(cx, chunk) {
			let strip = chunk.match(/(\w.*)$/) // Remove indentations
			cx.results.add('  ' + strip[1])
		},

		// Context finalizer
		// - This is called when the parser reached at '*/'
		fin(cx, chunk, matches) {
			cx.results.add(`</section>`)
		},

		// '@param' context
		// - This is a sub-rule of '$doc' which only can take effect inside '$doc' context
		// - The name of sub-rule must start with '$'
		$param: {
			start: /@param {(\w+)} (\w+)/, // Starts with '@param {type} name'
			end:   /@\w+/,                 // Ends with any other keyword that starts with '@'
			endsWithParent: true, // This means that this rule also ends with '$doc.end'

			// Context initializer
			init(cx, chunk, matches) {
				cx.data = {
					type: matches[1], // Save the parameter type
					name: matches[2]  // Save the parameter name
				}
				cx.results.add(`  <div class="param">`)
			},

			// Chunk parser
			parse(cx, chunk) {
				let strip = chunk.match(/(\w.*)$/) // Strip indents
				cx.results.add('    ' + strip[1])
			},

			// Context finalizer
			fin(cx, chunk, matches) {
				cx.results.add([
					`    <dl class="specs">`,
					`      <dt>Type</dt>`,
					`      <dd>${cx.data.type}</dd>`,
					`      <dt>Name</dt>`,
					`      <dd>${cx.data.name}</dd>`,
					`    </dl>`,
					`  </div>`
				])
				return false // Returning false makes the parser read the current chunk twice
			}
		},

		// '@example' context
		// - This is another sub-rule of '$doc'
		$example: {
			start: /@example (.+)/, // Starts with '@example (word)'
			end:   /@\w+/,          // Ends with any other keyword that starts with '@'
			endsWithParent: true, // This means that this rule also ends with '$doc.end'

			// Context initializer
			init(cx, chunk, matches) {
				cx.data = {
					title: matches[1]
				}
				cx.results.add([
					`  <section class="example">`,
					`    <h1>${cx.data.title}</h1>`
				])
			},

			// Chunk parser
			parse(cx, chunk) {
				let strip = chunk.match(/(\w.*)$/) // Strip indents
				cx.results.add('    ' + strip[1])
			},

			// Context finalizer
			fin(cx, chunk, matches) {
				cx.results.add(`  </section>`)
				return false
			},

			// "Example code" context
			// - This is a sub-rule of '$example'
			// - This rule converts a code-fenced block (```) as <pre><code>...</pre></code>
			$code: {
				start: /`{3}(\w+)?/, // Starts with ``` (triple backticks)
				                     // Also supports language notation like ```js
				end:   /`{3}$/,      // Ends with ```

				// Context initializer
				init(cx, chunk, matches) {
					cx.data = {
						lang: matches[1] || 'unknown'
					}
					cx.results.add([
						`    <pre>`,
						`      <code class="lang-${cx.data.lang}">`
					])
				},

				// Chunk parser
				parse(cx, chunk) {
					let strip = chunk.match(/(\w.*)$/) // Strip indents
					cx.results.add('        ' + strip[1])
				},

				// Context finalizer
				fin(cx, chunk, matches) {
					cx.results.add([
						`      </code>`,
						`    </pre>`
					])
				}
			}
		}
	}
})

// Read and parse a file asynchronously.
let cx = await parser.parseFile(new URL(file))

// 'cx' is the root context that contains all the sub-contexts generated throughout the parsing process
cx.results.traverse(result => {
	console.log(result)
})

// Result
let EXPECTED_OUTPUT = /*html*/`
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
        console.log('Health lefts ' + this.health)
      </code>
    </pre>
  </section>
  <section class="example">
    <h1>Attack a rat and kill it</h1>
    <pre>
      <code class="lang-js">
        var enemy = new GameObject('Rat', 3)
        enemy.takeDamage(5)
        console.log(this.name + ' must be dead')
      </code>
    </pre>
  </section>
</section>
`

export { EXPECTED_OUTPUT }
