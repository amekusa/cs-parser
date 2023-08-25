import ContextManager from './ContextManager.js'
import Context from './Context.js'
import Rule from './Rule.js'
import fs from 'node:fs';

/**
 * Context sensitive parser
 */
class Parser {
	/**
	 * @param {object|Rule} Rl=null The root rule
	 */
	constructor(Rl = null) {
		let rule = Rl instanceof Rule ? Rl : new Rule(Rl)
		this._rule = rule.from ? new Rule().addChild(rule) : rule
		if (!this._rule.name) this._rule.name = 'root'
		this._cm = null
	}

	/**
	 * Adds a new rule
	 * @param {object|Rule} Rl The rule to add
	 * @return {Rule} The `Rule` object which has peen added
	 */
	addRule(Rl) {
		let rule = Rl instanceof Rule ? Rl : new Rule(Rl)
		this._rule.addChild(rule)
		return rule
	}

	/**
	 * Adds multiple new rules
	 * @param {object[]|Rule[]} Rls An array of the rules to add
	 * @return {Rule[]} An array of `Rule` objects which have been added
	 */
	addRules(Rls) {
		let rules = []
		for (let item of Rls) rules.push(this.addRule(item))
		return rules
	}

	/**
	 * Parses the data specified as a string or Buffer.
	 * After the parsing completed, returns the root context which contains
	 * all the generated sub-contexts through the entire parsing
	 * @param {string|Buffer} Data The data to be parsed
	 * @return {Context} The root context
	 */
	parse(Data) {
		let cx = new Context(this._rule)
		this.onStart(cx)
		this._cm.feed(Data instanceof Buffer ? Data : Buffer.from(Data))
		this.onComplete(cx)
		return cx
	}

	/**
	 * Parses a file asynchronously
	 * @param {string} Url The file URL
	 * @param {object} Opt Streaming options
	 * @see https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options
	 * @return {Promise}
	 * A Promise that will resolve when the parsing completes.
	 * You can get the root context as the 1st parameter of a callback
	 * which you can pass to `.then()`
	 */
	parseFile(Url, Opt = null) {
		let cx = null
		let io = fs.createReadStream(Url, Object.assign(Opt || {}, {
			highWaterMark: 1
		}))
		io.on('open', () => {
			try {
				cx = new Context(this._rule)
				this.onStart(cx)
			} catch (e) {
				io.emit('error', e)
			}
		})
		io.on('data', byte => {
			try {
				this._cm.feed(byte)
			} catch (e) {
				io.emit('error', e)
			}
		})
		return new Promise((resolve, reject) => {
			io.on('end', () => {
				this.onComplete(cx)
				resolve(cx)
			})
			io.on('error', function (e) {
				console.error(e)
				io.destroy()
				reject(e)
			})
		})
	}

	/**
	 * @param {Context} Cx The root context
	 * @protected
	 */
	onStart(Cx) {
		this._cm = new ContextManager(Cx)
		Cx.start()
		Cx.updateState(true)
	}

	/**
	 * @param {Context} Cx The finished context
	 * @protected
	 */
	onComplete(Cx) {
		Cx.end()
		Cx.updateState(true)
		Cx.cleanupChildren(true)
	}
}

export default Parser
