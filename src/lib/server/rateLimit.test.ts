import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ConcurrencyGate, RateLimiter } from './rateLimit';

test('rate limiter consumes capacity and refills tokens', () => {
	let now = 0;
	const limiter = new RateLimiter({ now: () => now });
	const policy = { capacity: 2, refillMs: 1_000 };

	assert.equal(limiter.consume('key', policy).allowed, true);
	assert.equal(limiter.consume('key', policy).allowed, true);
	assert.deepEqual(limiter.consume('key', policy), { allowed: false, retryAfterSeconds: 1 });

	now = 1_000;
	assert.equal(limiter.consume('key', policy).allowed, true);
});

test('rate limiter stays bounded and fails closed for new keys', () => {
	const limiter = new RateLimiter({ now: () => 0, maxEntries: 1 });
	const policy = { capacity: 1, refillMs: 1_000 };

	assert.equal(limiter.consume('first', policy).allowed, true);
	assert.deepEqual(limiter.consume('second', policy), {
		allowed: false,
		retryAfterSeconds: 60
	});
	assert.equal(limiter.size, 1);
});

test('reset and sweep release buckets', () => {
	let now = 0;
	const limiter = new RateLimiter({ now: () => now });
	const policy = { capacity: 1, refillMs: 1_000 };

	limiter.consume('reset', policy);
	limiter.reset('reset');
	assert.equal(limiter.size, 0);

	limiter.consume('sweep', policy);
	now = 1_000;
	limiter.sweep();
	assert.equal(limiter.size, 0);
});

test('concurrency gate rejects excess work and releases capacity', async () => {
	const gate = new ConcurrencyGate(1);
	let release!: () => void;
	const blocked = new Promise<void>((resolve) => (release = resolve));
	const first = gate.tryRun(() => blocked.then(() => 'done'));

	assert.deepEqual(await gate.tryRun(async () => 'excess'), { started: false });
	release();
	assert.deepEqual(await first, { started: true, value: 'done' });
	assert.deepEqual(await gate.tryRun(async () => 'next'), { started: true, value: 'next' });
});
