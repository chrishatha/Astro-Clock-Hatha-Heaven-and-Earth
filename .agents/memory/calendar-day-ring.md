---
name: Calendar day ring
description: Date-to-slot behavior for the Astro Clock's 30-field date ring.
---

The 30-field calendar ring maps dates 1–30 to their matching fields. On the 31st,
field 1 represents the date and is the highlighted current field.

**Why:** The user requires the current date to be immediately visible in the
30-day circle, with the 31st specifically represented by field 1.

**How to apply:** Derive the highlighted field from the clock's effective date,
including preview dates, and map day 31 to field 1.
