# assay-ui

The shared Angular library behind Assay, the Conduit design system. Ships the
application shell components every Touchstone Conduit service has in common —
navigation rail, top bar, account menu, footer — plus the CSS tokens and
toolkit those components render against.

Installed as a git dependency pinned to a release branch:

```json
"assay-ui": "git+https://github.com/Touchstone-In/tsinconduit-design-system.git#assay-ui-v0.3.2"
```

After installing, patch `package-lock.json`'s `resolved` URL for `assay-ui`
from `git+ssh://` back to `git+https://`. On a version bump, also delete the
`node_modules/assay-ui` lock entry before reinstalling — npm does not
re-resolve a git dependency when only the ref changes, so the build quietly
keeps compiling against the previous version. Always confirm the installed
version moved; a green build does not prove the bump landed. Both gotchas have
copy-pasteable fixes in the repository README.

## Styles

Add both stylesheets to `angular.json`'s `styles` array, tokens first:

```json
"node_modules/assay-ui/styles/tokens.css",
"node_modules/assay-ui/styles/toolkit.css"
```

`tokens.css` defines the palette, type scale, spacing and motion custom
properties, and bundles the fonts. `toolkit.css` supplies the `a-` prefixed
classes the library's templates render.

## Components

All standalone; import the ones you use.

| Component | Selector | Notes |
| --- | --- | --- |
| `AssayRailComponent` | `assay-rail` | Brand mark, nav groups, footer projected via `[assayRailFooter]` |
| `AssayTopbarComponent` | `assay-topbar` | Page context, search, account affordances |
| `AssayAccountMenuComponent` | `assay-account-menu` | Identity block and menu items |
| `AssayFooterComponent` | `assay-footer` | Shared page footer |

There is deliberately no all-in-one `<assay-shell>`: services differ in whether
and how they need a mobile drawer, so composing the rail and top bar into your
own `mat-sidenav-container` (or a plain flex layout) stays your call.

## Navigation data

```ts
interface AssayNavGroup {
  label?: string;   // omit for a flat, ungrouped run of items
  icon?: string;    // stands in for the group when the rail is collapsed
  items: AssayNavItem[];
}
```

A labeled group with more than one item renders as a collapsible accordion
section — one group open at a time, auto-expanding to reveal whichever group
owns the active route, otherwise remembering the rider's last choice per
service in `localStorage`. Unlabeled groups, and labeled groups holding a
single item, render flat.

**If your service maps its own nav config into `AssayNavGroup` objects, check
that the mapping forwards `icon`.** A field-by-field rebuild
(`{ label, items }`) drops it silently: the build stays green, and every
collapsed category falls back to its first item's icon with nothing to indicate
why. Four Conduit services hit this. Verify against compiled output, or assert
on the rendered icon in a spec.

## Adopting the collapsible rail

`assay-rail` can reduce to an icon-only strip (`var(--a-rail-collapsed)`, 72px).
Collapsed, a labeled group shows one icon for the whole category — clicking it
restores the full rail with that group open — while an unlabeled group keeps
each item's own icon, hiding nothing but the labels.

**The rail sizes its own host element. It cannot resize the drawer you wrapped
it in.** Three host preconditions, none of which produce a build error:

**1. The drawer must size to content.** A `mat-sidenav` pinned to
`width: var(--a-rail-width)` leaves the rail shrinking to 72px inside a drawer
that stays at 248px — the nav squeezes into a strip and the rest of the drawer
sits empty. Use `width: auto; min-width: 0`, and put `autosize` on the
`mat-sidenav-container` so `mat-sidenav-content` re-measures its margin; without
it the container re-measures only on open/close, mode change, or a viewport
ruler event, and latches a stale margin.

Until you have done this, pass `[collapsible]="false"` — otherwise the toggle
renders and misbehaves when a rider clicks it.

**2. Nothing else in the drawer may set its width.** Once the drawer is
`width: auto` it shrink-to-fits around everything inside it. A sibling of
`<assay-rail>` with no width constraint — a profile badge, a user block, a
version stamp — becomes what sets the drawer's width, holding it open while the
rail narrows beside it. Same empty gutter, from the other direction. Hide such
siblings while collapsed:

```html
<assay-rail (collapsedChange)="railCollapsed.set($event)" …/>
@if (!railCollapsed()) { <app-profile-badge /> }
```

Content projected into `[assayRailFooter]` is already handled — the library
hides it when collapsed.

**3. Don't auto-collapse an overlay drawer.** `autoCollapseBelow` defaults to
`0` (off). An overlay drawer floats above the content and isn't competing for
horizontal space, so opening it as an icon strip costs the rider labels for no
gain. Gate the breakpoint on whatever signal drives your `over`/`side` mode
rather than passing a constant:

```html
<assay-rail [autoCollapseBelow]="isMobile() ? 0 : 1280" …/>
```

Bind it from the same place that sets the drawer's `[mode]`, so the two
breakpoints cannot drift apart.

### Rail inputs and outputs

| Input | Default | |
| --- | --- | --- |
| `service` | required | Shown under "CONDUIT"; also scopes `localStorage` keys |
| `groups` | required | `AssayNavGroup[]` |
| `ariaLabel` | `'Main navigation'` | |
| `collapsible` | `true` | `false` pins the rail open — no toggle, no reduction |
| `autoCollapseBelow` | `0` | Viewport width (px) to reduce below; `0` disables |

Outputs: `itemClick`, which fires on every item click (hosts typically use it
to close a mobile drawer), and `collapsedChange`, which fires when the rail
reduces or restores.

## Fonts

`tokens.css` bundles IBM Plex Sans and a Material Symbols Outlined subset. The
icon subset ships as `assay-material-symbols-subset.woff2` rather than
`material-symbols-outlined.woff2`: a host that also installs the
`material-symbols` package would otherwise emit two byte-different files to one
output path, which Angular's unit-test builder rejects outright. Production
builds hash output filenames, so that duplication ships silently rather than
failing — the only visible symptom is an unrunnable test suite.

A host loading both stylesheets ships both faces (~340KB subset against ~3.96MB
full). Dropping `material-symbols` from `angular.json` is worthwhile wherever
this subset covers every glyph that service uses.
