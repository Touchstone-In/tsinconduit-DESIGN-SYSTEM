import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import type { AssayNavGroup, AssayNavItem } from '../types';

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
@Component({
  selector: 'assay-rail',
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive],
  host: {
    '[class.is-collapsed]': 'collapsed()',
  },
  template: `
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
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      width: var(--a-rail-width);
      transition: width var(--a-motion-standard);
    }
    :host(.is-collapsed) {
      width: var(--a-rail-collapsed);
    }
    .a-rail {
      height: 100%;
    }
  `,
})
export class AssayRailComponent {
  /** Shown under "CONDUIT" in the brand block, e.g. "CELBAN", "Campus", "Insights". Also
   *  scopes the accordion's remembered-open-group `localStorage` key, so multiple Conduit
   *  apps in the same browser don't stomp on each other's rail state. */
  readonly service = input.required<string>();
  readonly groups = input.required<AssayNavGroup[]>();
  readonly ariaLabel = input('Main navigation');
  /** Set false to pin the rail open — no toggle, no auto-reduction. */
  readonly collapsible = input(true);
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
  readonly autoCollapseBelow = input(0);
  /** Fires on every item click — hosts typically use this to close a mobile drawer. */
  readonly itemClick = output<AssayNavGroup['items'][number]>();
  /** Fires whenever the rail reduces or restores, so a host drawer can resize with it. */
  readonly collapsedChange = output<boolean>();

  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** True while the viewport sits below `autoCollapseBelow()`. Drives the rail on its own
   *  unless the rider has since overridden it by hand. */
  private readonly viewportNarrow = signal(false);
  /** The rider's explicit choice, or null to follow the viewport. Crossing the breakpoint
   *  clears it, so a resize hands control back to the automatic behaviour. */
  private readonly manuallyCollapsed = signal<boolean | null>(null);

  readonly collapsed = computed(() => {
    if (!this.collapsible()) return false;
    return this.manuallyCollapsed() ?? this.viewportNarrow();
  });

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
      const apply = (matches: boolean) => {
        this.viewportNarrow.set(matches);
        this.manuallyCollapsed.set(null);
      };
      this.viewportNarrow.set(query.matches);

      const onChange = (event: MediaQueryListEvent) => apply(event.matches);
      query.addEventListener('change', onChange);
      onCleanup(() => query.removeEventListener('change', onChange));
    });

    let previous: boolean | null = null;
    effect(() => {
      const next = this.collapsed();
      if (previous !== null && previous !== next) this.collapsedChange.emit(next);
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
      if (typeof window === 'undefined') return;
      const nudge = () => window.dispatchEvent(new Event('resize'));
      requestAnimationFrame(nudge);
      setTimeout(nudge, 250);
    });
  }

  protected toggleCollapsed(): void {
    this.manuallyCollapsed.set(!this.collapsed());
  }

  /** Collapsed, a category icon is the only handle onto its items — so clicking it restores
   *  the full rail with that group open rather than navigating somewhere arbitrary. */
  protected revealGroup(group: AssayNavGroup): void {
    this.manuallyCollapsed.set(false);
    if (group.label) {
      this.manuallyOpenedLabel.set(group.label);
      this.saveRememberedGroup(group.label);
    }
  }

  /** Falls back to the first item's icon so navs written before groups had icons still
   *  collapse to something meaningful. */
  protected groupIcon(group: AssayNavGroup): string {
    return group.icon ?? group.items[0]?.icon ?? 'chevron_right';
  }

  /** The one open group, by label. Seeded from the group owning the active route if there is
   *  one, else the rider's last manual choice for this `service()`, else nothing. Recomputes
   *  on navigation so following a link (including from outside the rail, e.g. a search jump)
   *  always reveals its own group — this is deliberately a `computed()`, not a persisted
   *  signal, so navigation always wins over a stale manual choice. */
  private readonly activeGroupLabel = computed(() => {
    const url = this.currentUrl();
    for (const group of this.groups()) {
      if (!group.label) continue;
      if (group.items.some((item) => this.itemMatchesUrl(item, url))) return group.label;
    }
    return null;
  });

  private readonly manuallyOpenedLabel = signal<string | null>(null);

  private readonly expandedGroupLabel = computed(() => this.activeGroupLabel() ?? this.manuallyOpenedLabel() ?? this.loadRememberedGroup());

  /** A group is worth collapsing behind a toggle only if it has a label AND more than one
   *  item — an unlabeled group has no header to click, and a single-item group renders as a
   *  flat link using that item's own icon instead (nothing to disclose). */
  protected isCollapsible(group: AssayNavGroup): boolean {
    return !!group.label && group.items.length > 1;
  }

  protected isExpanded(group: AssayNavGroup): boolean {
    return !!group.label && this.expandedGroupLabel() === group.label;
  }

  /** Marks the collapsed rail's category icon for whichever group owns the active route. */
  protected isActiveGroup(group: AssayNavGroup): boolean {
    return !!group.label && this.activeGroupLabel() === group.label;
  }

  protected groupId(index: number): string {
    return `a-rail-group-${index}`;
  }

  protected toggleGroup(group: AssayNavGroup): void {
    if (!group.label) return;
    const next = this.isExpanded(group) ? null : group.label;
    this.manuallyOpenedLabel.set(next);
    this.saveRememberedGroup(next);
  }

  private itemMatchesUrl(item: AssayNavItem, url: string): boolean {
    if (!item.routerLink) return false;
    const path = Array.isArray(item.routerLink) ? item.routerLink.join('/') : item.routerLink;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return item.exact ? url === normalized : url.startsWith(normalized);
  }

  private get storageKey(): string {
    return `assay-rail.expanded-group.${this.service()}`;
  }

  private loadRememberedGroup(): string | null {
    try {
      return localStorage.getItem(this.storageKey);
    } catch {
      return null;
    }
  }

  private saveRememberedGroup(label: string | null): void {
    try {
      if (label) localStorage.setItem(this.storageKey, label);
      else localStorage.removeItem(this.storageKey);
    } catch {
      // Storage may be unavailable (private mode) — expansion state stays in-memory only.
    }
  }
}
