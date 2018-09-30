import { resolve } from 'path';
import { readFile, run } from './util';
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
	private json: PackageJson;
	private loadPromise: Promise<PackageJson>;
	path: string;

	constructor(path: string = resolve(process.cwd(), 'package.json')) {
		this.setPackagePath(path);
	}

	private getPackageData(redownload?: boolean): Promise<PackageJson> {
		if (redownload || !this.loadPromise) {
			this.loadPromise = new Promise<PackageJson>(async (resolve, reject) => {
				try {
					const jsonString = await readFile(this.path, { encoding: 'utf8' });
					this.json = JSON.parse(jsonString);
					resolve(this.json);
				} catch (error) {
					reject(Error('Unable to load package.json. Aborting upgrade.'));
				}
			});
		}

		return this.loadPromise;
	}

	async setPackagePath(path: string): Promise<void> {
		this.path = path;
		await this.getPackageData(true);
	}

	async getPackageVersion(): Promise<string> {
		await this.getPackageData();
		return this.json.version;
	}

	async getDojoVersion(): Promise<number> {
		const deps = await this.getDependencies();
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
		await this.getPackageData(true);
	}

	async uninstall(pkg: string): Promise<void>;
	async uninstall(packages: string[]): Promise<void>;
	async uninstall(packages: string | string[]): Promise<void> {
		packages = Array.isArray(packages) ? packages : [packages];

		if (!packages.length) {
			return;
		}

		await run('npm', ['uninstall', ...packages]);
		await this.getPackageData(true);
	}

	async updateDependencies(version: string): Promise<void> {
		const deps = (await this.getDependencies()).filter((dep) => dep.name.includes('@dojo') && !dep.isDevDependency);
		const devDeps = (await this.getDependencies()).filter(
			(dep) => dep.name.includes('@dojo') && dep.isDevDependency
		);
		await this.install(deps.map(({ name }) => `${name}@${version}`));
		await this.install(devDeps.map(({ name }) => `${name}@${version}`), true);
	}

	async getDependencies(): Promise<Dependency[]> {
		await this.getPackageData();
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
