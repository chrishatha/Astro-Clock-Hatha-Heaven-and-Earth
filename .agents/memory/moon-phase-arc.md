---
name: Symmetric moon-phase arc
description: User-mandated 15-day phase sequence for the Astro Clock moon arc.
---

The moon arc is intentionally a fixed mathematical 30-day cycle: 15 consecutive
calendar days for one half and 15 for the other. It must never derive active
slots from the irregular astronomical synodic month, because that can visually
skip a phase.

**Why:** The user requires every displayed phase slot to remain exactly one day
long, with main-phase boundaries fixed at 15 days even when astronomical
calendar data would place them after 14 or 16 days.

**How to apply:** Preserve the verified 29 July 2026 full-moon anchor and use
integer calendar-day offsets with positive modulo for dates in either direction.