const { describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

import { EOL } from 'os';
const normalizeLineEndings = (str: string) => str.replace(/\r?\n/g, EOL);

let jscodeshift = require('jscodeshift-ts');
import moduleTransform from '../../../../src/v6/transforms/use-globalize';

jscodeshift = jscodeshift.withParser('typescript');

const input = {
	source: normalizeLineEndings(`
import { formatDate } from '@dojo/framework/i18n/date';
import { formatCurrency as fc } from '@dojo/framework/i18n/number';
import * as unit from '@dojo/framework/i18n/unit';

const locale = 'en';
const options = { datetime: 'full' };
const unknown = {};

formatDate(new Date());
formatDate(new Date(), 'en');
formatDate(new Date(), { datetime: 'full' });
formatDate(new Date(), options);
formatDate(new Date(), options, locale);
formatDate(new Date(), unknown);

function f(formatDate) {
	formatDate(new Date(), 'en');
}

unit.formatUnit(12, 'mile-per-hour', { form: 'short' }, 'en');
unit.getUnitFormatter('mile-per-hour', 'en');

function g(unit) {
	unit.formatUnit(12, 'mile-per-hour', { form: 'short' }, 'en');
}

fc(42, 'USD');
`)
};

describe('use-globalize', () => {
	it('replaces formatters from @dojo/framework/i18n with their Globalize counterparts', () => {
		const output = moduleTransform(input, { jscodeshift, stats: () => {} });
		assert.equal(
			output,
			normalizeLineEndings(`
import * as Globalize from "globalize";

const locale = 'en';
const options = { datetime: 'full' };
const unknown = {};

Globalize.formatDate(new Date());
Globalize('en').formatDate(new Date());
Globalize.formatDate(new Date(), { datetime: 'full' });
Globalize.formatDate(new Date(), options);
Globalize(locale || "").formatDate(new Date(), options);
// TODO @dojo/cli-upgrade-app: Cannot verify whether the final argument is a locale or options object
formatDate(new Date(), unknown);

function f(formatDate) {
	// TODO @dojo/cli-upgrade-app: Unmodified: "formatDate" is shadowed.
    formatDate(new Date(), 'en');
}

Globalize('en').formatUnit(12, 'mile-per-hour', { form: 'short' });
Globalize('en').unitFormatter('mile-per-hour');

function g(unit) {
	// TODO @dojo/cli-upgrade-app: Unmodified: "unit" is shadowed.
    unit.formatUnit(12, 'mile-per-hour', { form: 'short' }, 'en');
}

Globalize.formatCurrency(42, 'USD');
`)
		);
	});
});
