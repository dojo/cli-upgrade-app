import { resolve } from 'path';
import { VersionConfig } from '../interfaces';

export const config: VersionConfig = {
	version: 4,
	transforms: [
		{
			name: 'Move deleted core dependencies into codebase',
			path: resolve(__dirname, 'transforms', 'replace-legacy-core.js')
		},
		{
			name: 'Log about v4 changes',
			path: resolve(__dirname, 'transforms', 'migration-logging.js'),
			loggingOnly: true
		}
	],

	dependencies: {
		add: [],
		remove: [],
		updateVersion: '^4.0.0'
	},

	postTransform() {
		console.log(
			'\n\nFor more information about changes in Dojo 4, please check out the migration guide at https://github.com/dojo/framework/blob/master/docs/V4-Migration-Guide.md\n\n'
		);
	}
};

export default config;
