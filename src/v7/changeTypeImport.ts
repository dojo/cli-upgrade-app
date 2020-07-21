import { getLineEndings } from '../util';

function isTargetedType(typeAnnotation: any, importName: string) {
	return typeAnnotation && typeAnnotation.typeName && typeAnnotation.typeName.name === importName;
}

function matchTypeRecursively(j: any, typeAnnotation: any, importName: string, newName: string) {
	if (isTargetedType(typeAnnotation, importName)) {
		return {
			...typeAnnotation,
			typeName: j.identifier(newName),
			typeParameters: undefined
		};
	} else if (
		typeAnnotation &&
		(typeAnnotation.type === 'TSUnionType' || typeAnnotation.type === 'TSIntersectionType')
	) {
		return {
			...typeAnnotation,
			types:
				typeAnnotation.types &&
				typeAnnotation.types.map((type: any) => matchTypeRecursively(j, type, importName, newName))
		};
	} else {
		return {
			...typeAnnotation,
			typeParameters: typeAnnotation.typeParameters && {
				...typeAnnotation.typeParameters,
				params: typeAnnotation.typeParameters.params.map((type: any) =>
					matchTypeRecursively(j, type, importName, newName)
				)
			}
		};
	}
}

export default function(targetedImport: string, oldName: string, newName: string) {
	return function(file: any, api: any) {
		let quote: string | undefined;
		const j = api.jscodeshift;
		const lineTerminator = getLineEndings(file.source);
		let jFile = j(file.source);
		let importName = '';

		jFile.find(j.ImportDeclaration).forEach((path: any) => {
			const { source, specifiers } = path.node;
			if (source.value && source.value === targetedImport) {
				if (specifiers) {
					specifiers.forEach((specifier: any) => {
						if (specifier.type === 'ImportSpecifier') {
							if (specifier.imported.name === oldName) {
								importName = specifier.local.name;
								specifier.imported.name = newName;
								specifier.local.name = newName;
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
			jFile.find(j.TSTypeAnnotation).replaceWith(function(path: any) {
				const node = path.value;
				return {
					...node,
					typeAnnotation: matchTypeRecursively(j, node.typeAnnotation, importName, newName)
				};
			});
		}

		return jFile.toSource({ quote: quote || 'single', lineTerminator });
	};
}
