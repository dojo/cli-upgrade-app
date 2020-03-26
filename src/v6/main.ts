import { VersionConfig } from '../interfaces';
import { resolve } from 'path';

export const config: VersionConfig = {
	version: 6,
	transforms: [
		{
			name: 'Refactor framework/widget-core to framework/core',
			path: resolve(__dirname, 'transforms', 'core-refactor.js')
		}
	],
	dependencies: {
		add: ['typescript@3.4.5'],
		remove: [],
		updateVersion: '^6.0.0'
	},

	postTransform() {
		console.log(
			'\n\nDojo 6 requires TypeScript version 3.4.5. Due to this upgrade, you may need to resolve some compilation errors manually.\n\n'
		);
	}
};
