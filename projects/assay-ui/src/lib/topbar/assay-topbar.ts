import { Component, input, output } from '@angular/core';
import { AssayAccountMenuComponent } from '../account-menu/assay-account-menu';
import type { AssayAccountMenuItem } from '../types';

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
@Component({
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
})
export class AssayTopbarComponent {
  readonly showMenuToggle = input(false);
  readonly menuToggle = output<void>();

  readonly serviceLabel = input('');
  readonly envLabel = input('Touchstone Institute · Conduit');

  readonly showSearch = input(false);
  readonly searchPlaceholder = input('Search…');
  readonly searchAriaLabel = input('Search');
  readonly searchSubmit = output<string>();

  readonly userName = input.required<string>();
  readonly userRole = input<string>('');
  readonly userEmail = input<string>('');
  readonly userInitials = input.required<string>();
  readonly accountMenuItems = input<AssayAccountMenuItem[]>([]);
  readonly signOut = output<void>();
}
