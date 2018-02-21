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
	 * @param string Tx Text to be parsed
	 */
	parse(Tx) {
		// TODO Implement
	}

	/**
	 * @param {string} Url File URL
	 * @param {object} Opt Streaming options
	 * @see https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options
	 */
	parseFile(Url, Opt = null) {
		let io = fs.createReadStream(Url, Object.assign(Opt || {}, {
			highWaterMark: 1
		}))
		io.on('open', () => {
			try {
				let cx = new Context(this._rule)
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
		io.on('error', function (e) {
			console.error(e)
			io.destroy()
		})
		io.on('end', () => {
			console.log('Parsing Completed!')
		})
	}
}

export default Parser
