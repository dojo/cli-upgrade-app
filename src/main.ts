import { Command, Helper, OptionsHelper } from '@dojo/cli/interfaces';
import chalk from 'chalk';
import { prompt } from 'inquirer';
import DependencyManager from './DependencyManager';
import { runTask } from './util';
import { VersionConfig } from './interfaces';

const { run: runCodemod } = require('jscodeshift/src/Runner');
const glob = require('glob');

export const LATEST_VERSION = 3;

export class UpgradeCommand implements Command {
	private depManager: DependencyManager;

	readonly name = 'app';
	readonly group = 'upgrade';
	readonly description = 'upgrade your application to a newer Dojo version';

	constructor(depManager: DependencyManager = new DependencyManager()) {
		this.depManager = depManager;
	}

	register(options: OptionsHelper) {
		options('pattern', {
			describe: 'glob pattern of source files to transform',
			alias: 'p',
			type: 'string',
			default: '{src,tests}/**/*.{ts,tsx}'
		});
		options('dry', {
			describe: 'perform a dry run, no changes are made to files',
			alias: 'd',
			type: 'boolean',
			default: false
		});
	}

	async getConfigs(fromVersion: number, toVersion: number = LATEST_VERSION): Promise<VersionConfig[]> {
		const configs: VersionConfig[] = [];
		for (let i = fromVersion + 1; i <= toVersion; ++i) {
			configs.push((await import(`./v${i}/main`)).config as VersionConfig);
		}
		return configs;
	}

	run = async (helper: Helper, args: { pattern: string; dry: boolean }) => {
		const { pattern, dry } = args;
		const paths = glob.sync(pattern);
		const hasJSX = paths.some((p: string) => p.match(/\.tsx$/g));
		const parser = hasJSX ? 'typescript-jsx' : 'typescript';
		const fromVersion = this.depManager.getDojoVersion();
		const toVersion = LATEST_VERSION;

		if (toVersion <= fromVersion) {
			throw Error(`Attempt to upgrade from ${fromVersion} to ${toVersion} not allowed. Exiting.`);
		}

		if (!dry) {
			const answer = await prompt({
				type: 'confirm',
				name: 'run',
				message:
					'This command will irreversibly modify files. Are you sure you want to run the upgrade? Use the --dry option first if in doubt',
				default: false
			});

			if (!answer) {
				throw Error('Aborting upgrade.');
			}
		}

		await Promise.all(
			(await this.getConfigs(fromVersion, toVersion)).map((config) => this.runUpgrade(config, parser, paths, dry))
		);
	};

	async runUpgrade(
		{ version, transforms, dependencies: { add = [], remove = [] } }: VersionConfig,
		parser: string,
		paths: string[],
		dry: boolean
	) {
		console.log('\n' + chalk.bold.cyan(`Running version ${version} upgrade scripts.`));
		try {
			for (const transform of transforms) {
				await runCodemod(transform, paths, {
					parser,
					verbose: 0,
					babel: false,
					dry,
					extensions: 'js',
					runInBand: false,
					silent: false
				});
			}

			if (remove.length) {
				await runTask(
					`Removing the following packages: ${remove.join(',')}`,
					() => this.depManager.uninstall(remove),
					dry
				);
			}

			if (add.length) {
				await runTask(
					`Installing the following packages: ${add.join(',')}`,
					() => this.depManager.install(add),
					dry
				);
			}

			if (version === LATEST_VERSION) {
				const versionString = `^${version}.0.0`;
				await runTask(
					`Updating @dojo packages to version ${versionString}`,
					() => this.depManager.updateDependencies(versionString),
					dry
				);
			}
		} catch (error) {
			console.error(error);
			throw Error('Failed to upgrade');
		}
	}
}

export const command = new UpgradeCommand();

export default command;
