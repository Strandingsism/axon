# Root Cause Tracing

Backward tracing through call stacks to find where a correct value becomes incorrect.

## The Method

Start at the symptom (the wrong output, the error message, the failed assertion) and trace backward through the code path until you find the exact line where data becomes wrong.

### Step 1: Identify the Symptom

What exactly is wrong? Be specific.

Bad: "The login doesn't work."
Good: "`login('user@example.com', 'correct-password')` returns `null` instead of a session token."

### Step 2: Find the Output Point

Where does the wrong value emerge? This is the function that returns the wrong value, or the line that throws the error.

### Step 3: Trace Backward

At each step backward through the call chain, ask:
- What values enter this function?
- What does this function do with those values?
- What values leave this function?

The bug is between the last function that produces correct output and the first function that produces wrong output.

### Step 4: Instrument Boundaries

Add logging at each boundary to find where things diverge:

```ts
// At each function boundary
function processData(input: RawInput): ProcessedData {
  console.log('[processData] input:', JSON.stringify(input))
  const result = transform(input)
  console.log('[processData] output:', JSON.stringify(result))
  return result
}
```

When you see correct input enter a function but wrong output leave it, you've found the broken function.

### Step 5: Narrow Within the Function

Once you've found the broken function, repeat the process within it. Instrument each statement that transforms data until you find the exact line.

## Instrumentation Patterns

### Pattern 1: Boundary Logging

```ts
// Log at every component boundary
console.log('[Component.fn] input:', input)
// ... operation ...
console.log('[Component.fn] output:', output)
```

### Pattern 2: Conditional Break

```ts
// Only log when values diverge from expected
if (result.status !== 'active') {
  console.log('[Unexpected] processData produced:', result)
  console.log('[Unexpected] input was:', input)
}
```

### Pattern 3: Stack Marker

```ts
// Identify which code path was taken
console.log('[TokenStore.get] HIT for key:', key)
// vs
console.log('[TokenStore.get] MISS for key:', key)
```

## Example

**Bug**: Users report that their settings reset after logging out and back in.

**Symptom**: `getUserSettings('user-1')` returns default settings after re-login.

**Trace backward**:

1. `getUserSettings` calls `loadFromStorage('user-1')`
2. `loadFromStorage` calls `cache.get('settings:user-1')`
3. `cache.get` returns `undefined` — cache miss
4. `cache.get` checks Redis: `redis.get('settings:user-1')`
5. Redis returns `null` — key doesn't exist
6. Why doesn't the key exist? `cache.set` was called on login...
7. Check `cache.set`: it calls `redis.set('settings:user-1', value, 'EX', ttl)`
8. **Found it**: `ttl` is `undefined` because `getSessionTTL` returns `undefined` for re-logins — the TTL function only handles first-time logins. Redis immediately expires or never stores the key.

**Root cause line**: `getSessionTTL` doesn't handle the re-login case, returning `undefined` instead of a valid TTL.
