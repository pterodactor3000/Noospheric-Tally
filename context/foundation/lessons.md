# Lessons Learned

> Append-only register of recurring rules and patterns. Re-read at start by /litany-of-capacitor-alignment, /prayer-of-unbroken-thread, /rites-of-true-aim, /hymn-of-consecration-of-a-new-machine, /rites-of-ignition, /hymn-of-engine-commencement.

## Put shared control styles in ui variants

- **Context**: `src/components/ui` and every page that renders a Button, Input, Label, Separator, or a repeated control.
- **Problem**: Pages restyled shared controls with override classes (`size-11!`, `px-2!`, `fieldControl` on every Input) and copied markup such as the disclosure three times. The copies drifted, and one visual fix had to touch every call site.
- **Rule**: Give a shared control its sizes and looks as cva variants or a component in `src/components/ui`, and have pages pick a variant. Keep page `className` to layout placement such as grid spans.
- **Applies to**: plan, implement, impl-review

## Make conflicting utilities exclusive variants

- **Context**: Tailwind classes composed with clsx, which has no tailwind-merge.
- **Problem**: A later class does not replace an earlier one. Both apply and stylesheet order decides, so `hover:bg-transparent` on the link variant could lose to the base wash, and Separator height needed `h-0.5!`.
- **Rule**: Put each conflicting utility in exactly one variant branch, so no two branches set the same property. Do not fix a conflict with `!` or a caller override.
- **Applies to**: implement, impl-review

## Style button states without enabled:

- **Context**: Base UI `Button` rendered through `render={<Link />}`.
- **Problem**: `:enabled` and `:disabled` match only form controls. Hover styles gated on `enabled:` never reached link-rendered buttons such as Add item.
- **Rule**: Write state styles as plain `hover:`, `active:`, and `focus-visible:`, and rely on `disabled:pointer-events-none` for disabled buttons. Check a link-rendered button whenever a state style changes.
- **Applies to**: implement, impl-review

## Keep button states off text links

- **Context**: `TextLink` and the Button `link` variant.
- **Problem**: The hover wash added for buttons also painted text links, and the user asked to remove it.
- **Rule**: Text links show only the underline on hover. Hover, press, and focus backgrounds belong to button-shaped controls, including links rendered as buttons.
- **Applies to**: implement, impl-review

## Give each control role its own color token

- **Context**: Theme tokens in `src/app/styles/globals.css`.
- **Problem**: Buttons shared `--input` with input borders. Raising button contrast would have changed every input border, so the slice added `--button`.
- **Rule**: Give each control role its own token. Draw borders with `currentColor` where text and border should change together.
- **Applies to**: plan, implement

## Confirm excluded controls when restyling a family

- **Context**: Framing and planning a slice that restyles a family of controls.
- **Problem**: The plan kept the file input unchanged. The user later asked for it to match, which reopened the plan, tests, and roadmap after the phases closed.
- **Rule**: When a slice restyles a family of controls, list every excluded member (file, select, checkbox, textarea) and get the user's decision on each before planning.
- **Applies to**: frame, plan

## Prove visual refactors with screenshot diffs

- **Context**: Refactors that should leave the UI unchanged.
- **Problem**: Moving styles between files can shift a pixel or a font size while every test passes, because the tests check class strings.
- **Rule**: Before and after the change, capture full-page screenshots of every page in light and dark at a wide and a 390px viewport with animations frozen, and require a zero-pixel diff. Check hover, focus, and press separately.
- **Applies to**: implement, impl-review

## Record user visual overrides in the plan

- **Context**: Plan-phases work where the user changes the visual contract mid-slice.
- **Problem**: Code diverged from `plan.md` as the user changed arms, colors, and inputs, so a reviewer reading the plan would flag correct code as drift.
- **Rule**: Update the plan contract and the matching Progress wording in the same commit as the code. Mark a check only after performing it, and leave a check open with a reason when it cannot pass as written.
- **Applies to**: implement, impl-review

## Delegate through enabled providers

- **Context**: Delegating plan, implementation, and review work to named models under `.cursor/rules/plan-phases.mdc`.
- **Problem**: The Cursor subagent list offered only `inherit` and `composer-2.5-fast`, so the named Claude and Grok models looked missing even though other enabled providers ran them.
- **Rule**: When Claude or another named provider is unavailable, look up the providers enabled in the harness (for example t3 `orchestrator_capabilities`) and delegate through one that offers the named model. Stop and ask only when no enabled provider offers it.
- **Applies to**: all
