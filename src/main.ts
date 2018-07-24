import { Command, Helper, OptionsHelper } from '@dojo/cli/interfaces';
import chalk from 'chalk';

const command: Command = {
	group: 'upgrade',
	name: 'app',
	description: 'upgrade your application to later dojo versions',
	register(options: OptionsHelper) {
	},
	run(helper: Helper) {
		console.warn(chalk.bgRed('foo'));
		return Promise.resolve();
	}
};

export default command;
