export interface Dependencies {
	updateVersion: string;
	add?: string[];
	remove?: string[];
}

export interface Transform {
	path: string;
	loggingOnly?: boolean;
	description?: string;
}

export interface VersionConfig {
	version: string | number;
	transforms?: (string | Transform)[];
	dependencies?: Dependencies;
	run?: () => void;
	postTransform?: () => void;
}
