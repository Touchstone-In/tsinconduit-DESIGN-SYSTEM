import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
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
 * Host apps compose this inside their own drawer/sidenav (e.g. Angular Material's
 * `mat-sidenav`) rather than this library owning that responsibility, since hosts differ in
 * whether they use Material at all. Give the rail a fixed width of `var(--a-rail-width)`
 * (248px) and a background of `var(--a-rail)` on its containing element.
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
  template: `
    <nav class="a-rail" [attr.aria-label]="ariaLabel()">
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
        <span>
          <span class="a-rail__brand-name">CONDUIT</span><br />
          <span class="a-rail__brand-service">{{ service() }}</span>
        </span>
      </div>

      @for (group of groups(); track $index) {
        @if (isCollapsible(group)) {
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
      <ng-content select="[assayRailFooter]" />
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
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
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
  /** Fires on every item click — hosts typically use this to close a mobile drawer. */
  readonly itemClick = output<AssayNavGroup['items'][number]>();

  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

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
