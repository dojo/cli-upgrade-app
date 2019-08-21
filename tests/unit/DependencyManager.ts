import DependencyManager from '../../src/DependencyManager';
import MockModule from '../support/MockModule';
import { resolve } from 'path';
import * as sinon from 'sinon';

const { describe, it, beforeEach, afterEach } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

const packageString = `
{
  "name": "package",
  "version": "1.2.3",
  "description": "",
  "main": "index.js",
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
	"some-package": "1.0.0",
	"@dojo/core": "^2.0.0",
	"@dojo/widget-core": "^2.0.0",
	"@dojo/test-extras": "^3.0.0"
  },
  "devDependencies": {
	"@dojo/cli-upgrade-app": "latest",
	"@dojo/cli-build-app": "^2.0.0",
	"some-other-package": "0.0.1"
  }
}
`;

const packageJson = JSON.parse(packageString);

describe('DependencyManager', () => {
	let depManager: DependencyManager;
	let mockModule: MockModule;
	let runStub: any;
	let readFileStub: any;
	let sandbox: sinon.SinonSandbox;
	let MockDependencyManager: typeof DependencyManager;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../src/DependencyManager', require);
		mockModule.dependencies(['./util', 'fs']);
		runStub = mockModule.getMock('./util').run;
		readFileStub = mockModule.getMock('fs').readFileSync.returns(packageString);
		MockDependencyManager = mockModule.getModuleUnderTest().default;
		depManager = new MockDependencyManager();
	});

	afterEach(() => {
		sandbox.restore();
		mockModule.destroy();
	});

	describe('instantiation', () => {
		it('defaults to a relative package.json', () => {
			depManager = new MockDependencyManager();
			assert.strictEqual(depManager.path, resolve(process.cwd(), 'package.json'));
			assert.isTrue(readFileStub.calledOnce);
		});

		it('provides for a custom path to be provided', () => {
			const path = 'path/to/somewhere.json';
			depManager = new MockDependencyManager(path);
			assert.strictEqual(depManager.path, path);
		});

		it('throws an error if the path is not valid', () => {
			readFileStub.throws('');
			assert.throws(() => {
				new MockDependencyManager('fake');
			}, 'Unable to load package.json. Aborting upgrade.');
		});
	});

	it('returns the current package version', () => {
		const version = depManager.getPackageVersion();
		assert.strictEqual(version, packageJson.version);
	});

	it('should return the minimum Dojo version based on installed Dojo packages', () => {
		const version = depManager.getDojoVersion();
		assert.strictEqual(version, 2);
	});

	it('should construct a correct install command for single pacakge installs', async () => {
		const toInstall = '@dojo/framework';
		const expectedArgs = ['npm', ['install', toInstall]];
		await depManager.install(toInstall);
		assert.isTrue(runStub.calledWith(...expectedArgs));
	});

	it('should correctly construct install commands for dev dependencies', async () => {
		const toInstall = '@dojo/cli-upgrade-app';
		const expectedArgs = ['npm', ['install', toInstall, '--save-dev']];
		await depManager.install(toInstall, true);
		assert.isTrue(runStub.calledWith(...expectedArgs));
	});

	it('can install more than one dependency at a time', async () => {
		const toInstall = ['@dojo/core', '@dojo/widget-core'];
		const expectedArgs = ['npm', ['install', ...toInstall]];
		await depManager.install(toInstall);
		assert.isTrue(runStub.calledWith(...expectedArgs));
	});

	it('should do nothing if no packages are provided to install', async () => {
		await depManager.install([]);
		assert.isTrue(runStub.notCalled);
	});

	it('can uninstall a package', async () => {
		const toUninstall = '@dojo/core';
		const expectedArgs = ['npm', ['uninstall', toUninstall]];
		await depManager.uninstall(toUninstall);
		assert.isTrue(runStub.calledWith(...expectedArgs));
	});

	it('can uninstall more than one package at a time', async () => {
		const toUninstall = ['@dojo/core', '@dojo/widget-core'];
		const expectedArgs = ['npm', ['uninstall', ...toUninstall]];
		await depManager.uninstall(toUninstall);
		assert.isTrue(runStub.calledWith(...expectedArgs));
	});

	it('should do nothing if no packages are provided to uninstall', async () => {
		await depManager.uninstall([]);
		assert.isTrue(runStub.notCalled);
	});

	it('can update all Dojo dependencies to a specified version', async () => {
		const stub = sandbox.stub(depManager, 'install').resolves();
		const deps = ['@dojo/core', '@dojo/widget-core', '@dojo/test-extras'];
		const devDeps = ['@dojo/cli-build-app'];
		const version = '^4.0.0';
		await depManager.updateDependencies(version);
		assert.isTrue(stub.calledTwice);
		assert.isTrue(stub.firstCall.calledWith(deps.map((dep) => `${dep}@${version}`)));
		assert.isTrue(stub.secondCall.calledWith(devDeps.map((dep) => `${dep}@${version}`), true));
	});

	it('can return a list of all dependencies dependencies', async () => {
		const expected = [
			{ name: 'some-package', version: '1.0.0', isDevDependency: false, major: 1, minor: 0, patch: 0 },
			{ name: '@dojo/core', version: '^2.0.0', isDevDependency: false, major: 2, minor: 0, patch: 0 },
			{ name: '@dojo/widget-core', version: '^2.0.0', isDevDependency: false, major: 2, minor: 0, patch: 0 },
			{ name: '@dojo/test-extras', version: '^3.0.0', isDevDependency: false, major: 3, minor: 0, patch: 0 },
			{ name: '@dojo/cli-build-app', version: '^2.0.0', isDevDependency: true, major: 2, minor: 0, patch: 0 },
			{ name: 'some-other-package', version: '0.0.1', isDevDependency: true, major: 0, minor: 0, patch: 1 }
		];
		const deps = await depManager.getDependencies();
		expected.forEach((dep) => assert.deepInclude(deps, dep));
	});
});
