import Context from './Context'
import {ContextState} from './ContextState'

/**
 * ContextManager can hold a context tree
 * and handle the composition as a stack of states
 */
class ContextManager {
	/**
	 * @param {Context} Cx The root context to manage
	 */
	constructor(Cx) {
		Cx.manager = this
		this._root = Cx
		this._current = null
		this._buffer = null
	}

	/**
	 * @type {Context} The root context
	 */
	get root() {
		return this._root
	}

	/**
	 * @type {Context} The current context
	 */
	get current() {
		return this._current
	}

	set current(Cx) {
		this._current = Cx
	}

	set buffer(Bf) {
		this._buffer = Bf
	}

	/**
	 * Feeds bytes to contexts
	 * @param {Buffer} Bf
	 */
	feed(Bf) {
		if (this._buffer && this._buffer.length) {
			let bf = this._buffer
			this._buffer = null
			this.feed(bf)
		}
		if (Bf.length == 1) {
			this._root.updateState()
			this._current.step(Bf)
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
