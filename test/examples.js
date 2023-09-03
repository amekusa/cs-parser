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
		'docblocks',
	];
	for (let item of examples) {
		it(item, async () => {
			let example = await import(`../examples/${item}.js`);
			_console.log('---- OUTPUT ----');
			_console.log(log.data);
			_console.log('================');
			assert.equal(log.data.trim(), example.EXPECTED_OUTPUT.trim());
		});
	}
});
