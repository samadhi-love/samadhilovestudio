# Genre browsing and style blends

The shared picker offers 298 named styles in 17 families. Popular choices retain the original six SAMADHI LOVE labels; Browse all genres switches to the searchable full catalog with a family filter. Selection persists when changing views, searching or filtering. Labels are music directions, not promises of dedicated models or exact provider output.

Quick Create, Guided Studio and Lyrics & Creative Prompts allow up to eight selected styles, including custom names (1–60 characters, no commas). Selected chips remove individual choices. Existing free-form genre and production fields remain editable. Guided Studio includes the selection in device draft recovery; older drafts without it restore with an empty selection. Quick Create remains an unsaved quick-start form, as before.

Connected creation sends selected genres at the beginning of the existing bounded provider prompt. The guided default palette text is omitted when explicit genres are selected for connected generation. Built-in instrumental synthesis still has four palettes and uses the nearest palette; selecting a new label does not add a new synthesizer or instrument model. The interface states this distinction.

Song details use the picker for existing persisted tags. Existing custom tags remain selectable. The overview and library use a single-choice variant to filter songs, without changing their metadata. Original template tags, songs, account storage and provider configuration are preserved; no migration is needed.

`npm run test:genres` checks catalog consistency, regional labels, category/search switching, custom styles, selection limits, legacy filter labels, and actual Quick Create/Guided Studio generation callbacks using simulated DOM controls. The suite is part of `npm run verify:studio`. Browser and physical-device layout checks remain unverified because the required browser helper is unavailable in this environment.

## Studio genre assistant

Quick Create and Guided Studio now offer **Studio chooses** and **Use this blend**. The assistant creates a named fusion recipe from explicit genres in the current description, explicit lyric style cues, and recurring genres in up to 30 eligible saved projects from the signed-in account's library. Examples, deleted songs and flagged explicit songs are excluded. Users can disable history suggestions, edit the fusion name, try another blend, select chips manually, or turn automatic selection off. A manual chip choice takes control back from automatic selection. When there is no genre guidance/history, a small set of creative starting recipes supplies suggestions.

Suggestions use bounded local text matching and rules, not a trained music model, semantic language understanding, or audio analysis. Recognized simple exclusions such as “no rock” are respected; more complex prose and unsupported names can be missed. The selected name and ingredients are saved in the generated song's existing production prompt. Full historical prompts are not forwarded to the provider. This does not add a separate cross-device preset manager. Existing finished audio is not changed; style instructions apply to new generation.

For section-specific styles, use:

```text
[Verse 1 | genre: Lebanese Dabke]
نور وحب

[Chorus | genre: Afro House]
Love and light

[Bridge]
{genre: R&B}
Together we shine
```

Only explicit `genre:`, `style:` or `fusion:` fields after a section heading's pipe, or in their own brace line, are parsed. Ordinary sung lines are never treated as genre code. Cues allow a section name up to 80 characters and a direction up to 160 characters. The original approved lyric string is retained exactly in notes and generation provenance. Provider chunks use clean headings, omit these instruction lines from the sung text, and carry the section's genre in `positive_styles`. Repeated choruses can have different styles. Long sections repeat their style on continuation chunks. Existing structured International Music Tent section directions take precedence when both are present.

Guided Studio's **Read genre directions from lyric code** checkbox controls interpretation. When disabled, recognized notation is still omitted from provider singing text but does not add section styles. The same parser is used by the existing creation endpoint, including caption-ready generation. Quick Create can carry these directions in its editable arrangement code; generated section names must match for the arrangement directions to map. Music providers may not follow every cue or deliver an exact genre transition. No new provider, account, credentials, database schema or payment is introduced.

Tests cover longest-label matching, simple exclusions, history opt-out/source preservation, named fusion delivery, code opt-out, repeated sections, long sections, Arabic words, and API-level inspection of the actual provider payload. Live musical results and physical-device/browser interaction remain unverified.
