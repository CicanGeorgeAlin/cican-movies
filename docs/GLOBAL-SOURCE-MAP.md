# CICAN MOVIES — GLOBAL SOURCE MAP & ACQUISITION STRATEGY v1.1

Date: 2026-10-02

Purpose: Build the largest legitimate, accurately catalogued, internationally representative movie collection CICAN can discover and play.

## 1. Core principle

CICAN MOVIES is global and language-first.

For every country and every language with a meaningful cinema tradition, the hunting process must actively seek films in their original audio language. Romanian cinema is the model: Romanian films should be catalogued as Romanian-language films, not replaced by English versions. Subtitles are a separate metadata/playback layer.

Original language must be preserved even when an English dub or subtitle exists. Translated titles, aliases and subtitles improve discovery; they do not replace the original language.

## 2. What “source complete” means

We cannot honestly prove that no additional movie URL will ever exist anywhere on the internet. New uploads, digitisation projects and private collections appear continuously.

Therefore CICAN uses a stronger operational definition:

Source-complete baseline = every major global source class and every discoverable authoritative archive/index has been mapped, searched or queued for systematic country/language exhaustion, with rights status recorded.

Anything discovered outside the map is added to the Source Map rather than silently becoming an unverified source.

## 3. Source hierarchy

### A. Primary film-archive network
1. National film archives
2. Cinematheques
3. National audiovisual institutes
4. FIAF member/associate institutions
5. Regional film archives
6. University film archives
7. Museum film collections
8. Film restoration institutions
9. Specialist cinematheques

FIAF's live directory is a core discovery index. FIAF's Online Directory is searchable by institution, city and country and is updated frequently. FIAF also maintains a separate catalogue/database index of film and audiovisual collections. [FIAF directory and collection catalogues are discovery indexes; individual access/rights must still be checked.]

### B. National audiovisual / broadcaster network
For every country:
1. National public broadcaster
2. National television archive
3. Radio/TV audiovisual archive
4. Government audiovisual archive
5. Regional broadcasters
6. Historical newsreel archive
7. Official broadcaster video channels

FIAT/IFTA is a global directory for broadcaster and audiovisual archives. Its member network includes national and regional broadcasters, archives and cultural institutions.

### C. National library and cultural-heritage network
1. National library
2. National digital library
3. National archives
4. City/regional archives
5. Museums
6. Heritage institutions
7. Cultural institutes
8. Historical societies
9. University libraries
10. Digital humanities repositories

### D. Global aggregators / discovery indexes
1. Europeana
2. European Film Gateway
3. Filmarchives Online / MIDAS
4. Digital Public Library of America
5. DigitalNZ
6. Trove
7. WorldCat and library discovery systems
8. UNESCO Memory of the World
9. FIAF Directory
10. FIAF Film/AV Collection Catalogues and Databases
11. FIAT/IFTA directory and resources
12. EUscreen
13. Other national/regional cultural-heritage aggregators discovered during country passes

EUscreen is a major additional European audiovisual discovery layer: it provides free access to thousands of archival audiovisual items and connects a network of 40+ members from almost 30 European countries. Its material may link back to the original provider, so item-level rights and provider terms remain decisive.

Aggregators are primarily discovery layers. The underlying institution and item rights are checked before CICAN uses a film.

### E. Open and reusable media repositories
1. Wikimedia Commons
2. Internet Archive
3. Creative Commons search ecosystem
4. Openverse
5. Open Images / Open Beelden
6. Vimeo Creative Commons
7. YouTube Creative Commons
8. Public-domain repositories
9. Openly licensed institutional repositories
10. PeerTube instances where the uploader's rights/licence can be established
11. Other open-media repositories discovered during systematic searches

Open Images is particularly useful because its audiovisual items are published under individual Creative Commons licences, provide downloadable media, and expose an OAI-PMH API for structured harvesting. Each item must still be checked for the licence and whether it is suitable for CICAN's feature-film rules.

### F. FIAF affiliate online collections
FIAF itself maintains a list of free online streaming services used by its affiliates. This list is a major hunting index and includes, among many others:
- Romanian National Film Archive / Cinemateca Română via European Film Gateway
- Academy Film Archive YouTube playlists
- Cineteca Nacional Mexico YouTube
- Cineteca Nacional Chile Online
- Italian Cineteca collections
- Danish Film Institute / Danmark på film
- German film archives
- Eye Filmmuseum / Open Images
- Filmoteca Española
- Filmoteca de Catalunya
- Filmoteka Narodowa / FINA digital repository
- Finnish Elonet / Living Memory
- IFI Irish Film Archive
- Korean Film Archive Korean Classic Film Theater on YouTube
- National Film Archive of Japan collections
- National Film and Sound Archive of Australia
- National Film Institute Hungary
- National Film Archive of Ukraine / Dovzhenko Centre
- Österreichisches Filmmuseum
- Swedish Filminstitutet / Filmarkivet.se
- Taiwan Film and Audiovisual Institute / Open Museum
- UCLA Film & Television Archive
- Yale Film Archive
- National Film Preservation Foundation Screening Room
- and many additional FIAF affiliate collections

These are discovery/access leads, not blanket reuse licences. Rights and embedding/reuse terms are verified per title.

### G. Audiovisual-archive directories beyond film-only archives
IASA maintains a worldwide database of organisations involved in sound and audiovisual archiving, searchable by country and category, with hundreds of entries. This is now a permanent CICAN discovery index because national audiovisual heritage can sit outside traditional film archives.

Use IASA to discover:
- national archives
- audiovisual archives
- university collections
- music/film archives
- regional repositories
- institutions in countries poorly represented in conventional film-archive directories

### H. Official online film platforms
Search country-by-country for:
1. Legal national cinema platforms
2. Official archive streaming portals
3. Film institute streaming portals
4. Official studio/rightsholder channels
5. Museum streaming collections
6. University streaming collections
7. Authorized restoration/preservation channels

These may be usable as playback sources, discovery sources, or permission leads depending on their terms.

## 4. Romania — first-class source model

Romania receives the same treatment as every other country, with additional attention because it is a major user-relevant language.

Romanian search layers:
- Arhiva Națională de Filme / Cinemateca Română
- CINEPUB
- TVR archive and official channels
- Romanian Film Centre / CNC
- UNATC and film-school archives
- Romanian universities
- Romanian museums and cultural institutions
- Europeana / European Film Gateway
- FIAF Romanian institutions
- FIAT/IFTA Romanian broadcaster/archive members
- IASA Romanian audiovisual institutions
- Wikimedia Commons
- Internet Archive
- YouTube official/authorized/CC/public-domain sources
- Vimeo CC/authorized sources
- Open Images/Open Beelden where Romanian material appears
- Other Romanian digital archives discovered during the country pass

The same structure is then repeated for every country.

## 5. Country × language matrix

For each country, CICAN creates a search pass for:

Country
→ national cinema
→ national film archive
→ national library
→ national broadcaster
→ government archive
→ universities/film schools
→ museums
→ cultural institutes
→ regional archives
→ FIAF institutions
→ FIAT/IFTA institutions
→ IASA institutions
→ aggregators
→ open repositories
→ YouTube
→ Vimeo
→ PeerTube
→ other discovered legal/open sources

Then repeat by:

Original language
→ native-language title searches
→ native-language archive searches
→ native-language filmmaker searches
→ native-language genre searches
→ decade/year searches
→ alternate titles/transliterations

This prevents an English-only search from hiding films.

## 6. International language rule

Every film record should distinguish:
- originalLanguage
- originalTitle
- internationalTitle
- nativeTitle
- alternateTitles
- subtitleLanguages
- audioLanguages
- sourceLanguages

The original soundtrack is the canonical language identity.

Examples:
- Romanian film: original audio Romanian; English/French subtitles are additional tracks.
- Japanese film: original audio Japanese; Romanian/English subtitles are additional tracks.
- Hindi film: original audio Hindi; English subtitles are additional tracks.

The same rule applies globally.

## 7. Rights states

Every candidate must be assigned one of:
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

Only appropriate verified states enter the playable catalogue.

A hosting platform is not itself a rights grant.

## 8. Film-integrity gate

A candidate must be checked for:
1. Feature-length status
2. Complete film
3. Not a trailer
4. Not a clip/excerpt
5. Not an episode
6. Not a series
7. Not promotional material
8. Duration consistent with the identified film
9. Correct title/year
10. Correct language
11. Correct source
12. Rights evidence
13. Playable media/embed
14. No duplicate already in catalogue
15. No obviously broken source

Existing CICAN documentary/format exclusion rules remain in force where applicable.

## 9. Discovery is not playback

A source can be:
- DISCOVERY_ONLY
- METADATA_ONLY
- RIGHTS_LEAD
- PLAYBACK_AUTHORIZED
- DIRECT_MEDIA
- AUTHORIZED_EMBED

For example, FIAF, IASA, Europeana and EUscreen can identify a film and its archive without necessarily providing CICAN with a reusable media source.

The canonical movie can have multiple verified sources:
Movie → Wikimedia source → Internet Archive source → YouTube authorized source → archive embed → other authorized source

This creates source fallback without duplicating the movie record.

## 10. Source exhaustion method

For each source:

DISCOVER
→ IDENTIFY
→ RIGHTS CHECK
→ FEATURE CHECK
→ MEDIA CHECK
→ LANGUAGE CHECK
→ DEDUPLICATE
→ IMPORT
→ PLAYBACK VERIFY
→ MARK SOURCE EXHAUSTED

Then move to the next source.

For each country:

COUNTRY PASS
→ national institutions
→ broadcaster
→ library
→ universities
→ museums
→ FIAF/FIAT/IASA
→ aggregators
→ open repositories
→ video platforms
→ native-language searches

Then mark:
COUNTRY_PASS = COMPLETE / PARTIAL / BLOCKED / CONTINUING

## 11. Permanent source-discovery loop

NEW SOURCE DISCOVERED
→ verify institution/platform
→ determine whether it is a new source class or an existing source
→ record it
→ run rights review
→ add to Source Map
→ search it systematically
→ update exhaustion status

This means the map is living, not frozen.

## 12. Sources that are discovery-only until individually cleared

Commercial streaming services, ordinary movie databases, random file-hosting sites, random social-media uploads, unofficial mirrors and ordinary search-engine results can help identify films, but they do not automatically provide CICAN with a lawful playback source.

No torrent, piracy index, unauthorized mirror or circumvention source is used as a CICAN acquisition source.

## 13. Priority source indexes

The first global indexes to exhaust are:
1. FIAF Directory
2. FIAF Film/AV Collection Catalogues and Databases
3. FIAF Affiliate Online Collections
4. FIAT/IFTA member/archive network
5. IASA audiovisual-archive directory
6. Europeana
7. European Film Gateway
8. Filmarchives Online / MIDAS
9. EUscreen
10. DPLA
11. DigitalNZ
12. Trove
13. UNESCO Memory of the World
14. Library of Congress collections
15. Wikimedia Commons
16. Internet Archive
17. Creative Commons/Openverse
18. Open Images / Open Beelden
19. YouTube
20. Vimeo
21. PeerTube
22. National archive/library/broadcaster networks
23. Universities and museums
24. Additional country-specific repositories

## 14. Canonical CICAN acquisition states

DISCOVERED
→ IDENTIFIED
→ RIGHTS_REVIEW
→ FEATURE_VERIFIED
→ MEDIA_VERIFIED
→ LANGUAGE_VERIFIED
→ DUPLICATE_CHECKED
→ CATALOG_READY
→ PLAYBACK_VERIFIED

Rejected candidates remain useful as research history:
REJECTED_FRAGMENT
REJECTED_TRAILER
REJECTED_EPISODE
REJECTED_DUPLICATE
REJECTED_RIGHTS
REJECTED_BROKEN
REJECTED_NON_FEATURE
REJECTED_UNCERTAIN

## 15. The benchmark

CICAN optimizes for:

largest legitimate + playable + accurately identified + internationally representative collection

—not the largest raw number of URLs.

A smaller verified catalogue is preferable to a larger catalogue padded with uncertain rights, fragments, duplicates or fake/incorrect movie entries.

## 16. Final global loop

ALL COUNTRIES
×
ALL RELEVANT ORIGINAL LANGUAGES
×
ALL SOURCE CLASSES
×
ALL MAJOR ARCHIVE/DISCOVERY INDEXES
×
RIGHTS VERIFICATION
×
FEATURE VERIFICATION
×
PLAYBACK VERIFICATION

Then:

REPEAT FOREVER AS NEW SOURCES APPEAR.

## Evidence base checked for v1.1

- FIAF Online Directory
- FIAF Film/AV Collection Catalogues and Databases
- FIAF Affiliate Online Collections
- FIAT/IFTA member network
- IASA worldwide audiovisual-archive links database
- Library of Congress digital moving-image collections
- European Film Gateway
- Filmarchives Online / MIDAS
- EUscreen
- UNESCO Memory of the World
- Creative Commons search ecosystem
- Open Images / Open Beelden
- Wikimedia Commons
- Internet Archive
- DigitalNZ
- Trove
- Romanian National Film Archive / Cinemateca Română
- CINEPUB
- Romanian audiovisual/archive sources

Important: these references establish discovery/source categories and examples. They do not grant CICAN rights to every film found through them. Item-level rights verification remains mandatory.
