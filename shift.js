const { run } = require('jscodeshift/src/Runner');
const { resolve } = require('path');
const glob = require('glob');

const paths = glob.sync('../../cli-test-app/src/main.ts', { ignore: '../../cli-test-app/**/*.css.d.ts' });
const transform = resolve(__dirname, 'dist', 'dev', 'src', 'v4', 'transforms', 'migration-logging.js');

run(transform, paths, {
	parser: 'typescript',
	verbose: 0,
	babel: false,
	dry: false,
	extensions: 'js',
	runInBand: true,
	silent: true
});
