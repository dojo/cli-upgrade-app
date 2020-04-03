import { getLineEndings } from '../../util';

export default function(file: any, api: any) {
	let quote: string | undefined;
	const j = api.jscodeshift;
	const lineTerminator = getLineEndings(file.source);

	return j(file.source)
		.find(j.ImportDeclaration)
		.replaceWith((p: any) => {
			const { source } = p.node;

			if (!quote) {
				quote = source.extra.raw.substr(0, 1) === '"' ? 'double' : 'single';
			}

			if (source.value && source.value.startsWith('@dojo/framework/testing/')) {
				source.value = source.value.replace('@dojo/framework/testing/', '@dojo/framework/testing/harness/');
			}

			return { ...p.node, source: { ...source } };
		})
		.toSource({ quote: quote || 'single', lineTerminator });
}
