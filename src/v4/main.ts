import { resolve } from 'path';
import { VersionConfig } from '../interfaces';
import logger from '../Logger';

export const config: VersionConfig = {
	version: 4,
	transforms: [
		resolve(__dirname, 'transforms', 'replace-legacy-core.js'),
		{ path: resolve(__dirname, 'transforms', 'migration-logging.js'), loggingOnly: true }
	],
	dependencies: {
		add: [],
		remove: [],
		updateVersion: '^4.0.0'
	},

	postTransform() {
		logger.flush();
	},

	run() {}
};

export default config;
