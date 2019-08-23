import { resolve } from 'path';
import { run } from './util';
import { readFileSync } from 'fs';
import { coerce } from 'semver';

export const LATEST_VERSION = 4;

interface Dependency {
	name: string;
	version: string;
	major: number;
	minor: number;
	patch: number;
	isDevDependency: boolean;
}

interface PackageJson {
	name: string;
	version: string;
	main?: string;
	author?: string;
	typings?: string;
	license?: string;
	homepage?: string;
	repository?: { type: string; url: string };
	scripts?: { [name: string]: string };
	dependencies?: { [name: string]: string };
	devDependencies?: { [name: string]: string };
}

export class DependencyManager {
	private json!: PackageJson;
	path: string;

	constructor(path: string = resolve(process.cwd(), 'package.json')) {
		this.path = path;
		this.getPackageData();
	}

	private getPackageData(): PackageJson {
		try {
			const jsonString = readFileSync(this.path, { encoding: 'utf8' });
			this.json = JSON.parse(jsonString);
		} catch (error) {
			throw Error('Unable to load package.json. Aborting upgrade.');
		}

		return this.json;
	}

	getPackageVersion(): string {
		return this.json.version;
	}

	getDojoVersion(): number {
		const deps = this.getDependencies();
		return deps.filter((dep) => dep.name.includes('@dojo')).reduce((minVersion, { major }) => {
			return major < minVersion ? major : minVersion;
		}, Infinity);
	}

	async install(pkg: string, devDependency?: boolean): Promise<void>;
	async install(packages: string[], devDependencies?: boolean): Promise<void>;
	async install(packages: string | string[], devDependency: boolean = false): Promise<void> {
		packages = Array.isArray(packages) ? packages : [packages];

		if (!packages.length) {
			return;
		}

		const args = ['install', ...packages];

		if (devDependency) {
			args.push('--save-dev');
		}

		await run('npm', args);
		this.getPackageData();
	}

	async uninstall(pkg: string): Promise<void>;
	async uninstall(packages: string[]): Promise<void>;
	async uninstall(packages: string | string[]): Promise<void> {
		packages = Array.isArray(packages) ? packages : [packages];

		if (!packages.length) {
			return;
		}

		await run('npm', ['uninstall', ...packages]);
		this.getPackageData();
	}

	async updateDependencies(version: string): Promise<void> {
		const deps = this.getDependencies().filter(
			(dep) => dep.name.includes('@dojo') && !dep.isDevDependency && !!coerce(dep.version)
		);
		const devDeps = this.getDependencies().filter(
			(dep) => dep.name.includes('@dojo') && dep.isDevDependency && !!coerce(dep.version)
		);
		await this.install(deps.map(({ name }) => `${name}@${version}`));
		await this.install(devDeps.map(({ name }) => `${name}@${version}`), true);
	}

	getDependencies(): Dependency[] {
		const { dependencies: deps = {}, devDependencies: devDeps = {} } = this.json;
		const transform = (deps: { [name: string]: string }, isDevDependency: boolean = false) => {
			return Object.keys(deps).map((name) => {
				const version = deps[name];
				const { major, minor, patch } = coerce(version) || ({} as any);
				return {
					name,
					version,
					isDevDependency,
					major,
					minor,
					patch
				};
			});
		};

		return transform(deps).concat(transform(devDeps, true));
	}
}

export default DependencyManager;
