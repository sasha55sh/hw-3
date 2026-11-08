# Testing conventions

- Do not add automated tests; all changes are verified manually.
- Do not perform additional testing or verification after implementing a feature unless explicitly requested.

When I would write use `prepare to commit`, run: 

```bash
npm typecheck
npm build
```

For web changes also run `npm lint`.
