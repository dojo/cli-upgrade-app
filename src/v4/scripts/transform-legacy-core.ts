import matchImportsExports from '../matchImportsExports';
const match = /\/(shim|has)\/(.*)/;

export default function transformLegacyCore(file: any, api: any) {
	const j = api.jscodeshift;
	return j(file.source)
		.find(j.Declaration, matchImportsExports)
		.replaceWith((p: any) => {
			const { source } = p.node;
			const matches = match.exec(source.value);
			if (matches) {
				const [, pkg, rest] = matches;
				source.value = `@dojo/framework/${pkg}/${rest}`;
				return Object.assign(
					{
						source: Object.assign({}, source)
					},
					p.node
				);
			}
			return p.node;
		})
		.toSource({ quote: 'single' });
}
