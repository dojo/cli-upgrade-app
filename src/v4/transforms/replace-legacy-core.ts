const dependencies = require('../core/dependencies.json');
import matchImportsExports from '../matchImportsExports';
import { getLineEndings } from '../../util';
const fs = require('fs-extra');
const match = /^@dojo\/framework\/(core\/.*)/;
const excludes = ['core/Destroyable', 'core/Evented', 'core/QueuingEvented', 'core/has'];

export = function(file: any, api: any, options: { dry?: boolean }) {
	let quote: string | undefined;
	let lineTerminator = getLineEndings(file.source);
	const j = api.jscodeshift;
	return j(file.source)
		.find(j.Declaration, matchImportsExports)
		.replaceWith((p: any) => {
			const { source } = p.node;
			const matches = match.exec(source.value);
			if (matches && excludes.indexOf(matches[1]) === -1) {
				const moduleImport = matches[1];
				let filesToCopy: string[] = [];
				if (dependencies[`${moduleImport}.ts`]) {
					filesToCopy = [`${moduleImport}.ts`, ...dependencies[`${moduleImport}.ts`]];
				} else if (dependencies[`${moduleImport}.d.ts`]) {
					filesToCopy = [`${moduleImport}.d.ts`, ...dependencies[`${moduleImport}.d.ts`]];
				}
				filesToCopy.forEach((copyPath) => {
					if (!options.dry) {
						const fileExists = fs.pathExistsSync(`${process.cwd()}/src/dojo/${copyPath}`);
						if (!fileExists) {
							fs.copySync(`${__dirname}/../${copyPath}`, `${process.cwd()}/src/dojo/${copyPath}`);
						}
					}
				});
				if (!quote) {
					quote = source.extra.raw.substr(0, 1) === '"' ? 'double' : 'single';
				}
				let pathToSrc = '.';
				const numberOfSegments = file.path.split('/').length;
				if (file.path.startsWith('src/')) {
					if (numberOfSegments >= 3) {
						pathToSrc = '..' + '/..'.repeat(numberOfSegments - 3);
					}
				} else {
					if (numberOfSegments >= 2) {
						pathToSrc = '../'.repeat(numberOfSegments - 1) + 'src';
					}
				}

				source.value = `${pathToSrc}/dojo/${matches[1]}`;
				return { ...p.node, source: { ...source } };
			}
			return p.node;
		})
		.toSource({ quote: quote || 'single', lineTerminator });
};
