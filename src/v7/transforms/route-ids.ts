import { getLineEndings } from '../../util';

export default function(file: any, api: any) {
	let quote: string | undefined;

	if (file.path && /^routes\.ts(x)?$/.test(file.path)) {
		const j = api.jscodeshift;
		const lineTerminator = getLineEndings(file.source);

		return j(file.source)
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
	}
}
