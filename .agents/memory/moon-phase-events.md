---
name: Exact moon phase events
description: Accuracy and local-time requirements for phase event dates and the moon cross.
---

The Astro Clock must calculate new moon, first quarter, full moon, and last
quarter topocentrically for the selected coordinates. Convert each event to the
coordinates' local time zone, and show its local calendar day in the moon cross.
Keep this separate from the intentionally fixed moon arc.

**Why:** The user rejected averaged or arbitrary phase dates and times, and on
27 October 2026 clarified that the phase timing itself must be location-specific,
not merely converted from a geocentric instant. They confirmed that the existing
arc works and should remain unchanged.

**How to apply:** Use topocentric apparent ecliptic positions for event
timestamps, plus coordinate-derived IANA time zones for display. Do not alter
the fixed 15+15-day arc unless the user explicitly asks.
