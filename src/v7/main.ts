import { resolve } from 'path';
import { VersionConfig } from '../interfaces';

export const config: VersionConfig = {
	version: 6,
	transforms: [
		{
			name: 'Replace Dojo i18n formatters with Globalize.js',
			path: resolve(__dirname, 'transforms', 'use-globalize.js')
		}
	],

	dependencies: {
		add: [],
		remove: [],
		updateVersion: '^7.0.0'
	},

	postTransform() {}
};

export default config;
