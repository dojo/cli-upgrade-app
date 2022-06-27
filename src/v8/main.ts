import { VersionConfig } from '../interfaces';

export const config: VersionConfig = {
	version: 8,
	transforms: [],
	dependencies: {
		add: [],
		remove: [],
		updateVersion: '^8.0.0'
	},
	postTransform() {}
};
