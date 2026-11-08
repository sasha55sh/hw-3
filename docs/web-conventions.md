# Web conventions

- A component may use `fetch` directly for one-off actions that do not need caching.
- Keep components self-contained; colocate request calls and local types with the component using them.
- Forms should use controlled inputs. React Hook Form is preferred for forms with validation or more than two flelds.
- Use existing colors and spacing where practical.
- Pages and layouts are server components by default. Only add `'use client'` when the file needs state, effects, browser APIs, or Firebase.
- Pages compose layouts, hooks and components. No data mapping, no business rules, no large JSX trees — a page over ~100 lines means a component is missing.
- Page content is wrapped in `<MaxWidthWrapper>`.
- File names are kebab-case (`move-to-device-card.tsx`).
- `export function`, named, no default export. Not `const X = () => {}`. Pages and layouts under `app/` are the only default exports (Next requires it).
- `className` merged via `cn()`, then `{...props}` spread last.

Include useful loading and error feedback. Empty states are required for primary pages but optional inside dialogs.
Use semantic HTML and support keyboard interaction. Follow-up accessibility improvements may be tracked separately when they would significantly increase the scope of a small feature.