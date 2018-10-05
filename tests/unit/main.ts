import { UpgradeCommand } from '../../src/main';
import DependencyManager from '../../src/DependencyManager';
import MockModule from '../support/MockModule';
import * as sinon from 'sinon';

const { describe, it, beforeEach, afterEach } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

describe('main', () => {
	let mockModule: MockModule;
	let command: UpgradeCommand;
	let sandbox: sinon.SinonSandbox;
	let promptStub: sinon.SinonStub;
	let runTaskStub: sinon.SinonStub;
	let codemodStub: sinon.SinonStub;
	let getDojoVersionStub: sinon.SinonStub;
	let uninstallStub: sinon.SinonStub;
	let installStub: sinon.SinonStub;
	let updateDependenciesStub: sinon.SinonStub;
	let mockDepManager: any;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../src/main', require);
		mockModule.dependencies(['./util', 'jscodeshift/src/Runner', 'inquirer']);
		runTaskStub = mockModule.getMock('./util').runTask;
		codemodStub = mockModule.getMock('jscodeshift/src/Runner').run.resolves();
		promptStub = mockModule.getMock('inquirer').prompt;
		mockDepManager = sinon.createStubInstance(DependencyManager);
		getDojoVersionStub = mockDepManager.getDojoVersion;
		uninstallStub = mockDepManager.uninstall;
		installStub = mockDepManager.install;
		updateDependenciesStub = mockDepManager.updateDependencies;
		command = new (mockModule.getModuleUnderTest()).UpgradeCommand(mockDepManager);

		// default behavior
		getDojoVersionStub.returns(2);
		uninstallStub.resolves();
		installStub.resolves();
		updateDependenciesStub.resolves();

		sandbox.stub(console, 'log');
		sandbox.stub(console, 'error');
	});

	afterEach(() => {
		sandbox.restore();
		mockModule.destroy();
	});

	it('should run with dry option', async () => {
		promptStub.resolves(true);
		await command.run({} as any, { pattern: '*.noop', dry: true });
		assert.include(codemodStub.getCall(0).args[2], { dry: true });
	});

	it('should run with pattern option', async () => {
		promptStub.resolves(true);
		await command.run({} as any, { pattern: 'src/main.ts', dry: true });
		assert.deepEqual(codemodStub.getCall(0).args[1], ['src/main.ts']);
	});

	it('runs a version-specific config', async () => {
		sandbox.stub(command, 'getConfigs').resolves([
			{
				version: 4,
				transforms: ['test/transform.js'],
				dependencies: {
					add: ['@dojo/frameowrk'],
					remove: ['@dojo/core', '@dojo/widget-core']
				}
			}
		]);

		promptStub.resolves(true);

		await command.run({} as any, { pattern: 'src/main.ts', dry: false });
		assert.strictEqual(codemodStub.getCall(0).args[0], 'test/transform.js', 'failed to send args to transform');
		assert.strictEqual(runTaskStub.callCount, 3);
	});

	it("won't call install or uninstall if there is nothing to do", async () => {
		sandbox.stub(command, 'getConfigs').resolves([
			{
				version: 4,
				transforms: ['test/transform.js'],
				dependencies: {
					add: [],
					remove: []
				}
			}
		]);

		promptStub.resolves(true);

		await command.run({} as any, { pattern: 'src/main.ts', dry: false });
		assert.strictEqual(codemodStub.getCall(0).args[0], 'test/transform.js', 'failed to send args to transform');
		assert.strictEqual(runTaskStub.callCount, 1);
	});

	it('does not updateDojoDependencies for versions except for the latest', async () => {
		sandbox.stub(command, 'getConfigs').resolves([
			{
				version: 2,
				transforms: ['test/transform.js'],
				dependencies: {
					add: [],
					remove: []
				}
			}
		]);

		promptStub.resolves(true);

		await command.run({} as any, { pattern: 'src/main.ts', dry: false });
		assert.strictEqual(codemodStub.getCall(0).args[0], 'test/transform.js', 'failed to send args to transform');
		assert.strictEqual(runTaskStub.callCount, 0);
	});

	it('forces specific settings if loggingOnly is set when running codemods', async () => {
		sandbox.stub(command, 'getConfigs').resolves([
			{
				version: 2,
				transforms: [{ path: 'test/transform.js', loggingOnly: true }],
				dependencies: {
					add: [],
					remove: []
				}
			}
		]);

		promptStub.resolves(true);

		await command.run({} as any, { pattern: 'src/main.ts', dry: false });
		const config = codemodStub.getCall(0).args[2];
		assert.isTrue(config.dry);
		assert.isTrue(config.silent);
	});

	it('should not run when user cancels prompt', async () => {
		promptStub.resolves(false);
		let message = '';
		try {
			await command.run({} as any, { pattern: 'src/main.ts', dry: false });
		} catch (e) {
			message = e.message;
		}

		assert.isTrue(codemodStub.notCalled);
		assert.strictEqual(message, 'Aborting upgrade.');
	});

	it("calls a config's run method if it exists", async () => {
		const runStub = sandbox.stub();
		sandbox.stub(command, 'getConfigs').resolves([
			{
				version: 2,
				run: runStub
			}
		]);

		promptStub.resolves(true);
		await command.run({} as any, { pattern: 'src/main.ts', dry: false });
		assert.isTrue(runStub.called);
	});

	it("calls a config's postTransform method if it exists", async () => {
		const runStub = sandbox.stub();
		sandbox.stub(command, 'getConfigs').resolves([
			{
				version: 2,
				postTransform: runStub
			}
		]);

		promptStub.resolves(true);
		await command.run({} as any, { pattern: 'src/main.ts', dry: false });
		assert.isTrue(runStub.called);
	});
});
