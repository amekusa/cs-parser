// Data to parse
let data = `
---- Employees List ----
Alice {
	sex > female
	age > 24
}
Bob {
	sex > male
	age > 32
}
Charlie {
	sex > male
}
Dolly {
	sex > female
	species > sheep
}
`

// Initialize the parser
import csp from 'cs-parser'
let parser = csp.create()

// Define the 1st rule
parser.addRule({
	from: /(\w+) {/, // Starts with '(word) {'
	to:   '}',       //   Ends with '}'

	// Context initializer
	// - This is called when the parser reached at '(word) {'
	// - 'cx' is a context object that persists throughout the parsing process
	// - 'chunk' is the current line
	// - 'matches' is the result of regex-matching of 'from'
	init(cx, chunk, matches) {
		// Prepare a data container for chunk parser
		cx.data = {
			type: 'employee',
			name: matches[1], // 'word'
			sex: 'unknown',
			age: 'unknown',
			errors: []
		}
	},

	// Chunk parser
	// - This is called for every line after init() untill fin().
	// - The current line is passed as 'chunk'
	parse(cx, chunk) {
		// Check if the current chunk (line) is something like: '(word1) > (word2)'
		let matches = chunk.match(/(\w+) > +(\w+)/)
		if (matches) {
			let prop  = matches[1] // 'word1'
			let value = matches[2] // 'word2'

			// Validate the matches
			if (prop in cx.data) {
				// Store the matches to the data container
				cx.data[prop] = value
			} else {
				// Error handling
				cx.data.errors.push('invalid property: ' + prop)
			}
		}
	},

	// Context finalizer
	// - This is called when the parser reached at '}'
	fin(cx) {
		// Print errors
		let errors = cx.data.errors
		if (errors.length) {
			console.log(errors.length + ' errors found in ' + cx.data.name)
			for (let err of errors) {
				console.log(err)
			}
		}
	}
})

// Parse the data and print the results
let result = parser.parse(data)
let i = 0
result.traverse(each => {
	if (each.data.type == 'employee') {
		i++
		console.log('\nEmployee #' + i + ': ' + each.data.name)
		console.log('--------------------')
		console.log('   Sex: ' + each.data.sex)
		console.log('   Age: ' + each.data.age)
	}
})

let EXPECTED_OUTPUT = `
1 errors found in Dolly
invalid property: species

Employee #1: Alice
--------------------
   Sex: female
   Age: 24

Employee #2: Bob
--------------------
   Sex: male
   Age: 32

Employee #3: Charlie
--------------------
   Sex: male
   Age: unknown

Employee #4: Dolly
--------------------
   Sex: female
   Age: unknown

`

// Only for testing
export { EXPECTED_OUTPUT };
