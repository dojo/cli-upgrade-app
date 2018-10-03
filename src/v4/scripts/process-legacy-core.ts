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

interface DependencyMap {
	[coreImport: string]: string[];
}
const deps: DependencyMap = {};

// Copy core src
rimraf.sync(`${v4Path}/core`);
rimraf.sync('temp');
execSync('git clone https://github.com/dojo/framework.git temp --branch v3.0.1 --single-branch --depth 1');
fs.renameSync('temp/src/core', `${v4Path}/core`);
rimraf.sync('temp');

// Generate dependency list
const paths: string[] = glob.sync(`${coreDir}/**/*.ts`);
paths.forEach((filename) => {
	const list = dependencyTree
		.toList({
			filename: filename,
			directory: coreDir
		})
		.map((dep: string) => dep.replace(`${v4Path}/`, ''));
	list.pop();
	deps[filename.replace(`src/v4/`, '')] = list;
});
// Copy dependencies not caught from dynamic import
deps['core/request.ts'].push('core/request/providers/node.ts', ...deps['core/request/providers/node.ts']);
fs.writeFileSync(`${v4Path}/core/dependencies.json`, JSON.stringify(deps, null, '\t'));

let transform: string;
if (__dirname.includes('/dist/')) {
	transform = path.resolve(__dirname, './transform-legacy-core.js');
} else {
	// running from src dir
	transform = path.resolve(__dirname, '../../../dist/cjs/src/v4/scripts/transform-legacy-core.js');
}
const opts = {
	parser: 'typescript',
	transform,
	path: paths,
	verbose: 1,
	babel: false,
	dry: false,
	extensions: 'js',
	runInBand: false,
	silent: false
};

let response = Runner.run(opts.transform, opts.path, opts);
if (response) {
	response.then(() => {
		// copy files
		cpx.copySync('src/v4/core/**/*.{ts,d.ts,json}', 'dist/release/v4/core');
		cpx.copySync('src/v4/core/**/*.{ts,d.ts,json}', 'dist/dev/src/v4/core');
	});
} else {
	throw Error('Runner did not return');
}
