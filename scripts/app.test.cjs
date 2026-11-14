const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

const context = vm.createContext({
    URL,
    document: { currentScript: { src: 'http://localhost/app.js' }, addEventListener() {} }
});
vm.runInContext(readFileSync(new URL('../app.js', `file://${__filename}`), 'utf8'), context);
const evaluate = (code) => vm.runInContext(code, context);

assert.equal(Math.round(evaluate('estimateTax(82400000, 35)')), 31724000);
assert.equal(evaluate('estimateTax(0, 45)'), 0);
assert.ok(Math.abs(evaluate('estimateTax(1000000, 6)') - 66000) < 0.001);
assert.equal(Math.round(evaluate('estimateTax(82400000 / 3, 35) * 3')), 31724000);
assert.equal(evaluate("isDataStale('2026-11-14 21:00:00 (KST)', Date.parse('2026-11-16T11:59:59Z'))"), false);
assert.equal(evaluate("isDataStale('2026-11-14 21:00:00 (KST)', Date.parse('2026-11-16T12:00:00Z'))"), true);
assert.equal(evaluate("isDataStale('invalid')"), null);
assert.equal(evaluate('state.scenarioPrice = 206000; getScenarioPrice()'), 206000);
assert.equal(evaluate('state.scenarioPrice = 206250; getPositionGrossKrw({shares: 400})'), 82500000);
assert.equal(evaluate('formatAnnualShares(600, translations.ko)'), '200 주');
assert.equal(evaluate('formatAnnualShares(400, translations.ko)'), '약 133.3 주');
console.log('Tax estimates, KST freshness, scenario values and annual shares passed.');
