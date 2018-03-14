// The sample data to be parsed
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

// The parser and the rule
const csp = require('../lib')
let parser = csp.create()

parser.addRule({
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

// Parse and print the results
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
