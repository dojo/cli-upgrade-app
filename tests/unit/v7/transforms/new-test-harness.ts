const { describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');
import { EOL } from 'os';

const normalizeLineEndings = (str: string) => str.replace(/\r?\n/g, EOL);

let jscodeshift = require('jscodeshift');
import moduleTransform from '../../../../src/v7/transforms/new-test-harness';

jscodeshift = jscodeshift.withParser('ts');

const input = {
	source: normalizeLineEndings(`
import { tsx } from '@dojo/framework/core/vdom';
import harness from '@dojo/framework/testing/harness';
import { createBreakpointMock } from '@dojo/framework/testing/mocks/middleware/breakpoint';
import assertionTemplate from '@dojo/framework/testing/assertionTemplate';
`)
};

describe('new-test-harness', () => {
	it('transforms widget-core imports to core', () => {
		const output = moduleTransform(input, { jscodeshift, stats: () => {} });
		assert.equal(
			output,
			normalizeLineEndings(`
import { tsx } from '@dojo/framework/core/vdom';
import harness from '@dojo/framework/testing/harness/harness';
import { createBreakpointMock } from '@dojo/framework/testing/harness/mocks/middleware/breakpoint';
import assertionTemplate from '@dojo/framework/testing/harness/assertionTemplate';
`)
		);
	});
});
