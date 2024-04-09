import { ok } from 'assert';

const subject = new Date();
const equalComparand = new Date(subject.valueOf());
const unequalComparand = new Date(subject.valueOf() + 1);

/**
 * Dates can be monkey patched, so modifications to structure are
 * possible, even though doing so is suspect (probably an anti-pattern)!
 */
const monkeyPatched = new Date(subject.valueOf());
monkeyPatched.foo = 'bar';
monkeyPatched['patched'] = true;

const equal = (left, right) => left.valueOf() === right.valueOf();

ok(equal(subject, equalComparand), 'should be equal');
ok(!equal(subject, unequalComparand), 'should be unequal');

// The monkey patched date still shows equal, even though it is
// patched!!
ok(equal(subject, equalComparand), 'should be equal');
ok(monkeyPatched.foo === 'bar', 'should be monkey patched');
ok(monkeyPatched['patched'], 'should be monkey patched');

// Verify that the properties attached to a Date are
// discoverable as structure...
const props = Object.getOwnPropertyNames(monkeyPatched);
ok(props.length === 2, 'has our two patched properties');
