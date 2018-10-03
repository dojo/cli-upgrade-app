import { resolve } from 'path';
import { VersionConfig } from '../interfaces';

export const config: VersionConfig = {
	version: 4,
	transforms: [resolve(__dirname, 'transforms', 'module-transform-legacy-core.js')],
	dependencies: {
		add: [],
		remove: [],
		updateVersion: '^4.0.0'
	},

	run() {}
};

export default config;
