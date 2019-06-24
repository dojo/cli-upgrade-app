import { VersionConfig } from '../interfaces';
import { resolve } from 'path';

export const config: VersionConfig = {
	version: 6,
	transforms: [
		{
			name: 'Refactor framework/widget-core to framework/core',
			path: resolve(__dirname, 'transforms', 'core-refactor.js')
		}
	]
};
