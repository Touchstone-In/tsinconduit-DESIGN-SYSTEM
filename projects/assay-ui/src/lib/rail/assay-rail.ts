import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type { AssayNavGroup } from '../types';

/**
 * The Assay navigation rail — the literal `a-rail` markup every Conduit service shares:
 * brand mark, flat `a-rail__section` labels over flat `a-rail__item` links, the active item
 * marked via `aria-current="page"` (which `assay-ui/styles/toolkit.css` renders as the
 * Current-gradient slice). No collapse/accordion — see {@link AssayNavGroup}.
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
  imports: [RouterLink, RouterLinkActive],
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
        @if (group.label) {
          <div class="a-rail__section">{{ group.label }}</div>
        }
        @for (item of group.items; track item.label) {
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
        }
      }

      <div class="a-rail__spacer"></div>
      <ng-content select="[assayRailFooter]" />
    </nav>
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
  /** Shown under "CONDUIT" in the brand block, e.g. "CELBAN", "Campus", "Insights". */
  readonly service = input.required<string>();
  readonly groups = input.required<AssayNavGroup[]>();
  readonly ariaLabel = input('Main navigation');
  /** Fires on every item click — hosts typically use this to close a mobile drawer. */
  readonly itemClick = output<AssayNavGroup['items'][number]>();
}
