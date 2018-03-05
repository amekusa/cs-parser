/**
 * A container that stores parse results
 */
class ResultSet {
	constructor() {
		this._results = []
	}

	/**
	 * Saves the provided data as a parsing result.
	 * You can pass an array as multiple results
	 * @param {mixed|mixed[]|ResultSet} Result The data to add
	 * @param {boolean} KeepsArray=false
	 * If `true`, stores the result as a single result even if it is an array
	 * @return {ResultSet} This
	 * @chainable
	 */
	add(Result, KeepsArray = false) {
		if (Array.isArray(Result) && !KeepsArray) {
			for (let item of Result) this._results.push(item)
		} else this._results.push(Result)
		return this
	}

	/**
	 * Performs traversal
	 * @param {function} Fn
	 * The callback that receives every single result as the 1st parameter
	 * @param {mixed} Arg=null
	 * Additional argument to pass to `Fn` as the 2nd parameter
	 */
	traverse(Fn, Arg = null) {
		for (let item of this._results) {
			if (item instanceof ResultSet) item.traverse(Fn, Arg)
			else Fn(item, Arg)
		}
	}
}

export default ResultSet
