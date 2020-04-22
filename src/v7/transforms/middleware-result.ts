import { getLineEndings } from '../../util';

export default function(file: any, api: any) {
	let quote: string | undefined;
	const j = api.jscodeshift;
	const lineTerminator = getLineEndings(file.source);
	let jFile = j(file.source);
	let importName: string = '';

	jFile.find(j.ImportDeclaration).forEach((path: any) => {
		const { source, specifiers } = path.node;
		if (source.value && source.value === '@dojo/framework/core/interfaces') {
			if (specifiers) {
				specifiers.forEach((specifier: any) => {
					if (specifier.type === 'ImportSpecifier') {
						if (specifier.imported.name === 'MiddlewareResult') {
							importName = specifier.local.name;
							specifier.imported.name = 'DefaultMiddlewareResult';
							specifier.local.name = 'DefaultMiddlewareResult';
						}
					}
				});
			}
		}

		if (!quote) {
			quote = source.extra.raw.substr(0, 1) === '"' ? 'double' : 'single';
		}

		return { ...path.node, source: { ...source }, specifiers: [...specifiers] };
	});

	debugger;
	if (importName) {
		jFile.find(j.TSTypeAnnotation).replaceWith(function(path: any) {
			const node = path.value;
			if (
				node.typeAnnotation &&
				node.typeAnnotation.typeName &&
				node.typeAnnotation.typeName.name === importName
			) {
				return {
					...node,
					typeAnnotation: {
						...node.typeAnnotation,
						typeName: j.identifier('DefaultMiddlewareResult'),
						typeParameters: undefined
					}
				};
			}

			return node;
		});
	}

	return jFile.toSource({ quote: quote || 'single', lineTerminator });
}
