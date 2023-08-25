/**
 * Test if the examples correctly work as intended
 */

import assert from 'node:assert';
import LogStream from './lib/LogStream.js';

// Replace default console
const _console = console;
const log = new LogStream();
console = new _console.Console(log);

beforeEach(() => {
	log.clear();
});

describe('Examples', () => {
	let examples = [
		'employees',
	];
	for (let example of examples) {
		it(example, async () => {
			let result = await import(`../examples/${example}.js`);
			_console.log('---- OUTPUT ----');
			_console.log(log.data);
			_console.log('================');
			assert.equal(log.data.trim(), result.EXPECTED_OUTPUT.trim());
		});
	}
});
