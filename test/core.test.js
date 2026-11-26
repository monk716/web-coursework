import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRegistration } from '../src/validation.js';
import { selectProducts } from '../src/catalog.js';
const valid = { name: 'Анна', email: 'anna@example.com', password: 'Test12345', confirmPassword: 'Test12345' };
test('Valid registration and trimmed Unicode names are accepted', () => {
  assert.deepEqual(validateRegistration(valid), {});
  assert.deepEqual(validateRegistration({ ...valid, name: '  李明  ' }), {});
});
test('All four fields are required', () => assert.deepEqual(Object.keys(validateRegistration({})), ['name', 'email', 'password', 'confirmPassword']));
test('Reject malformed email addresses', () => {
  for (const email of ['abc', 'a@b', 'a@@b.com', 'a b@c.com', 'a@b.c d']) assert.ok(validateRegistration({ ...valid, email }).email);
});
test('Password boundaries and mismatch are checked', () => {
  assert.ok(validateRegistration({ ...valid, password: '1234567' }).password);
  assert.ok(validateRegistration({ ...valid, password: 'a'.repeat(129) }).password);
  assert.ok(validateRegistration({ ...valid, confirmPassword: 'different' }).confirmPassword);
  assert.equal(validateRegistration({ ...valid, password: '12345678', confirmPassword: '12345678' }).password, undefined);
});
test('Name length and whitespace-only names are checked', () => {
  for (const name of [' ', 'a', 'a'.repeat(81)]) assert.ok(validateRegistration({ ...valid, name }).name);
});
const products = [{ id: 1, title: 'Oak Chair', category: 'furniture', price: 40, rating: 4 }, { id: 2, title: 'Desk Lamp', category: 'home-decoration', price: 20, rating: 5 }, { id: 3, title: 'Small Chair', category: 'furniture', price: 10, rating: 3 }];
test('Search, category and max price combine without mutating API data', () => {
  const original = structuredClone(products);
  assert.deepEqual(selectProducts(products, { query: ' CHAIR ', category: 'furniture', maxPrice: '30' }).map(p => p.id), [3]);
  assert.deepEqual(selectProducts(products, { maxPrice: '0' }), []);
  assert.deepEqual(products, original);
});
test('Price and rating sort in the right direction', () => {
  assert.deepEqual(selectProducts(products, { sort: 'price-asc' }).map(p => p.id), [3, 2, 1]);
  assert.deepEqual(selectProducts(products, { sort: 'price-desc' }).map(p => p.id), [1, 2, 3]);
  assert.deepEqual(selectProducts(products, { sort: 'rating' }).map(p => p.id), [2, 1, 3]);
});
