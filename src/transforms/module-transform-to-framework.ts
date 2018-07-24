const match = /^@dojo\/(core|has|i18n|widget-core|routing|stores|shim|test-extras)/;

function transform(file: any, api: any) {
	const j = api.jscodeshift;
	return j(file.source)
		.find(j.ImportDeclaration)
		.replaceWith(
			(p: any) => {
				const { source } = p.node;
				const matches = match.exec(source.value);
				if (matches) {
					const [ full, pkg ] = matches;
					const replacement = pkg === 'test-extras' ? 'testing' : pkg;
					source.value = source.value.replace(full, `@dojo/framework/${replacement}`);
					return { ...p.node, source: { ...source } };
				}
				return p.node;
			}
		)
		.toSource({quote: 'single'});
}

module.exports = transform;
