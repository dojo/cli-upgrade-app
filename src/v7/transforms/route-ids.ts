import { getLineEndings } from '../../util';
import * as path from 'path';
import chalk from 'chalk';
import { warning } from 'log-symbols';

export default function(file: any, api: any) {
	let quote: string | undefined;
	const routesRegex = /src\/routes\.ts(x)?$/;
	const j = api.jscodeshift;
	const jFile = j(file.source);

	if (file.path && routesRegex.test(file.path)) {
		const lineTerminator = getLineEndings(file.source);

		return jFile
			.find(j.ObjectExpression)
			.replaceWith((p: any) => {
				if (p.node && p.node.properties) {
					const outlet = p.node.properties.reduce(
						(outlet: string | boolean, property: any) =>
							outlet ? outlet : property.key.name === 'outlet' && property.value.value,
						false
					);
					if (outlet) {
						if (!quote) {
							quote = p.node.properties[0].value.extra.raw[0] === '"' ? 'double' : 'single';
						}
						return {
							...p.node,
							properties: [
								...p.node.properties,
								j.objectProperty(j.identifier('id'), j.stringLiteral(outlet))
							]
						};
					}
				}

				return p;
			})
			.toSource({ quote: quote || 'single', lineTerminator });
	} else {
		debugger;
		const injectorPaths = jFile
			.find(j.ImportDeclaration)
			.filter((path: any) => path.node.source.value === '@dojo/framework/routing/RouterInjector')
			.paths();
		const injectorImports = injectorPaths && injectorPaths[0];
		const injectorLocalImport =
			injectorImports &&
			injectorImports.value.specifiers.find(({ imported: { name } }: any) => name === 'registerRouterInjector');
		const localName = injectorLocalImport && injectorLocalImport.local.name;
		if (jFile.find(j.CallExpression, { callee: { name: localName } }).length) {
			const routesImports = jFile
				.find(j.ImportDeclaration)
				.filter((path: any) => path.node.source.value.endsWith('routes'))
				.paths();
			if (
				!routesImports ||
				!routesImports.some((routesImport: any) => {
					debugger;
					const routesPath = `${path.resolve(file.path, `../${routesImport.node.source.value}`)}.ts`;
					return routesRegex.test(routesPath);
				})
			) {
				console.log(
					`${chalk.bold.yellow(
						warning
					)}  The routing config passed to the router injector could not be located. It needs to be updated to include 'id' properties`
				);
			}
		}
	}
}
