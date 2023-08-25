import Parser from './Parser'
import Rule from './Rule'

/**
 * The main API provider
 */
class Main {
	/**
	 * Creates a Parser instance
	 * @param {object|Rule} Rl The parsing rule definition
	 * @return {Parser} A new Parser instance
	 */
	create(Rl) {
		return new Parser(Rl)
	}
	/**
	 * Creates a Rule instance
	 * @param {object} Df The rule definition
	 * @return {Rule} A new Rule instance
	 */
	newRule(Df = null) {
		return new Rule(Df)
	}
}

export default new Main()
