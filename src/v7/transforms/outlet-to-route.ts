import { getLineEndings } from '../../util';

export default function(file: any, api: any) {
	let quote: string | undefined;
	const j = api.jscodeshift;
	const lineTerminator = getLineEndings(file.source);
	let jFile = j(file.source);
	let importScope: any = null;

	jFile.find(j.ImportDeclaration).forEach((path: any) => {
		const { source, specifiers } = path.node;
		if (source.value && source.value === '@dojo/framework/routing/Outlet') {
			source.value = '@dojo/framework/routing/Route';
			if (specifiers) {
				specifiers.forEach((specifier: any) => {
					if (specifier.type === 'ImportSpecifier') {
						if (specifier.imported.name === 'Outlet') {
							specifier.imported.name = 'Route';
							if (specifier.local.name === 'Outlet') {
								specifier.local.name = 'Route';
								importScope = path.scope;
							}
						}
					} else if (specifier.type === 'ImportDefaultSpecifier' && specifier.local.name === 'Outlet') {
						specifier.local.name = 'Route';
						importScope = path.scope;
					}
				});
			}
		}

		if (!quote) {
			quote = source.extra.raw.substr(0, 1) === '"' ? 'double' : 'single';
		}

		return { ...path.node, source: { ...source }, specifiers: [...specifiers] };
	});

	if (importScope) {
		jFile
			.find(j.Identifier, { name: 'Outlet' })
			.filter(function(path: any) {
				const parent = path.parent.node;

				if (j.MemberExpression.check(parent) && parent.property === path.node && !parent.computed) {
					// obj.oldName
					return false;
				}

				if (j.Property.check(parent) && parent.key === path.node && !parent.computed) {
					// { oldName: 3 }
					return false;
				}

				if (j.MethodDefinition.check(parent) && parent.key === path.node && !parent.computed) {
					// class A { oldName() {} }
					return false;
				}

				if (j.ClassProperty.check(parent) && parent.key === path.node && !parent.computed) {
					// class A { oldName = 3 }
					return false;
				}

				if (j.JSXAttribute.check(parent) && parent.name === path.node && !parent.computed) {
					// <Foo oldName={oldName} />
					return false;
				}

				return true;
			})
			.forEach(function(path: any) {
				let scope = path.scope;
				while (scope) {
					if (scope.declares('Outlet') && scope !== importScope) {
						return;
					}
					scope = scope.parent;
				}
				path.get('name').replace('Route');
			});
	}

	return jFile.toSource({ quote: quote || 'single', lineTerminator });
}
