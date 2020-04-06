const { describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');
import { EOL } from 'os';

const normalizeLineEndings = (str: string) => str.replace(/\r?\n/g, EOL);

let jscodeshift = require('jscodeshift');
import moduleTransform from '../../../../src/v7/transforms/route-ids';

jscodeshift = jscodeshift.withParser('ts');

const input = {
	path: 'routes.ts',
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
		const output = moduleTransform({ ...input, path: 'routes.tsx' }, { jscodeshift, stats: () => {} });
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
});
