import command from '../../src/main';
import * as inquirer from 'inquirer';

const { after, describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

const prompt = inquirer.prompt;
const promptStub = (run: boolean) => {
	(inquirer as any).prompt = () => Promise.resolve({ run });
};
const promptRestore = () => {
	(inquirer as any).prompt = prompt;
};

describe('main', () => {
	after(() => {
		promptRestore();
	});

	it('should run with dry option', async () => {
		promptStub(true);
		let output: any = {};
		command.__runner = {
			run(transform: string, path: string, opts: any) {
				output = opts;
			}
		};
		await command.run({} as any, { pattern: '*.noop', dry: true });
		assert.isTrue(output.dry);
	});

	it('should run with pattern option', async () => {
		promptStub(true);
		let output: any = {};
		command.__runner = {
			run(transform: string, path: string, opts: any) {
				output = opts;
			}
		};
		await command.run({} as any, { pattern: 'src/main.ts', dry: false });
		assert.deepEqual(output.path, ['src/main.ts']);
	});

	it('should not run when user cancels prompt', async () => {
		promptStub(false);
		let called = false;
		let message: undefined | string;
		command.__runner = {
			run(transform: string, path: string, opts: any) {
				called = true;
			}
		};
		try {
			await command.run({} as any, { pattern: 'src/main.ts', dry: false });
		} catch (e) {
			message = e.message;
		}
		assert.isFalse(called);
		assert.equal(message, 'Aborting upgrade');
	});
});
