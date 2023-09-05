import assert from 'node:assert';
import stream from 'node:stream';

/**
 * @example
 * let log = new LogStream();
 * console = new console.Console(log);
 */
class LogStream extends stream.Writable {
	constructor(options) {
		super(options);
		this.clear();
	}
	get data() {
		return Buffer.concat(this._chunks).toString('utf8');
	}
	get lines() {
		return this.data.split('\n');
	}
	_write(chunk, enc, next) {
		this._chunks.push(chunk);
		next();
	}
	clear() {
		this._chunks = [];
	}
	assertLines(...args) {
		assert.deepEqual(this.lines, args);
	}
}

export default LogStream;
