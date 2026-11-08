## TypeScript conventions

- Keep TypeScripts strict and resolve type errors instead of weakening compiler options.
- Avoid `any`. Treat data from requests, responses, and other external boundaries as `unknown` untill it has been validated or narrowed.
- Prefer inference for local implementation details and explicit types at exported package boundaries.
- Use import type for type-only imports.
- Prefer discriminated unions when modeling a fixed set of states or outcomes.
- Avoid type assertions and non-null assertions unless the invariant is guaranteed and clear from nearby code.
- Mark values `readonly` when callers should not sutate thes, and avoid mutating objects received from other layer.
- Choose descriptive domain names instead of generic names such as `Data`, `Item`, or `Result`.
- Do not add comments to TypeScript code even if they are necessary to explain non-obvious behavior or a deliberate workaround.
- 3+ branches on one value: `switch` or a lookup map, not an if/else chain.
- Never more than one `?:` in one expression or JSX node.
- A mode with 3+ mutually exclusive states is a union type.

- Every TS file shold be tested following `docs/testing-conventions.md` when I ask for it with the help of `prepare to commit`