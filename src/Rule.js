import Composite from './Composite'
import Context from './Context'

const INHERIT = Symbol('INHERIT')

/**
 * A nestable parsing rule
 * @extends Composite
 */
class Rule extends Composite {
	/**
	 * Creates a rule instance with the options in the specified object.
	 * @param {object} Df=null
	 * The rule definition object that contains the options as its properties.
	 * Definition objects can be **nested**.
	 * A nested definition is interpreted as a **sub-rule**.
	 * The property name for a nested definition must start with `$`
	 *
	 * ###### Available Options:
	 * @param {string|RegExp} Df.from
	 * The pattern that indicates the begining point of this rule.
	 * If the current chunk matched with this pattern,
	 * this rule will be activated, and the new context will start parsing
	 * from the next chunk.<br>
	 * **Aliases:** `start`
	 * @param {string|RegExp} Df.to
	 * The pattern that indicates the end point of this rule.
	 * If the current chunk matched with this pattern,
	 * this rule will be deactivated, and the current context will be finalized.
	 * <br>
	 * **Aliases:** `end`
	 *
	 * @param {function} Df.init
	 * The callback which is called when this rule gets activated.<br>
	 * If this returns `false`, the {@link Parser} will read the current chunk
	 * again<br>
	 * **Parameters:**
	 * @param {Context} Df.init.cx The current context
	 * @param {string} Df.init.chunk
	 * The current chunk which has matched with `from`
	 * @param {number|string[]} Df.init.matches
	 * If the `from` pattern is a string, the index of the matched string
	 * in the chunk.<br>
	 * If the `from` pattern is a RegExp, the regex matching results array
	 *
	 * @param {function} Df.parse
	 * The callback which is called for every single chunk.<br>
	 * If this returns `false`, the {@link Parser} will read the current chunk
	 * again<br>
	 * **Parameters:**
	 * @param {Context} Df.parse.cx The current context
	 * @param {string} Df.parse.chunk The current chunk
	 *
	 * @param {function} Df.fin
	 * The callback which is called when this rule gets deactivated.
	 * If this returns `false`, the {@link Parser} will read the current chunk
	 * again<br>
	 * **Parameters:**
	 * @param {Context} Df.fin.cx The current context
	 * @param {string} Df.fin.chunk
	 * The current chunk which has matched with `to`
	 * @param {number|string[]} Df.fin.matches
	 * If the `to` pattern is a string, the index of the matched string
	 * in the chunk.<br>
	 * If the `to` pattern is a RegExp, the regex matching results array
	 *
	 * @param {boolean} Df.isRecursive=false Whether this rule is recursive<br>
	 * **Aliases:** `recursive`, `recurse`
	 * @param {boolean} Df.endsWithParent=false
	 * If `true`, the parent rule can end even when this rule is active
	 * @param {string|RegExp} Df.splitter='\n'
	 * The chunk splitter. When the {@link Parser} reached at
	 * the chunk splitter, the substring from the previous chunk splitter
	 * is passed to the rule as a chunk. The default splitter is a line-break
	 * @param {string} Df.encoding=Rule.INHERIT
	 * The encoding to use for converting the buffer to a chunk string<br>
	 * **Fallback:** `'utf8'`
	 * @param {object} Df.$*
	 * A sub-rule definition. The property name can be any string
	 * but must start with `$` (dollar sign)
	 */
	constructor(Df = null) {
		super()
		if (!Df) Df = {}
		this._from = Df.from || Df.start || null
		this._to = Df.to || Df.end || null
		this._init = Df.init || null
		this._fin = Df.fin || null
		this._parse = Df.parse || null
		this._isRecursive = Df.isRecursive || Df.recursive || Df.recurse || null
		this._endsWithParent = Df.endsWithParent || null
		this._splitter = Df.splitter || null
		this._encoding = Df.encoding || INHERIT

		// Sub rules
		for (let i in Df) {
			let m = i.match(/^\$/)
			if (!m) continue
			if (!Df[i]) continue
			this.addChild(new Rule(Df[i]))
		}
	}

	/**
	 * The enum for rule properties,
	 * which means the actual property value inherits from the parent rule
	 * @type {Symbol}
	 * @const
	 */
	static get INHERIT() {
		return INHERIT
	}

	/**
	 * The start pattern
	 * @type {RegExp}
	 * @default null
	 */
	get from() {
		return this.get('_from', null)
	}

	set from(X) {
		this.set('_from', X)
	}

	/**
	 * The start pattern
	 * @deprecated Use {@link Rule#from} instead
	 * @type {RegExp}
	 * @default null
	 */
	get start() {
		console.warn(`rule.start is deprecated. Use rule.from instead`)
		return this.from
	}

	set start(X) {
		console.warn(`rule.start is deprecated. Use rule.from instead`)
		this.from = X
	}

	/**
	 * The end pattern
	 * @type {RegExp}
	 * @default null
	 */
	get to() {
		return this.get('_to', null)
	}

	set to(X) {
		this.set('_to', X)
	}

	/**
	 * The end pattern
	 * @deprecated Use {@link Rule#to} instead
	 * @type {RegExp}
	 * @default null
	 */
	get end() {
		console.warn(`rule.end is deprecated. Use rule.to instead`)
		return this.to
	}

	set end(X) {
		console.warn(`rule.end is deprecated. Use rule.to instead`)
		this.to = X
	}

	/**
	 * Whether this rule is recursive
	 * @type {boolean}
	 * @default false
	 */
	get isRecursive() {
		return this.get('_isRecursive', false)
	}

	set isRecursive(X) {
		this.set('_isRecursive', X)
	}

	/**
	 * Whether the current context can also be ended by the parent context rule
	 * @type {boolean}
	 * @default false
	 */
	get endsWithParent() {
		return this.get('_endsWithParent', false)
	}

	set endsWithParent(X) {
		this.set('_endsWithParent', X)
	}

	/**
	 * The chunk splitter
	 * @type {string|RegExp}
	 * @default '\n'
	 */
	get splitter() {
		return this.get('_splitter', '\n')
	}

	set splitter(X) {
		this.set('_splitter', X)
	}

	/**
	 * The encoding to decode buffers. Falls back to `'utf8'`
	 * @type {string}
	 * @default Rule.INHERIT
	 */
	get encoding() {
		return this.get('_encoding', 'utf8')
	}

	set encoding(X) {
		this.set('_encoding', X)
	}

	/**
	 * @param {string} Name The name of the property to get
	 * @param {mixed} Fallback The value which the property falls back to
	 * @param {boolean} Inherits=true Whether or not to inherit the parent's value
	 * @return {mixed}
	 * @private
	 */
	get(Name, Fallback, Inherits = true) {
		let prop = this[Name]
		return Inherits && prop == INHERIT ? (
			this.hasParent ?
			this.parent.get(Name, Fallback, Inherits) : Fallback
		) : (prop == null ? Fallback : prop)
	}

	/**
	 * @param {string} Name The name of the property to set
	 * @param {mixed} Value The value to set to the property
	 * @private
	 */
	set(Name, Value) {
		if (this[Name] != null)
			throw new Error(`The property cannot be changed`)
		this[Name] = Value
	}

	/**
	 * Performs matching the specified chunk with the start pattern
	 * @param {string} Chunk The chunk to match
	 * @return {mixed} The matching result
	 */
	startsWith(Chunk) {
		return Rule.checkEnclosure(Chunk, this.from)
	}

	/**
	 * Performs matching the specified chunk with the end pattern
	 * @param {string} Chunk The chunk to match
	 * @return {mixed} The matching result
	 */
	endsWith(Chunk) {
		return Rule.checkEnclosure(Chunk, this.to)
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
