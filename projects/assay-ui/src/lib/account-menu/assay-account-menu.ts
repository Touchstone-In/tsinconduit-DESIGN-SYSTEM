import { Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AssayAccountMenuItem } from '../types';

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
@Component({
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
})
export class AssayAccountMenuComponent {
  readonly name = input.required<string>();
  readonly role = input<string>('');
  readonly email = input<string>('');
  readonly initials = input.required<string>();
  readonly items = input<AssayAccountMenuItem[]>([]);
  readonly signOut = output<void>();

  protected readonly open = signal(false);
}
