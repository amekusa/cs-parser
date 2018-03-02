/**
 * A container that stores parse results
 */
class ResultSet {
	constructor() {
		this._results = []
	}

	/**
	 * Saves specified data as a parsing result
	 * @param {mixed|ResultSet} Result The data to add
	 */
	add(Result) {
		this._results.push(Result)
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
