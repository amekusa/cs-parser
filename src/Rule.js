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
	 * The property name for a nested definition must start with `$` (dollar sign)
	 *
	 * ###### Available Options:
	 * @param {string|RegExp} Df.from
	 * The pattern that indicates the begining point of this rule.
	 * If the current chunk matched with this pattern,
	 * this rule will be activated, and the new context will start parsing
	 * from the next chunk
	 * @param Df.start
	 * Alias of `from`
	 * @param {string|RegExp} Df.to
	 * The pattern that indicates the end point of this rule.
	 * If the current chunk matched with this pattern,
	 * this rule will be deactivated, and the current context will be finalized
	 * @param Df.end Alias of `to`
	 *
	 * @param {function} Df.onStart
	 * The callback which is called when this rule gets activated.<br>
	 * If this returns `false`, the {@link Parser} will read the current chunk
	 * again
	 * ###### Parameters:
	 * @param {Context} Df.onStart.cx The current context
	 * @param {string} Df.onStart.chunk
	 * The current chunk which has matched with `from`
	 * @param {number|string[]} Df.onStart.matches
	 * If the `from` pattern is a string, the index of the matched string
	 * in the chunk.<br>
	 * If the `from` pattern is a RegExp, the regex matching results array
	 * @param Df.init Alias of `onStart`
	 *
	 * @param {function} Df.onActive
	 * The callback which is called for every single chunk.<br>
	 * If this returns `false`, the {@link Parser} will read the current chunk
	 * again
	 * ###### Parameters:
	 * @param {Context} Df.onActive.cx The current context
	 * @param {string} Df.onActive.chunk The current chunk
	 * @param Df.parse Alias of `onActive`
	 *
	 * @param {function} Df.onEnd
	 * The callback which is called when this rule gets deactivated.
	 * If this returns `false`, the {@link Parser} will read the current chunk
	 * again
	 * ###### Parameters:
	 * @param {Context} Df.onEnd.cx The current context
	 * @param {string} Df.onEnd.chunk
	 * The current chunk which has matched with `to`
	 * @param {number|string[]} Df.onEnd.matches
	 * If the `to` pattern is a string, the index of the matched string
	 * in the chunk.<br>
	 * If the `to` pattern is a RegExp, the regex matching results array
	 * @param Df.fin Alias of `onEnd`
	 *
	 * @param {object} Df.on
	 * The container for the another aliases of `onStart`, `onActive`, `onEnd`
	 * ###### Properties:
	 * @param {function} Df.on.start Alias of `onStart`
	 * @param {function} Df.on.active Alias of `onActive`
	 * @param {function} Df.on.end Alias of `onEnd`
	 *
	 * @param {boolean} Df.isRecursive=false Whether this rule is recursive
	 * @param Df.recursive Alias of `isRecursive`
	 * @param Df.recurse Alias of `isRecursive`
	 * @param {boolean} Df.endsWithParent=false
	 * If `true`, the parent rule can end even when this rule is active
	 * @param {string|RegExp} Df.splitter='\n'
	 * The chunk splitter. When the {@link Parser} reached at
	 * the chunk splitter, the substring from the previous chunk splitter
	 * is passed to the rule as a chunk. The default splitter is a line-break
	 * @param {string} Df.encoding=Rule.INHERIT
	 * The encoding to use for converting the buffer to a chunk string.
	 * Falls back to `'utf8'`
	 * @param {object} Df.$*
	 * A sub-rule definition. The property name can be any string
	 * but must start with `$` (dollar sign)
	 */
	constructor(Df = null) {
		super()
		if (!Df) Df = {}
		this._from = Df.from || Df.start || null
		this._to = Df.to || Df.end || null
		this._isRecursive = Df.isRecursive || Df.recursive || Df.recurse || null
		this._endsWithParent = Df.endsWithParent || null
		this._splitter = Df.splitter || null
		this._encoding = Df.encoding || INHERIT

		this._onStart  = Df.onStart  || (Df.on && Df.on.start)  || Df.init  || null
		this._onActive = Df.onActive || (Df.on && Df.on.active) || Df.parse || null
		this._onEnd    = Df.onEnd    || (Df.on && Df.on.end)    || Df.fin   || null

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
	 * The event handler which is called when this rule is activated
	 * @type {function}
	 * @default null
	 */
	get onStart() {
		return this.get('_onStart', null)
	}

	set onStart(X) {
		this.set('_onStart', X)
	}

	/**
	 * The event handler which is called every time
	 * the parser reached at {@link Rule#splitter}
	 * @type {function}
	 * @default null
	 */
	get onActive() {
		return this.get('_onActive', null)
	}

	set onActive(X) {
		this.set('_onActive', X)
	}
	/**
	 * The event handler which is called when this rule is deactivated
	 * @type {function}
	 * @default null
	 */
	get onEnd() {
		return this.get('_onEnd', null)
	}

	set onEnd(X) {
		this.set('_onEnd', X)
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
	 * Sets an event handler
	 * @param {string} Ev
	 * The event identifier
	 * ###### Available Events:
	 * + `'start'`: Occurs when the current chunk matched with {@link Rule#from}
	 * + `'active'`: While this rule is active, occurs every time the parser reached at {@link Rule#splitter}
	 * + `'end'`: Occurs when the current chunk matched with {@link Rule#to}

	 * @param {function} Fn
	 * The event handler.
	 * Returning `false` makes the parser read the current chunk again
	 * ###### Parameters:
	 * @param {Context} Fn.cx The current context
	 * @param {string} Fn.chunk The current chunk
	 * @param {number|string[]} Fn.matches
	 * The matching result of {@link Rule#from}/{@link Rule#to}.<br>
	 * **Only for `start` and `end` events**.
	 */
	on(Ev, Fn) {
		switch (Ev) {
		case 'start':
		case 'active':
		case 'end':
			this.set('_on' + Ev[0].toUpperCase() + Ev.slice(1), Fn)
			break
		default:
			throw new Error('No such event')
		}
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
		if (this.onStart) {
			r = this.onStart(Cx, Chunk, MatchResult)
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
		if (this.onEnd) {
			r = this.onEnd(Cx, Chunk, MatchResult)
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
		if (this.onActive) {
			r = this.onActive(Cx, Chunk)
			if (typeof r == 'undefined') r = true
		}
		return r
	}
}

export default Rule
