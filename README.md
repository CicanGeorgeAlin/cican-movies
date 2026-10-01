# CICAN MOVIES

**Search the movie world. Find it. Play it.**

CICAN MOVIES is a player-first movie discovery platform designed to search a large network of free and legitimately accessible movie sources and give the user the cleanest available viewing path.

## The core idea

**SEARCH → FIND → PLAY**

CICAN is not intended to become another movie encyclopedia. Metadata exists to identify a movie and resolve a playable source.

The long-term goal is a very large catalogue assembled from many independent archives, APIs, feeds, official uploads, public-domain collections, creator-authorized sources, and other providers whose playback can be used appropriately.

## What makes CICAN different

- One search experience across many source providers.
- One movie can have multiple independent sources.
- Playable sources are prioritized.
- Supported embedded players can appear inside the CICAN player experience.
- Direct media supplied by permitted sources can play through the browser's native media player inside CICAN.
- Sources that cannot be embedded remain available as legitimate external sources.
- Source failures can eventually trigger another available source.
- The catalogue is designed for automated expansion rather than manually hard-coded entries.
- The visual experience stays extremely simple: search, find, play.

## Source policy

CICAN is built for broad discovery, but every provider adapter must respect the provider's technical and legal permissions.

CICAN does not:

- defeat DRM or access controls;
- extract protected streams;
- bypass provider restrictions;
- re-host copyrighted movies without authorization;
- strip provider protections;
- deliberately facilitate copyright infringement.

CICAN can:

- index legitimate free sources;
- use official APIs and feeds;
- use provider-supported embeds;
- play directly supplied media when the source permits it;
- retain legitimate external links when embedding is unavailable;
- maintain multiple sources for resilience.

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
             ┌─────────────┼─────────────┐
             ↓             ↓             ↓
        LOCAL INDEX   ARCHIVE/APIs   PROVIDER ADAPTERS
             └─────────────┼─────────────┘
                           ↓
                    SOURCE VALIDATOR
                           ↓
                  PLAYBACK RESOLVER
                           ↓
                     CICAN PLAYER
                           ↓
                         WATCH
```

## Current implementation

The repository currently contains:

- mobile-first CICAN landing/search interface;
- result and movie views;
- source abstraction;
- asynchronous source resolution;
- Internet Archive provider adapter;
- centralized provider registry for controlled source expansion;
- optional official YouTube search adapter using the YouTube Data API;
- Wikimedia Commons video provider using the official MediaWiki API;
- embedded-player path;
- direct-media playback path;
- external-source fallback;
- normalized movie/source schema;
- source-engine documentation;
- a preserved V1 demo branch.

## Wikimedia Commons video search

CICAN can search Wikimedia Commons through the official MediaWiki API and resolve file metadata for video results. Wikimedia documents open API access and media metadata through its API ecosystem. citeturn0search7turn0search9

CICAN keeps these sources in `review` status by default because public availability and a displayed license are not the same thing as a universal clearance determination. The source page and license metadata remain available to the user.

## Optional YouTube search

CICAN includes an optional YouTube search adapter built around the official YouTube Data API. It activates only when a YouTube API key is explicitly configured; the browser never attempts to scrape YouTube search pages. The API's search method is quota-controlled, so this provider is deliberately optional and bounded. citeturn0search0turn0search1

## Internet Archive foundation

Internet Archive is the first real provider adapter. CICAN can search movie metadata, inspect item metadata, detect common playable formats, and present an appropriate playback route.

A publicly accessible file is not automatically treated as copyright-cleared. The source record preserves that distinction so future ingestion can apply explicit rights verification before promoting material as cleared.

## Production-scale roadmap

### Phase 1 — Source Engine
- provider adapters;
- normalized source schema;
- source capability detection;
- source ranking;
- multiple-source records.

### Phase 2 — Archive Expansion
- Internet Archive ingestion;
- public-domain collections;
- authorized archives;
- creator-authorized sources;
- official free movie catalogues.

### Phase 3 — CICAN Player
- provider adapters;
- fullscreen;
- playback memory;
- subtitles where supplied;
- source switching;
- error recovery;
- mobile controls.

### Phase 4 — Massive Index
- server-side ingestion;
- deduplication;
- title/year/entity matching;
- source health checks;
- freshness checks;
- incremental indexing;
- scalable search.

### Phase 5 — CICAN Search Engine
```
Search a movie
      ↓
Identify the movie
      ↓
Search the source network
      ↓
Check availability
      ↓
Select the best permitted playback path
      ↓
PLAY
```

## Autopilot development rule

When the user says **Continue**, treat the repository and this README as the source of truth.

For each continuation:

1. inspect the current implementation;
2. preserve working behaviour;
3. identify the next highest-value technical improvement;
4. implement it;
5. test what can be tested;
6. document important architecture changes;
7. keep the project moving toward the massive search-and-play vision.

The user can intervene at any time with questions or creative decisions; technical implementation remains the default responsibility of the development process.

Created by **CICAN GEORGE ALIN**.


## Product direction — CICAN beyond Movies

Movies remain the first vertical and the current benchmark. The underlying architecture is being expanded toward a video-first search and playback engine.

Long-term content types include movies, TV, documentaries, education, music, news, sports, gaming, short videos, live video, lectures and archives.

The product principle is:

**SEARCH → FIND → PLAY**

The interface stays simple while the underlying system handles identification, source resolution, permitted playback, source fallback, sharing and future video intelligence.

### Player direction

The CICAN Player is designed around:
- cinematic fullscreen playback
- voice search
- sharing and deep links
- playback resume
- source switching and recovery
- subtitles/captions where supplied
- chapters/key moments where available
- Picture-in-Picture where supported
- mobile and keyboard controls
- legitimate download options only when a source explicitly permits downloading

### Voice search

CICAN now has a progressive-enhancement voice-search foundation using the browser speech-recognition capability when available. The microphone button turns spoken requests into normal CICAN searches; unsupported browsers keep the normal text search.

### Core principle

**Power underneath. Simplicity on top.**
