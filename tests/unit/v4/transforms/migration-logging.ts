import {
	getImport,
	getImportedLocals,
	getDeclaratorValue,
	getArgument
} from '../../../../src/v4/transforms/migration-logging';
import MockModule from '../../../support/MockModule';
import * as sinon from 'sinon';

const j = require('jscodeshift').withParser('typescript');

const { describe, it, beforeEach, afterEach } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

describe('v4/module-logging', () => {
	describe('getImport', () => {
		it('returns a Path object when the import is found', () => {
			const source = `import Router from '@dojo/framework/routing/Router';`;
			const value = getImport(j, source, '@dojo/framework/routing/Router');
			assert.isDefined(value);
		});

		it('returns undefined when the import is not found', () => {
			const source = `import Router from '@dojo/framework/routing/Router';`;
			const value = getImport(j, source, 'some-import');
			assert.isUndefined(value);
		});
	});

	describe('getImportedLocals', () => {
		const getPath = (root: string) =>
			j(root)
				.find(j.ImportDeclaration)
				.paths()[0];

		it('should return the local variable name for an import', () => {
			const source = `import A, { B, C as D } from 'some-import';`;
			const locals = getImportedLocals(getPath(source)).reduce(
				(obj, value) => {
					obj[value.name] = { isDefault: value.isDefault };
					return obj;
				},
				{} as any
			);

			assert.property(locals, 'A');
			assert.property(locals, 'B');
			assert.notProperty(locals, 'C', 'C should be renamed to D locally');
			assert.property(locals, 'D');

			assert.isTrue(locals.A.isDefault, 'A should be the default import');
		});
	});

	describe('getDeclaratorValue', () => {
		it('returns the value Path for the provided identifier', () => {
			const source = `
			const message = 'hello world';
			`;

			const arg = getDeclaratorValue(j, source, 'message');

			assert.strictEqual(arg.type, 'StringLiteral');
			assert.strictEqual(arg.value, 'hello world');
		});

		it('returns undefined if the value is not found', () => {
			const source = `
			const message = 'hello world';
			`;

			const arg = getDeclaratorValue(j, source, 'notFound');

			assert.isUndefined(arg);
		});
	});

	describe('getArgument', () => {
		it('returns the Path related to the argument at the provided index', () => {
			const source = `new TestClass('hello world', true);`;
			const path = j(source)
				.find(j.NewExpression, { callee: { name: 'TestClass' } })
				.paths()[0];

			const firstArg = getArgument(j, source, path, 0);
			assert.strictEqual(firstArg.type, 'StringLiteral');
			assert.strictEqual(firstArg.value, 'hello world');

			const secondArg = getArgument(j, source, path, 1);
			assert.strictEqual(secondArg.type, 'BooleanLiteral');
			assert.strictEqual(secondArg.value, true);
		});

		it('returns undefined if there is not argument at the provided index', () => {
			const source = `new TestClass();`;
			const path = j(source)
				.find(j.NewExpression, { callee: { name: 'TestClass' } })
				.paths()[0];
			const firstArg = getArgument(j, source, path, 0);
			assert.isUndefined(firstArg, 'Should return undfined as there is no argument');
		});

		it('should return the actual value, even when a varaibale is provided', () => {
			const source = `
			const message = 'hello world';

			sayHello(message);
			`;
			const path = j(source)
				.find(j.CallExpression, { callee: { name: 'sayHello' } })
				.paths()[0];
			const arg = getArgument(j, source, path, 0);

			assert.strictEqual(arg.type, 'StringLiteral');
			assert.strictEqual(arg.value, 'hello world');
		});
	});

	describe('the transform', () => {
		let mockModule: MockModule;
		let sandbox: sinon.SinonSandbox;
		let loggerStub: sinon.SinonStub;
		let transform: Function;

		beforeEach(() => {
			sandbox = sinon.sandbox.create();
			mockModule = new MockModule('../../../../src/v4/transforms/migration-logging', require);
			mockModule.dependencies(['../../logger']);
			loggerStub = sandbox.stub();
			mockModule.getMock('../../logger').default.register = () => loggerStub;
			transform = mockModule.getModuleUnderTest().default;
		});

		afterEach(() => {
			sandbox.restore();
			mockModule.destroy();
		});

		it('is a function', () => {
			assert.isFunction(transform);
		});

		it('should log the file because it is using the ProjectorMixin', () => {
			const source = `import { ProjectorMixin } from '@dojo/framework/widget-core/mixins/Projector';`;
			transform({ source, path: 'test.ts' }, { jscodeshift: j, stats: () => {} });
			assert.isTrue(loggerStub.calledOnce, 'the logger shold have been called');
		});

		it('should log the file because it is using the Outlet', () => {
			const source = `import Outlet from '@dojo/framework/routing/Outlet';`;
			transform({ source, path: 'test.ts' }, { jscodeshift: j, stats: () => {} });
			assert.isTrue(loggerStub.calledOnce, 'the logger shold have been called');
		});

		it('should log the file because it is importing the Router and passing onEnter to the config', () => {
			const source = `
			import Router from '@dojo/framework/routing/Router';

			const router = new Router([{
				path: 'testpath',
				outlet: 'testoutlet',
				onEnter() {
				}
			}]);
			`;
			transform({ source, path: 'test.ts' }, { jscodeshift: j, stats: () => {} });
			assert.isTrue(loggerStub.calledOnce, 'the logger shold have been called');
		});

		it('should log the file because it is importing the Router and passing onExit to the config', () => {
			const source = `
			import Router from '@dojo/framework/routing/Router';

			const router = new Router([{
				path: 'testpath',
				outlet: 'testoutlet',
				onExit() {
				}
			}]);
			`;
			transform({ source, path: 'test.ts' }, { jscodeshift: j, stats: () => {} });
			assert.isTrue(loggerStub.calledOnce, 'the logger shold have been called');
		});

		it('should log the file because it is importing the Router and passing onEnter and onExit to the config variable passed to the Router constructor', () => {
			const source = `
			import Router from '@dojo/framework/routing/Router';

			const config = [{
				path: 'testpath',
				outlet: 'testoutlet',
				onEnter() {
				},
				onExit() {
				}
			}];

			const router = new Router(config);
			`;
			transform({ source, path: 'test.ts' }, { jscodeshift: j, stats: () => {} });
			assert.isTrue(loggerStub.calledOnce, 'the logger shold have been called');
		});

		it('should log the file for each of the issues found', () => {
			const source = `
			import { ProjectorMixin } from '@dojo/framework/widget-core/mixins/Projector';
			import Outlet from '@dojo/framework/routing/Outlet';
			import Router from '@dojo/framework/routing/Router';

			export default Outlet(
				{
					index: MyIndexWidget,
					main: MyMainWidget
				},
				'outlet-id',
				{
					mapParams: (matchDetails) => {
						return { id: matchDetails.param.id };
					}
				}
			);

			const routerA = new Router([{
				path: 'testpath',
				outlet: 'testoutlet',
				onEnter() {
				},
				onExit() {
				}
			}]);

			routerA.setPath('hello');

			const config = [{
				path: 'testpath',
				outlet: 'testoutlet',
				onEnter() {
				},
				onExit() {
				}
			}];

			const routerB = new Router(config);
			`;

			transform({ source, path: 'test.ts' }, { jscodeshift: j, stats: () => {} });
			assert.strictEqual(loggerStub.callCount, 3, 'the logger shold have been called once for each issue');
		});
	});
});
