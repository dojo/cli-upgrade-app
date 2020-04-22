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

	if (importName) {
		function isMiddlewareResultType(typeAnnotation: any) {
			return typeAnnotation && typeAnnotation.typeName && typeAnnotation.typeName.name === importName;
		}

		jFile.find(j.TSTypeAnnotation).replaceWith(function(path: any) {
			const node = path.value;
			if (isMiddlewareResultType(node.typeAnnotation)) {
				return {
					...node,
					typeAnnotation: {
						...node.typeAnnotation,
						typeName: j.identifier('DefaultMiddlewareResult'),
						typeParameters: undefined
					}
				};
			} else if (
				node.typeAnnotation &&
				(node.typeAnnotation.type === 'TSUnionType' || node.typeAnnotation.type === 'TSIntersectionType')
			) {
				debugger;
				return {
					...node,
					typeAnnotation: {
						...node.typeAnnotation,
						types:
							node.typeAnnotation.types &&
							node.typeAnnotation.types.map((type: any) => {
								if (isMiddlewareResultType(type)) {
									return {
										...type,
										typeName: j.identifier('DefaultMiddlewareResult'),
										typeParameters: undefined
									};
								}

								return type;
							})
					}
				};
			}

			return node;
		});
	}

	return jFile.toSource({ quote: quote || 'single', lineTerminator });
}
