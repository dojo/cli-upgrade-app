const { describe, it, after } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

import * as rimraf from 'rimraf';
import { EOL } from 'os';

const normalizeLineEndings = (str: string) => str.replace(/\r?\n/g, EOL);

let jscodeshift = require('jscodeshift-ts');
import moduleTransform = require('../../../../src/v4/transforms/replace-legacy-core');

jscodeshift = jscodeshift.withParser('typescript');

describe('replace-legacy-core', () => {
	after(() => {
		// This test will try to copy core into the src directory
		rimraf.sync('src/core');
	});

	it('should transform legacy package imports to local copies', () => {
		const input = {
			path: 'src/index.ts',
			source: normalizeLineEndings(`
import request from '@dojo/framework/core/request';
import { EventObject } from '@dojo/framework/core/Evented';

const cjsMod = require('@dojo/framework/core/compare');
const dynamicImport = import('@dojo/framework/core/DateObject');

export { Observable } from '@dojo/framework/core/Observable';
`)
		};
		const output = moduleTransform(input, { jscodeshift, stats: () => {} }, { dry: false });
		assert.equal(
			output,
			normalizeLineEndings(`
import request from './dojo/core/request';
import { EventObject } from '@dojo/framework/core/Evented';

const cjsMod = require('@dojo/framework/core/compare');
const dynamicImport = import('@dojo/framework/core/DateObject');

export { Observable } from './dojo/core/Observable';
`)
		);
	});

	it('should transform legacy package interface imports to local copies', () => {
		const input = {
			path: 'src/index.ts',
			source: normalizeLineEndings(`
import { Response } from '@dojo/framework/core/request/interfaces';
`)
		};
		const output = moduleTransform(input, { jscodeshift, stats: () => {} }, { dry: false });
		assert.equal(
			output,
			normalizeLineEndings(`
import { Response } from './dojo/core/request/interfaces';
`)
		);
	});

	it('should transform paths relative to src/core', () => {
		const input = {
			path: 'src/subdir/index.ts',
			source: normalizeLineEndings(`
import request from '@dojo/framework/core/request';
import { EventObject } from '@dojo/framework/core/Evented';

export { Observable } from '@dojo/framework/core/Observable';
`)
		};
		const output = moduleTransform(input, { jscodeshift, stats: () => {} }, { dry: false });
		assert.equal(
			output,
			normalizeLineEndings(`
import request from '../dojo/core/request';
import { EventObject } from '@dojo/framework/core/Evented';

export { Observable } from '../dojo/core/Observable';
`)
		);
	});

	it('should transform deep paths relative to src/core', () => {
		const input = {
			path: 'src/subdir/another/index.ts',
			source: normalizeLineEndings(`
import request from '@dojo/framework/core/request';
import { EventObject } from '@dojo/framework/core/Evented';

export { Observable } from '@dojo/framework/core/Observable';
`)
		};
		const output = moduleTransform(input, { jscodeshift, stats: () => {} }, { dry: false });
		assert.equal(
			output,
			normalizeLineEndings(`
import request from '../../dojo/core/request';
import { EventObject } from '@dojo/framework/core/Evented';

export { Observable } from '../../dojo/core/Observable';
`)
		);
	});

	it('should transform paths within the tests directory', () => {
		const input = {
			path: 'tests/unit/index.ts',
			source: normalizeLineEndings(`
import request from '@dojo/framework/core/request';
import { EventObject } from '@dojo/framework/core/Evented';

export { Observable } from '@dojo/framework/core/Observable';
`)
		};
		const output = moduleTransform(input, { jscodeshift, stats: () => {} }, { dry: false });
		assert.equal(
			output,
			normalizeLineEndings(`
import request from '../../src/dojo/core/request';
import { EventObject } from '@dojo/framework/core/Evented';

export { Observable } from '../../src/dojo/core/Observable';
`)
		);
	});
});
