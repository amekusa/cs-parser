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
	 * @param {string|Buffer} Tx Text to be parsed
	 * @return {Context} The root context
	 */
	parse(Tx) {
		let cx = new Context(this._rule)
		this._cm = new ContextManager(cx)
		cx.start()
		this._cm.feed(Tx instanceof Buffer ? Tx : Buffer.from(Tx))
		cx.cleanupChildren(true)
		return cx
	}

	/**
	 * @param {string} Url File URL
	 * @param {object} Opt Streaming options
	 * @see https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options
	 * @return {Promise}
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
				console.log('Parsing Completed!')
				let wasted = cx.cleanupChildren(true)
				console.log(wasted.length + ` wasted contexts`)
				resolve(cx)
			})
			io.on('error', function (e) {
				console.error(e)
				io.destroy()
				reject(e)
			})
		})
	}
}

export default Parser
