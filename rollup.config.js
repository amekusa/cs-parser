import rNode from '@rollup/plugin-node-resolve';

const output = {
	name: 'cs-parser',
	sourcemap: true,
	indent: false,
};

export default {
	input: 'src/main.js',
	output: [
		{
			file: 'dist/import/bundle.mjs',
			format: 'es',
			...output
		},
		{
			file: 'dist/require/bundle.cjs',
			format: 'cjs',
			...output
		},
	],
	treeshake: true,
	plugins: [
		rNode({ // support importing npm packages
			browser: false,
		}),
	],
};
