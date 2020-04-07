import { VersionConfig } from '../interfaces';
import { resolve } from 'path';

export const config: VersionConfig = {
	version: 7,
	transforms: [
		{
			name: 'Refactor framework/testing to framework/testing/harness',
			path: resolve(__dirname, 'transforms', 'new-test-harness.js')
		},
		{
			name: 'Update Outlet dependencies to Route',
			path: resolve(__dirname, 'transforms', 'outlet-to-route.js')
		}
	],
	dependencies: {
		add: [],
		remove: [],
		updateVersion: '^7.0.0'
	},
	postTransform() {}
};
