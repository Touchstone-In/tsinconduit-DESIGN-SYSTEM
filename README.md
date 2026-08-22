# tsinconduit-design-system

**Assay** — the design language for the whole Conduit suite by Touchstone
Institute — and **`assay-ui`**, the Angular library that ships it as real,
shared components instead of copy-pasted markup per service.

This repo is the single canonical source for both:

- `design/` — the design document, palette validation, and reference
  screenshots (ported from `tsinconduit-SSO/design-system`, which now
  just links here).
- `projects/assay-ui/` — the Angular library source: the shell
  components (`assay-rail`, `assay-topbar`, `assay-account-menu`,
  `assay-footer`) and the CSS toolkit/tokens/fonts/brand assets they
  render against.

## Why a real library, not another vendored copy

Three services (SSO, CELBAN, DASHBOARD) started out with their own copy
of the Assay CSS in a `design-system/` folder, each kept in sync by
hand. That doesn't scale to 14 services — a shell fix had to be
hand-ported into every repo separately. `assay-ui` fixes that: the rail,
top bar, account menu and footer exist in exactly one place: this repo.
Every service imports the same compiled components, so a shell change
here is one release away from being live everywhere, not fourteen
hand-ports away.

## Installing in a service

No private npm registry is involved — this ships as a **git-tag
dependency**, installed straight from this repo (now public, so no
credentials are needed to fetch it):

```jsonc
// package.json
"dependencies": {
  "assay-ui": "git+https://github.com/Touchstone-In/tsinconduit-design-system.git#assay-ui-v0.1.0"
}
```

> **CI note — read this before running a bare `npm install`/`bun install`
> against a service that depends on `assay-ui`.** npm always resolves a
> GitHub-hosted git dependency's `package-lock.json` `"resolved"` field to
> an `ssh://` URL internally, no matter what URL form the `package.json`
> spec above uses — and GitHub Actions runners have no SSH key for
> cross-repo access, only the checkout's own scoped HTTPS token, so `npm
> ci` fails with `Permission denied (publickey)`. After installing or
> bumping the `assay-ui` version, patch the lockfile's resolved URL back
> to `https` (this makes npm fetch a plain tarball from
> `codeload.github.com` — no git binary or SSH needed at all):
>
> ```bash
> # from the service's frontend directory, after npm install / npm update
> node -e '
>   const fs = require("fs");
>   const p = "package-lock.json";
>   const data = JSON.parse(fs.readFileSync(p, "utf8"));
>   const node = data.packages["node_modules/assay-ui"];
>   node.resolved = node.resolved.replace("git+ssh://git@github.com/", "git+https://github.com/");
>   fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
> '
> rm -rf node_modules && npm ci   # verify it installs clean, no SSH involved
> ```
>
> `bun install` does not have this problem — bun resolves GitHub-hosted
> git deps via the `api.github.com` tarball endpoint natively, never SSH.
> (If `bun install` fails with "Integrity check failed", that's a stale
> pinned hash in `bun.lock` from an earlier state, unrelated to this —
> just delete `bun.lock` and reinstall to regenerate it.)

> **Second gotcha, specific to *bumping* the version: npm does not
> re-resolve a git dependency when only the ref changes.** Edit
> `package.json` from `#assay-ui-v0.2.0` to `#assay-ui-v0.3.0`, run a plain
> `npm install`, and npm will update the lockfile's requested spec string
> while leaving `"resolved"` pinned to the *old* commit — so the build
> silently keeps compiling against the previous version, and everything
> looks green. Delete the lockfile entry first to force re-resolution:
>
> ```bash
> node -e '
>   const fs = require("fs");
>   const p = "package-lock.json";
>   const data = JSON.parse(fs.readFileSync(p, "utf8"));
>   delete data.packages["node_modules/assay-ui"];
>   fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
> '
> npm install          # re-resolves to the new branch tip
> # then apply the ssh -> https patch above, and verify:
> cat node_modules/assay-ui/package.json | grep '"version"'
> ```
>
> Always confirm the installed `version` matches the ref you asked for, and
> that the lockfile's `resolved` commit SHA actually changed. A green build
> alone does not prove the bump landed.

Then wire the CSS toolkit into `angular.json`'s `styles` array, after
your own service's stylesheet (loading order matters — Assay's classes
are uniquely prefixed `a-*` and its custom properties `--a-*`, so it
never collides with a service's own tokens/utility classes, but should
still load after them so nothing in the service accidentally shadows
it):

```jsonc
"styles": [
  // ...your existing entries...
  "node_modules/assay-ui/styles/tokens.css",
  "node_modules/assay-ui/styles/toolkit.css"
]
```

Import components from `assay-ui` like any other library:

```ts
import { AssayRailComponent, AssayTopbarComponent, AssayFooterComponent } from 'assay-ui';
```

See `projects/assay-ui/README.md` for the full component API (inputs,
outputs, content-projection slots) and usage examples.

## Adopting the collapsible rail

`assay-rail` can reduce to an icon-only strip (`var(--a-rail-collapsed)`,
72px). **The rail sizes its own host element** — it cannot resize the
drawer you wrapped it in. Two host preconditions, both easy to miss
because neither produces a build error:

1. **The drawer must size to content.** Most Conduit services pin
   `width: var(--a-rail-width)` (some also `min-width`) on their
   `mat-sidenav`. With that in place the rail shrinks to 72px inside a
   drawer that stays at 248px — the nav squeezes into a strip and the rest
   of the drawer sits empty. Give the drawer `width: auto; min-width: 0`
   and put `autosize` on the `mat-sidenav-container` so
   `mat-sidenav-content` re-measures its margin. Without `autosize` the
   container only re-measures on open/close, mode change, or a viewport
   ruler event, so a width changing underneath it latches a stale margin.

   Until you have done this, pass `[collapsible]="false"` — otherwise the
   toggle renders and misbehaves when a rider clicks it.

2. **Don't auto-collapse an overlay drawer.** `autoCollapseBelow` defaults
   to `0` (off) and should stay off wherever the drawer is in `over` mode:
   an overlay floats above the content and isn't competing for horizontal
   space, so opening it as an icon strip costs the rider labels for no
   gain. If your layout switches to `over` below some width, gate the
   breakpoint on that same signal rather than passing a constant:

   ```html
   <assay-rail [autoCollapseBelow]="isMobile() ? 0 : 1280" …>
   ```

Give labeled groups an `icon` before enabling any of this — collapsed, a
labeled group shows one icon for the whole category, and without `icon` it
falls back to the group's *first item's* icon, which reads as that
destination rather than the category. If your service maps its own nav
config into `AssayNavGroup` objects, check that the mapping actually
forwards `icon`: a field-by-field rebuild drops it silently, and the icons
you added will have no effect with nothing to indicate why.

## What's deliberately NOT in the library

- **No fabricated navigation destinations.** The rail and account menu
  accept only the nav items / menu items you pass in. Neither invents
  "Settings" or "My profile" links — if your service doesn't have a
  real route for something, don't pass it.
- **No nesting below one level.** A labeled group collapses into an
  accordion section and the rail reduces to icons on narrow viewports
  (see `assay-rail`), but groups hold items, and items hold nothing. If a
  service's nav is deeper than that, split it into more groups rather
  than nesting further.
- **No opinion on how you compose the shell.** `assay-rail` and
  `assay-topbar` are independent components — wire them into your own
  `mat-sidenav-container` (or plain flex layout, if your service doesn't
  use Angular Material) however fits your app. The library doesn't ship
  a single all-in-one `<assay-shell>` because services differ in
  whether/how they need a mobile drawer, and forcing one shape would
  have meant assuming Angular Material everywhere.
- **No color token changes for any given service.** A service's own
  design tokens are its own concern — some services have accessibility
  test suites (contrast-verified hex values) that a blind snap to
  Assay's literal palette could silently break. `assay-ui` ships the
  *reference* tokens (`styles/tokens.css`) for services that want to
  adopt them directly; services with their own tuned tokens can keep
  them and just consume the component markup/toolkit classes.

## Releasing a new version

The library is source-published, not registry-published: consumers
install a **git tag**, and that tag must resolve to a *built* package
(compiled JS/CSS a plain `npm install` can use immediately — no build
step runs on the consumer's machine). Concretely, tags are cut on an
orphan `dist` branch whose root **is** `dist/assay-ui/`'s contents, not
on `main` (which holds the buildable source).

```bash
npm install            # once, or after dependency changes
npm run build           # -> dist/assay-ui/
./scripts/release.sh 0.1.0   # builds, commits dist/assay-ui/ onto the
                              # `dist` branch, tags it assay-ui-v0.1.0, pushes both
```

After a release, bump the version each consuming service pins to and
open a PR there — `assay-ui` itself never auto-propagates.

## Local development

```bash
npm install
npm run build            # ng build assay-ui -> dist/assay-ui/
```

There's no demo app in this workspace yet (`ng generate application demo`
would add one) — for now, build and `npm link` the library, or reference
`dist/assay-ui` directly, to try changes in a real service before
cutting a release.
