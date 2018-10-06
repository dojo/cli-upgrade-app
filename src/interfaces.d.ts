export interface Dependencies {
	updateVersion: string;
	add?: string[];
	remove?: string[];
}

export interface Transform {
	path: string;
	loggingOnly?: boolean;
	name?: string;
}

export interface VersionConfig {
	version: string | number;
	transforms?: (string | Transform)[];
	dependencies?: Dependencies;
	run?: () => void;
	postTransform?: () => void;
}
