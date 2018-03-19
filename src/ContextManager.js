import Context from './Context'

/**
 * A ContextManager can control multiple contexts through the entire parsing
 */
class ContextManager {
	/**
	 * @param {Context} Cx The root context to manage
	 */
	constructor(Cx) {
		Cx.manager = this
		this._root = Cx
		this._current = null
		this._history = []
		this._buffer = null
	}

	/**
	 * The root context
	 * @type {Context}
	 * @readonly
	 */
	get root() {
		return this._root
	}

	/**
	 * The current active context
	 * @type {Context}
	 */
	get current() {
		return this._current
	}

	set current(X) {
		if (X && !this._history.includes(X)) {
			if (this._history.length)
				X.prev = this._history[this._history.length - 1]
			this._history.push(X)
		}
		this._current = X
	}

	/**
	 * An array of contexts which have ever been activated
	 * @type {Context[]}
	 * @readonly
	 */
	get history() {
		return this._history
	}

	set buffer(Bf) {
		this._buffer = Bf
	}

	/**
	 * Feeds a buffer to all the appropriate contexts
	 * depending on the current context
	 * @param {Buffer} Bf
	 */
	feed(Bf) {
		if (this._buffer && this._buffer.length) {
			let bf = this._buffer
			this._buffer = null
			this.feed(bf)
		}
		if (Bf.length == 1) {
			this._current.step(Bf)
			this._root.updateState(true)
			return
		}
		if (!Bf.length) throw new Error(`Empty buffer`)
		for (let byte of Bf) {
			let hx = byte.toString(16)
			if (hx.length == 1) hx = '0' + hx // Zero padding
			this.feed(Buffer.from(hx, 'hex'))
		}
	}
}

export default ContextManager
