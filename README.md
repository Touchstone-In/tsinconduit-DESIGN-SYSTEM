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
dependency**, installed straight from this repo:

```jsonc
// package.json
"dependencies": {
  "assay-ui": "github:Touchstone-In/tsinconduit-design-system#assay-ui-v0.1.0"
}
```

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

## What's deliberately NOT in the library

- **No fabricated navigation destinations.** The rail and account menu
  accept only the nav items / menu items you pass in. Neither invents
  "Settings" or "My profile" links — if your service doesn't have a
  real route for something, don't pass it.
- **No collapsible nav-group behaviour.** No Assay reference mockup has
  one; the rail renders flat sections and flat items. If a service's
  nav is very deep, split it into more sections rather than nesting.
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
