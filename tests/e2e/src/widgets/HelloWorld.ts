import WidgetBase from '@dojo/framework/widget-core/WidgetBase';
import { v } from '@dojo/framework/widget-core/d';
import { createTimer } from '@dojo/framework/core/util';
import { List } from '@dojo/framework/core/List';

import * as css from './styles/helloWorld.m.css';

const logo = require('./../img/logo.svg');

/**
 * A "Hello World" widget that renders a spinning Dojo 2 logo and the text "Hello, Dojo 2 World!".
 *
 * Refer to the creating widgets tutorial for help: https://dojo.io/tutorials/003_creating_widgets/
 */
export class HelloWorld extends WidgetBase {
	useDeprecatedFeature() {
		const list = new List();
		list.add('Adding item to list');
	}

	protected render() {
		createTimer(() => console.log('Using a core feature that has not been deprecated'));
		return v('div', { classes: css.root }, [
			v('img', { src: logo, classes: css.logo }),
			v('div', { classes: css.label }, ['Hello, Dojo World!'])
		]);
	}
}

export default HelloWorld;
