# Interface Registry
> Register before coding. Unregistered exports = scope creep.

## auth/login
login(email: str, password: str) → Session    # authenticate, returns signed token
logout(sessionId: str) → void                  # end session, clear cache

## auth/token-store
class TokenStore(dir: str)
  set(userId: str, token: str) → void          # persist encrypted
  get(userId: str) → str | null                # null if missing/expired
  delete(userId: str) → void                   # remove + clear cache
