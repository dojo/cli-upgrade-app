const { describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

import { EOL } from 'os';
const normalizeLineEndings = (str: string) => str.replace(/\r?\n/g, EOL);

let jscodeshift = require('jscodeshift');
import moduleTransform = require('../../../../src/v3/transforms/module-transform-to-framework');

jscodeshift = jscodeshift.withParser('ts');

const input = {
	source: normalizeLineEndings(`
import { ProjectorMixin } from '@dojo/widget-core/mixins/Projector';
import { registerRouterInjector } from '@dojo/routing/RouterInjector';
import harness from '@dojo/test-extras/harness';
import TodoApp from './widgets/TodoApp';
import Registry from '@dojo/widget-core/Registry';
import AnotherThing from '@dojo/cli/something/else';

const registry = new Registry();
const router = registerRouterInjector([
	{
		path: 'filter/{filter}',
		outlet: 'filter',
		defaultParams: { filter: 'all' },
		defaultRoute: true
	}
], registry);

const Projector = ProjectorMixin(TodoApp);
const projector = new Projector();
projector.setProperties({ registry });
projector.append();
`)
};

describe('module-transform-to-framework', () => {
	it('should transform legacy package imports to the new dojo/framework package', () => {
		const output = moduleTransform(input, { jscodeshift, stats: () => {} });
		assert.equal(
			output,
			normalizeLineEndings(`
import { ProjectorMixin } from '@dojo/framework/widget-core/mixins/Projector';
import { registerRouterInjector } from '@dojo/framework/routing/RouterInjector';
import harness from '@dojo/framework/testing/harness';
import TodoApp from './widgets/TodoApp';
import Registry from '@dojo/framework/widget-core/Registry';
import AnotherThing from '@dojo/cli/something/else';

const registry = new Registry();
const router = registerRouterInjector([
	{
		path: 'filter/{filter}',
		outlet: 'filter',
		defaultParams: { filter: 'all' },
		defaultRoute: true
	}
], registry);

const Projector = ProjectorMixin(TodoApp);
const projector = new Projector();
projector.setProperties({ registry });
projector.append();
`)
		);
	});
});
