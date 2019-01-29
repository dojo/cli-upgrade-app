import { getLineEndings } from '../../util';

const match = /^@dojo\/framework\/(has\/preset|shim\/support\/has)/;

export default function(file: any, api: any) {
	const j = api.jscodeshift;
	const lineTerminator = getLineEndings(file.source);
	let quote: string | undefined;

	return j(file.source)
		.find(j.ImportDeclaration)
		.replaceWith((p: any) => {
			const { source } = p.node;

			if (match.test(source.value)) {
				return { ...p.node, source: { ...source, value: '@dojo/framework/has/has' } };
			}

			return p.node;
		})
		.toSource({ quote: quote || 'single', lineTerminator });
}
