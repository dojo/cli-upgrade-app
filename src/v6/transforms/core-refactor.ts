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

			if (source.value === '@dojo/framework/widget-core/d') {
				console.log('P', p);
				debugger; // tslint:disable-line 
			} else if (
				source.value === '@dojo/framework/widget-core/d' ||
				source.value === '@dojo/framework/widget-core/tsx'
			) {
				source.value = '@dojo/framework/core/vdom';
			}

			source.value = source.value.replace('widget-core', 'core');

			return { ...p.node, source: { ...source } };
		})
		.toSource({ quote: quote || 'single', lineTerminator });
}
