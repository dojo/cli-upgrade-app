module.exports = function matchImportsExports(node: any) {
	const { source, type } = node;
	if (
		type === 'ImportDeclaration' ||
		type === 'ExportAllDeclaration' ||
		(type === 'ExportNamedDeclaration' && source && source.value)
	) {
		return true;
	}
	return false;
};
