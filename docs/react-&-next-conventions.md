# React & Next.js conventions

- Use function components and keep each component focused on one clear responsibility.
- Keep state as close as possible to where it is used. Lift state only when multiple components genuinely need to coordinate through it.
- Do not copy query data into local state. Reserve local state for temporary interface and form.
- Avoid effects for values that can be derived during render. Use memolzation only when it privents measured work or stabilizes a meaningful dependency.
- Use stable domain identifiers for list keys rather than array indexes.
- Name event handlers with a `handle` prefix and callback props with an `on` prefix.
- Keep forms keyboard accessible, associate every control with a label, and announce validation or server errors.
- Represent loading, error, empty, pending, and successful states where they apply.
- Extract a component or hook when doing so clarifies ownership or enables genuine reuse, not solely to reduce line count.
- Preserve focus intentionally when opening and closing modal interfaces.