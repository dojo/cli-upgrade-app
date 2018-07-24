import { Command, Helper, OptionsHelper } from '@dojo/cli/interfaces';
const Runner = require('jscodeshift/src/Runner');
const path = require('path');
const babylon = require('babylon');
const glob = require('glob')

const command: Command = {
	group: 'upgrade',
	name: 'app',
	description: 'upgrade your application to later dojo versions',
	register(options: OptionsHelper) {},
	run(helper: Helper) {
		const options = {
			sourceType: 'module',
			allowImportExportEverywhere: true,
			allowReturnOutsideFunction: true,
			plugins: [ 'typescript', 'jsx' ]
		};

		const parser = (code: string)  => babylon.parse(code, options);

		const opts = {
			parser,
			transform: path.resolve(__dirname, 'transforms', 'module-transform-to-framework.js'),
			path: glob.sync('{src,tests}/**/*.{ts,tsx}'),
			verbose: 0,
			babel: true,
			extensions: 'js',
			runInBand: false,
			silent: false
		}

		return Runner.run(opts.transform, opts.path, opts);
	}
};

export default command;
