const { describe, it, after } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

import * as rimraf from 'rimraf';
import * as os from 'os';

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
			source: `
import request from '@dojo/framework/core/request';
import { EventObject } from '@dojo/framework/core/Evented';

const cjsMod = require('@dojo/framework/core/compare');
const dynamicImport = import('@dojo/framework/core/DateObject');

export { Observable } from '@dojo/framework/core/Observable';
`
		};
		const output = moduleTransform(input, { jscodeshift, stats: () => {} }, { dry: false });
		assert.equal(
			output,
			`
import request from './dojo/core/request';
import { EventObject } from '@dojo/framework/core/Evented';

const cjsMod = require('@dojo/framework/core/compare');
const dynamicImport = import('@dojo/framework/core/DateObject');

export { Observable } from './dojo/core/Observable';
`
				.split(/\r?\n/g)
				.join(os.EOL)
		);
	});

	it('should transform paths relative to src/core', () => {
		const input = {
			path: 'src/subdir/index.ts',
			source: `
import request from '@dojo/framework/core/request';
import { EventObject } from '@dojo/framework/core/Evented';

export { Observable } from '@dojo/framework/core/Observable';
`
		};
		const output = moduleTransform(input, { jscodeshift, stats: () => {} }, { dry: false });
		assert.equal(
			output,
			`
import request from '../dojo/core/request';
import { EventObject } from '@dojo/framework/core/Evented';

export { Observable } from '../dojo/core/Observable';
`
				.split(/\r?\n/g)
				.join(os.EOL)
		);
	});

	it('should transform deep paths relative to src/core', () => {
		const input = {
			path: 'src/subdir/another/index.ts',
			source: `
import request from '@dojo/framework/core/request';
import { EventObject } from '@dojo/framework/core/Evented';

export { Observable } from '@dojo/framework/core/Observable';
`
		};
		const output = moduleTransform(input, { jscodeshift, stats: () => {} }, { dry: false });
		assert.equal(
			output,
			`
import request from '../../dojo/core/request';
import { EventObject } from '@dojo/framework/core/Evented';

export { Observable } from '../../dojo/core/Observable';
`
				.split(/\r?\n/g)
				.join(os.EOL)
		);
	});

	it('should transform paths within the tests directory', () => {
		const input = {
			path: 'tests/unit/index.ts',
			source: `
import request from '@dojo/framework/core/request';
import { EventObject } from '@dojo/framework/core/Evented';

export { Observable } from '@dojo/framework/core/Observable';
`
		};
		const output = moduleTransform(input, { jscodeshift, stats: () => {} }, { dry: false });
		assert.equal(
			output,
			`
import request from '../../src/dojo/core/request';
import { EventObject } from '@dojo/framework/core/Evented';

export { Observable } from '../../src/dojo/core/Observable';
`
				.split(/\r?\n/g)
				.join(os.EOL)
		);
	});
});
