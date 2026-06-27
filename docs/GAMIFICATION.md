# Gamification engine

All game-balance logic lives in `src/lib/gamification/` as **pure functions**, with every tunable number in `constants.ts`. This makes the system testable, server-runnable (anti-cheat), and easy to balance.

## XP & levels

**XP to advance from level _L_ → _L+1_:**

```
xpForLevel(L) = round(100 + (L - 1) × 45)
```

A gentle linear-per-level curve (≈ quadratic cumulative) — fast early wins, steady long-term goals.

| Level | XP for this level | Cumulative |
|------:|------------------:|-----------:|
| 1→2 | 100 | 0 |
| 2→3 | 145 | 100 |
| 3→4 | 190 | 245 |
| 5→6 | 280 | 670 |
| 10→11 | 505 | 2,500 |

**Titles** scale with level: Sprout → Explorer → Adventurer → Trailblazer → Champion → Hero → Legend → Grandmaster.

`getLevelInfo(totalXp)` returns the level, title, XP into level, XP for next, and a `0..1` progress value used by every progress bar.

## Reward formula

For a correct answer (`computeReward`):

```
xp    = questionXp + (difficulty - 1) × 4
coins = questionCoins + (difficulty - 1) × 1
+ Speedy bonus:  +5 XP if answered < 6 s
× Streak bonus:  × 1.5 XP while streak ≥ 3 days
```

A wrong answer still grants **+2 XP** ("Nice try") — a growth-mindset nudge that keeps momentum without rewarding guessing materially.

## Streaks

`updateStreak(lastActiveDate, streak)`:

- Same day → unchanged
- Consecutive day → +1
- Gap → reset to 1

At **3+ days** the 1.5× XP multiplier activates. (Roadmap: a "streak freeze" pet perk already exists in the catalogue — *Tipi the Fantail*.)

## Adaptive difficulty

`nextDifficulty(accuracy, ageBand)` keeps learners in the **flow zone** (challenge ≈ skill):

| Rolling accuracy | Target difficulty |
|------------------|-------------------|
| ≥ 85% | 4 |
| 70–84% | 3 |
| 50–69% | 2 |
| < 50% | 1 |

…then clamped by an age ceiling (5-7 → 3, 8-10 → 4, 11-14 → 5).

`selectAdaptiveQuestion()` scores the candidate pool by closeness to the target difficulty, **boosts weak strands** (+4) and **penalises recently-seen** questions (−6), then picks the best.

## Mastery

Each subject keeps a rolling **exponential moving average** of accuracy (`applyAttemptToMastery`, α = 0.25) so recent performance matters most. Strands dropping below **60%** are flagged as `weakStrands` and surfaced to the learner, parent, and the adaptive selector.

## Economy

| Sink | Source |
|------|--------|
| Pets (60–400 🪙) | Correct answers (3+ 🪙) |
| Avatar parts (40–300 🪙) | Quests (+25 🪙), bosses (+150 🪙) |
| | Daily challenge (+50 🪙 +1 💎) |

Coins are the soft currency (earned constantly); **gems** are the premium/scarce currency (daily challenge, events). Tune all values in `constants.ts`.

## Achievements

`evaluateAchievements(player, signals)` is called after every state change and returns only **newly** unlocked IDs, so the UI celebrates each exactly once. Rarities (`common → legendary`) drive the badge frame and celebration intensity. Includes a **secret** achievement (*Perfectionist*) and a **legendary boss** reward (*Ember the Dragon*).

## Worlds

Subjects are themed worlds gated by total XP (`WORLDS`): Storyhaven & Numberforge open immediately; Discovery Lab (150 XP), Aotearoa Atlas (300), Maker Bay (500), Te Ao Māori (800) unlock as the learner grows — a long-arc progression goal.

## Balancing guide

1. Change a number in `constants.ts` only.
2. Re-derive the level table from `xpForLevel`.
3. Sanity-check the economy: *time-to-first-pet* and *time-to-level-5* are the two key feel metrics.
4. (Phase 4) Re-tune difficulty thresholds on real attempt data.
