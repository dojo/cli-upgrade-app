const { describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');
import { EOL } from 'os';

const normalizeLineEndings = (str: string) => str.replace(/\r?\n/g, EOL);

let jscodeshift = require('jscodeshift-ts');
import moduleTransform from '../../../../src/v6/transforms/core-refactor';

jscodeshift = jscodeshift.withParser('typescript');

const input = {
	source: normalizeLineEndings(`
import { WidgetBase } from '@dojo/framework/widget-core/WidgetBase';
import { tsx } from '@dojo/framework/widget-core/tsx';
`)
};

describe('refactor-core', () => {
	it('transforms widget-core imports to core', () => {
		const output = moduleTransform(input, { jscodeshift, stats: () => {} });
		assert.equal(
			output,
			normalizeLineEndings(`
import { WidgetBase } from '@dojo/framework/core/WidgetBase';
import { tsx } from '@dojo/framework/core/vdom';
`));
	});
});
