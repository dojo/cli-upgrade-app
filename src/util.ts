import { readFile as nodeReadFile, writeFile as nodeWriteFile } from 'fs';
import { promisify } from 'util';
const { spawn } = require('cross-spawn');
const { promise: ora }: any = require('ora');

export const readFile = promisify(nodeReadFile);
export const writeFile = promisify(nodeWriteFile);

export interface TaskOptions {
	text: string;
	command: string;
	args?: string[];
	ignoreErrors?: boolean;
}

export function run(command: string, args: string[] = [], resolveOnErrors: boolean = false): Promise<string> {
	return new Promise((resolve, reject) => {
		let stdout = '';
		let stderr = '';
		const proc = spawn(command, args);

		proc.stdout.on('data', (data: Buffer) => {
			stdout += data.toString('utf8');
		});
		proc.stderr.on('data', (data: Buffer) => {
			stderr += data.toString('utf8');
		});
		proc.on('close', (code: number) => {
			if (!resolveOnErrors && code) {
				reject(stderr);
			} else {
				resolve(stdout);
			}
		});
	});
}

export async function runTask<T>(
	text: string,
	task: (() => Promise<T | void>) | Promise<T | void>,
	dry: boolean = false
): Promise<T | void> {
	const promise = dry ? Promise.resolve() : typeof task === 'function' ? task() : task;

	ora(promise, {
		spinner: 'dots',
		color: 'white',
		text
	});

	return await promise;
}
