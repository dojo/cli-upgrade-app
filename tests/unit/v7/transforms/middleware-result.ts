const { describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');
import { EOL } from 'os';

const normalizeLineEndings = (str: string) => str.replace(/\r?\n/g, EOL);

let jscodeshift = require('jscodeshift');
import moduleTransform from '../../../../src/v7/transforms/middleware-result';

jscodeshift = jscodeshift.withParser('tsx');

const changeImport = {
	source: normalizeLineEndings(`
import { tsx, w } from '@dojo/framework/core/vdom';
import { MiddlewareResult } from '@dojo/framework/core/interfaces';
const Foo: MiddlewareResult<any, any, any> = {};
const bar: void | MiddlewareResult<any, any, any> = {};
const baz: { foo: string } & MiddlewareResult<any, any, any> = {};
`)
};

const changeNamedImport = {
	source: normalizeLineEndings(`
import { tsx, w } from '@dojo/framework/core/vdom';
import { MiddlewareResult as Alias } from '@dojo/framework/core/interfaces';
const Foo: Alias<any, any, any> = {};
`)
};

const changeNestedImport = {
	source: normalizeLineEndings(`
import { tsx, w } from '@dojo/framework/core/vdom';
import { MiddlewareResult } from '@dojo/framework/core/interfaces';
const Foo: MiddlewareResult<any, any, any> = {};
const bar: void | Array<{} & Array<{} | MiddlewareResult<any, any, any>>> = {};
const baz: { foo: string } & Array<{} & Array<{} | MiddlewareResult<any, any, any>>> = {};
`)
};

describe('middleware-result', () => {
	it('transforms import', () => {
		const output = moduleTransform(changeImport, { jscodeshift, stats: () => {} });
		assert.equal(
			output,
			normalizeLineEndings(`
import { tsx, w } from '@dojo/framework/core/vdom';
import { DefaultMiddlewareResult } from '@dojo/framework/core/interfaces';
const Foo: DefaultMiddlewareResult = {};
const bar: void | DefaultMiddlewareResult = {};
const baz: { foo: string } & DefaultMiddlewareResult = {};
`)
		);
	});

	it('transforms deeply nested types', () => {
		const output = moduleTransform(changeNestedImport, { jscodeshift, stats: () => {} });
		assert.equal(
			output,
			normalizeLineEndings(`
import { tsx, w } from '@dojo/framework/core/vdom';
import { DefaultMiddlewareResult } from '@dojo/framework/core/interfaces';
const Foo: DefaultMiddlewareResult = {};
const bar: void | Array<{} & Array<{} | DefaultMiddlewareResult>> = {};
const baz: { foo: string } & Array<{} & Array<{} | DefaultMiddlewareResult>> = {};
`)
		);
	});

	it('transforms named import', () => {
		const output = moduleTransform(changeNamedImport, { jscodeshift, stats: () => {} });
		assert.equal(
			output,
			normalizeLineEndings(`
import { tsx, w } from '@dojo/framework/core/vdom';
import { DefaultMiddlewareResult as DefaultMiddlewareResult } from '@dojo/framework/core/interfaces';
const Foo: DefaultMiddlewareResult = {};
`)
		);
	});
});
