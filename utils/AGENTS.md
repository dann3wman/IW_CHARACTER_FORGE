# Storage expectations for utilities

These guidelines apply to storage-related helpers under `utils/`.

- Prefer IndexedDB as the primary persistence layer, with an in-memory fallback when the database is unavailable.
- When bypassing IndexedDB (such as during fallback or feature detection), clone values before returning them to avoid cross-reference mutation.
- Preserve existing `DEFAULT_PROJECT_SETTINGS` keys to maintain backward compatibility for previously saved projects.
- Keep default project seeding idempotent so repeated initialization does not duplicate or mutate baseline records.
- When extending stored shapes, add fields in a backward-compatible way (e.g., optional properties with sensible defaults) so existing data remains readable without migration errors.
