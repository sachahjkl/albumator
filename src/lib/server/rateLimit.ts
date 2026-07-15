import { createHash } from 'node:crypto';

export type RateLimitPolicy = {
	capacity: number;
	refillMs: number;
};

type Bucket = {
	tokens: number;
	updatedAt: number;
	policy: RateLimitPolicy;
};

export class RateLimiter {
	readonly #buckets = new Map<string, Bucket>();
	readonly #now: () => number;
	readonly #maxEntries: number;

	constructor({ now = Date.now, maxEntries = 20_000 } = {}) {
		this.#now = now;
		this.#maxEntries = maxEntries;
	}

	consume(key: string, policy: RateLimitPolicy) {
		const now = this.#now();
		let bucket = this.#buckets.get(key);

		if (!bucket) {
			if (this.#buckets.size >= this.#maxEntries) {
				this.sweep();
			}
			if (this.#buckets.size >= this.#maxEntries) {
				return { allowed: false, retryAfterSeconds: 60 };
			}

			bucket = { tokens: policy.capacity, updatedAt: now, policy };
			this.#buckets.set(key, bucket);
		} else {
			const elapsed = Math.max(0, now - bucket.updatedAt);
			bucket.tokens = Math.min(policy.capacity, bucket.tokens + elapsed / policy.refillMs);
			bucket.updatedAt = now;
			bucket.policy = policy;
		}

		if (bucket.tokens < 1) {
			return {
				allowed: false,
				retryAfterSeconds: Math.max(1, Math.ceil(((1 - bucket.tokens) * policy.refillMs) / 1000))
			};
		}

		bucket.tokens -= 1;
		return { allowed: true, retryAfterSeconds: 0 };
	}

	reset(key: string) {
		this.#buckets.delete(key);
	}

	sweep() {
		const now = this.#now();
		for (const [key, bucket] of this.#buckets) {
			const refilled = bucket.tokens + Math.max(0, now - bucket.updatedAt) / bucket.policy.refillMs;
			if (refilled >= bucket.policy.capacity) {
				this.#buckets.delete(key);
			}
		}
	}

	get size() {
		return this.#buckets.size;
	}
}

export class ConcurrencyGate {
	#active = 0;

	constructor(readonly capacity: number) {}

	async tryRun<T>(operation: () => Promise<T>) {
		if (this.#active >= this.capacity) {
			return { started: false as const };
		}

		this.#active += 1;
		try {
			return { started: true as const, value: await operation() };
		} finally {
			this.#active -= 1;
		}
	}
}

export const LOGIN_IP_POLICY = { capacity: 10, refillMs: 30_000 };
export const LOGIN_ACCOUNT_POLICY = { capacity: 5, refillMs: 180_000 };
export const REGISTER_IP_POLICY = { capacity: 3, refillMs: 600_000 };
export const REGISTER_ACCOUNT_POLICY = { capacity: 2, refillMs: 1_800_000 };

export const authRateLimiter = new RateLimiter();
export const argonGate = new ConcurrencyGate(2);

const cleanupTimer = setInterval(() => authRateLimiter.sweep(), 60_000);
cleanupTimer.unref();

export const accountRateLimitKey = (action: 'login' | 'register', username: string) => {
	const accountHash = createHash('sha256').update(username).digest('hex');
	return `${action}:account:${accountHash}`;
};
