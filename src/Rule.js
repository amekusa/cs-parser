import Composite from './Composite'
import Context from './Context'

/**
 * Parsing rule
 * @extends Composite
 */
class Rule extends Composite {
	/**
	 * @param {object} Df=null
	 * Rule definition.<br>
	 * Format:
	 * ```js
	 * {
	 *   start: RegExp, // The pattern where this rule starts from
	 *   end:   RegExp, // The pattern where this rule ends at
	 *   init:  function (context, chunk, matches), // Called when this rule starts
	 *   fin:   function (context, chunk, matches), // Called when this rule ends
	 *   parse: function (context, chunk), // Called for every chunk from 'start' to 'end'
	 *   isRecursive:    boolean, // Whether this rule is recursive (default: false)
	 *   endsWithParent: boolean, // If true, the parent rule can end even when this rule is active (default: false)
	 *   splitter: string|RegExp, // The chunk splitter (default: '\n')
	 *   encoding: string, // The encoding to decode buffers (default: 'utf8')
	 * }
	 * ```
	 * Definition objects can be nested.
	 * A nested definition is interpreted as a sub-rule.<br>
	 * The property name for a nested definition must start from '$'
	 */
	constructor(Df = null) {
		super()
		if (!Df) Df = {}
		this._start = Df.start || null
		this._end = Df.end || null
		this._init = Df.init || null
		this._fin = Df.fin || null
		this._parse = Df.parse || null
		this._isRecursive = Df.isRecursive || Df.recursive || Df.recurse || null
		this._endsWithParent = Df.endsWithParent || null
		this._splitter = Df.splitter || null
		this._encoding = Df.encoding || null

		// Sub rules
		for (let i in Df) {
			let m = i.match(/^\$/)
			if (!m) continue
			if (!Df[i]) continue
			this.addChild(new Rule(Df[i]))
		}
	}

	/**
	 * The start pattern
	 * @type {RegExp}
	 * @default null
	 */
	get start() {
		return this._start
	}

	set start(X) {
		if (this._start != null)
			throw new Error(`The property cannot be changed`)
		this._start = X
	}

	/**
	 * The end pattern
	 * @type {RegExp}
	 * @default null
	 */
	get end() {
		return this._end
	}

	set end(X) {
		if (this._end != null)
			throw new Error(`The property cannot be changed`)
		this._end = X
	}

	/**
	 * Whether this rule is recursive
	 * @type {boolean}
	 * @default false
	 */
	get isRecursive() {
		return this._isRecursive == null ? false : this._isRecursive
	}

	set isRecursive(X) {
		if (this._isRecursive != null)
			throw new Error(`The property cannot be changed`)
		this._isRecursive = X
	}

	/**
	 * Whether the current context can also be ended by the parent context rule
	 * @type {boolean}
	 * @default false
	 */
	get endsWithParent() {
		return this._endsWithParent == null ? false : this._endsWithParent
	}

	set endsWithParent(X) {
		if (this._endsWithParent != null)
			throw new Error(`The property cannot be changed`)
		this._endsWithParent = X
	}

	/**
	 * The chunk splitter
	 * @type {string|RegExp}
	 * @default '\n'
	 */
	get splitter() {
		return this._splitter || (
			this.hasParent ? this._parent.splitter : '\n'
		)
	}

	set splitter(X) {
		if (this._splitter) throw new Error(`The property cannot be changed`)
		this._splitter = X
	}

	/**
	 * The encoding to decode buffers
	 * @type {string}
	 * @default 'utf8'
	 */
	get encoding() {
		return this._encoding || (
			this.hasParent ? this._parent.encoding : 'utf8'
		)
	}

	set encoding(X) {
		if (this._encoding) throw new Error(`The property cannot be changed`)
		this._encoding = X
	}

	/**
	 * Performs matching the specified chunk with the start pattern
	 * @param {string} Chunk The chunk to match
	 * @return {mixed} The matching result
	 */
	startsWith(Chunk) {
		return Rule.checkEnclosure(Chunk, this._start)
	}

	/**
	 * Performs matching the specified chunk with the end pattern
	 * @param {string} Chunk The chunk to match
	 * @return {mixed} The matching result
	 */
	endsWith(Chunk) {
		return Rule.checkEnclosure(Chunk, this._end)
	}

	/**
	 * @private
	 * @param {string} Chunk
	 * @param {boolean|string|function|RegExp|mixed[]} Cond Condition
	 * @return {mixed}
	 */
	static checkEnclosure(Chunk, Cond) {
		if (!Cond) return false
		switch (typeof Cond) {
		case 'boolean':
			return true
		case 'string':
			let idx = Chunk.indexOf(Cond)
			return idx < 0 ? false : idx
		case 'function':
			return Cond(Chunk)
		}
		if (Cond instanceof RegExp) return Chunk.match(Cond)
		if (Array.isArray(Cond)) {
			for (let item of Cond) {
				let r = Rule.checkEnclosure(Chunk, item)
				if (r) return r
			}
		}
		return false
	}

	/**
	 * Initializes a context
	 * @param {Context} Cx The context to initialize
	 * @param {string} Chunk='' The chunk that matched with the `start` condition
	 * @param {string[]} MatchResult=null The matching result of the `start` condition
	 * @return {boolean}
	 * The result of `init` callback.
	 * If `init` is not specified, `true` will be returned
	 */
	init(Cx, Chunk = '', MatchResult = null) {
		let r = true // Goes next chunk
		if (this._init) {
			r = this._init(Cx, Chunk, MatchResult)
			if (typeof r == 'undefined') r = true
		}
		return r
	}

	/**
	 * Finalizes a context
	 * @param {Context} Cx The context to finalize
	 * @param {string} Chunk='' The chunk that matched with the `end` condition
	 * @param {string[]} MatchResult=null The maching result of the `end` condition
	 * @return {boolean}
	 * Result of `fin` callback.
	 * If `fin` is not specified, `true` will be returned
	 */
	fin(Cx, Chunk = '', MatchResult = null) {
		let r = true // Goes next chunk
		if (this._fin) {
			r = this._fin(Cx, Chunk, MatchResult)
			if (typeof r == 'undefined') r = true
		}
		return r
	}

	/**
	 * Parses a chunk
	 * @param {Context} Cx The current context
	 * @param {string} Chunk='' The chunk to parse
	 * @return {boolean}
	 * The result of `parse` callback.
	 * If `parse` is not specified, `true` will be returned
	 */
	parse(Cx, Chunk = '') {
		let r = true // Goes next chunk
		if (this._parse) {
			r = this._parse(Cx, Chunk)
			if (typeof r == 'undefined') r = true
		}
		return r
	}
}

export default Rule
