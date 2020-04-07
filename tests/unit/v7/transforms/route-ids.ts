const { describe, it, beforeEach, afterEach } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');
import { EOL } from 'os';
import * as sinon from 'sinon';

const normalizeLineEndings = (str: string) => str.replace(/\r?\n/g, EOL);

let jscodeshift = require('jscodeshift');
import moduleTransform from '../../../../src/v7/transforms/route-ids';

jscodeshift = jscodeshift.withParser('ts');

const input = {
	path: 'src/routes.ts',
	source: normalizeLineEndings(`
export default [
    {
        path: 'home',
        outlet: 'home',
        defaultRoute: true
    },
    {
        path: 'about',
        outlet: 'about'
    },
    {
        path: 'profile',
        outlet: 'profile'
    }
];
`)
};

describe('route-ids', () => {
	it('add ID property to routes in ts file', () => {
		const output = moduleTransform(input, { jscodeshift, stats: () => {} });
		assert.equal(
			output,
			normalizeLineEndings(`
export default [
    {
        path: 'home',
        outlet: 'home',
        defaultRoute: true,
        id: 'home'
    },
    {
        path: 'about',
        outlet: 'about',
        id: 'about'
    },
    {
        path: 'profile',
        outlet: 'profile',
        id: 'profile'
    }
];
`)
		);
	});

	it('add ID property to routes in tsx file', () => {
		const output = moduleTransform({ ...input, path: 'src/routes.tsx' }, { jscodeshift, stats: () => {} });
		assert.equal(
			output,
			normalizeLineEndings(`
export default [
    {
        path: 'home',
        outlet: 'home',
        defaultRoute: true,
        id: 'home'
    },
    {
        path: 'about',
        outlet: 'about',
        id: 'about'
    },
    {
        path: 'profile',
        outlet: 'profile',
        id: 'profile'
    }
];
`)
		);
	});

	it('does not run against other files', () => {
		const output = moduleTransform({ ...input, path: 'src/mailroutes.tsx' }, { jscodeshift, stats: () => {} });
		assert.isUndefined(output);
	});

	describe('warning', () => {
		let sandbox: sinon.SinonSandbox;
		let loggerStub: sinon.SinonStub;

		beforeEach(() => {
			sandbox = sinon.sandbox.create();
			loggerStub = sandbox.stub(console, 'log');
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should log if the router is used but the config file will not be updated', () => {
			const source = normalizeLineEndings(`
				import { registerRouterInjector } from '@dojo/framework/routing/RouterInjector';
				import routes from './someotherroutes';
				registerRouterInjector(routes as any, null as any);
			`);
			moduleTransform({ source, path: 'src/main.ts' }, { jscodeshift, stats: () => {} });
			assert.isTrue(loggerStub.calledOnce);
		});

		it('should not log if the router is used and the config file will be updated', () => {
			const source = normalizeLineEndings(`
				import { registerRouterInjector } from '@dojo/framework/routing/RouterInjector';
				import routes from './routes';
				registerRouterInjector(routes as any, null as any);
			`);
			moduleTransform({ source, path: 'src/main.ts' }, { jscodeshift, stats: () => {} });
			assert.isFalse(loggerStub.called);
		});
	});
});
