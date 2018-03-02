import ContextManager from './ContextManager'
import Context from './Context'
import {ContextState} from './ContextState'
import Rule from './Rule'
const fs = require('fs')

/**
 * Context sensitive parser
 */
class Parser {
	/**
	 * @param {object|Rule} Rl Rule definition
	 */
	constructor(Rl) {
		let rule = Rl instanceof Rule ? Rl : new Rule(Rl)
		this._rule = rule.start ? new Rule().addChild(rule) : rule
		this._cm = null
	}

	/**
	 * Parses the data specified as a string or Buffer.
	 * After the parsing completed, returns the root context which contains
	 * all the generated sub-contexts through the entire parsing.
	 * @param {string|Buffer} Data The data to be parsed
	 * @return {Context} The root context
	 */
	parse(Data) {
		let cx = new Context(this._rule)
		this._cm = new ContextManager(cx)
		cx.start()
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
	 * A Promise that resolves when the parsing complete.
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
				this._cm = new ContextManager(cx)
				cx.start()
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
	 * @protected
	 * @param {Context} Cx The finished context
	 */
	onComplete(Cx) {
		console.log('Parsing Completed!')
		let wasted = Cx.cleanupChildren(true)
		console.log(wasted.length + ` wasted contexts`)
	}
}

export default Parser
