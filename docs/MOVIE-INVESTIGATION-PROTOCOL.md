# CICAN MOVIES — MOVIE INVESTIGATION & PUBLICATION PROTOCOL v1.0

Date: 2026-10-02

## Purpose

This protocol is the per-movie quality gate used after the Global Source Map and before a film is allowed into the live CICAN MOVIES catalogue.

The Source Map defines **where to hunt**. This document defines **how to investigate every individual movie**.

The goal is not to claim impossible certainty. The goal is reproducible, evidence-based publication with conservative rejection when an important fact cannot be established.

---

## 1. Non-negotiable publication rule

A discovered title is a **candidate**, not a catalogue movie.

A movie becomes **CATALOG_READY** only when the required identity, feature integrity, language, rights, source provenance, playback and duplicate checks pass.

If a critical check is unresolved:

**DO NOT PUBLISH.**

Keep the title as a candidate / unresolved item for later investigation.

Never fill an evidence gap with an assumption.

---

## 2. Investigation identity card

Every investigated title must resolve, as far as evidence permits:

- canonical title
- original/native title
- international/English title
- alternate titles
- release year
- country/territory
- director
- original language
- script where relevant
- approximate/runtime
- source institution/platform
- source URL
- source type
- rights state
- playback state
- subtitle availability
- duplicate identity
- evidence notes

Where reliable sources disagree, preserve the disagreement and investigate rather than silently selecting a value.

---

## 3. Evidence hierarchy

Prefer evidence in this order:

1. National film archive / cinematheque / official cultural institution
2. National audiovisual archive or broadcaster
3. FIAF / FIAT-IFTA / IASA member institution or catalogue
4. National library / university / museum archive
5. Official restoration or rightsholder source
6. Authoritative cultural-heritage aggregator pointing to an identifiable institution
7. Legitimate open-media repository with item-level licence/provenance
8. Official/authorized video channel or embed
9. Secondary film databases only as supporting identity/discovery evidence

Search engines and ordinary aggregators are discovery tools, not rights evidence by themselves.

No single database is automatically treated as authoritative for every field.

---

## 4. Identity gate

Confirm the film is the same work across the relevant sources.

Check:

- title
- native title
- year
- director
- country
- runtime
- principal production identity
- alternate/transliterated titles

If two films share a title, resolve them separately.

If the year or identity is uncertain, do not merge records.

---

## 5. Feature-film integrity gate

Reject or hold candidates that are:

- trailers
- teasers
- clips
- excerpts
- fragments
- incomplete reels
- episodes
- television series entries
- interviews
- promotional material
- compilations that are not the identified feature
- fan edits that materially alter the work

Verify that the playable source represents the complete feature whenever the source claims to host the complete film.

Runtime is evidence, not the sole proof of completeness.

For silent/early cinema, restoration differences can affect runtime; investigate version lineage before rejecting a legitimate variant.

---

## 6. Language gate

Determine the **original audio language** from evidence, not from country alone.

Record:

- originalLanguage
- originalTitle
- nativeTitle
- audioLanguages
- subtitleLanguages
- script when useful

Original audio remains the canonical language identity.

A translated title, English metadata page, dub or subtitle does not change the original language.

For multilingual films, record the relevant language set and investigate the production/version context.

---

## 7. Rights gate

Rights are checked for the **specific work and specific playback source**.

Possible states:

- PUBLIC_DOMAIN_VERIFIED
- CC0_VERIFIED
- CC_BY_VERIFIED
- OTHER_OPEN_LICENSE_VERIFIED
- AUTHORIZED_RIGHTSHOLDER
- AUTHORIZED_ARCHIVE
- AUTHORIZED_EMBED
- PERMISSION_REQUIRED
- RIGHTS_UNCLEAR
- RIGHTS_RESTRICTED
- REJECTED_RIGHTS

Important rules:

- A hosting platform is not itself a rights grant.
- A film being old does not automatically prove public-domain status in every jurisdiction.
- A public-domain claim must be supported by relevant evidence.
- A Creative Commons label must be checked at item level.
- An archive's ownership of a physical print does not automatically mean CICAN has reuse rights.
- An official upload is strong provenance evidence but does not automatically establish every possible reuse right.
- Discovery evidence and playback authorization are separate.

If the rights basis for the intended CICAN playback method is unclear, the title does not enter the playable catalogue.

---

## 8. Source provenance gate

For the actual playback source, establish:

- who provides it
- what institution/channel/account controls it
- what media is being played
- whether the source is an authorized embed, direct media source, or other permitted method
- source URL
- relevant licence/rights statement
- date checked

Prefer stable institutional or rightsholder provenance over anonymous mirrors.

Do not use piracy indexes, torrents, unauthorized mirrors or circumvention sources as acquisition sources.

---

## 9. Playback gate

Verify that the source actually corresponds to the intended film.

Check:

- source loads
- media is playable
- title/version matches
- feature is complete or appropriately documented as a specific authorized version
- runtime is plausible
- source is not merely a metadata page
- embed/direct-media method is permitted
- source is not obviously broken

A discovery record without a verified playback path remains discovery-only.

---

## 10. Subtitle gate

Subtitles are a separate capability.

Record:

- whether subtitles exist
- subtitle language(s)
- whether the subtitle file/track belongs to the same film/version
- source/provenance of the subtitle track
- whether the subtitle track can legally be used with the playback source

Never imply that subtitles exist merely because a platform offers subtitles generally.

Do not replace original audio with a dub simply because subtitles are unavailable.

---

## 11. Duplicate gate

Before import, compare:

- canonical title
- original title
- year
- director
- country
- alternate titles
- known source IDs
- runtime/version information

The same film may have multiple legitimate sources. Prefer **one movie identity with multiple verified source records**, rather than multiple movie entries.

Different restorations or materially different versions should be linked as versions where appropriate rather than accidentally duplicated.

---

## 12. Source fallback

A film may have several investigated sources:

Movie
→ primary authorized source
→ secondary authorized source
→ archive embed
→ open licensed source

Fallback sources are attached to the same canonical movie identity after independent verification.

One bad source does not automatically invalidate a movie if another lawful, verified playback source exists.

One lawful source does not automatically clear another source.

---

## 13. Evidence confidence

Use a conservative internal result:

### PASS
All critical gates have sufficient evidence.

### HOLD
The movie may be legitimate, but one or more important fields require further investigation.

### REJECT
The evidence indicates the candidate should not enter the catalogue.

There is no requirement to manufacture a numerical confidence score.

The operational principle is:

**Evidence complete enough to publish = PASS.  
Important unresolved question = HOLD.  
Evidence against publication = REJECT.**

---

## 14. Investigation record

For each PASS movie, retain enough evidence to reproduce the decision:

- identity sources
- rights source/evidence
- playback source
- language evidence
- subtitle evidence where applicable
- runtime/version evidence
- duplicate check
- date checked
- final publication state

Negative knowledge is also useful: record why strong-looking candidates were rejected or held so the same work is not repeated unnecessarily.

---

## 15. Final publication gate

Before adding a title to the live catalogue, answer:

1. What exact film is this?
2. Is it actually the intended feature?
3. Is it complete enough for the claimed version?
4. What is its original language?
5. What are its canonical/native titles?
6. What is the release year?
7. What country/production identity applies?
8. Who provides the playback source?
9. What is the rights basis for using that source?
10. Is the playback method authorized/appropriate?
11. Does the source actually play?
12. Are subtitles available, and are they attributable to this film/version?
13. Is the film already in CICAN under another title?
14. Are all critical evidence fields recorded?
15. Would the decision still be defensible if the discovery source disappeared tomorrow?

If any critical answer is unknown:

**HOLD — DO NOT PUBLISH.**

---

## 16. Batch publication rule

Movies are added in verified batches, not one unverified discovery at a time.

Batch flow:

DISCOVER
→ INVESTIGATE EACH MOVIE
→ PASS / HOLD / REJECT
→ DEDUPLICATE
→ IMPORT PASS ITEMS
→ RUN MOVIE INTEGRITY VALIDATOR
→ RUN PLAYER VALIDATOR WHEN SOURCE/PLAYER CODE CHANGES
→ DEPLOY
→ VERIFY
→ RECORD BATCH

A failed batch must never leave the catalogue in a knowingly corrupted state.

---

## 17. Relationship to the Global Source Map

The two documents have different jobs:

**GLOBAL-SOURCE-MAP.md**
= where CICAN searches and how source exhaustion works.

**MOVIE-INVESTIGATION-PROTOCOL.md**
= how CICAN decides whether one discovered movie is safe and sufficiently verified for publication.

Together:

SOURCE MAP
→ DISCOVERY
→ MOVIE INVESTIGATION PROTOCOL
→ CATALOGUE
→ PLAYBACK
→ SUBTITLES
→ A–Z WEBSITE

Neither document claims impossible 100% certainty. Both are designed to minimize false positives and preserve an auditable path from discovery to publication.

---

## 18. Locked operating principle

For CICAN MOVIES:

**A large catalogue is not the objective by itself.**

The objective is a large catalogue in which each published movie has a defensible identity, source, rights basis, playback path and language record.

When evidence is insufficient, CICAN waits.

**QUALITY GATE BEFORE QUANTITY.**


## Rejected / Held Research Ledger

Every investigated candidate that does not enter the public catalogue must be preserved in `docs/REJECTED-MOVIE-LEDGER.md`. A failed current investigation is not necessarily a permanent rejection.

For each held/rejected candidate, preserve the title, year, investigation date, discovery/playback sources investigated, rights and jurisdiction findings, feature/playback/subtitle findings, exact reason for the current hold, missing evidence, and a concrete re-investigation target. These candidates remain excluded from the public catalogue and must never affect the public movie count.

Future Continue cycles should update existing ledger entries rather than creating duplicates. When new evidence resolves all blocking issues, the candidate may be promoted through the normal investigation gates and added to the public catalogue.
