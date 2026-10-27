---
name: Exact moon phase events
description: Accuracy and local-time requirements for phase event dates and the moon cross.
---

The Astro Clock must calculate new moon, first quarter, full moon, and last
quarter from actual astronomical phase instants, then convert them to the time
zone for the selected coordinates. The moon cross must show the event's local
calendar day. Keep this separate from the intentionally fixed moon arc.

**Why:** The user rejected averaged or arbitrary phase dates and times, asking
for accurate event data and confirming that the existing arc itself works.

**How to apply:** Use astronomical phase calculations for event timestamps and
coordinate-derived IANA time zones for displayed dates and times; do not alter
the fixed 15+15-day arc unless the user explicitly asks.
