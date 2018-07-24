import { Command, Helper, OptionsHelper } from '@dojo/cli/interfaces';
const Runner = require('jscodeshift/src/Runner');
const path = require('path');
const glob = require('glob')

const command: Command & { __runner: any } = {
	__runner: Runner,
	group: 'upgrade',
	name: 'app',
	description: 'upgrade your application to later dojo versions',
	register(options: OptionsHelper) {
		options('pattern', {
			describe: 'glob pattern of source files to transform',
			alias: 'p',
			type: 'string',
			default: '{src,tests}/**/*.{ts,tsx}'
		});
		options('dry', {
			describe: 'perform a dry run, no changes are made to files',
			alias: 'd',
			type: 'boolean',
			default: false
		});
	},
	run(helper: Helper, args: { pattern: string, dry: boolean }) {
		const { pattern, dry } = args;
		const opts = {
			parser: 'typescript',
			transform: path.resolve(__dirname, 'transforms', 'module-transform-to-framework.js'),
			path: glob.sync(pattern),
			verbose: 0,
			babel: false,
			dry,
			extensions: 'js',
			runInBand: false,
			silent: false
		}
		return command.__runner.run(opts.transform, opts.path, opts);
	}
};

export default command;
