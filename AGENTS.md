<!-- BEGIN @pterodactor3000/silica-animus -->

# Team Engineering Conventions

These conventions apply to all code in this repository. Adapt names, framework rules, testing policy, and security expectations to your stack before treating them as exhaustive.

## Naming

- Variables and functions: descriptive camelCase (no abbreviations except `url`, `id`, `api`, `config`)
- Booleans: prefix with `is`, `has`, `should`, `can`
- Functions: verb-first (`getUserById`, not `user`)
- Files: match primary export (`UserService.ts` exports `UserService`)
- Constants: UPPER_SNAKE_CASE

## Error Handling

- All async operations: try/catch or `.catch()`
- Error messages include what operation failed and the relevant inputs
- No empty catch blocks; at minimum, log or rethrow the error
- HTTP errors include status code and actionable message
- Cleanup belongs in `finally` blocks when resources are opened

## TypeScript

- Zero `any` without explicit justification comment
- Prefer `interface` over `type` for object shapes
- Use `unknown` for external data, narrow with type guards
- Model states with discriminated unions, not optional fields
- Generic params: descriptive names (`TUser`, not `T`)

## Functions

- Single responsibility; if you need "and" to describe it, split it
- Max 3 parameters; use an options object beyond that
- Early returns over nested conditionals
- Query functions (`get*`, `find*`, `is*`) must be pure

## Security

- No secrets in code; environment variables only
- Validate user input at system boundaries
- SQL: parameterized statements only
- API responses never leak stack traces or internal paths

## Testing

- Test names describe behavior: "returns empty array when no results found"
- Each test owns its setup and teardown
- Specific assertions: `toEqual(expected)` instead of `toBeTruthy()`
- Cover edge cases: empty, null, boundary values and error paths
<!-- END @pterodactor3000/silica-animus -->

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <imperative summary>
```

- Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `style`, `revert`
- Scope is optional; use a short area name (`auth`, `api`, `ui`, `db`)
- Subject: imperative mood (`add`, `fix`, `remove`), no trailing period, ≤72 chars
- Focus on why, not a file list; the diff already shows what changed
- Body only when needed: non-obvious why, breaking changes, migrations, linked issues
- Breaking changes: append `!` after type/scope, and explain in a `BREAKING CHANGE:` footer
- No emoji, no AI attribution, no "This commit does…" filler

Examples:

```
feat(auth): add session cookie validation
fix(db): prevent double-count on concurrent tally writes
docs: clarify roadmap slice acceptance criteria
feat(api)!: rename /v1/orders to /v1/checkout

BREAKING CHANGE: clients must migrate to /v1/checkout; old route returns 410
```
