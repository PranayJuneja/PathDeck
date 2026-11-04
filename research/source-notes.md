# Path Deck image-source research

Research date: 4 November 2026. Scope: a full MBBS educational atlas, with gross pathology, microscopy and explanatory diagrams. A visible web image is not automatically licensed for redistribution.

## Primary acquisition source: Wikimedia Commons

Commons' API was tested successfully with an explicit descriptive User-Agent, returning search results, source descriptions, original/thumbnail URLs, author, license text and license URL. A 1200px acute-appendicitis image was downloaded successfully (HTTP 200, image/jpeg, 503,063 bytes). A request without an explicit User-Agent returned HTML instead of JSON, so the importer consistently supplies one.

Verified example:

- Source: [Acute appendicitis Low Power](https://commons.wikimedia.org/wiki/File:Acute_appendicitis_Low_Power.jpg)
- Creator: Department of Pathology, Calicut Medical College
- License recorded by the file metadata: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- Description: appendiceal lumen exudate and dense inflammatory infiltrate in the wall
- Other results from the same tested query: Rama2k1's acute-appendicitis diagram (CC BY-SA 4.0) and Mikael Häggström's acute suppurative appendicitis specimen (CC0).

Working endpoint shape:

```text
https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=acute%20appendicitis%20histopathology&gsrnamespace=6&gsrlimit=3&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=1200&format=json
```

The [Calicut Medical College pathology collection](https://commons.wikimedia.org/wiki/Category:Images_from_Department_of_Pathology,_Calicut_Medical_College) contains **312 files**, verified through the API's categoryinfo property. It is a useful MBBS-oriented collection, but the importer still checks individual-file licenses rather than assuming a collection-wide license.

The importer accepts only documented CC0, public-domain, CC BY and CC BY-SA assets; it rejects NC, ND, unspecified licenses and restriction metadata. Each downloaded derivative keeps the source page, original URL, author, license, license link, original caption, source revision, local SHA-256 and transformation details. Attribution visibly states resizing and WebP conversion. Images retain their source license; the application's code license does not override media licenses.

## Other research sources and limits

- [Libre Pathology copyright policy](https://librepathology.org/wiki/Libre_Pathology:Copyrights): the page explicitly describes a **CC BY-NC-SA 3.0** site license and says images from Commons have varying licenses. Do not treat Libre Pathology as universally CC BY-SA or copy all images/text indiscriminately. It is useful as a linked study reference, with independent per-file rights checks for any incorporated image.
- WebPath's attempted `https://webpath.med.utah.edu/COPYRITE.html` returned 404. Reuse permission was not established; its images are not approved for bulk import on this evidence.
- CDC PHIL's old detail URL redirected via a link to `https://wwwn.cdc.gov/phil/Details.aspx?pid=1873`. The follow-up source exploration was incomplete, so no CDC files were admitted on an assumed blanket public-domain rule.
- NCI Visuals Online's attempted about-page fetch failed through the proxy (403 tunneling). It was not used as license evidence.
- DuckDuckGo's search page returned an unusable 302 document; Bing discovery returned mainly general pathology pages. Primary file metadata, not search snippets, is used for final rights and captions.

## Matching and QA

Topic-specific searches use disease names with histopathology, gross pathology and diagram terms. Ranking checks source title/caption/categories, prioritizes relevant pathology media, and rejects book scans, instruments and unrelated illustrations. Source captions are retained, rather than invented magnifications or confident relabelling. Automatic matching still requires visual review; `reviewed` starts false. Contact sheets and `research/media-audit.json` make missing coverage, accepted licenses and rejected/download-failed candidates inspectable.

Search Summary
- Commands: `webcmd web fetch` for search/primary policy pages; Commons Action API through Node `fetch` with a descriptive User-Agent; image download verified by HTTP status, content type and bytes.
- Sources fetched: Commons file and category metadata; Libre Pathology copyright policy; attempted WebPath copyright, CDC PHIL detail, NCI Visuals Online about pages.
- Browser fallback: none.
- Gaps/failures: the non-Commons alternatives above are not established reusable bulk sources. Full MBBS completeness requires an explicit topic coverage audit, not a large image count alone.

## Frozen catalog and review limits

Final source snapshot: 500 Commons assets (135.99 MiB), 192/207 topics with Commons media. Exactly 500 physical WebP files are referenced; no orphan files, blank captions, unresolved creator placeholders, audit errors or integrity failures. 24 assets from the prior 524-image snapshot were excluded during the bounded final caption/contact-sheet pass. Rejections and corrected associations are persisted for future imports.

All 17 pre-prune contact-sheet pages were visually inspected, with suspicious source captions/provenance checked. This is thumbnail/source-caption sanity QA, not a full-resolution diagnostic review or specialist certification. Records retain reviewed:false. Research figures can contain multiple panels; their original descriptions identify relevant panels and must remain visible. Detailed frozen counts, Commons-only coverage gaps and limitations are in research/qa-review.json; per-source exclusions are in commons-rejections.json and evidence-backed metadata overrides in commons-overrides.json. Native original mechanisms fill selected source-photo gaps separately.
