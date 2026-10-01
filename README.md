# CICAN MOVIES

**Search the movie world. Find a free source. Play.**

CICAN MOVIES is a player-first movie discovery platform focused on making free, legitimately accessible films easier to discover and watch through one clean, fast, mobile-first experience.

## Core product

**SEARCH → FIND → PLAY**

The player is the centre of the product. CICAN should not become another movie encyclopedia. Metadata exists to resolve and play a movie, not to overwhelm the user.

## Product principles

- Search broadly for free and legitimately accessible movie sources.
- Prefer sources that permit embedded playback.
- Use a unified CICAN viewing experience where technically and legally permitted.
- If embedding is unavailable, provide the legitimate source link rather than bypassing it.
- Never download, re-host, strip provider protections, bypass access controls, or deliberately facilitate copyright infringement.
- Build a source-adapter architecture so different providers can be integrated without rebuilding the player.
- Validate source health and prefer working sources.
- Keep the experience exceptionally simple: search, find, play.
- Preserve a clean black/white CICAN visual identity and strong mobile usability.
- Expand the catalogue through automation and structured ingestion rather than manually hard-coding thousands of movies.

## Architecture

```
CICAN MOVIES
    │
  SEARCH
    │
MOVIE RESOLVER
    │
SOURCE ENGINE
    │
SOURCE VALIDATION
    │
PLAYER ADAPTERS
    │
CICAN PLAYER
    │
  WATCH
```

## V1

The initial implementation contains:

- CICAN landing/search interface
- responsive mobile-first styling
- movie result cards
- movie/player view
- source abstraction
- embeddable-source adapter path
- external-source fallback path
- initial catalog schema

The demo catalog is intentionally minimal. The next development stages should replace it with a validated ingestion/indexing pipeline rather than filling the repository with arbitrary links.

## Autopilot development rule

When continuing the project, use the existing repository state as the source of truth. Preserve working behaviour, inspect before changing, test each meaningful increment, and move the architecture toward the agreed goal without requiring the user to restate the project direction.

## Long-term direction

CICAN MOVIES aims to become a large search-and-play system for free, legitimately accessible movies:

**Search anything → find an available free source → play through the best possible CICAN experience.**

Created by **CICAN GEORGE ALIN**.
