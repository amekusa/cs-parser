const csp = require('../lib')
const fs = require('fs')

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
				cx.results.add([
					`    <dl class="specs">`,
					`      <dt>Type</dt>`,
					`      <dd>${cx.data.type}</dd>`,
					`      <dt>Name</dt>`,
					`      <dd>${cx.data.name}</dd>`,
					`    </dl>`,
					`  </div>`
				])
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
				cx.results
					.add(`  <section class="example">`)
					.add(`    <h1>${cx.data.title}</h1>`)
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
					cx.results
						.add(`    <pre>`)
						.add(`      <code class="lang-${cx.data.lang}">`)
				},
				// Parse Callback
				parse(cx, chunk) {
					let strip = chunk.match(/(\w.*)$/) // Strip indents
					cx.results.add('        ' + strip[1])
				},
				// Finalize Callback
				fin(cx, chunk, matches) {
					cx.results
						.add(`      </code>`)
						.add(`    </pre>`)
				}
			}
		}
	}
})

// Read and parse a file asynchronously.
parser.parseFile(__dirname + '/GameObject.js') // This returns a Promise object
.then(function (cx) {
	// 'cx' is the root context that contains all the sub-contexts
	// which are generated through the parsing process
	cx.results.traverse(result => {
		console.log(result)
	})
})
