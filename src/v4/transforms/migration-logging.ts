import chalk from 'chalk';
import { error, warning } from 'log-symbols';

function log(message: string, type: 'warning' | 'error' = 'warning'): void {
	const icon = type === 'error' ? chalk.bold.red(error) : chalk.bold.yellow(warning);
	console.log(`${icon}  ${message}`);
}

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
		log(`${file.path}: Use of ProjectorMixin is deprecated.`);
	}

	// log the path if the loction is importing outlets
	const outletPath = getImport(j, root, '@dojo/framework/routing/Outlet');
	if (!!outletPath) {
		const { name: outletName } = getImportedLocals(outletPath).reduce(
			(value: { name: string; isDefault: boolean }, path: Path) => (path.isDefault ? path : value)
		);
		if (root.find(j.CallExpression, { callee: { name: outletName } }).paths().length) {
			log(`${file.path}: Outlet is no longer a higher order component.`, 'error');
		}
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
			log(`${file.path}: onEnter/onExit router config properties are no longer supported.`, 'error');
		}
	}
}
