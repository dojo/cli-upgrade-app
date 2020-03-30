const { describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

import { EOL } from 'os';
const normalizeLineEndings = (str: string) => str.replace(/\r?\n/g, EOL);

let jscodeshift = require('jscodeshift');
import moduleTransform from '../../../../src/v5/transforms/consolidate-has';

jscodeshift = jscodeshift.withParser('ts');

const input = {
	source: normalizeLineEndings(`
import has from '@dojo/framework/has/has';
import has2 from '@dojo/framework/has/preset';
import has3 from '@dojo/framework/shim/support/has';
`)
};

describe('consolidate-has', () => {
	it('transforms removed has imports to their new location', () => {
		const output = moduleTransform(input, { jscodeshift, stats: () => {} });
		assert.equal(
			output,
			normalizeLineEndings(`
import has from '@dojo/framework/has/has';
import has2 from '@dojo/framework/has/has';
import has3 from '@dojo/framework/has/has';
`)
		);
	});
});
