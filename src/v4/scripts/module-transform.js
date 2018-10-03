const matchImportsExports = require('../matchImportsExports');
const match = /\/(shim|has)\/(.*)/;

module.exports = function (file, api) {
    const j = api.jscodeshift;
    return j(file.source)
		.find(j.Declaration, matchImportsExports)
		.replaceWith((p) => {
			const { source, type } = p.node;
			const matches = match.exec(source.value);
			if (matches) {
				const [ /* match */, pkg, rest ] = matches;
				source.value = `@dojo/framework/${pkg}/${rest}`;
				return { ...p.node, source: { ...source } };
			}
			return p.node;
		})
		.toSource({ quote: 'single' });
};
