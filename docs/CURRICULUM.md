# Curriculum mapping

LearnQuest content is aligned to the **New Zealand Curriculum (NZC)**. The mapping lives in `src/lib/curriculum/` and is the bridge between a learner's profile and the content they see.

## Subjects → NZC learning areas

| LearnQuest subject | NZC learning area | Reo | World |
|--------------------|-------------------|-----|-------|
| English | English | Reo Pākehā | Storyhaven 📚 |
| Mathematics | Mathematics & Statistics | Pāngarau | Numberforge 🌋 |
| Science | Science | Pūtaiao | Discovery Lab ⚗️ |
| Social Sciences | Social Sciences | Tikanga ā-Iwi | Aotearoa Atlas 🏔️ |
| Technology | Technology | Hangarau | Maker Bay 🤖 |
| Te Reo Māori | Te Reo Māori | — | Te Ao Māori ✨ *(scaffolded)* |

## Strands

Each subject is broken into NZC strands (`STRANDS` in `nz-curriculum.ts`). Examples:

- **Mathematics:** Number & Algebra, Geometry & Measurement, Statistics
- **Science:** Nature of Science, Living World, Physical World, Material World, Planet Earth & Beyond
- **English:** Reading & Comprehension, Writing & Composition, Oral Language
- **Social Sciences:** Identity/Culture/Organisation, Place & Environment, Continuity & Change
- **Technology:** Technological Practice, Computational Thinking, Digital Outcomes

Strands are the unit of **weakness detection** — mastery and `weakStrands` are tracked per strand.

## Levels ↔ age bands

NZC Levels 1–5 span roughly ages 5–14. The mapping engine (`levelsForAgeBand`) translates:

| Age band | NZC levels served |
|----------|-------------------|
| 5–7 | 1–2 |
| 8–10 | 2–3 |
| 11–14 | 4–5 |

`questionsForSubject(subject, ageBand)` and `questionsForAge(ageBand)` filter the pool with these predicates — the same predicates become SQL `WHERE subject = ? AND level = ANY(?)` in cloud mode.

## Authoring questions

A `Question` (see `src/types/index.ts`) carries everything the engine needs:

```ts
{
  id, subject, strandId, ageBand, level,
  type,           // multiple-choice | math-puzzle | sentence-building | …
  difficulty,     // 1..5 — drives adaptive selection (distinct from NZC level)
  prompt, options?, tokens?, passage?,
  answer,         // index (MCQ) or canonical string
  explanation,    // shown by the AI tutor
  xp, coins
}
```

**Authoring rules of thumb**

- `level` = curriculum placement; `difficulty` = relative challenge *within* that level. Keep them independent.
- Always write a warm, concrete `explanation` — it powers the tutor's fallback and grounds the AI path.
- For `sentence-building` / `drag-and-drop`, `tokens` are the shuffled pieces and `answer` is the target string (compared normalised: case/space/punctuation-insensitive).
- Prefer locally-relevant context (kiwi, tuatara, te Tiriti, Aotearoa place names).

## Coverage

`strandCoverage(subject, ageBand)` reports how many questions exist per strand — the basis for the Phase 2 content-gap dashboard. Aim for balanced coverage across every strand × level before launch.

## Te Reo Māori (future-ready)

The reo subject, its strands (Kōrero, Pānui, …), world, and sample content already exist in the data model; it's flagged `comingSoon` in the UI. Phase 5 adds audio, macron-correct typography, and educator review to graduate it to a full subject.
