type JSCodeShift = any;
type Path = any;
type Expression = any;

const match = /^@dojo\/framework\/i18n\/(date|number|unit)/;

const methodMap: { [key: string]: { module: string; arity: number; renameTo: string } } = {
	formatDate: { module: 'date', arity: 3, renameTo: 'formatDate' },
	formatRelativeTime: { module: 'date', arity: 4, renameTo: 'formatRelativeTime' },
	getDateFormatter: { module: 'date', arity: 2, renameTo: 'dateFormatter' },
	getDateParser: { module: 'date', arity: 2, renameTo: 'dateParser' },
	getRelativeTimeFormatter: { module: 'date', arity: 3, renameTo: 'relativeTimeFormatter' },
	parseDate: { module: 'date', arity: 3, renameTo: 'parseDate' },

	formatCurrency: { module: 'number', arity: 4, renameTo: 'formatCurrency' },
	formatNumber: { module: 'number', arity: 3, renameTo: 'formatNumber' },
	getCurrencyFormatter: { module: 'number', arity: 3, renameTo: 'currencyFormatter' },
	getNumberFormatter: { module: 'number', arity: 2, renameTo: 'numberFormatter' },
	getNumberParser: { module: 'number', arity: 2, renameTo: 'numberParser' },
	getPluralGenerator: { module: 'number', arity: 2, renameTo: 'pluralGenerator' },
	parseNumber: { module: 'number', arity: 3, renameTo: 'parseNumber' },
	pluralize: { module: 'number', arity: 3, renameTo: 'plural' },

	formatUnit: { module: 'unit', arity: 4, renameTo: 'formatUnit' },
	getUnitFormatter: { module: 'unit', arity: 3, renameTo: 'unitFormatter' }
};

/**
 * @private
 * Return an expression that is recast to `Globalize(locale)[method](arg1, arg2, ...argN - 1)`
 */
function mapWithLocale(j: JSCodeShift, method: string, args: any[]): Expression {
	const last = args[args.length - 1];
	const locale = last.type === 'StringLiteral' ? last : j.logicalExpression('||', last, j.literal(''));
	return j.callExpression(
		j.memberExpression(j.callExpression(j.identifier('Globalize'), [locale]), j.identifier(method)),
		args.slice(0, args.length - 1)
	);
}

/**
 * @private
 * Return an expression that is recast to `Globalize[method](args)`
 */
function mapWithoutLocale(j: JSCodeShift, method: string, args: any[]): Expression {
	return j.callExpression(j.memberExpression(j.identifier('Globalize'), j.identifier(method)), args);
}

/**
 * @private
 * Return an expression that is recast to either `Globalize(locale)[method](args1, args2, ...argsN - 1)` or
 * `Globalize[method](args)`, depending on whether it is clear that the final argument is either a locale
 * string or options object. If the final argument is indeterminate, then nothing is returned.
 */
function mapOptionsOrLocale(j: JSCodeShift, method: string, args: any[]): Expression | void {
	const last = args[args.length - 1];
	if (last.type === 'StringLiteral' || (last.type === 'Identifier' && last.name === 'locale')) {
		return j.callExpression(
			j.memberExpression(j.callExpression(j.identifier('Globalize'), [last]), j.identifier(method)),
			args.slice(0, args.length - 1)
		);
	} else if (last.type !== 'Identifier' || /options/i.test(last.name || '')) {
		return j.callExpression(j.memberExpression(j.identifier('Globalize'), j.identifier(method)), args);
	}
}

/**
 * @private
 * A map of maximum formatter arities to functions that return the correct replacement based on the
 * number of supplied arguments.
 */
const mappersByArity: { [key: number]: (j: JSCodeShift, method: string, args: any[]) => Expression | void } = {
	4: (j: JSCodeShift, method: string, args: any[]) => {
		switch (args.length) {
			case 4:
				return mapWithLocale(j, method, args);
			case 3:
				return mapOptionsOrLocale(j, method, args);
			default:
				return mapWithoutLocale(j, method, args);
		}
	},

	3: (j: JSCodeShift, method: string, args: any[]) => {
		switch (args.length) {
			case 3:
				return mapWithLocale(j, method, args);
			case 2:
				return mapOptionsOrLocale(j, method, args);
			default:
				return mapWithoutLocale(j, method, args);
		}
	},

	2: (j: JSCodeShift, method: string, args: any[]) => {
		switch (args.length) {
			case 2:
				return mapWithLocale(j, method, args);
			case 1:
				return mapOptionsOrLocale(j, method, args);
			default:
				return mapWithoutLocale(j, method, args);
		}
	}
};

/**
 * Replace formatters from @dojo/framework/i18n in the provided file with the equivalent Globalize.js methods.
 * If formatter names are shadowed, or if it is not possible to determine whether a specific argument represents
 * a locale string or options object, insert a warning comment into the file that is prefixed with
 * "TODO @dojo/cli-upgrade-app" so that users can easily locate them.
 */
export default function(file: any, api: any) {
	const j = api.jscodeshift;
	const root = j(file.source);

	const namespaces: { [key: string]: any } = {};
	const aliases: { [key: string]: string } = {};
	let matches = new Map();

	root.find(j.ImportDeclaration).replaceWith((path: Path) => {
		const { source } = path.node;
		if (match.test(source.value)) {
			const module = (match.exec(source.value) as string[])[1];
			matches.set(module, true);

			const [specifier] = path.value.specifiers;
			if (specifier.type === 'ImportNamespaceSpecifier') {
				namespaces[specifier.local.name] = module;
			} else if (specifier.imported) {
				aliases[specifier.local.name] = specifier.imported.name;
			}

			if (matches.size > 1) {
				return;
			}

			return j.importDeclaration([j.importNamespaceSpecifier(j.identifier('Globalize'))], j.literal('globalize'));
		}
		return path.node;
	});

	root.find(j.CallExpression).replaceWith((path: Path) => {
		const { arguments: args, callee } = path.value;
		const ns = callee.object ? callee.object.name : callee.name;
		let methodName = callee.name || (callee.property && callee.property.name);
		if (aliases[methodName]) {
			methodName = aliases[methodName];
		}
		if (methodName in methodMap) {
			const { module: moduleName, arity, renameTo } = methodMap[methodName];
			if (matches.has(moduleName) && (!callee.object || callee.object.name in namespaces)) {
				let par = path.parentPath;
				while (par) {
					if (par.value.params && par.value.params.some(({ name }: { name: string }) => name === ns)) {
						path.node.comments = [
							j.commentLine(` TODO @dojo/cli-upgrade-app: Unmodified: "${ns}" is shadowed.`)
						];
						return path.node;
					}
					par = par.parentPath;
				}

				const replacement = mappersByArity[arity](j, renameTo, args);
				if (!replacement) {
					path.node.comments = [
						j.commentLine(
							' TODO @dojo/cli-upgrade-app: Cannot verify whether the final argument is a locale or options object'
						)
					];
					return path.node;
				}
				return replacement;
			}
		}
		return path.node;
	});

	return root.toSource();
}
