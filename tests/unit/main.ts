import command from '../../src/main';

const { describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

describe('main', () => {
	it('run with dry option', () => {
		let output: any = {};
		command.__runner = {
			run(transform: string, path: string, opts: any) {
				output = opts;
			}
		};
		command.run({} as any, { pattern: '*.noop', dry: true });
		assert.isTrue(output.dry);
	});
	it('run with pattern option', () => {
		let output: any = {};
		command.__runner = {
			run(transform: string, path: string, opts: any) {
				output = opts;
			}
		};
		command.run({} as any, { pattern: 'src/main.ts', dry: false });
		assert.deepEqual(output.path, [ 'src/main.ts' ]);
	});
});
