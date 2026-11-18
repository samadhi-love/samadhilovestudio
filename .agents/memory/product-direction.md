---
name: Preserve the existing studio
description: User's standing product direction and migration scope
---
Continue the existing SAMADHI LOVE Studio rather than building a replacement.

**Why:** The user repeatedly emphasized “i want to continue this app not a new one.”

**How to apply:** Preserve the imported screens, features, assets, and data model. Make targeted hosting and compatibility changes before redesigning.

Keep Cloudflare D1 and private R2 for production storage; this does not require Cloudflare Worker hosting.

**Why:** The user chose “Keep Cloudflare backend” and subsequently approved Replit Node hosting with server-only D1/R2 adapters. The storage choice was not a requirement to keep a Worker gateway.

**How to apply:** Preserve D1/private R2 and the currently approved hosting approach, not a PostgreSQL replacement or a newly introduced gateway. Preparing a connection is not permission to deploy, provision resources, migrate data or replace encryption keys.

The goal is a unique, affordable app for young enthusiasts, especially beginners, with easy song creation and both easy and advanced visual/lyric-video tools.

**Why:** The user explicitly described this target audience and workflow.

**How to apply:** Keep easy creation accessible and advanced controls available without forcing beginners through them.

Prioritize aspiring creators rather than professionals: quality and ease of use should let beginners enjoy creating, not deal with creation issues.

**Why:** The user emphasized “we do not need pros” and wants beginners to feel happy with what they are doing.

**How to apply:** Judge the core journey by whether a beginner can finish a satisfying song and video without technical troubleshooting. Keep advanced tools optional.

Do not add more tabs. Keep the main focus on song creation and visual/lyric-video creation.

**Why:** The user corrected the discussion of additional tabs and reiterated the two main product priorities.

**How to apply:** Keep Party Mix and radio secondary. The user is considering “coming soon” or a special subscription for those capabilities; neither option is yet a final implementation decision.

Creator setup should offer visible buttons instead of requiring terminal commands.

**Why:** The user could not complete command-based vault setup and explicitly requested a simple generation/copy button.

**How to apply:** Prefer browser-based, step-by-step setup while preserving secure secret entry and clearly stating any manual step that remains.

“Simplified as well as sophisticated” means smart, polished results from a short, understandable flow—not long menus for professional song makers. A song request should mean vocals and lyrics, not an instrumental sketch.

**Why:** The user repeated this requirement after receiving instrumental-only output and finding the creation menus too complicated.

**How to apply:** Default beginner creation to sung songs, never silently substitute sketches, and keep technical controls optional. Do not equate adding more selectors with sophistication.

Follow Suno's documented creation structure rather than inventing new choices and tabs: Simple uses one song description; Custom separates lyrics, style and title.

**Why:** The user explicitly instructed “search how suno works and follow instead of making ... choices and tabs.”

**How to apply:** Use the familiar Simple/Custom distinction. Keep provider capabilities and costs honest; matching the interaction does not imply matching Suno's music model.

Finish the build before evaluating provider costs. The user intends to follow provider rules, accepts breaking even initially, and wants low introductory pricing to build an audience before considering increases.

**Why:** The user explicitly stated that immediate profit is unnecessary and breaking even is acceptable while attracting an audience.

**How to apply:** Do not treat maximum near-term profit as the goal or enable pricing changes automatically. Evaluate sustainable introductory pricing after the build, and confirm required permissions before public provider-backed use.

Prioritize strong captions, lyric alignment and production in one place, without making creators move between apps and repeatedly upload their work.

**Why:** The user explicitly identified this integrated workflow as a strong reason to use the product.

**How to apply:** Carry the saved audio, lyrics, timing and visual choices through editing and export. Prioritize alignment quality and correction tools over adding disconnected features.

For songs created in the studio, aim for accurate automatic lyric alignment without routine manual editing. Offer varied singing performances suited to the requested genre, not an unrelated vocal delivery.

**Why:** The user emphasized accurate voice timing and specifically objected to a country-style singer being used for rap or hip-hop.

**How to apply:** Evaluate timing against the finished sung audio and test genre-appropriate vocal delivery. Treat manual timing as an exception path, and do not represent spoken-voice catalogs as selectable singing voices.

Consolidate tools by the beginner's task. Simple and Pro should share the same screen homes; advanced depth belongs inside those screens rather than in competing menus or duplicate workflows.

**Why:** The user repeated: "if anything exists in several options that makes the same function take it out" and "professionals know where they can go beginners needs to hold a solid hand".

**How to apply:** Reuse existing engines when combining related tools, keep a clear next step, and preserve old entry points through compatibility routing. Merely renaming tabs or grouping unchanged duplicate pages is not sufficient.

Community presentation should emphasise kind reactions without public popularity rankings or listen/like counts. The owner can still see their own statistics.

**Why:** The owner explicitly requested “Only kind reactions — no rankings, no noise” and said to keep the underlying data while hiding public metrics.

**How to apply:** Do not reintroduce public competitive scores as decoration or delete the underlying statistics to achieve a simpler presentation.

No draft-recovery prompts or drafts lists for users. Forms quietly keep the latest writing and show it automatically on return. “New song” starts fresh immediately. Paid-song recovery stays, but runs silently and automatically; preserve existing user data.

**Why:** The owner found a repeating recovery notice blocked song creation and confused beginners, and explicitly chose this simpler behaviour.

**How to apply:** Keep device/account saving and paid-result protection behind the scenes. Do not reintroduce restore/dismiss gates or draft-management panels in Create or lyric/video editors. Preserve existing data and backups rather than cleaning them up to remove notices.

Singing defaults to Auto with English fallback, with a visible language selector in both Simple and Custom. Priority: dropdown pick > language/dialect named in the description > clearly non-English lyrics > English. Uncertain language detection must never block creation. Always show one calm line explaining the language and why.

**Why:** The owner reported English lyrics being blocked by uncertain detection and no visible Simple-mode override, and explicitly chose this easier setup.

**How to apply:** Match the full shared language/dialect catalog, including existing world-music language names. Preserve explicit user choices (including English and dialects) over conflicting descriptions, keep dialect depth in Custom → Vocals, and fall back to English rather than asking beginners to resolve detection. Use the creator's original description, not automatically appended style hints, so the screen and server agree and a genre chip alone cannot unexpectedly change the singing language.

Song length defaults to Auto: fit supplied lyrics and sections naturally; for description-only creation use a natural provider length, or about three minutes when the production pipeline requires a number. Keep a manual choice, the existing minimum, and a six-minute maximum for new songs and extensions.

**Why:** The owner explicitly chose natural song length instead of short beginner demos and set a six-minute ceiling.

**How to apply:** Apply the same limit to controls, presets, quote validation, creation and the untruncated crossfaded extension timeline. Preserve existing longer saved recordings; never truncate or delete them to enforce a new-request limit.

Keep normal personal-key Create wording quiet: at most one small “Uses your ElevenLabs credits” line; retain double-cost confirmation for “Make 2 versions”.

**Why:** The owner says users are responsible for their own ElevenLabs credits and finds repeated credit warnings unnecessary.

**How to apply:** Do not reintroduce repeated normal-generation warnings. Preserve accounting, paid-result recovery and explicit consent before replaying an uncertain paid attempt; this wording decision is not permission to bypass those safeguards.
