import Composite from './Composite'
import Context from './Context'

/**
 * Parsing rule
 * @extends Composite
 * @todo Support function as the type of start|end
 */
class Rule extends Composite {
	/**
	 * @param {object} Df=null Rule definition
	 * Format: {
	 *   start:    RegExp,
	 *   end:      RegExp,
	 *   init:     function (context, chunk, start's matches or start's return),
	 *   fin:      function (context, chunk, end's matches or end's return),
	 *   parse:    function (context, chunk),
	 *   endsWithParent: boolean
	 *   splitter: string|RegExp,
	 *   encoding: string,
	 *   $xxx:     object
	 * }
	 */
	constructor(Df = null) {
		super()
		if (!Df) Df = {}
		this._start = Df.start || null
		this._end = Df.end || null
		this._init = Df.init || null
		this._fin = Df.fin || null
		this._parse = Df.parse || null
		this._endsWithParent = Df.endsWithParent || false
		this._splitter = Df.splitter || '\n'
		this._encoding = Df.encoding || ''

		// Sub rules
		for (let i in Df) {
			let m = i.match(/^\$/)
			if (!m) continue
			if (!Df[i]) continue
			this.addChild(new Rule(Df[i]))
		}
	}

	/**
	 * @type {RegExp} Start pattern
	 * @default null
	 */
	get start() {
		return this._start
	}

	/**
	 * @type {RegExp} End pattern
	 * @default null
	 */
	get end() {
		return this._end
	}

	/**
	 * @type {boolean}
	 */
	get endsWithParent() {
		return this._endsWithParent
	}

	/**
	 * @type {string|RegExp} Chunk splitter
	 * @default '\n'
	 */
	get splitter() {
		return this._splitter
	}

	/**
	 * @type {string} Text encoding. If it wasn't specified, inherits parent's value
	 * @default 'utf8'
	 */
	get encoding() {
		return this._encoding || (
			this.hasParent ? this._parent.encoding : 'utf8'
		)
	}

	/**
	 * @param {string} Chunk
	 * @return {mixed}
	 */
	startsWith(Chunk) {
		return Rule.checkEnclosure(Chunk, this._start)
	}

	/**
	 * @param {string} Chunk
	 * @return {mixed}
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
	 * @param {Context} Cx Context to initialize
	 * @param {string} Chunk The chunk which is matched with `start` condition
	 * @param {string[]} MatchResult=null
	 * Match result of `start` regex pattern
	 * @return {boolean}
	 * Result of `init` function specified in constructor.
	 * If `init` is not specified, `true` is returned
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
	 * @param {Context} Cx Context to finalize
	 * @param {string} Chunk The chunk which is matched with `end` condition
	 * @param {string[]} MatchResult=null
	 * Match result of `end` regex pattern
	 * @return {boolean}
	 * Result of `fin` function specified in constructor.
	 * If `fin` is not specified, `true` is returned
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
	 * @param {Context} Cx The current context
	 * @param {string} Chunk The chunk to parse
	 * @return {boolean}
	 * Result of `parse` function specified in constructor.
	 * If `parse` is not specified, `true` is returned
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
