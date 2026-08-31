---
tags:
  - slides
  - sample
---

# Release Walkthrough

Use the Slides plugin to present this markdown deck.

---

## Goals

- Confirm markdown slide splitting.
- Confirm lists, code, and notes render.
- Link to [[plugin-tasks/TaskNotes/Tasks/Golden Release Checklist|release checklist]].

Note: Speaker note for the goals slide.

---

## Vertical Track

Move down through the implementation details.

----

### Parser Fidelity

- Blank-line separators build the deck tree.
- Four dashes create vertical child slides.

----

### Live Updates

Editor changes refresh the deck without losing its position.

---

## Sample Code

```ts
const release = "e2e-vault";
console.log(`Presenting ${release}`);
```

---

## Done

The deck should open in a Reveal-backed slides view.
