# NOVA v2.22.0 — Cognitive Memory 2.0

NOVA v2.22 adds a provenance-aware, non-destructive cognitive memory layer on top of the v2.21 architecture.

## What changed

- Episodic-style claim ledger with structured subject/predicate/object support
- Provenance and authority metadata on stored claims
- Credential/secret storage guardrails
- Deterministic conflict detection for competing claims
- Auditable conflict resolution with supersession instead of silent overwrite
- Relevance-ranked cognitive retrieval
- Non-destructive consolidation proposals
- Temporal validity fields (`validFrom`, `validTo`)
- Cognitive memory status/data/policy endpoints
- New `🧠 Cog Memory` control in the NOVA UI

## Important architecture rule

Consolidation does not silently rewrite NOVA's identity, planner, safety rules, or source evidence. Original claims remain recoverable and conflict resolution is recorded in an append-only-style event history.

## Run

1. Import into a Replit Node.js project.
2. Replit installs dependencies from `package.json`.
3. Run `npm start`.
4. Add provider credentials through Replit Secrets if you want an external reasoning provider.

`node_modules` is intentionally not included. Generate/commit `package-lock.json` after a successful install for reproducible deployments.

## Cognitive Memory API

- `GET /api/nova/cognitive-memory`
- `GET /api/nova/cognitive-memory/policy`
- `GET /api/nova/cognitive-memory/data`
- `GET /api/nova/cognitive-memory/search?q=...`
- `GET /api/nova/cognitive-memory/conflicts`
- `POST /api/nova/cognitive-memory`
- `POST /api/nova/cognitive-memory/consolidate`
- `POST /api/nova/cognitive-memory/conflicts/:id/resolve`
- `DELETE /api/nova/cognitive-memory/:id`

Data defaults to `.nova-data/cognitive-memory.json`; override with `NOVA_MEMORY_DIR`.
