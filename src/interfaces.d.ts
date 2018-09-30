interface Dependencies {
	updateVersion: string;
	add?: string[];
	remove?: string[];
}

export interface VersionConfig {
	version: string | number;
	transforms: string[];
	dependencies: Dependencies;
	run?: () => void;
}
