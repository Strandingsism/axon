# Testing Anti-Patterns

Common pitfalls when writing tests. If you recognize yourself in any of these, stop and rewrite.

## Mock Without Understanding

**Symptom**: Mocking a dependency without understanding its contract.

```ts
// Bad: mock returns what you want, not what's real
jest.mock('./database', () => ({
  query: jest.fn().mockResolvedValue([{ id: 1 }])
}))
```

If you don't understand what `database.query` actually returns, your mock might return something impossible. Your test passes. Your code breaks in production.

**Fix**: Use the real dependency if possible. If you must mock, verify the mock's return type matches the real type.

## Test-Only Methods

**Symptom**: Adding public methods to production classes solely for testing.

```ts
// Bad: this exists only for tests
class TokenStore {
  _clearForTesting() { ... }
}
```

If you can't test the class through its public API, the API is insufficient — not the tests.

**Fix**: Test through the public API. If a behavior can't be verified through public methods, either the behavior is implementation detail (don't test it) or the API is incomplete (add a real method).

## Testing Implementation, Not Behavior

**Symptom**: Tests that break when the implementation changes but the behavior is preserved.

```ts
// Bad: tests that `fetchUser` calls `http.get` with specific args
expect(http.get).toHaveBeenCalledWith('/api/users/1')
```

**Fix**: Test the outcome, not the mechanism.

```ts
// Good: tests that `fetchUser` returns the right user
const user = await fetchUser('1')
expect(user.name).toBe('Alice')
```

## The Giant Test

**Symptom**: A test that sets up 50 lines of state, calls 10 methods, and asserts 20 things.

```ts
// Bad: 80-line test that tests the entire workflow
it('handles the full auth flow', () => {
  // 50 lines of setup
  // 10 method calls
  // 20 assertions
})
```

**Fix**: One behavior per test. If the name has "and", split it.

```ts
it('rejects expired tokens', () => { ... })
it('rejects tokens with invalid signatures', () => { ... })
it('accepts valid tokens', () => { ... })
```

## The Meaningless Test

**Symptom**: A test that always passes regardless of implementation.

```ts
// Bad: tests nothing
it('has a login function', () => {
  expect(login).toBeDefined()
})
```

**Fix**: Test behavior, not existence.

```ts
it('returns a session token on successful login', async () => {
  const token = await login('user@example.com', 'correct-password')
  expect(token).toMatch(/^sess_[a-f0-9]{32}$/)
})
```

## The Flaky Test

**Symptom**: A test that sometimes passes and sometimes fails with no code changes.

Common causes:
- Race conditions (tests don't wait for async operations)
- Time dependencies (`setTimeout` instead of event-based waiting)
- Shared mutable state between tests
- External service dependencies (network calls in tests)
- Test order dependencies (test B assumes test A ran first)

**Fix**: Make tests deterministic. Use event-based waiting instead of timeouts. Reset state between tests. Mock external services.

## The Coverage-Chasing Test

**Symptom**: A test that exercises every line but verifies nothing.

```ts
// Bad: 100% coverage, 0% confidence
it('handles input', () => {
  const result = process('anything')
  // No assertions — just "exercising the code"
})
```

**Fix**: Assert the correct output. Coverage is a side effect of good tests, not the goal.

## The Mirror Test

**Symptom**: A test that repeats the implementation logic.

```ts
// Implementation
function double(n: number): number {
  return n * 2
}

// Bad: same logic, different notation
it('doubles numbers', () => {
  expect(double(3)).toBe(3 + 3) // 3 + 3 === n * 2, just different syntax
})
```

If the implementation has a bug (`return n + 2`), the test has the same bug (`3 + 2 = 5`, test expects `6` — wait, no, `3 + 3 = 6`). This is why tests-after fail: they're biased by the implementation.

**Fix**: Use literal expected values computed independently.

```ts
// Good: expected value computed by hand, not by copying the implementation
it('doubles numbers', () => {
  expect(double(3)).toBe(6) // 6 is the known correct answer
})
```
