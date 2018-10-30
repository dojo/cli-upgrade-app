import MockModule from '../support/MockModule';
import * as sinon from 'sinon';

const { describe, it, beforeEach, afterEach } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

describe('util', () => {
	let mockModule: MockModule;
	let spawnStub: any;
	let sandbox: sinon.SinonSandbox;
	let util: any;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../src/util', require);
		mockModule.dependencies(['ora', 'cross-spawn']);
		util = mockModule.getModuleUnderTest();
	});

	afterEach(() => {
		sandbox.restore();
		mockModule.destroy();
	});

	describe('run', () => {
		let stdoutStub: sinon.SinonStub;
		let stderrStub: sinon.SinonStub;
		let onCloseStub: sinon.SinonStub;

		function closeStreamAsync(code: number = 0): void {
			stderrStub.callsArgWithAsync(1, Buffer.from('stderr', 'utf8'));
			stdoutStub.callsArgWithAsync(1, Buffer.from('stdout', 'utf8'));
			onCloseStub.callsArgWithAsync(1, code);
		}

		beforeEach(() => {
			stdoutStub = sandbox.stub();
			stderrStub = sandbox.stub();
			onCloseStub = sandbox.stub();
			spawnStub = mockModule.getMock('cross-spawn').spawn.returns({
				on: onCloseStub,
				stdout: { on: stdoutStub },
				stderr: { on: stderrStub }
			});
		});

		it('passes the correct arguments to spawn', async () => {
			const args = ['ls', ['-la']];
			closeStreamAsync();
			await util.run(...args);
			assert.isTrue(spawnStub.calledWith(...args));
		});

		it('passes output from stdout on success', async () => {
			closeStreamAsync();
			const result = await util.run('ls');
			assert.strictEqual(result, 'stdout');
		});

		it('passes output from stdout on failure when resolveOnErrors is true', async () => {
			closeStreamAsync(1);
			const result = await util.run('ls', ['la'], true);
			assert.strictEqual(result, 'stdout');
		});

		it('rejects with stderr message', function(this: any) {
			const dfd = this.async();
			closeStreamAsync(1);
			return util.run('ls', ['la']).catch(
				dfd.callback((error: string) => {
					assert.strictEqual(error, 'stderr');
				})
			);
		});
	});

	describe('runTask', () => {
		let oraStub: sinon.SinonStub;

		beforeEach(() => {
			oraStub = mockModule.getMock('ora').promise;
		});

		it('calls ora for the task to be run when a Promise is passed', async () => {
			await util.runTask('test', Promise.resolve());
			assert.isTrue(oraStub.called);
		});

		it('calls ora for the task to be run when a function is passed', async () => {
			const stub = sandbox.stub().resolves();
			await util.runTask('test', () => stub());
			assert.isTrue(oraStub.called);
			assert.isTrue(stub.called);
		});

		it('does not call the function when "dry" is passed', async () => {
			const stub = sandbox.stub().resolves();
			await util.runTask('test', () => stub(), true);
			assert.isTrue(oraStub.called);
			assert.isFalse(stub.called);
		});
	});

	describe('getLineEndings', () => {
		it('correctly finds CRLF line endings', () => {
			const source = 'hello\r\nworld\r\ntest';
			const result = util.getLineEndings(source);
			assert.strictEqual(result, '\r\n');
		});
		it('correctly finds CR line endings', () => {
			const source = 'hello\rworld\rtest';
			const result = util.getLineEndings(source);
			assert.strictEqual(result, '\r');
		});
		it('correctly finds LF line endings', () => {
			const source = 'hello\nworld\ntest';
			const result = util.getLineEndings(source);
			assert.strictEqual(result, '\n');
		});
		it('returns undefined if line endings are not found', () => {
			const source = 'hello world test';
			const result = util.getLineEndings(source);
			assert.isUndefined(result);
		});
	});
});
