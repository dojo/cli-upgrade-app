import { getLineEndings } from '../../util';

export default function(file: any, api: any) {
	let quote: string | undefined;
	const j = api.jscodeshift;
	const lineTerminator = getLineEndings(file.source);

	return j(file.source)
		.find(j.ImportDeclaration)
		.replaceWith((p: any) => {
			const { source, specifiers } = p.node;

			if (!quote) {
				quote = source.extra.raw.substr(0, 1) === '"' ? 'double' : 'single';
			}

			if (source.value === '@dojo/framework/widget-core/d' && specifiers.length) {
				const decorateImports: any[] = [];
				const otherImports: any[] = [];

				specifiers.forEach((specifier: any) => {
					if (specifier.imported.name === 'decorate') {
						decorateImports.push(specifier);
					} else {
						otherImports.push(specifier);
					}
				});

				if (decorateImports.length) {
					return [
						{
							...p.node,
							specifiers: decorateImports,
							source: {
								...source,
								value: '@dojo/framework/core/util'
							}
						},
						{
							...p.node,
							specifiers: otherImports,
							source: {
								...source,
								value: '@dojo/framework/core/vdom'
							}
						}
					];
				} else {
					source.value = '@dojo/framework/core/vdom';
				}
			} else if (source.value === '@dojo/framework/widget-core/tsx') {
				source.value = '@dojo/framework/core/vdom';
			}

			if (source.value === '@dojo/framework/has/has') {
				source.value = '@dojo/framework/core/has';
			}

			source.value = source.value.replace('widget-core', 'core');

			return { ...p.node, source: { ...source } };
		})
		.toSource({ quote: quote || 'single', lineTerminator });
}
