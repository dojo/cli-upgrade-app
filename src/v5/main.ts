import { VersionConfig } from '../interfaces';
import { resolve } from 'path';

export const config: VersionConfig = {
	version: 5,
	transforms: [{ name: 'Consolidate has into has/has', path: resolve(__dirname, 'transforms', 'consolidate-has.js') }]
};
