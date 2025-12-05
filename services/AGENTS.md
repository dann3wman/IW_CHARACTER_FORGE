# Service Layer Guidance

This document applies to all files under `services/`.

- Defer API client instantiation until a user-supplied key or configuration is available. Avoid creating clients during module load before runtime credentials are present.
- Do not rely on global singletons that read environment variables prematurely; initialize clients within well-scoped factories or request handlers once all configuration is known.
- Centralize error logging and handling expectations: surface meaningful messages, ensure errors are captured in shared helpers, and avoid duplicating ad-hoc logging.
- Validate API/model responses against explicit schemas before use. Reject or sanitize data that fails validation to keep downstream consumers safe.
