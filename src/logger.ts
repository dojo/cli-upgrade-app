export type LogFunction = (message: string) => void;

interface LogType {
	message: string;
	logs: string[];
}

export class LogService {
	private logs: { [key: string]: LogType } = {};

	register(key: string, message: string): LogFunction {
		let log = this.logs[key];
		if (!log) {
			log = this.logs[key] = {
				message,
				logs: [] as string[]
			};
		}

		return this.log.bind(this, key);
	}

	log(key: string, message: string): void {
		this.logs[key].logs.push(message);
	}

	clear(): void {
		this.logs = {};
	}

	flush(): void {
		Object.keys(this.logs).forEach((key) => {
			const { logs, message } = this.logs[key];
			if (logs.length) {
				console.log(`${message}
				${logs.map((log) => `\t${log}`).join('\n')}
				`);
			}
		});
		this.clear();
	}
}

export const logger = new LogService();
export default logger;
