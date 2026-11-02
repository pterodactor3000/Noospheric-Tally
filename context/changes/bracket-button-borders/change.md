---
change_id: bracket-button-borders
title: Bracket button borders
status: implementing
created: 2026-11-02
updated: 2026-11-02
archived_at: null
---

## Notes

Roadmap S-16 (`context/foundation/roadmap.md`), PRD FR-019. Linear TEC-65, team Tech Heresy, project Noospheric Tally, https://linear.app/tech-heresy/issue/TEC-65/s-16bracket-button-borders-feat-frame-buttons-and-inputs-with-bracket. GitHub issue pterodactor3000/Noospheric-Tally#72. Artifacts: `plan.md`, `plan-brief.md`.

Branch: `feature/s-16-bracket-button-borders`, from `main`. Prerequisites: none. Not blocked.

Outcome: every shared Button, and the tally and item-page count controls, is framed by a left bracket and a right bracket with short arms. Help, the tally, and the item page show `?`, `-`, and `+` with no typed brackets. Text, search, email, and password inputs get the same frame, a middle-dot track that loses one dot per typed character, and the app-title block caret while focused.

Closed product decisions from 2026-11-02 are recorded in `plan.md` under `## Implementation Approach`. The plan was written by a planning subagent. Complexity is Medium.

After the phases, the shared controls moved into `src/components/ui`. The count steppers are `CountStepper`. The collapsible new-item forms are `Disclosure`. Text links are `TextLink`. Dot leaders are `DotLeader`. The caret is `TerminalCaret`. `FormAlert`, `FormError`, and `ItemListMarker` also moved there. Pages pick a `Button` size (`touch`, `glyph`, `icon-touch`, `icon-xl`) or `Separator variant="heading"` and pass no override classes. `Input` and `Label` carry the field size and label type. The class names in `plan.md` describe the code as each phase landed.
