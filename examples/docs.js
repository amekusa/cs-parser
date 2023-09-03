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
		fin(cx, chunk, matches) {  // Finalize
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
				cx.results
					.add(`  <section class="example">`)
					.add(`    <h1>${cx.data.title}</h1>`)
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
					cx.results
						.add(`    <pre>`)
						.add(`      <code class="lang-${cx.data.lang}">`)
				},

				// Chunk parser
				parse(cx, chunk) {
					let strip = chunk.match(/(\w.*)$/) // Strip indents
					cx.results.add('        ' + strip[1])
				},

				// Context finalizer
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
parser.parseFile(new URL(file))
.then(cx => {
	// 'cx' is the root context that contains all the sub-contexts generated throughout the parsing process
	cx.results.traverse(result => {
		console.log(result)
	})
})
