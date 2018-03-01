import Composite from './Composite'
import ContextManager from './ContextManager'
import {ContextState} from './ContextState'
import ResultSet from './ResultSet'
import Rule from './Rule'

/**
 * A parsing context which holds a rule and state
 * @extends Composite
 */
class Context extends Composite {
	/**
	 * @override
	 * @param {Rule} Rule
	 * @param {ContextManager} Manager=null
	 */
	constructor(Rule, Manager = null) {
		super()
		this._rule = Rule
		this._manager = Manager
		this._state = ContextState.STANDBY
		this._nextState = null
		this._results = null
		this._data = null
		this._buffer = Buffer.alloc(0)
	}

	/**
	 * @type {Rule}
	 */
	get rule() {
		return this._rule
	}

	/**
	 * @type {ContextManager}
	 */
	get manager() {
		return this._manager || (this.hasParent ? this.parent.manager : null)
	}

	set manager(Manager) {
		if (this.hasParent) throw new Error(`Manager of a non-root context cannot be changed`)
		if (this._manager) throw new Error(`Another manager is already set`)
		this._manager = Manager
	}

	/**
	 * @type {Symbol}
	 */
	get state() {
		return this._state
	}

	/**
	 * @type {Symbol}
	 */
	get nextState() {
		return this._nextState || this._state
	}

	set nextState(State) {
		this._nextState = State
	}

	/**
	 * @type {ResultSet}
	 */
	get results() {
		return this._results
	}

	/**
	 * @type {mixed}
	 */
	get data() {
		return this._data
	}

	set data(Value) {
		this._data = Value
	}

	/**
	 * @override
	 */
	verifyChild(Cx) {
		if (Cx._manager && Cx._manager !== this.manager)
			throw new Error(`Multiple managers conflicted`)
		return true
	}

	/**
	 * @protected
	 */
	clearBuffer() {
		this._buffer = Buffer.alloc(0)
	}

	/**
	 * @protected
	 * Populates sub-contexts
	 */
	populate() {
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
		if (this._nextState) {
			this._state = this._nextState
			this._nextState = null

			let manager = this.manager
			if (manager && this.state == ContextState.ACTIVE)
				manager.current = this
		}
	}

	/**
	 * @param {Buffer} Byte
	 * @return {boolean|string} `false` or chunk
	 */
	step(Byte) {
		switch (this.state) {
		case ContextState.STANDBY:
			return this._step(Byte)
		case ContextState.ACTIVE:
			if (
				this._rule.endsWithParent &&
				this.hasParent &&
				this.parent.step(Byte) &&
				this.parent.nextState == ContextState.FINISHED
			) return true // End with the parent
			// Search a child to activate
			var found = null
			for (let item of this._children) {
				if (
					!found &&
					item.step(Byte) &&
					item.nextState == ContextState.ACTIVE
				) {
					found = item
					break // Stop searching
				}
			}
			if (found) {
				this.clearBuffer()
				for (let item of this._children) item.clearBuffer()
				return true
			}
			return this._step(Byte)
		case ContextState.BACKGROUND:
			if (
				this._rule.endsWithParent &&
				this.hasParent &&
				this.parent.step(Byte) &&
				this.parent.nextState == ContextState.FINISHED
			) return true // End with the parent
			return this._step(Byte)
		}
		return false
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
	 * @param {string} Chunk Chunk to apply the rule
	 */
	parseChunk(Chunk) {
		let manager = this.manager

		switch (this._state) {
		case ContextState.STANDBY:
			var starts = this._rule.startsWith(Chunk)
			if (starts || starts === 0) { // Starts
				if (!this.start(Chunk, starts)) manager.buffer = this._buffer
			}
			return
		case ContextState.ACTIVE:
			var ends = this._rule.endsWith(Chunk)
			if (ends || ends === 0) { // Ends
				if (!this.end(Chunk, ends)) manager.buffer = this._buffer
				return
			}
			if (!this._rule.parse(this, Chunk)) manager.buffer = this._buffer
			return
		case ContextState.BACKGROUND:
			var ends = this._rule.endsWith(Chunk)
			if (ends || ends === 0) { // Ends
				if (!this.end(Chunk, ends)) manager.buffer = this._buffer
			}
			return
		}
	}

	start(Chunk = null, Arg = null) {
		if (this._state == ContextState.ACTIVE) {
			console.warn('Already active')
			return false
		}
		this.nextState = ContextState.ACTIVE
		this._results = new ResultSet()
		if (this.hasParent) {
			this.parent.nextState = ContextState.BACKGROUND
			this.parent.results.add(this._results)
		}
		this.populate()
		return this._rule.init(this, Chunk, Arg)
	}

	end(Chunk = null, Arg = null) {
		if (this._state == ContextState.FINISHED) {
			console.warn('Already finished')
			return false
		}
		// End all the sub-contexts
		for (let item of this._children) {
			if (item.state == ContextState.FINISHED) continue
			item.end()
		}
		this.nextState = ContextState.FINISHED
		switch (this._state) {
		case ContextState.ACTIVE:
		case ContextState.BACKGROUND:
			if (this.hasParent) {
				// Make the parent active
				this.parent.nextState = ContextState.ACTIVE
				// Clone itself
				this.parent.addChild(new Context(this._rule))
			}
			return this._rule.fin(this, Chunk, Arg)
		}
		return false
	}
}

export default Context
