import Composite from './Composite.js'
import ResultSet from './ResultSet.js'

const // Enums for state
	STANDBY    = Symbol('STANDBY'),
	ACTIVE     = Symbol('ACTIVE'),
	BACKGROUND = Symbol('BACKGROUND'),
	FINISHED   = Symbol('FINISHED'),
	WASTED     = Symbol('WASTED')

/**
 * A parsing context
 * @extends Composite
 */
class Context extends Composite {
	/**
	 * @override
	 * @param {Rule} Rl The rule that determines the behavior of this context
	 * @param {ContextManager} Manager=null The manager that controls this context
	 */
	constructor(Rl, Manager = null) {
		super()
		this._rule = Rl
		this._manager = Manager
		this._state = STANDBY
		this._nextState = null
		this._results = null
		this._data = {}
		this._buffer = Buffer.alloc(0)
		this._prev = null
		this._next = null
	}

	/**
	 * An enum for {@link Context#state}
	 * which means the context is waiting for being activated
	 * @type {Symbol}
	 * @const
	 */
	static get STANDBY() {
		return STANDBY
	}

	/**
	 * An enum for {@link Context#state}
	 * which means the context is active
	 * @type {Symbol}
	 * @const
	 */
	static get ACTIVE() {
		return ACTIVE
	}

	/**
	 * An enum for {@link Context#state}.
	 * When a sub-context gets activated, the parent context goes this state
	 * @type {Symbol}
	 * @const
	 */
	static get BACKGROUND() {
		return BACKGROUND
	}

	/**
	 * An enum for {@link Context#state}
	 * which means the context has been deactivated
	 * @type {Symbol}
	 * @const
	 */
	static get FINISHED() {
		return FINISHED
	}

	/**
	 * An enum for {@link Context#state}
	 * which means the context has no longer chance of getting activated
	 * @type {Symbol}
	 * @const
	 */
	static get WASTED() {
		return WASTED
	}

	/**
	 * The rule that determines the behavior of this context
	 * @type {Rule}
	 * @readonly
	 */
	get rule() {
		return this._rule
	}

	/**
	 * The manager that is controlling this context
	 * @type {ContextManager}
	 */
	get manager() {
		return this._manager || (this.hasParent ? this.parent.manager : null)
	}

	set manager(X) {
		if (this.hasParent) throw new Error(`Manager of a non-root context cannot be changed`)
		if (this._manager) throw new Error(`Another manager is already set`)
		this._manager = X
	}

	/**
	 * The current state
	 * @type {Symbol}
	 * @default Context.STANDBY
	 * @readonly
	 */
	get state() {
		return this._state
	}

	/**
	 * The next state which this context is about to change to
	 * @type {Symbol}
	 */
	get nextState() {
		return this._nextState || this._state
	}

	set nextState(X) {
		this._nextState = X
	}

	/**
	 * The parsing results
	 * @type {ResultSet}
	 * @readonly
	 */
	get results() {
		return this._results
	}

	/**
	 * The data object
	 * @type {mixed}
	 * @default {}
	 */
	get data() {
		return this._data
	}

	set data(X) {
		this._data = X
	}

	/**
	 * The previous context
	 * @type {Context}
	 */
	get prev() {
		return this._prev
	}

	set prev(X) {
		X._next = this
		this._prev = X
	}

	/**
	 * The next context
	 * @type {Context}
	 */
	get next() {
		return this._next
	}

	set next(X) {
		X._prev = this
		this._next = X
	}

	/**
	 * @override
	 * @param {Context} Cx The context to verify
	 */
	verifyChild(Cx) {
		if (Cx._manager && Cx._manager !== this.manager)
			throw new Error(`Multiple managers conflicted`)
		return true
	}

	/**
	 * Clears internal reading buffer
	 * @protected
	 */
	clearBuffer() {
		this._buffer = Buffer.alloc(0)
	}

	/**
	 * Populates sub-contexts
	 * @protected
	 */
	populate() {
		if (this._rule.isRecursive) this.addChild(new Context(this._rule))
		for (let item of this._rule) this.addChild(new Context(item))
	}

	/**
	 * Updates the state
	 * @param {boolean} Recursive=false Whether or not to perform recursively
	 */
	updateState(Recursive = false) {
		if (Recursive) {
			for (let item of this._children) item.updateState(Recursive)
		}
		if (!this._nextState) return
		this._state = this._nextState
		this._nextState = null

		let manager = this.manager
		if (manager && this._state == ACTIVE) manager.current = this
	}

	/**
	 * Removes all the unnecessary children
	 * @param {boolean} Recursive=false Whether or not to perform recursively
	 * @return {Context[]} An array of removed contexts
	 */
	cleanupChildren(Recursive = false) {
		if (!this.hasChild) return
		let children = []
		let wasted = []
		for (let item of this._children) {
			if (item.state == WASTED) {
				wasted.push(item)
				continue
			}
			if (Recursive)
				wasted = wasted.concat(item.cleanupChildren(Recursive))
			children.push(item)
		}
		this._children = children
		return wasted
	}

	/**
	 * Pushes a single byte into the internal reading buffer.
	 * And if the buffer reached at the chunk splitter (default: '\n'),
	 * passes the buffer to `parseChunk()`.
	 * @param {Buffer} Byte The byte to push into the buffer
	 * @return {boolean}
	 * `true` if the buffer reached at the chunk splitter.
	 * Otherwise `false`
	 */
	step(Byte) {
		switch (this.state) {
		case STANDBY:
			break
		case ACTIVE:
			if (
				this._rule.endsWithParent &&
				this.hasParent &&
				this.parent.step(Byte) &&
				this.parent.nextState == FINISHED
			) return true // End with the parent
			// Search a child to activate
			var found = null
			for (let item of this._children) {
				if (!found && item.step(Byte) && item.nextState == ACTIVE) {
					found = item
					break // Stop searching
				}
			}
			if (found) {
				this.clearBuffer()
				for (let item of this._children) item.clearBuffer()
				return true
			}
			break
		case BACKGROUND:
			if (
				this._rule.endsWithParent &&
				this.hasParent &&
				this.parent.step(Byte) &&
				this.parent.nextState == FINISHED
			) return true // End with the parent
			break
		default:
			return false
		}
		return this._step(Byte)
	}

	/**
	 * @private
	 * @return {boolean}
	 */
	_step(Byte) {
		this._buffer = Buffer.concat([this._buffer, Byte])
		let chunks = this._buffer.toString(this._rule.encoding)
			.split(this._rule.splitter)
		if (chunks.length < 2) return false
		if (chunks.length > 2) throw new Error(`Something is going wrong..`)
		this.parseChunk(chunks[0])
		this.clearBuffer()
		return true
	}

	/**
	 * Applies the rule to a chunk
	 * @param {string} Chunk Chunk to apply the rule
	 */
	parseChunk(Chunk) {
		let manager = this.manager

		switch (this._state) {
		case STANDBY:
			var starts = this._rule.startsWith(Chunk)
			if (starts || starts === 0) { // Starts
				if (!this.start(Chunk, starts)) manager.buffer = this._buffer
			}
			break
		case ACTIVE:
			var ends = this._rule.endsWith(Chunk)
			if (ends || ends === 0) { // Ends
				if (!this.end(Chunk, ends)) manager.buffer = this._buffer
			} else if (!this._rule.parse(this, Chunk))
				manager.buffer = this._buffer
			break
		case BACKGROUND:
			var ends = this._rule.endsWith(Chunk)
			if (ends || ends === 0) { // Ends
				if (!this.end(Chunk, ends)) manager.buffer = this._buffer
			}
			break
		}
	}

	/**
	 * Activates this context
	 */
	start(Chunk = null, Arg = null) {
		if (this._state == ACTIVE) {
			console.warn('Already active')
			return false
		}
		this.nextState = ACTIVE
		this._results = new ResultSet()
		if (this.hasParent) {
			this.parent.nextState = BACKGROUND
			this.parent.results.add(this._results)
		}
		this.populate()
		return this._rule.init(this, Chunk, Arg)
	}

	/**
	 * Deactivates this context
	 */
	end(Chunk = null, Arg = null) {
		if (this._state == FINISHED) {
			console.warn('Already finished')
			return false
		}
		// End all the sub-contexts
		for (let item of this._children) {
			if (item.state == FINISHED) continue
			item.end()
		}
		switch (this._state) {
		case STANDBY:
			this.nextState = WASTED
			break
		case ACTIVE:
		case BACKGROUND:
			this.nextState = FINISHED
			if (this.hasParent) {
				// The parent comes back to active
				this.parent.nextState = ACTIVE
				this.parent.addChild(new Context(this._rule))
			}
			return this._rule.fin(this, Chunk, Arg)
		}
		return false
	}

	/**
	 * Returns the outlined string for debug
	 * @param {string} Indent=2-spaces The indentation string
	 * @param {number} Level=0 The indentation level
	 * @return {string} The outlined string
	 */
	outline(Indent = '  ', Level = 0) {
		let r = Indent.repeat(Level) + this._rule.express(this)
		for (let item of this._children)
			r += '\n' + item.outline(Indent, Level + 1)
		return r
	}
}

export default Context
