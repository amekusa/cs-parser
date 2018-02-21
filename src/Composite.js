/**
 * The base class which represents a composite structure
 */
class Composite {
	constructor() {
		this._parent = null
		this._children = []
	}

	/**
	 * @type {boolean} Whether this has parent
	 */
	get hasParent() {
		return this._parent != null
	}

	/**
	 * @type {boolean} Whether this has any child
	 */
	get hasChild() {
		return this._children.length > 0
	}

	/**
	 * @type {Composite} The parent composite object
	 */
	get parent() {
		return this._parent
	}

	/**
	 * @type {Composite[]} The ancestors. The order is closest to furthest
	 */
	get ancestors() {
		let r = []
		let item = this
		while (item.hasParent) {
			item = item._parent
			r.push(item)
		}
		return r
	}

	/**
	 * @type {Composite} The root of composition
	 */
	get root() {
		let r = this
		while (r.hasParent) r = r._parent
		return r
	}

	/**
	 * @type {int} The number of children
	 */
	get length() {
		return this._children.length
	}

	/**
	 * Determines whether the specified composite object can be added as a child
	 * @param {Composite} Cp
	 * @return {boolean|string}
	 * `true` if `Cp` is valid. Any type other than `true` means invalid.
	 * If a string is returned, it is shown as an error message in the debug console
	 */
	verifyChild(Cp) {
		return true
	}

	/**
	 * Adds a child composite object
	 * @param {Composite} Cp
	 * @return {Composite} This
	 */
	addChild(Cp) {
		if (Cp.hasParent) throw new Error('Parent already exists')
		let verified = this.verifyChild(Cp)
		if (verified !== true) {
			console.error(typeof verified == 'string' ? verified : 'Invalid child')
			return this
		}
		Cp._parent = this
		this._children.push(Cp)
		return this
	}

	/**
	 * Adds multiple child composite objects
	 * @param {Composite[]} Cs
	 * @return {Composite} This
	 */
	addChildren(Cs) {
		for (let item of Cs) this.addChild(item)
		return this
	}

	/**
	 * Performs tree traversal
	 * @param {function} Fn
	 * Function that gets every descendant composite element as the 1st parameter.
	 * If false is returned, the traversal is aborted.
	 * The returned value other than false is passed to descent traversal call of 'Fn' as the 2nd parameter
	 * @param {number} Depth=-1
	 * Limit of traversal depth. Negative number means no limit
	 * @param {mixed} Arg=null
	 * Additinal argument to pass to 'Fn' as the 2nd parameter.
	 * @return {boolean}
	 * True if the traversal is successfully completed.
	 * False if the traversal is aborted
	 */
	traverse(Fn, Depth = -1, Arg = null) {
		let r = true
		let result = Fn(this, Arg)
		if (result === false || Depth == 0) return !this.hasChild
		for (let item of this._children) {
			if (!item.traverse(Fn, Depth - 1, result) && r) r = false
		}
		return r
	}

	[Symbol.iterator]() {
		return this._children[Symbol.iterator]()
	}
}

export default Composite
