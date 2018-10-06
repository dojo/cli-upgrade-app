import { resolve } from 'path';
import { VersionConfig } from '../interfaces';

export const config: VersionConfig = {
	version: 3,
	transforms: [
		{
			name: 'Convert to framework paths',
			path: resolve(__dirname, 'transforms', 'module-transform-to-framework.js')
		}
	],
	dependencies: {
		add: ['@dojo/framework'],
		remove: [
			'@dojo/core',
			'@dojo/has',
			'@dojo/routing',
			'@dojo/i18n',
			'@dojo/shim',
			'@dojo/stores',
			'@dojo/widget-core',
			'@dojo/test-extras'
		],
		updateVersion: '^3.0.0'
	},

	run() {}
};

export default config;
