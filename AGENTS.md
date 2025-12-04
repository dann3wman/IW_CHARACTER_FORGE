# Guidance for IW_CHARACTER_FORGE Contributors

This document applies to all files in this repository unless a more specific `AGENTS.md` exists further down the tree.

## Working style
- Favor idiomatic React with functional components and hooks. Keep shared types in `types.ts` and reuse helpers in `utils/` and `services/` rather than duplicating logic.
- Prefer explicit TypeScript types over `any`. Keep prop and state shapes narrowly defined and colocated near their usage or in `types.ts` when shared.
- Keep UI changes accessible: provide clear text labels, sensible keyboard focus ordering, and avoid introducing color-only distinctions.
- Avoid storing secrets or API keys in the repository. Any keys should be supplied via runtime configuration.

## Dependency and file hygiene
- Do not edit files inside `node_modules/`. Add new third-party packages only when necessary and document their purpose.
- Preserve existing formatting and naming conventions. Keep imports ordered logically (React first, then local utilities and types) and remove unused code when you touch a file.

## Testing and verification
- For changes that affect code behavior, run `npm run build` to ensure the project still compiles. Add any additional targeted checks you believe are relevant.
- Documentation-only changes (including updates limited to Markdown) do not require running tests or build commands, but mention the skip in your summary.

## Pull requests and summaries
- Keep PR descriptions concise: list the high-level changes and note any user-facing impacts or risk areas. Mention if tests were skipped and why.
- When adding new instructions or documentation, call out the intended scope so future contributors understand where the guidance applies.
