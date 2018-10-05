import loggerSingleton, { LogService } from '../../src/logger';
import * as sinon from 'sinon';

const { describe, it, beforeEach, afterEach } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

describe('LogService', () => {
	let logger: LogService;
	let sandbox: sinon.SinonSandbox;
	let logStub: sinon.SinonStub;

	beforeEach(() => {
		logger = new LogService();
		sandbox = sinon.sandbox.create();
		logStub = sandbox.stub(console, 'log');
	});

	afterEach(() => {
		sandbox.restore();
	});

	it('should provide a sinlgeton instance of the logger', () => {
		assert.instanceOf(loggerSingleton, LogService);
	});

	it('returns a log function when registering a new log section', () => {
		const retValue = logger.register('test', 'test message');
		assert.isFunction(retValue);
	});

	it('logs out the logged messages when flushed', () => {
		const log = logger.register('test', 'test message');
		log('this is a test');
		logger.flush();
		assert.isTrue(logStub.calledOnce);
	});
});
