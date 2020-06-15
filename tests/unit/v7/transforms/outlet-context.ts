const { describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');
import { EOL } from 'os';

const normalizeLineEndings = (str: string) => str.replace(/\r?\n/g, EOL);

let jscodeshift = require('jscodeshift');
import moduleTransform from '../../../../src/v7/transforms/outlet-context';

jscodeshift = jscodeshift.withParser('tsx');

const changeImport = {
	source: normalizeLineEndings(`
import { tsx, w } from '@dojo/framework/core/vdom';
import { OutletContext } from '@dojo/framework/routing/interfaces';
const Foo: OutletContext = {};
const bar: void | OutletContext = {};
const baz: { foo: string } & OutletContext = {};
`)
};

const changeNestedImport = {
	source: normalizeLineEndings(`
import { tsx, w } from '@dojo/framework/core/vdom';
import { OutletContext } from '@dojo/framework/routing/interfaces';
const Foo: OutletContext = {};
const bar: void | Array<{} & Array<OutletContext>> = {};
const baz: { foo: string } & Array<{} | Array<{} | OutletContext>> = {};
`)
};

const changeNamedImport = {
	source: normalizeLineEndings(`
import { tsx, w } from '@dojo/framework/core/vdom';
import { OutletContext as Alias } from '@dojo/framework/routing/interfaces';
const Foo: Alias = {};
`)
};

describe('outlet-context', () => {
	it('transforms import', () => {
		const output = moduleTransform(changeImport, { jscodeshift, stats: () => {} });
		assert.equal(
			output,
			normalizeLineEndings(`
import { tsx, w } from '@dojo/framework/core/vdom';
import { RouteContext } from '@dojo/framework/routing/interfaces';
const Foo: RouteContext = {};
const bar: void | RouteContext = {};
const baz: { foo: string } & RouteContext = {};
`)
		);
	});

	it('transforms nested import', () => {
		const output = moduleTransform(changeNestedImport, { jscodeshift, stats: () => {} });
		assert.equal(
			output,
			normalizeLineEndings(`
import { tsx, w } from '@dojo/framework/core/vdom';
import { RouteContext } from '@dojo/framework/routing/interfaces';
const Foo: RouteContext = {};
const bar: void | Array<{} & Array<RouteContext>> = {};
const baz: { foo: string } & Array<{} | Array<{} | RouteContext>> = {};
`)
		);
	});

	it('transforms named import', () => {
		const output = moduleTransform(changeNamedImport, { jscodeshift, stats: () => {} });
		assert.equal(
			output,
			normalizeLineEndings(`
import { tsx, w } from '@dojo/framework/core/vdom';
import { RouteContext as RouteContext } from '@dojo/framework/routing/interfaces';
const Foo: RouteContext = {};
`)
		);
	});
});
