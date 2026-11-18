---
name: Storage cost verification
description: Verify request costs through the real production adapter rather than a native-R2-style mock.
---
Assert storage request costs at the outbound transport of the real production
adapter, using a fake transport and no credentials or live requests.

**Why:** An abstraction-level recovery test showed zero reads while
metadata-inclusive listings in the S3-compatible production adapter still
caused per-object metadata reads. That failed the owner's requirement to avoid
a storage read for every already-attached song.

**How to apply:** Count emitted storage commands, not only calls to the bucket
facade. Treat metadata-rich listings as potentially multiple operations. Filter
known primary and historical audio references before fetching metadata, while
keeping genuinely unattached paid takes eligible for recovery review.
