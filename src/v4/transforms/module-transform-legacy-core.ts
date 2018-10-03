const dependencies = require('../core/dependencies.json');
const matchImportsExports = require('../matchImportsExports');
const fs = require('fs-extra');
const match = /^@dojo\/framework\/(core\/.*)/;
const excludes = ['core/Destroyable', 'core/Evented', 'core/QueuingEvented', 'core/util'];

export = function(file: any, api: any, options: { dry?: boolean }) {
	let quote: string | undefined;
	const j = api.jscodeshift;
	return j(file.source)
		.find(j.Declaration, matchImportsExports)
		.replaceWith((p: any) => {
			const { source } = p.node;
			const matches = match.exec(source.value);
			if (matches && excludes.indexOf(matches[1]) === -1) {
				const filePath = `${matches[1]}.ts`;
				const filesToCopy = [filePath, ...dependencies[filePath]];
				filesToCopy.forEach((file) => {
					if (!options.dry) {
						fs.copySync(`${__dirname}/../${file}`, `${process.cwd()}/src/${file}`);
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

				source.value = `${pathToSrc}/${matches[1]}`;
				return { ...p.node, source: { ...source } };
			}
			return p.node;
		})
		.toSource({ quote: quote || 'single' });
};
