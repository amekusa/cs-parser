/**
 * A container that stores parse results
 */
class ResultSet {
	constructor() {
		this._results = []
	}

	/**
	 * @param {mixed|ResultSet} Result
	 */
	add(Result) {
		this._results.push(Result)
	}

	/**
	 * @param {function} Fn
	 * @param {mixed} Arg=null
	 */
	traverse(Fn, Arg = null) {
		for (let item of this._results) {
			if (item instanceof ResultSet) item.traverse(Fn, Arg)
			else Fn(item, Arg)
		}
	}
}

export default ResultSet
