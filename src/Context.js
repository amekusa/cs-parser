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
		this._results = new ResultSet()
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

	set state(State) {
		this._state = State
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

	get killsChild() {
		let r = this._rule.killsChild
		if (r) return r
		// Check whether the all of active children's `endsWithParent`
		for (let item of this._children) {
			if (item.state != ContextState.ACTIVE) continue
			if (item.state != ContextState.BACKGROUND) continue
			if (!item.rule.endsWithParent) return false
		}
		return true
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
	 * @override
	 * @param {Context} Cx
	 * @return {Context} This
	 */
	addChild(Cx) {
		super.addChild(Cx)
		this._results.add(Cx.results)
		return this
	}

	/**
	 * @param {Buffer} Byte
	 * @return {boolean|string} `false` or chunk
	 */
	step(Byte) {
		for (let item of this._children) item.step(Byte)
		this._buffer = Buffer.concat([this._buffer, Byte])
		let chunks = this._buffer.toString(this._rule.encoding)
			.split(this._rule.splitter)
		if (chunks.length < 2) return false
		if (chunks.length > 2) throw new Error(`Something is going wrong..`)
		this.parseChunk(chunks[0])
		this._buffer = Buffer.alloc(0) // Clear buffer
	}

	/**
	 * @param {string} Chunk Chunk to apply the rule
	 */
	parseChunk(Chunk) {
		let manager = this.manager

		switch (this._state) {
		case ContextState.STANDBY:
			let starts = this._rule.startsWith(Chunk)
			if (starts || starts === 0) { // Starts
				if (!this.start(Chunk, starts)) manager.buffer = this._buffer
				break
			}
			break
		case ContextState.ACTIVE:
			let ends = this._rule.endsWith(Chunk)
			if (ends || ends === 0) { // Ends
				if (!this.end(Chunk, ends)) manager.buffer = this._buffer
				break
			}
			if (!this._rule.parse(this, Chunk)) manager.buffer = this._buffer
			break
		case ContextState.BACKGROUND:
			let noActiveChild = true
			for (let item of this._children) {
				if (
					item.state == ContextState.ACTIVE ||
					item.state == ContextState.BACKGROUND
				) {
					noActiveChild = false
					break
				}
			}
			// If there is no active child, comes back to active
			if (noActiveChild) {
				this.state = ContextState.ACTIVE
				break
			}
			if (this.killsChild) {
				let ends = this._rule.endsWith(Chunk)
				if (ends || ends === 0) { // End
					if (!this.end(Chunk, ends)) manager.buffer = this._buffer
					break
				}
			}
		}
	}

	start(Chunk = null, Arg = null) {
		if (this._state == ContextState.ACTIVE) {
			console.warn('Already active')
			return false
		}
		this.state = ContextState.ACTIVE
		// Set the parent context as background
		if (this.hasParent) this.parent.state = ContextState.BACKGROUND
		// Populate sub-contexts
		for (let item of this._rule) this.addChild(new Context(item))
		return this._rule.init(this, Chunk, Arg)
	}

	end(Chunk = null, Arg = null) {
		if (this._state == ContextState.FINISHED) {
			console.warn('Already finished')
			return false
		}
		if (this._state == ContextState.STANDBY) {
			this.state = ContextState.FINISHED
			return false
		}
		this.state = ContextState.FINISHED
		if (this.killsChild) {
			for (let item of this._children) {
				if (item.state == ContextState.FINISHED) continue
				item.end()
			}
		}
		// Create a sibling that has the same DNA as itself
		if (this.hasParent && this.parent.state != ContextState.FINISHED)
			this.parent.addChild(new Context(this._rule))
		return this._rule.fin(this, Chunk, Arg)
	}
}

export default Context
