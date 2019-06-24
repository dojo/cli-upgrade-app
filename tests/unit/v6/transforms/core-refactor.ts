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
import has from '@dojo/framework/has/has';
import { v, decorate as testDecorate } from '@dojo/framework/widget-core/d';
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
import has from '@dojo/framework/core/has';
import { decorate as testDecorate } from '@dojo/framework/core/util';
import { v } from '@dojo/framework/core/vdom';
`)
		);
	});
});
