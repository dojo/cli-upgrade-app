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

export default function(file: any, api: any) {
	const j = api.jscodeshift;
	const root = j(file.source);

	function findImport(name: string, source: any = root) {
		return source
			.find(j.ImportDeclaration)
			.filter((path: any) => path.node.source.value === name)
			.paths()[0];
	}

	function getImportedLocals(path: any) {
		return path.value.specifiers.map((specifier: any) => ({
			name: specifier.local.name,
			isDefault: specifier.type === 'ImportDefaultSpecifier'
		}));
	}

	function getArgument(path: any, argNum = 0) {
		const arg = path.value.arguments[argNum];
		if (arg && arg.name) {
			return root.find(j.VariableDeclarator, { id: { name: arg.name } }).paths()[0].value.init;
		}

		return arg;
	}

	// log the path if the location is importing the ProjectorMixin
	if (!!findImport('@dojo/framework/widget-core/mixins/Projector')) {
		projectorLog(file.path);
	}

	// log the path if the loction is importing outlets
	if (!!findImport('@dojo/framework/routing/Outlet')) {
		outletLog(file.path);
	}

	const routerPath = findImport('@dojo/framework/routing/Router');
	if (!!routerPath) {
		const { name: routerName } = getImportedLocals(routerPath).reduce(
			(name: string, path: any) => (path.isDefault ? path.name : 'Router')
		);
		root.find(j.NewExpression, { callee: { name: routerName } }).forEach((init: any) => {
			const arg = getArgument(init, 0);
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
