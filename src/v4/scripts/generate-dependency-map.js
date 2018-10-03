const dependencyTree = require('dependency-tree');
const glob = require('glob');
const Runner = require('jscodeshift/src/Runner');
const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');
const rimraf = require('rimraf');
const cpx = require('cpx');

const coreDir = 'src/v4/core';
const v4Path = path.resolve(__dirname, '../');

/** @type {{ [coreImport: string]: string[]; }} */
const deps = {};

async function runTransform(options) {
	try {
		await Runner.run(options.transform, options.path, options);
	} catch (e) {
		console.log(e);
	}
}

// Copy core src
rimraf.sync(`${v4Path}/core`);
rimraf.sync('temp');
execSync('git clone git@github.com:dojo/framework.git temp --branch v3.0.1 --single-branch');
fs.renameSync('temp/src/core', `${v4Path}/core`);
rimraf.sync('temp');

// Generate dependency list
const paths = glob.sync(`${coreDir}/**/*.ts`);
paths.forEach((filename) => {
	const list = dependencyTree.toList({
		filename: filename,
		directory: coreDir
	}).map((dep) => dep.replace(`${v4Path}/`, ''));
	list.pop();
	deps[filename.replace(`src/v4/`, '')] = list;
});
// Copy dependencies not caught from dynamic import
deps['core/request.ts'].push('core/request/providers/node.ts', ...deps['core/request/providers/node.ts']);
fs.writeFileSync(`${v4Path}/core/dependencies.json`, JSON.stringify(deps, null, '\t'));

const opts = {
	parser: 'typescript',
	transform: path.resolve(__dirname, './module-transform.js'),
	path: paths,
	verbose: 1,
	babel: false,
	dry: false,
	extensions: 'js',
	runInBand: false,
	silent: false
};
runTransform(opts);

// copy files
cpx.copySync('src/v4/core/**/*.{ts,d.ts,json}', 'dist/release/v4/core');
cpx.copySync('src/v4/core/**/*.{ts,d.ts,json}', 'dist/dev/src/v4/core');
