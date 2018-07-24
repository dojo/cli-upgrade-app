const babylon = require('babylon');
const recast = require('recast');

function transform(file: any, api: any) {
	const parse = (source: any) => babylon.parse(source, {
		sourceType: 'module',
		plugins: file.path.endsWith('.tsx') ? ['jsx', 'typescript'] : ['typescript'],
	});

	const j = api.jscodeshift;

	return j(recast.parse(file.source, { parser: { parse } }))
		.find(j.ImportDeclaration)
		.replaceWith(
			(p: any) => {
				const { source } = p.node;
				if (source.value.indexOf('@dojo/') === 0) {
					source.value = source.value.replace('@dojo/', '@dojo/framework/');
					return { ...p.node, source: { ...source } };
				}
				return p.node;
			}
		)
		.toSource({quote: 'single'});
}

module.exports = transform;
