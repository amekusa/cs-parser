/**
 * The base class which provides the implementation of the Composite design pattern.
 * A composite object can form a tree-like structure, the nodes or leaves of which are also composites
 */
class Composite {
	constructor() {
		this._parent = null
		this._children = []
	}

	/**
	 * Whether this has parent
	 * @type {boolean}
	 */
	get hasParent() {
		return this._parent != null
	}

	/**
	 * Whether this has one or more children
	 * @type {boolean}
	 */
	get hasChild() {
		return this._children.length > 0
	}

	/**
	 * The parent node
	 * @type {Composite}
	 */
	get parent() {
		return this._parent
	}

	/**
	 * The ancestors ordered by closest to furthest
	 * @type {Composite[]}
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
	 * The root of composition
	 * @type {Composite}
	 */
	get root() {
		let r = this
		while (r.hasParent) r = r._parent
		return r
	}

	/**
	 * The number of children
	 * @type {number}
	 */
	get length() {
		return this._children.length
	}

	/**
	 * Determines whether the specified composite can be added as a child
	 * @param {Composite} Cp The composite which is about to be added
	 * @return {boolean|string}
	 * `true` if `Cp` is valid. Any type other than `true` means invalid.
	 * If a string is returned, it is shown as an error message in the debug console
	 */
	verifyChild(Cp) {
		return true
	}

	/**
	 * Adds a child composite
	 * @param {Composite} Cp The composite to add as a child
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
	 * Adds multiple child composites
	 * @param {Composite[]} Cps The array of the composites to add
	 * @return {Composite} This
	 */
	addChildren(Cps) {
		for (let item of Cps) this.addChild(item)
		return this
	}

	/**
	 * Performs tree traversal
	 * @param {function} Fn
	 * The callback that receives every descendant composite as the 1st parameter.
	 * If `false` is returned, the traversal will be aborted.
	 * The returned value other than `false` will be passed to the next traversal call of `Fn` as the 2nd parameter
	 * @param {number} Depth=-1
	 * The limit of traversal depth. Negative number means no-limit
	 * @param {mixed} Arg=null
	 * Additinal argument to pass to `Fn` as the 2nd parameter.
	 * @return {boolean}
	 * `true` if the traversal is successfully completed.
	 * `false` if the traversal is aborted
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

	/**
	 * @ignore
	 */
	[Symbol.iterator]() {
		return this._children[Symbol.iterator]()
	}
}

export default Composite
