# Defense in Depth

After finding and fixing a root cause, add validation at multiple layers to prevent this class of bug from recurring. Don't just fix the bug — make it impossible for the bug to come back.

## The Principle

A single bug often reveals a missing validation layer. Fix the root cause, then ask: **what validation could have caught this before it became a user-visible bug?**

Add that validation. Not "maybe." Not "in a follow-up." Now, as part of the fix.

## Layers of Defense

### Layer 1: Type System

Could the type system have caught this?

```ts
// Before: string can be anything
function setTTL(seconds: string): void { ... }

// After: narrow type prevents invalid values
type TTLSeconds = number & { readonly __brand: 'TTLSeconds' }
function setTTL(seconds: TTLSeconds): void { ... }
```

### Layer 2: Input Validation

Could input validation at the boundary have caught this?

```ts
// Before: accepts anything
function login(credentials: unknown): Promise<Session> { ... }

// After: validates at the boundary
function login(credentials: unknown): Promise<Session> {
  const parsed = LoginCredentials.safeParse(credentials)
  if (!parsed.success) {
    throw new ValidationError(parsed.error)
  }
  // ... now credentials are guaranteed valid
}
```

### Layer 3: Invariants

Could a runtime invariant check have caught this?

```ts
// Before: assumes TTL is always valid
const ttl = getSessionTTL(user)
cache.set(key, value, ttl) // ttl might be undefined

// After: validates invariant
const ttl = getSessionTTL(user)
if (ttl == null || ttl <= 0) {
  throw new InvariantError(`Invalid TTL for user ${user.id}: ${ttl}`)
}
cache.set(key, value, ttl)
```

### Layer 4: Error Handling

Could better error handling have caught this?

```ts
// Before: silently swallows the error
try {
  await cache.set(key, value)
} catch {
  // ignore — cache is best-effort
}

// After: logs warning, but still degrades gracefully
try {
  await cache.set(key, value)
} catch (err) {
  logger.warn('Cache write failed, continuing without cache', {
    key,
    error: err.message,
  })
}
```

### Layer 5: Monitoring

Could monitoring have detected this sooner?

```ts
// After the fix: add metrics to detect recurrence
cache.set(key, value).catch((err) => {
  metrics.increment('cache.write.failure', { key_pattern: extractPattern(key) })
})
```

## The Rule of Three

After a bug is fixed, add **at least one** defense layer that would have caught it. Not all five — but at least one.

If this is the **second time** the same class of bug has occurred (e.g., another `undefined` passed to a function that expected a value), add **two** defense layers.

If this is the **third time**, the type system or architecture is wrong. Restructure to make this class of bug unrepresentable — you shouldn't need runtime checks for something the compiler can enforce.

## Example: Adding Defense Layers

**Original bug**: `getSessionTTL` returns `undefined` for re-logins, causing cache keys to never be stored.

**Fix**: Handle re-login case in `getSessionTTL`.

**Defense layers added**:

1. **Type system (Layer 1)**: Change `getSessionTTL` return type from `number | undefined` to `number` — if there's a code path that can't produce a TTL, it must throw, not return undefined.
2. **Invariant (Layer 3)**: Add assertion in `cache.set` that TTL is a positive integer.
3. **Monitoring (Layer 5)**: Add metric for cache write failures by error type.

Now if another code path produces an invalid TTL, the type system catches it at compile time. If it somehow reaches runtime, the invariant catches it immediately. If it still occurs in production, the metric surfaces it in minutes instead of days.
