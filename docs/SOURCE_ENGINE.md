# CICAN MOVIES — Source Engine

## Purpose

The Source Engine separates **movie identity** from **where a movie can be watched**.

One movie may have many sources. A source can be:

- `embed` — a provider-supported embedded player
- `media` — a directly playable media file supplied by a permitted source
- `external` — a legitimate source page that remains outside CICAN

## Resolution pipeline

1. Normalize the search.
2. Search the CICAN index.
3. Query enabled provider adapters.
4. Resolve provider metadata into the CICAN movie schema.
5. Deduplicate by normalized title/year.
6. Merge sources.
7. Rank title matches.
8. Put playable sources ahead of external sources.

## Provider policy

CICAN is designed for broad discovery, but each provider adapter must respect that provider's technical and legal permissions.

CICAN does not defeat DRM or access controls, extract protected streams, re-host copyrighted movies without authorization, or strip provider protections.

CICAN can index legitimate free sources, use official APIs, use supported embeds, play directly supplied media where the source permits it, and link to sources when embedding is unavailable.

## Scale architecture

The browser is the beginning, not the final crawler. Production ingestion should eventually run server-side:

Provider APIs / feeds / archives
→ ingestion jobs
→ source policy and rights checks
→ movie normalization
→ deduplication
→ health checks
→ search index
→ CICAN frontend

This allows the catalogue to grow without shipping a massive data file to every visitor.

## Current live adapter

### Internet Archive

The first provider adapter searches Internet Archive movie metadata, resolves item metadata, detects common playable media formats, and creates a CICAN media source when a playable file is supplied. If direct playback is unavailable, it retains the item's source page.

The adapter deliberately does not infer copyright clearance merely because a file is publicly accessible. Rights information must be reviewed by the ingestion layer before a source is promoted as cleared.

## Planned provider layers

- official YouTube API/search integration
- public-domain film repositories
- creator-authorized catalogues
- libraries and archives
- free streaming services with permitted playback
- provider-specific embed adapters
- automated source health checks
- freshness monitoring
- large-scale ingestion
- deduplication and title/year matching
- resilient multi-source playback selection

The product objective is:

**SEARCH → FIND → PLAY**

with maximum practical coverage of legitimately accessible free movies.
