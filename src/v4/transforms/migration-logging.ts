import chalk from 'chalk';
import logger from '../Logger';

const warningSymbol = process.platform === 'win32' ? '!!' : '⚠';

const projectorMessage = `${chalk.yellow(
	`${warningSymbol} The ProjectorMixin has been discontinued. Please consider replacing your usage of it.`
)}

For more information about this change, please refer to the Dojo 4 Migration Guide.

ProjectorMixin is used in the following files:
`.trim();
const projectorLog = logger.registerLogger('projectorMixin', projectorMessage);

const outletMessage = `
${chalk.yellow(`${warningSymbol}  Outlet has changed`)}

Outlet has been changed from ma higher order component to a standard widget that accepts a render property to define what output when the outlet has matched.

Outlet has been detected in the following files:
`.trim();
const outletLog = logger.registerLogger('outlet', outletMessage);

const routingMessage = `
${chalk.yellow(`${warningSymbol}  onEnter and onExit properties have been removed from the routing configuration`)}

The motivation behind this changes is to make the route configuration more static and discourage the use of dynamic logic or introduction of side effects. In the long term, this will allow Dojo to statically analyze route configuration and perform automatic code-splitting based on the routes during an application build.

Registering an action when an outlet is entered or exited is still possible by listening to an outlet event on the router instance.

router.on('outlet', (context, action) => {
	if (context.id === 'my-outlet' && action === 'enter') {
		// do something when \`my-outlet\` is entered.
	}
});

onEnter and onExit usage has been detected in the following files:
`.trim();
const routingLog = logger.registerLogger('routing', routingMessage);

type Collection = any;
type JSCodeShift = any;
type Path = any;
type Expression = any;

export function getImport(j: JSCodeShift, root: string | Collection, name: string): Path {
	return (typeof root === 'string' ? j(root) : root)
		.find(j.ImportDeclaration)
		.filter((path: any) => path.node.source.value === name)
		.paths()[0];
}

export function getImportedLocals(path: Path): { name: string; isDefault: boolean }[] {
	return path.value.specifiers.map((specifier: any) => ({
		name: specifier.local.name,
		isDefault: specifier.type === 'importDefaultSpecifier'
	}));
}

export function getArgument(j: JSCodeShift, root: string | Collection, path: Path, argNum: number = 0): Expression {
	const arg = path.value.arguments[argNum];

	if (arg && arg.name) {
		// the argument is a named identifier, so go find the declarator value
		return getDeclaratorValue(j, root, arg.name);
	}

	return arg;
}

export function getDeclaratorValue(j: JSCodeShift, root: string | Collection, name: string): Expression {
	return (typeof root === 'string' ? j(root) : root)
		.find(j.VariableDeclarator, {
			id: { name }
		})
		.paths()[0].value.init;
}

export default function(file: any, api: any) {
	const j = api.jscodeshift;
	const root = j(file.source);

	// log the path if the location is importing the ProjectorMixin
	if (!!getImport(j, root, '@dojo/framework/widget-core/mixins/Projector')) {
		projectorLog(file.path);
	}

	// log the path if the loction is importing outlets
	if (!!getImport(j, root, '@dojo/framework/routing/Outlet')) {
		outletLog(file.path);
	}

	const routerPath = getImport(j, root, '@dojo/framework/routing/Router');

	if (!!routerPath) {
		const { name: routerName } = getImportedLocals(routerPath).reduce(
			(value: { name: string; isDefault: boolean; }, path: Path) => (path.isDefault ? path : value)
		);
		root.find(j.NewExpression, { callee: { name: routerName } }).forEach((init: any) => {
			const arg = getArgument(j, root, init, 0);
			if (
				arg.elements.some(({ properties }: any) =>
					properties.some(({ key: { name } }: any) => name === 'onEnter' || name === 'onExit')
				)
			) {
				routingLog(file.path);
			}
		});
	}
}
