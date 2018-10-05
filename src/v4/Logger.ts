type LogFunction = (path: string) => void;

export class Logger {
	private logs: { [key: string]: string[] } = {};
	private messages: { [key: string]: string } = {};

	registerLogger(key: string, message: string): LogFunction {
		if (!this.logs[key]) {
			this.logs[key] = [] as string[];
		}
		this.messages[key] = message;

		return this.logPath.bind(this, key);
	}

	logPath(key: string, path: string): void {
		this.logs[key].push(path);
	}

	clear(): void {
		this.logs = {};
		this.messages = {};
	}

	flush(): void {
		Object.keys(this.logs).forEach((key) => {
			const paths = this.logs[key];
			const message = this.messages[key];
			if (paths.length) {
				console.log('\n' + message);
				console.log(paths.map((path) => `\t${path}`).join('\n') + '\n');
			}
		});
		this.clear();
	}
}

const logger = new Logger();

export default logger;
