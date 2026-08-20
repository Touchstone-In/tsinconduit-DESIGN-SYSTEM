import { Component, input } from '@angular/core';

/**
 * The Assay page footer — the literal `a-footer` every Conduit service shares, rendered at
 * the bottom of every page's content region. Pins to the bottom of short pages when its
 * containing element is a flex column (see the toolkit's own `.a-main` for the canonical
 * case, or replicate `margin-top: auto` on a custom content wrapper).
 *
 * @example `<assay-footer />` or `<assay-footer><a assayFooterLink routerLink="/privacy">Privacy</a></assay-footer>`
 */
@Component({
  selector: 'assay-footer',
  template: `
    <footer class="a-footer">
      <span>© {{ year() }} Touchstone Institute. All rights reserved.</span>
      <span class="a-footer__links">
        <ng-content select="[assayFooterLink]" />
      </span>
    </footer>
  `,
})
export class AssayFooterComponent {
  readonly year = input(new Date().getFullYear());
}
