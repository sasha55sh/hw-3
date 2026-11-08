# Tailwind conventions 

- Use Tailwind CSS and reuse existing design tokens and shared values before introducing new ones.
- Build layouts mobile-first, then add responsive variants for larger breakpoints.
- Order Tailwind classes in className from base/mobile styles → responsive breakpoints → states and interaction variants → effects and animations.
- Prefer Flexbox and Grid for layout instead of fixed positioning.
- Prefer responsive and relative units through Tailwind utilities; use fixed values only where appropriate.
- Provide visible focus-visible styles for interactive elements and never remove focus indicators without an accessible replacement.
- Ensure hover-only information is also accessible to keyboard and touch users.
- Respect prefers-reduced-motion for nonessential animations.
- Maintain sufficient text and control contrast against the dark interface.
- Keep transitions restrained and limit them to properties that do not cause unnecessary layout shifts.
- Fonts are tokens too: `font-playwrite` (display/brand) and `font-manrope` (UI text).
- Never hardcode a hex value in a className. If the colour is missing, add it to `@theme inline` first.
- Conditional classes go through `cn()` with `&&` or a single `?:`, never string concatenation: `cn(base, isActive ? 'text-warm-gold' : 'text-soft-lavender', className)`.
- Icon-only controls get `aria-label`, decorative icons get `aria-hidden`.