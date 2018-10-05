import chalk from 'chalk';
import logger from '../../logger';

const warningSymbol = process.platform === 'win32' ? '!!' : '⚠';

const message = `
${chalk.yellow(`${warningSymbol}  Dojo 4 Breaking Changes`)}

Dojo 4 introduces a number of breaking changes, some of which have been detected in your project.
Please refer to the Dojo 4 Migration Guide for more information

<LINK TO MIGRATION GUIDE>

`.trim();
const log = logger.register('v4-changes', message);

type Collection = any;
type JSCodeShift = any;
type Path = any;
type Expression = any;

export function getImport(j: JSCodeShift, root: string | Collection, name: string): Path | void {
	return (typeof root === 'string' ? j(root) : root)
		.find(j.ImportDeclaration)
		.filter((path: any) => path.node.source.value === name)
		.paths()[0];
}

export function getImportedLocals(path: Path): { name: string; isDefault: boolean }[] {
	return path.value.specifiers.map((specifier: any) => ({
		name: specifier.local.name,
		isDefault: specifier.type === 'ImportDefaultSpecifier'
	}));
}

export function getDeclaratorValue(j: JSCodeShift, root: string | Collection, name: string): Expression {
	const path = (typeof root === 'string' ? j(root) : root)
		.find(j.VariableDeclarator, {
			id: { name }
		})
		.paths()[0];
	return path && path.value.init;
}

export function getArgument(j: JSCodeShift, root: string | Collection, path: Path, argNum: number = 0): Expression {
	const arg = path.value.arguments[argNum];

	if (arg && arg.name) {
		// the argument is a named identifier, so go find the declarator value
		return getDeclaratorValue(j, root, arg.name);
	}

	return arg;
}

export default function(file: any, api: any) {
	const j = api.jscodeshift;
	const root = j(file.source);

	// log the path if the location is importing the ProjectorMixin
	if (!!getImport(j, root, '@dojo/framework/widget-core/mixins/Projector')) {
		log(file.path);
	}

	// log the path if the loction is importing outlets
	if (!!getImport(j, root, '@dojo/framework/routing/Outlet')) {
		log(file.path);
	}

	const routerPath = getImport(j, root, '@dojo/framework/routing/Router');

	if (!!routerPath) {
		const { name: routerName } = getImportedLocals(routerPath).reduce(
			(value: { name: string; isDefault: boolean }, path: Path) => (path.isDefault ? path : value)
		);
		const found = root.find(j.NewExpression, { callee: { name: routerName } }).some((init: any) => {
			const arg = getArgument(j, root, init, 0);
			return arg.elements.some(({ properties }: any) =>
				properties.some(({ key: { name } }: any) => name === 'onEnter' || name === 'onExit')
			);
		});

		if (found) {
			log(file.path);
		}
	}
}
