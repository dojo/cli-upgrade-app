const { describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');
import { EOL } from 'os';

const normalizeLineEndings = (str: string) => str.replace(/\r?\n/g, EOL);

let jscodeshift = require('jscodeshift');
import moduleTransform from '../../../../src/v7/transforms/outlet-to-route';

jscodeshift = jscodeshift.withParser('tsx');

const changeDefaultImportInput = {
	source: normalizeLineEndings(`
import { tsx, w } from '@dojo/framework/core/vdom';
import Outlet from '@dojo/framework/routing/Outlet';
const Foo: any = {};
function foo() {
    return <Outlet/>;
}
function bar() {
    return w(Outlet);
}
function baz() {
    return w(Foo);
}
`)
};

const changeImportInput = {
	source: normalizeLineEndings(`
import { tsx, w } from '@dojo/framework/core/vdom';
import { Outlet } from '@dojo/framework/routing/Outlet';
function foo() {
    return <Outlet/>;
}
function bar() {
    return w(Outlet);
}
if (true) {
    const Outlet = 'A Bad Idea';
    console.log(Outlet);
}
`)
};

const changeImportInputNewScope = {
	source: normalizeLineEndings(`
import { tsx, w } from '@dojo/framework/core/vdom';
import { Outlet } from '@dojo/framework/routing/Outlet';
function foo() {
    return <Outlet/>;
}
function bar() {
    return w(Outlet);
}
(() => {
    const Outlet = 'A Bad Idea';
    console.log(Outlet);
})();
`)
};

const changeImportNotLocalInput = {
	source: normalizeLineEndings(`
import { tsx, w } from '@dojo/framework/core/vdom';
import { Outlet as MyOutletName } from '@dojo/framework/routing/Outlet';
function foo() {
    return <MyOutletName/>;
}
function bar() {
    return w(MyOutletName);
}
`)
};

const doNotChangeDefaultImportInput = {
	source: normalizeLineEndings(`
import { tsx, w } from '@dojo/framework/core/vdom';
import MyOutletName  from '@dojo/framework/routing/Outlet';
function foo() {
    return <MyOutletName/>;
}
function bar() {
    return w(MyOutletName);
}
`)
};

describe('outlet-to-route', () => {
	it('transforms default import', () => {
		const output = moduleTransform(changeDefaultImportInput, { jscodeshift, stats: () => {} });
		assert.equal(
			output,
			normalizeLineEndings(`
import { tsx, w } from '@dojo/framework/core/vdom';
import Route from '@dojo/framework/routing/Route';
const Foo: any = {};
function foo() {
    return <Route/>;
}
function bar() {
    return w(Route);
}
function baz() {
    return w(Foo);
}
`)
		);
	});

	it('transforms named import, failing to detect block scope', () => {
		const output = moduleTransform(changeImportInput, { jscodeshift, stats: () => {} });
		assert.equal(
			output,
			normalizeLineEndings(`
import { tsx, w } from '@dojo/framework/core/vdom';
import { Route } from '@dojo/framework/routing/Route';
function foo() {
    return <Route/>;
}
function bar() {
    return w(Route);
}
if (true) {
    const Route = 'A Bad Idea';
    console.log(Route);
}
`)
		);
	});

	it('transforms named import, successfully  detecting function scope', () => {
		const output = moduleTransform(changeImportInputNewScope, { jscodeshift, stats: () => {} });
		assert.equal(
			output,
			normalizeLineEndings(`
import { tsx, w } from '@dojo/framework/core/vdom';
import { Route } from '@dojo/framework/routing/Route';
function foo() {
    return <Route/>;
}
function bar() {
    return w(Route);
}
(() => {
    const Outlet = 'A Bad Idea';
    console.log(Outlet);
})();
`)
		);
	});

	it('transforms named import source but not local name if aliased', () => {
		const output = moduleTransform(changeImportNotLocalInput, { jscodeshift, stats: () => {} });
		assert.equal(
			output,
			normalizeLineEndings(`
import { tsx, w } from '@dojo/framework/core/vdom';
import { Route as MyOutletName } from '@dojo/framework/routing/Route';
function foo() {
    return <MyOutletName/>;
}
function bar() {
    return w(MyOutletName);
}
`)
		);
	});

	it('Does not change default import name if it is not `Outlet`', () => {
		const output = moduleTransform(doNotChangeDefaultImportInput, { jscodeshift, stats: () => {} });
		assert.equal(
			output,
			normalizeLineEndings(`
import { tsx, w } from '@dojo/framework/core/vdom';
import MyOutletName  from '@dojo/framework/routing/Route';
function foo() {
    return <MyOutletName/>;
}
function bar() {
    return w(MyOutletName);
}
`)
		);
	});
});
