import { NgTemplateOutlet } from '@angular/common';
import * as i0 from '@angular/core';
import { input, output, inject, signal, computed, effect, Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

/**
 * The Assay navigation rail — the literal `a-rail` markup every Conduit service shares:
 * brand mark, `a-rail__item` links with the active item marked via `aria-current="page"`
 * (which `assay-ui/styles/toolkit.css` renders as the Current-gradient slice).
 *
 * A labeled group with more than one item renders as a collapsible accordion section — a
 * clickable header with a chevron, one group open at a time, auto-expanding to reveal
 * whichever group owns the active route (on load and on navigation) and otherwise remembering
 * the rider's last choice per `service()` in `localStorage`. An unlabeled group, or a labeled
 * group with exactly one item, renders flat instead — there's nothing to disclose.
 *
 * The rail also reduces to an icon-only strip (`var(--a-rail-collapsed)`, 72px) on the rider's
 * toggle, and unprompted below `autoCollapseBelow()` once a host opts into that. Collapsed,
 * a labeled group shows one icon standing for the whole category — clicking it restores the full
 * rail with that group open — while an unlabeled group shows its items' own icons. Expanded, every
 * row shows icon and label together.
 *
 * Host apps compose this inside their own drawer/sidenav (e.g. Angular Material's
 * `mat-sidenav`) rather than this library owning that responsibility, since hosts differ in
 * whether they use Material at all. The rail sizes its own host element between
 * `var(--a-rail-width)` and `var(--a-rail-collapsed)`, so a drawer with a hard-coded width will
 * not follow it: give that drawer `width: auto`, or resize it from `(collapsedChange)`. Until
 * you have, leave `autoCollapseBelow` at its default of 0 — otherwise the rail shrinks inside a
 * drawer that doesn't, which is why unprompted collapsing is opt-in rather than automatic.
 *
 * @example
 * ```html
 * <assay-rail service="CELBAN" [groups]="navGroups" (itemClick)="onNavClick()">
 *   <div assayRailFooter>© 2026 Touchstone Institute.</div>
 * </assay-rail>
 * ```
 */
class AssayRailComponent {
    /** Shown under "CONDUIT" in the brand block, e.g. "CELBAN", "Campus", "Insights". Also
     *  scopes the accordion's remembered-open-group `localStorage` key, so multiple Conduit
     *  apps in the same browser don't stomp on each other's rail state. */
    service = input.required(...(ngDevMode ? [{ debugName: "service" }] : /* istanbul ignore next */ []));
    groups = input.required(...(ngDevMode ? [{ debugName: "groups" }] : /* istanbul ignore next */ []));
    ariaLabel = input('Main navigation', ...(ngDevMode ? [{ debugName: "ariaLabel" }] : /* istanbul ignore next */ []));
    /** Set false to pin the rail open — no toggle, no auto-reduction. */
    collapsible = input(true, ...(ngDevMode ? [{ debugName: "collapsible" }] : /* istanbul ignore next */ []));
    /**
     * Viewport width (px) under which the rail reduces itself to icons unprompted. **Off by
     * default (0)**, because the rail sizes its own host element and most hosts wrap it in a
     * drawer with a hard-coded `width: var(--a-rail-width)` — switching this on without also
     * letting that drawer size to content leaves a 72px rail inside a 248px drawer. Set it to a
     * breakpoint (1280 is the Assay reference value) only once the host drawer follows the rail:
     * `width: auto` on the drawer, or resize it from `(collapsedChange)`. The manual toggle works
     * regardless of this setting. (A `mat-sidenav-container[autosize]` host's own remeasure of its
     * content margin doesn't reliably follow this rail's width on its own — see the constructor's
     * `resize`-dispatch effect below, which compensates for that.)
     */
    autoCollapseBelow = input(0, ...(ngDevMode ? [{ debugName: "autoCollapseBelow" }] : /* istanbul ignore next */ []));
    /** Fires on every item click — hosts typically use this to close a mobile drawer. */
    itemClick = output();
    /** Fires whenever the rail reduces or restores, so a host drawer can resize with it. */
    collapsedChange = output();
    router = inject(Router);
    currentUrl = toSignal(this.router.events.pipe(filter((e) => e instanceof NavigationEnd), map((e) => e.urlAfterRedirects), startWith(this.router.url)), { initialValue: this.router.url });
    /** True while the viewport sits below `autoCollapseBelow()`. Drives the rail on its own
     *  unless the rider has since overridden it by hand. */
    viewportNarrow = signal(false, ...(ngDevMode ? [{ debugName: "viewportNarrow" }] : /* istanbul ignore next */ []));
    /** The rider's explicit choice, or null to follow the viewport. Crossing the breakpoint
     *  clears it, so a resize hands control back to the automatic behaviour. */
    manuallyCollapsed = signal(null, ...(ngDevMode ? [{ debugName: "manuallyCollapsed" }] : /* istanbul ignore next */ []));
    collapsed = computed(() => {
        if (!this.collapsible())
            return false;
        return this.manuallyCollapsed() ?? this.viewportNarrow();
    }, ...(ngDevMode ? [{ debugName: "collapsed" }] : /* istanbul ignore next */ []));
    constructor() {
        effect((onCleanup) => {
            const breakpoint = this.autoCollapseBelow();
            if (!breakpoint || typeof window === 'undefined' || !window.matchMedia) {
                // Auto-collapse just turned off (e.g. a host switching to `0` for handset, where an
                // overlay drawer shouldn't reduce to icons). Without this, a `viewportNarrow` left
                // `true` from the previous breakpoint keeps forcing the rail collapsed even though
                // nothing is driving it anymore — `collapsed()` falls back to it once
                // `manuallyCollapsed()` is null, which it is here.
                this.viewportNarrow.set(false);
                return;
            }
            const query = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
            const apply = (matches) => {
                this.viewportNarrow.set(matches);
                this.manuallyCollapsed.set(null);
            };
            this.viewportNarrow.set(query.matches);
            const onChange = (event) => apply(event.matches);
            query.addEventListener('change', onChange);
            onCleanup(() => query.removeEventListener('change', onChange));
        });
        let previous = null;
        effect(() => {
            const next = this.collapsed();
            if (previous !== null && previous !== next)
                this.collapsedChange.emit(next);
            previous = next;
        });
        // A host's `mat-sidenav-container[autosize]` (or equivalent) only re-measures its content
        // margin on a handful of specific triggers — open/close, mode change, or a `ViewportRuler`
        // change — none of which our own width transition fires by itself. Left alone, the
        // container's cached margin goes stale the moment this rail's width changes: a dead gutter
        // after collapsing, or content rendered underneath the rail after expanding again. This
        // reproduces identically whether or not the host runs zoneless change detection, so it
        // isn't a zone timing gap — `ResizeObserver`-based autosize just doesn't reliably catch a
        // CSS-transitioned width. Dispatching a `resize` event is what `ViewportRuler` listens for,
        // and is a documented, real remeasure trigger rather than a workaround bolted on from
        // outside. Fired twice: once next frame, for a width that's already applied by the time this
        // runs (a fresh render in a collapsed state has no transition to wait for), and once after
        // `--a-motion-standard` (200ms) has had time to finish, for a width that animates there.
        effect(() => {
            this.collapsed();
            if (typeof window === 'undefined')
                return;
            const nudge = () => window.dispatchEvent(new Event('resize'));
            requestAnimationFrame(nudge);
            setTimeout(nudge, 250);
        });
    }
    toggleCollapsed() {
        this.manuallyCollapsed.set(!this.collapsed());
    }
    /** Collapsed, a category icon is the only handle onto its items — so clicking it restores
     *  the full rail with that group open rather than navigating somewhere arbitrary. */
    revealGroup(group) {
        this.manuallyCollapsed.set(false);
        if (group.label) {
            this.manuallyOpenedLabel.set(group.label);
            this.saveRememberedGroup(group.label);
        }
    }
    /** Falls back to the first item's icon so navs written before groups had icons still
     *  collapse to something meaningful. */
    groupIcon(group) {
        return group.icon ?? group.items[0]?.icon ?? 'chevron_right';
    }
    /** The one open group, by label. Seeded from the group owning the active route if there is
     *  one, else the rider's last manual choice for this `service()`, else nothing. Recomputes
     *  on navigation so following a link (including from outside the rail, e.g. a search jump)
     *  always reveals its own group — this is deliberately a `computed()`, not a persisted
     *  signal, so navigation always wins over a stale manual choice. */
    activeGroupLabel = computed(() => {
        const url = this.currentUrl();
        for (const group of this.groups()) {
            if (!group.label)
                continue;
            if (group.items.some((item) => this.itemMatchesUrl(item, url)))
                return group.label;
        }
        return null;
    }, ...(ngDevMode ? [{ debugName: "activeGroupLabel" }] : /* istanbul ignore next */ []));
    manuallyOpenedLabel = signal(null, ...(ngDevMode ? [{ debugName: "manuallyOpenedLabel" }] : /* istanbul ignore next */ []));
    expandedGroupLabel = computed(() => this.activeGroupLabel() ?? this.manuallyOpenedLabel() ?? this.loadRememberedGroup(), ...(ngDevMode ? [{ debugName: "expandedGroupLabel" }] : /* istanbul ignore next */ []));
    /** A group is worth collapsing behind a toggle only if it has a label AND more than one
     *  item — an unlabeled group has no header to click, and a single-item group renders as a
     *  flat link using that item's own icon instead (nothing to disclose). */
    isCollapsible(group) {
        return !!group.label && group.items.length > 1;
    }
    isExpanded(group) {
        return !!group.label && this.expandedGroupLabel() === group.label;
    }
    /** Marks the collapsed rail's category icon for whichever group owns the active route. */
    isActiveGroup(group) {
        return !!group.label && this.activeGroupLabel() === group.label;
    }
    groupId(index) {
        return `a-rail-group-${index}`;
    }
    toggleGroup(group) {
        if (!group.label)
            return;
        const next = this.isExpanded(group) ? null : group.label;
        this.manuallyOpenedLabel.set(next);
        this.saveRememberedGroup(next);
    }
    itemMatchesUrl(item, url) {
        if (!item.routerLink)
            return false;
        const path = Array.isArray(item.routerLink) ? item.routerLink.join('/') : item.routerLink;
        const normalized = path.startsWith('/') ? path : `/${path}`;
        return item.exact ? url === normalized : url.startsWith(normalized);
    }
    get storageKey() {
        return `assay-rail.expanded-group.${this.service()}`;
    }
    loadRememberedGroup() {
        try {
            return localStorage.getItem(this.storageKey);
        }
        catch {
            return null;
        }
    }
    saveRememberedGroup(label) {
        try {
            if (label)
                localStorage.setItem(this.storageKey, label);
            else
                localStorage.removeItem(this.storageKey);
        }
        catch {
            // Storage may be unavailable (private mode) — expansion state stays in-memory only.
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.21", ngImport: i0, type: AssayRailComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "21.2.21", type: AssayRailComponent, isStandalone: true, selector: "assay-rail", inputs: { service: { classPropertyName: "service", publicName: "service", isSignal: true, isRequired: true, transformFunction: null }, groups: { classPropertyName: "groups", publicName: "groups", isSignal: true, isRequired: true, transformFunction: null }, ariaLabel: { classPropertyName: "ariaLabel", publicName: "ariaLabel", isSignal: true, isRequired: false, transformFunction: null }, collapsible: { classPropertyName: "collapsible", publicName: "collapsible", isSignal: true, isRequired: false, transformFunction: null }, autoCollapseBelow: { classPropertyName: "autoCollapseBelow", publicName: "autoCollapseBelow", isSignal: true, isRequired: false, transformFunction: null } }, outputs: { itemClick: "itemClick", collapsedChange: "collapsedChange" }, host: { properties: { "class.is-collapsed": "collapsed()" } }, ngImport: i0, template: `
    <nav class="a-rail" [class.a-rail--collapsed]="collapsed()" [attr.aria-label]="ariaLabel()">
      <div class="a-rail__brand">
        <span class="a-mark" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <defs>
              <linearGradient id="assayRailMark" x1="0" y1="0" x2="22" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#4C5BC4" />
                <stop offset="0.55" stop-color="#19B0D4" />
                <stop offset="1" stop-color="#A8D44E" />
              </linearGradient>
            </defs>
            <path
              d="M1 13 H8 C9.5 13 9.5 7 11 7 C12.5 7 12.5 15 14 15 C15.2 15 15.4 13 16.5 13 H21"
              stroke="url(#assayRailMark)"
              stroke-width="2.2"
              stroke-linecap="round"
              fill="none"
            />
          </svg>
        </span>
        @if (!collapsed()) {
          <span>
            <span class="a-rail__brand-name">CONDUIT</span><br />
            <span class="a-rail__brand-service">{{ service() }}</span>
          </span>
          @if (collapsible()) {
            <button type="button" class="a-rail__collapse" aria-label="Collapse navigation" (click)="toggleCollapsed()">
              <span class="a-icon" aria-hidden="true">left_panel_close</span>
            </button>
          }
        }
      </div>

      @if (collapsed() && collapsible()) {
        <button
          type="button"
          class="a-rail__collapse a-rail__collapse--solo"
          aria-label="Expand navigation"
          (click)="toggleCollapsed()"
        >
          <span class="a-icon" aria-hidden="true">left_panel_open</span>
        </button>
      }

      @for (group of groups(); track $index) {
        @if (collapsed()) {
          @if (group.label) {
            <button
              type="button"
              class="a-rail__item a-rail__item--icon"
              [class.is-current]="isActiveGroup(group)"
              [title]="group.label"
              [attr.aria-label]="group.label"
              (click)="revealGroup(group)"
            >
              <span class="a-icon" aria-hidden="true">{{ groupIcon(group) }}</span>
            </button>
          } @else {
            @for (item of group.items; track item.label) {
              <ng-container [ngTemplateOutlet]="railIconItem" [ngTemplateOutletContext]="{ $implicit: item }" />
            }
          }
        } @else if (isCollapsible(group)) {
          <button
            type="button"
            class="a-rail__section a-rail__section--toggle"
            [attr.aria-expanded]="isExpanded(group)"
            [attr.aria-controls]="groupId($index)"
            (click)="toggleGroup(group)"
          >
            <span>{{ group.label }}</span>
            <span class="a-icon a-rail__section-chevron" aria-hidden="true">expand_more</span>
          </button>
          <div class="a-rail__group" [class.is-open]="isExpanded(group)" [id]="groupId($index)">
            <div class="a-rail__group-inner">
              @for (item of group.items; track item.label) {
                <ng-container [ngTemplateOutlet]="railItem" [ngTemplateOutletContext]="{ $implicit: item }" />
              }
            </div>
          </div>
        } @else {
          @if (group.label) {
            <div class="a-rail__section">{{ group.label }}</div>
          }
          @for (item of group.items; track item.label) {
            <ng-container [ngTemplateOutlet]="railItem" [ngTemplateOutletContext]="{ $implicit: item }" />
          }
        }
      }

      <div class="a-rail__spacer"></div>
      <!-- Projected once and hidden by CSS when collapsed, rather than sitting inside an @if:
           footer text has nowhere to go at 72px, but re-projecting on every toggle would
           needlessly tear down whatever the host put here. -->
      <div class="a-rail__footer-slot">
        <ng-content select="[assayRailFooter]" />
      </div>
    </nav>

    <ng-template #railItem let-item>
      @if (item.routerLink) {
        <a
          [routerLink]="item.routerLink"
          routerLinkActive
          #rla="routerLinkActive"
          [routerLinkActiveOptions]="{ exact: !!item.exact }"
          [attr.aria-current]="rla.isActive ? 'page' : null"
          class="a-rail__item"
          (click)="itemClick.emit(item)"
        >
          <span class="a-icon" aria-hidden="true">{{ item.icon }}</span>
          {{ item.label }}
          @if (item.badge !== undefined) {
            <span class="a-rail__badge">{{ item.badge }}</span>
          }
        </a>
      } @else {
        <a [href]="item.href" class="a-rail__item" (click)="itemClick.emit(item)">
          <span class="a-icon" aria-hidden="true">{{ item.icon }}</span>
          {{ item.label }}
          @if (item.badge !== undefined) {
            <span class="a-rail__badge">{{ item.badge }}</span>
          }
        </a>
      }
    </ng-template>

    <ng-template #railIconItem let-item>
      @if (item.routerLink) {
        <a
          [routerLink]="item.routerLink"
          routerLinkActive
          #rla="routerLinkActive"
          [routerLinkActiveOptions]="{ exact: !!item.exact }"
          [attr.aria-current]="rla.isActive ? 'page' : null"
          class="a-rail__item a-rail__item--icon"
          [title]="item.label"
          [attr.aria-label]="item.label"
          (click)="itemClick.emit(item)"
        >
          <span class="a-icon" aria-hidden="true">{{ item.icon }}</span>
          @if (item.badge !== undefined) {
            <span class="a-rail__badge a-rail__badge--dot" aria-hidden="true"></span>
          }
        </a>
      } @else {
        <a
          [href]="item.href"
          class="a-rail__item a-rail__item--icon"
          [title]="item.label"
          [attr.aria-label]="item.label"
          (click)="itemClick.emit(item)"
        >
          <span class="a-icon" aria-hidden="true">{{ item.icon }}</span>
          @if (item.badge !== undefined) {
            <span class="a-rail__badge a-rail__badge--dot" aria-hidden="true"></span>
          }
        </a>
      }
    </ng-template>
  `, isInline: true, styles: [":host{display:block;height:100%;width:var(--a-rail-width);transition:width var(--a-motion-standard)}:host(.is-collapsed){width:var(--a-rail-collapsed)}.a-rail{height:100%}\n"], dependencies: [{ kind: "directive", type: NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "directive", type: RouterLink, selector: "[routerLink]", inputs: ["target", "queryParams", "fragment", "queryParamsHandling", "state", "info", "relativeTo", "preserveFragment", "skipLocationChange", "replaceUrl", "routerLink"] }, { kind: "directive", type: RouterLinkActive, selector: "[routerLinkActive]", inputs: ["routerLinkActiveOptions", "ariaCurrentWhenActive", "routerLinkActive"], outputs: ["isActiveChange"], exportAs: ["routerLinkActive"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.21", ngImport: i0, type: AssayRailComponent, decorators: [{
            type: Component,
            args: [{ selector: 'assay-rail', imports: [NgTemplateOutlet, RouterLink, RouterLinkActive], host: {
                        '[class.is-collapsed]': 'collapsed()',
                    }, template: `
    <nav class="a-rail" [class.a-rail--collapsed]="collapsed()" [attr.aria-label]="ariaLabel()">
      <div class="a-rail__brand">
        <span class="a-mark" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <defs>
              <linearGradient id="assayRailMark" x1="0" y1="0" x2="22" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#4C5BC4" />
                <stop offset="0.55" stop-color="#19B0D4" />
                <stop offset="1" stop-color="#A8D44E" />
              </linearGradient>
            </defs>
            <path
              d="M1 13 H8 C9.5 13 9.5 7 11 7 C12.5 7 12.5 15 14 15 C15.2 15 15.4 13 16.5 13 H21"
              stroke="url(#assayRailMark)"
              stroke-width="2.2"
              stroke-linecap="round"
              fill="none"
            />
          </svg>
        </span>
        @if (!collapsed()) {
          <span>
            <span class="a-rail__brand-name">CONDUIT</span><br />
            <span class="a-rail__brand-service">{{ service() }}</span>
          </span>
          @if (collapsible()) {
            <button type="button" class="a-rail__collapse" aria-label="Collapse navigation" (click)="toggleCollapsed()">
              <span class="a-icon" aria-hidden="true">left_panel_close</span>
            </button>
          }
        }
      </div>

      @if (collapsed() && collapsible()) {
        <button
          type="button"
          class="a-rail__collapse a-rail__collapse--solo"
          aria-label="Expand navigation"
          (click)="toggleCollapsed()"
        >
          <span class="a-icon" aria-hidden="true">left_panel_open</span>
        </button>
      }

      @for (group of groups(); track $index) {
        @if (collapsed()) {
          @if (group.label) {
            <button
              type="button"
              class="a-rail__item a-rail__item--icon"
              [class.is-current]="isActiveGroup(group)"
              [title]="group.label"
              [attr.aria-label]="group.label"
              (click)="revealGroup(group)"
            >
              <span class="a-icon" aria-hidden="true">{{ groupIcon(group) }}</span>
            </button>
          } @else {
            @for (item of group.items; track item.label) {
              <ng-container [ngTemplateOutlet]="railIconItem" [ngTemplateOutletContext]="{ $implicit: item }" />
            }
          }
        } @else if (isCollapsible(group)) {
          <button
            type="button"
            class="a-rail__section a-rail__section--toggle"
            [attr.aria-expanded]="isExpanded(group)"
            [attr.aria-controls]="groupId($index)"
            (click)="toggleGroup(group)"
          >
            <span>{{ group.label }}</span>
            <span class="a-icon a-rail__section-chevron" aria-hidden="true">expand_more</span>
          </button>
          <div class="a-rail__group" [class.is-open]="isExpanded(group)" [id]="groupId($index)">
            <div class="a-rail__group-inner">
              @for (item of group.items; track item.label) {
                <ng-container [ngTemplateOutlet]="railItem" [ngTemplateOutletContext]="{ $implicit: item }" />
              }
            </div>
          </div>
        } @else {
          @if (group.label) {
            <div class="a-rail__section">{{ group.label }}</div>
          }
          @for (item of group.items; track item.label) {
            <ng-container [ngTemplateOutlet]="railItem" [ngTemplateOutletContext]="{ $implicit: item }" />
          }
        }
      }

      <div class="a-rail__spacer"></div>
      <!-- Projected once and hidden by CSS when collapsed, rather than sitting inside an @if:
           footer text has nowhere to go at 72px, but re-projecting on every toggle would
           needlessly tear down whatever the host put here. -->
      <div class="a-rail__footer-slot">
        <ng-content select="[assayRailFooter]" />
      </div>
    </nav>

    <ng-template #railItem let-item>
      @if (item.routerLink) {
        <a
          [routerLink]="item.routerLink"
          routerLinkActive
          #rla="routerLinkActive"
          [routerLinkActiveOptions]="{ exact: !!item.exact }"
          [attr.aria-current]="rla.isActive ? 'page' : null"
          class="a-rail__item"
          (click)="itemClick.emit(item)"
        >
          <span class="a-icon" aria-hidden="true">{{ item.icon }}</span>
          {{ item.label }}
          @if (item.badge !== undefined) {
            <span class="a-rail__badge">{{ item.badge }}</span>
          }
        </a>
      } @else {
        <a [href]="item.href" class="a-rail__item" (click)="itemClick.emit(item)">
          <span class="a-icon" aria-hidden="true">{{ item.icon }}</span>
          {{ item.label }}
          @if (item.badge !== undefined) {
            <span class="a-rail__badge">{{ item.badge }}</span>
          }
        </a>
      }
    </ng-template>

    <ng-template #railIconItem let-item>
      @if (item.routerLink) {
        <a
          [routerLink]="item.routerLink"
          routerLinkActive
          #rla="routerLinkActive"
          [routerLinkActiveOptions]="{ exact: !!item.exact }"
          [attr.aria-current]="rla.isActive ? 'page' : null"
          class="a-rail__item a-rail__item--icon"
          [title]="item.label"
          [attr.aria-label]="item.label"
          (click)="itemClick.emit(item)"
        >
          <span class="a-icon" aria-hidden="true">{{ item.icon }}</span>
          @if (item.badge !== undefined) {
            <span class="a-rail__badge a-rail__badge--dot" aria-hidden="true"></span>
          }
        </a>
      } @else {
        <a
          [href]="item.href"
          class="a-rail__item a-rail__item--icon"
          [title]="item.label"
          [attr.aria-label]="item.label"
          (click)="itemClick.emit(item)"
        >
          <span class="a-icon" aria-hidden="true">{{ item.icon }}</span>
          @if (item.badge !== undefined) {
            <span class="a-rail__badge a-rail__badge--dot" aria-hidden="true"></span>
          }
        </a>
      }
    </ng-template>
  `, styles: [":host{display:block;height:100%;width:var(--a-rail-width);transition:width var(--a-motion-standard)}:host(.is-collapsed){width:var(--a-rail-collapsed)}.a-rail{height:100%}\n"] }]
        }], ctorParameters: () => [], propDecorators: { service: [{ type: i0.Input, args: [{ isSignal: true, alias: "service", required: true }] }], groups: [{ type: i0.Input, args: [{ isSignal: true, alias: "groups", required: true }] }], ariaLabel: [{ type: i0.Input, args: [{ isSignal: true, alias: "ariaLabel", required: false }] }], collapsible: [{ type: i0.Input, args: [{ isSignal: true, alias: "collapsible", required: false }] }], autoCollapseBelow: [{ type: i0.Input, args: [{ isSignal: true, alias: "autoCollapseBelow", required: false }] }], itemClick: [{ type: i0.Output, args: ["itemClick"] }], collapsedChange: [{ type: i0.Output, args: ["collapsedChange"] }] } });

/**
 * The Assay account menu — the avatar dropdown every Conduit service shares: identity block
 * (name, role, email), optional extra items you supply (e.g. "My profile"), and Sign out.
 * The library never fabricates extra items — pass `items` only for destinations that
 * genuinely exist in your app.
 *
 * @example
 * ```html
 * <assay-account-menu
 *   name="Rosa Dela Cruz" role="Candidate" email="rosa@example.com" initials="RD"
 *   (signOut)="logout()"
 * />
 * ```
 */
class AssayAccountMenuComponent {
    name = input.required(...(ngDevMode ? [{ debugName: "name" }] : /* istanbul ignore next */ []));
    role = input('', ...(ngDevMode ? [{ debugName: "role" }] : /* istanbul ignore next */ []));
    email = input('', ...(ngDevMode ? [{ debugName: "email" }] : /* istanbul ignore next */ []));
    initials = input.required(...(ngDevMode ? [{ debugName: "initials" }] : /* istanbul ignore next */ []));
    items = input([], ...(ngDevMode ? [{ debugName: "items" }] : /* istanbul ignore next */ []));
    signOut = output();
    open = signal(false, ...(ngDevMode ? [{ debugName: "open" }] : /* istanbul ignore next */ []));
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.21", ngImport: i0, type: AssayAccountMenuComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "21.2.21", type: AssayAccountMenuComponent, isStandalone: true, selector: "assay-account-menu", inputs: { name: { classPropertyName: "name", publicName: "name", isSignal: true, isRequired: true, transformFunction: null }, role: { classPropertyName: "role", publicName: "role", isSignal: true, isRequired: false, transformFunction: null }, email: { classPropertyName: "email", publicName: "email", isSignal: true, isRequired: false, transformFunction: null }, initials: { classPropertyName: "initials", publicName: "initials", isSignal: true, isRequired: true, transformFunction: null }, items: { classPropertyName: "items", publicName: "items", isSignal: true, isRequired: false, transformFunction: null } }, outputs: { signOut: "signOut" }, ngImport: i0, template: `
    <div class="a-account">
      <button
        type="button"
        class="a-account__trigger"
        aria-label="Account menu"
        aria-haspopup="menu"
        [attr.aria-expanded]="open()"
        (click)="open.set(!open())"
      >
        <span class="a-avatar" aria-hidden="true">{{ initials() }}</span>
        <span class="a-icon a-icon--xs" aria-hidden="true">expand_more</span>
      </button>

      @if (open()) {
        <div class="a-account-menu" role="menu">
          <div class="a-account-menu__id">
            <span class="a-avatar a-avatar--lg" aria-hidden="true">{{ initials() }}</span>
            <span>
              <span class="a-account-menu__name">{{ name() }}</span><br />
              <span class="a-account-menu__meta">{{ role() }}</span><br />
              @if (email()) {
                <span class="a-account-menu__meta">{{ email() }}</span>
              }
            </span>
          </div>
          @if (items().length) {
            <hr class="a-divider" style="margin: var(--space-2) 0" />
            @for (item of items(); track item.label) {
              @if (item.routerLink) {
                <a [routerLink]="item.routerLink" class="a-account-menu__item" role="menuitem" (click)="open.set(false)">
                  <span class="a-icon a-icon--sm" aria-hidden="true">{{ item.icon }}</span>
                  <span>{{ item.label }}</span>
                </a>
              } @else {
                <a [href]="item.href" class="a-account-menu__item" role="menuitem" (click)="open.set(false)">
                  <span class="a-icon a-icon--sm" aria-hidden="true">{{ item.icon }}</span>
                  <span>{{ item.label }}</span>
                </a>
              }
            }
          }
          <hr class="a-divider" style="margin: var(--space-2) 0" />
          <button
            type="button"
            class="a-account-menu__item a-account-menu__item--signout"
            role="menuitem"
            (click)="open.set(false); signOut.emit()"
          >
            <span class="a-icon a-icon--sm" aria-hidden="true">logout</span>
            <span>Sign out of Conduit</span>
          </button>
        </div>
      }
    </div>
  `, isInline: true, dependencies: [{ kind: "directive", type: RouterLink, selector: "[routerLink]", inputs: ["target", "queryParams", "fragment", "queryParamsHandling", "state", "info", "relativeTo", "preserveFragment", "skipLocationChange", "replaceUrl", "routerLink"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.21", ngImport: i0, type: AssayAccountMenuComponent, decorators: [{
            type: Component,
            args: [{
                    selector: 'assay-account-menu',
                    imports: [RouterLink],
                    template: `
    <div class="a-account">
      <button
        type="button"
        class="a-account__trigger"
        aria-label="Account menu"
        aria-haspopup="menu"
        [attr.aria-expanded]="open()"
        (click)="open.set(!open())"
      >
        <span class="a-avatar" aria-hidden="true">{{ initials() }}</span>
        <span class="a-icon a-icon--xs" aria-hidden="true">expand_more</span>
      </button>

      @if (open()) {
        <div class="a-account-menu" role="menu">
          <div class="a-account-menu__id">
            <span class="a-avatar a-avatar--lg" aria-hidden="true">{{ initials() }}</span>
            <span>
              <span class="a-account-menu__name">{{ name() }}</span><br />
              <span class="a-account-menu__meta">{{ role() }}</span><br />
              @if (email()) {
                <span class="a-account-menu__meta">{{ email() }}</span>
              }
            </span>
          </div>
          @if (items().length) {
            <hr class="a-divider" style="margin: var(--space-2) 0" />
            @for (item of items(); track item.label) {
              @if (item.routerLink) {
                <a [routerLink]="item.routerLink" class="a-account-menu__item" role="menuitem" (click)="open.set(false)">
                  <span class="a-icon a-icon--sm" aria-hidden="true">{{ item.icon }}</span>
                  <span>{{ item.label }}</span>
                </a>
              } @else {
                <a [href]="item.href" class="a-account-menu__item" role="menuitem" (click)="open.set(false)">
                  <span class="a-icon a-icon--sm" aria-hidden="true">{{ item.icon }}</span>
                  <span>{{ item.label }}</span>
                </a>
              }
            }
          }
          <hr class="a-divider" style="margin: var(--space-2) 0" />
          <button
            type="button"
            class="a-account-menu__item a-account-menu__item--signout"
            role="menuitem"
            (click)="open.set(false); signOut.emit()"
          >
            <span class="a-icon a-icon--sm" aria-hidden="true">logout</span>
            <span>Sign out of Conduit</span>
          </button>
        </div>
      }
    </div>
  `,
                }]
        }], propDecorators: { name: [{ type: i0.Input, args: [{ isSignal: true, alias: "name", required: true }] }], role: [{ type: i0.Input, args: [{ isSignal: true, alias: "role", required: false }] }], email: [{ type: i0.Input, args: [{ isSignal: true, alias: "email", required: false }] }], initials: [{ type: i0.Input, args: [{ isSignal: true, alias: "initials", required: true }] }], items: [{ type: i0.Input, args: [{ isSignal: true, alias: "items", required: false }] }], signOut: [{ type: i0.Output, args: ["signOut"] }] } });

/**
 * The Assay top bar — the literal `a-topbar` every Conduit service shares: context text,
 * an optional search field, and (from the right) any host-supplied extra actions, then the
 * account menu. Height and chrome come entirely from `assay-ui/styles/toolkit.css`.
 *
 * @example
 * ```html
 * <assay-topbar
 *   serviceLabel="Staff Portal" [showMenuToggle]="true" [showSearch]="true"
 *   userName="Amara Osei" userInitials="AO"
 *   (menuToggle)="sidenav.toggle()" (searchSubmit)="onSearch($event)" (signOut)="logout()"
 * >
 *   <app-accessibility-menu assayTopbarActions />
 * </assay-topbar>
 * ```
 */
class AssayTopbarComponent {
    showMenuToggle = input(false, ...(ngDevMode ? [{ debugName: "showMenuToggle" }] : /* istanbul ignore next */ []));
    menuToggle = output();
    serviceLabel = input('', ...(ngDevMode ? [{ debugName: "serviceLabel" }] : /* istanbul ignore next */ []));
    envLabel = input('Touchstone Institute · Conduit', ...(ngDevMode ? [{ debugName: "envLabel" }] : /* istanbul ignore next */ []));
    showSearch = input(false, ...(ngDevMode ? [{ debugName: "showSearch" }] : /* istanbul ignore next */ []));
    searchPlaceholder = input('Search…', ...(ngDevMode ? [{ debugName: "searchPlaceholder" }] : /* istanbul ignore next */ []));
    searchAriaLabel = input('Search', ...(ngDevMode ? [{ debugName: "searchAriaLabel" }] : /* istanbul ignore next */ []));
    searchSubmit = output();
    userName = input.required(...(ngDevMode ? [{ debugName: "userName" }] : /* istanbul ignore next */ []));
    userRole = input('', ...(ngDevMode ? [{ debugName: "userRole" }] : /* istanbul ignore next */ []));
    userEmail = input('', ...(ngDevMode ? [{ debugName: "userEmail" }] : /* istanbul ignore next */ []));
    userInitials = input.required(...(ngDevMode ? [{ debugName: "userInitials" }] : /* istanbul ignore next */ []));
    accountMenuItems = input([], ...(ngDevMode ? [{ debugName: "accountMenuItems" }] : /* istanbul ignore next */ []));
    signOut = output();
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.21", ngImport: i0, type: AssayTopbarComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "21.2.21", type: AssayTopbarComponent, isStandalone: true, selector: "assay-topbar", inputs: { showMenuToggle: { classPropertyName: "showMenuToggle", publicName: "showMenuToggle", isSignal: true, isRequired: false, transformFunction: null }, serviceLabel: { classPropertyName: "serviceLabel", publicName: "serviceLabel", isSignal: true, isRequired: false, transformFunction: null }, envLabel: { classPropertyName: "envLabel", publicName: "envLabel", isSignal: true, isRequired: false, transformFunction: null }, showSearch: { classPropertyName: "showSearch", publicName: "showSearch", isSignal: true, isRequired: false, transformFunction: null }, searchPlaceholder: { classPropertyName: "searchPlaceholder", publicName: "searchPlaceholder", isSignal: true, isRequired: false, transformFunction: null }, searchAriaLabel: { classPropertyName: "searchAriaLabel", publicName: "searchAriaLabel", isSignal: true, isRequired: false, transformFunction: null }, userName: { classPropertyName: "userName", publicName: "userName", isSignal: true, isRequired: true, transformFunction: null }, userRole: { classPropertyName: "userRole", publicName: "userRole", isSignal: true, isRequired: false, transformFunction: null }, userEmail: { classPropertyName: "userEmail", publicName: "userEmail", isSignal: true, isRequired: false, transformFunction: null }, userInitials: { classPropertyName: "userInitials", publicName: "userInitials", isSignal: true, isRequired: true, transformFunction: null }, accountMenuItems: { classPropertyName: "accountMenuItems", publicName: "accountMenuItems", isSignal: true, isRequired: false, transformFunction: null } }, outputs: { menuToggle: "menuToggle", searchSubmit: "searchSubmit", signOut: "signOut" }, ngImport: i0, template: `
    <header class="a-topbar">
      @if (showMenuToggle()) {
        <button type="button" class="a-icon-btn" aria-label="Toggle navigation menu" (click)="menuToggle.emit()">
          <span class="a-icon" aria-hidden="true">menu</span>
        </button>
      }

      <div class="a-topbar__context">
        <span class="a-topbar__service">{{ serviceLabel() }}</span>
        <span class="a-topbar__env">{{ envLabel() }}</span>
      </div>

      <ng-content select="[assayTopbarBetween]" />

      @if (showSearch()) {
        <div class="a-topbar__search">
          <span class="a-icon a-icon--sm" aria-hidden="true">search</span>
          <input
            type="search"
            [attr.aria-label]="searchAriaLabel()"
            [placeholder]="searchPlaceholder()"
            #searchInput
            (keydown.enter)="searchSubmit.emit(searchInput.value)"
          />
        </div>
      }

      <div class="a-topbar__actions">
        <ng-content select="[assayTopbarActions]" />
        <assay-account-menu
          [name]="userName()"
          [role]="userRole()"
          [email]="userEmail()"
          [initials]="userInitials()"
          [items]="accountMenuItems()"
          (signOut)="signOut.emit()"
        />
      </div>
    </header>
  `, isInline: true, dependencies: [{ kind: "component", type: AssayAccountMenuComponent, selector: "assay-account-menu", inputs: ["name", "role", "email", "initials", "items"], outputs: ["signOut"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.21", ngImport: i0, type: AssayTopbarComponent, decorators: [{
            type: Component,
            args: [{
                    selector: 'assay-topbar',
                    imports: [AssayAccountMenuComponent],
                    template: `
    <header class="a-topbar">
      @if (showMenuToggle()) {
        <button type="button" class="a-icon-btn" aria-label="Toggle navigation menu" (click)="menuToggle.emit()">
          <span class="a-icon" aria-hidden="true">menu</span>
        </button>
      }

      <div class="a-topbar__context">
        <span class="a-topbar__service">{{ serviceLabel() }}</span>
        <span class="a-topbar__env">{{ envLabel() }}</span>
      </div>

      <ng-content select="[assayTopbarBetween]" />

      @if (showSearch()) {
        <div class="a-topbar__search">
          <span class="a-icon a-icon--sm" aria-hidden="true">search</span>
          <input
            type="search"
            [attr.aria-label]="searchAriaLabel()"
            [placeholder]="searchPlaceholder()"
            #searchInput
            (keydown.enter)="searchSubmit.emit(searchInput.value)"
          />
        </div>
      }

      <div class="a-topbar__actions">
        <ng-content select="[assayTopbarActions]" />
        <assay-account-menu
          [name]="userName()"
          [role]="userRole()"
          [email]="userEmail()"
          [initials]="userInitials()"
          [items]="accountMenuItems()"
          (signOut)="signOut.emit()"
        />
      </div>
    </header>
  `,
                }]
        }], propDecorators: { showMenuToggle: [{ type: i0.Input, args: [{ isSignal: true, alias: "showMenuToggle", required: false }] }], menuToggle: [{ type: i0.Output, args: ["menuToggle"] }], serviceLabel: [{ type: i0.Input, args: [{ isSignal: true, alias: "serviceLabel", required: false }] }], envLabel: [{ type: i0.Input, args: [{ isSignal: true, alias: "envLabel", required: false }] }], showSearch: [{ type: i0.Input, args: [{ isSignal: true, alias: "showSearch", required: false }] }], searchPlaceholder: [{ type: i0.Input, args: [{ isSignal: true, alias: "searchPlaceholder", required: false }] }], searchAriaLabel: [{ type: i0.Input, args: [{ isSignal: true, alias: "searchAriaLabel", required: false }] }], searchSubmit: [{ type: i0.Output, args: ["searchSubmit"] }], userName: [{ type: i0.Input, args: [{ isSignal: true, alias: "userName", required: true }] }], userRole: [{ type: i0.Input, args: [{ isSignal: true, alias: "userRole", required: false }] }], userEmail: [{ type: i0.Input, args: [{ isSignal: true, alias: "userEmail", required: false }] }], userInitials: [{ type: i0.Input, args: [{ isSignal: true, alias: "userInitials", required: true }] }], accountMenuItems: [{ type: i0.Input, args: [{ isSignal: true, alias: "accountMenuItems", required: false }] }], signOut: [{ type: i0.Output, args: ["signOut"] }] } });

/**
 * The Assay page footer — the literal `a-footer` every Conduit service shares, rendered at
 * the bottom of every page's content region. Pins to the bottom of short pages when its
 * containing element is a flex column (see the toolkit's own `.a-main` for the canonical
 * case, or replicate `margin-top: auto` on a custom content wrapper).
 *
 * @example `<assay-footer />` or `<assay-footer><a assayFooterLink routerLink="/privacy">Privacy</a></assay-footer>`
 */
class AssayFooterComponent {
    year = input(new Date().getFullYear(), ...(ngDevMode ? [{ debugName: "year" }] : /* istanbul ignore next */ []));
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.21", ngImport: i0, type: AssayFooterComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.1.0", version: "21.2.21", type: AssayFooterComponent, isStandalone: true, selector: "assay-footer", inputs: { year: { classPropertyName: "year", publicName: "year", isSignal: true, isRequired: false, transformFunction: null } }, ngImport: i0, template: `
    <footer class="a-footer">
      <span>© {{ year() }} Touchstone Institute. All rights reserved.</span>
      <span class="a-footer__links">
        <ng-content select="[assayFooterLink]" />
      </span>
    </footer>
  `, isInline: true });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.21", ngImport: i0, type: AssayFooterComponent, decorators: [{
            type: Component,
            args: [{
                    selector: 'assay-footer',
                    template: `
    <footer class="a-footer">
      <span>© {{ year() }} Touchstone Institute. All rights reserved.</span>
      <span class="a-footer__links">
        <ng-content select="[assayFooterLink]" />
      </span>
    </footer>
  `,
                }]
        }], propDecorators: { year: [{ type: i0.Input, args: [{ isSignal: true, alias: "year", required: false }] }] } });

/*
 * Public API surface of assay-ui — the shared Angular components for Assay, the Conduit
 * suite's design language. Canonical source: this repo. See README.md for installation
 * (git-tag dependency, no registry) and the styles/ folder for the CSS toolkit these
 * components render against.
 */

/**
 * Generated bundle index. Do not edit.
 */

export { AssayAccountMenuComponent, AssayFooterComponent, AssayRailComponent, AssayTopbarComponent };
//# sourceMappingURL=assay-ui.mjs.map
