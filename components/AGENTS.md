# Component usage guidelines

This guidance applies to files in `components/`.

- Favor existing shared components (modals, inputs, selectors, charts) before creating new ones to keep behaviors and styling consistent. When introducing a new pattern, extract it into a reusable component so other screens can adopt it.
- Align spacing, typography, and color usage with the tokens defined in `constants.ts` and any shared styles. Avoid ad-hoc inline styles when styled utilities or CSS classes already exist.
- Keep layouts responsive: verify component behavior on narrow and wide viewports, and reuse existing responsive helpers from sibling components for consistency.
- Keep props narrowly typed and consistent across components. Reuse prop shapes from `types.ts` or existing components when possible to avoid divergent interfaces.
- Preserve accessibility affordances (ARIA labels, focus management) used by existing UI elements when reusing or extending components.
