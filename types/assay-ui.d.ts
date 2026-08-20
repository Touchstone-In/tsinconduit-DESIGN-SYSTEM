import * as assay_ui from 'assay-ui';
import * as _angular_core from '@angular/core';

/** One item in an {@link AssayNavGroup} — a single rail destination. */
interface AssayNavItem {
    label: string;
    icon: string;
    /** Router path passed straight to `routerLink`. Use this OR `href`, not both. */
    routerLink?: string | string[];
    /** Plain `href` for hosts not using Angular Router for this link. */
    href?: string;
    /** Matches `routerLinkActiveOptions.exact` — set true for a group's own index route. */
    exact?: boolean;
    /** Small numeric/text badge rendered at the trailing edge of the item. */
    badge?: string | number;
}
/**
 * A section of the rail. Groups with a `label` render an `a-rail__section` header above
 * their items; omit `label` for a short nav with no section grouping (matching the Assay
 * reference mockups that have no headers at all, e.g. Connect, Insights). There is
 * deliberately no collapse/accordion behaviour — no Assay reference mockup has one; a host
 * app with a very deep nav should split it into more sections rather than nest a group.
 */
interface AssayNavGroup {
    label?: string;
    items: AssayNavItem[];
}
/** One extra action in the account-menu dropdown, below the identity block and above
 *  Sign out (e.g. "My profile", "Account settings") — provide only entries with a real
 *  destination; the library does not fabricate any on your behalf. */
interface AssayAccountMenuItem {
    label: string;
    icon: string;
    routerLink?: string | string[];
    href?: string;
}

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
declare class AssayRailComponent {
    /** Shown under "CONDUIT" in the brand block, e.g. "CELBAN", "Campus", "Insights". */
    readonly service: _angular_core.InputSignal<string>;
    readonly groups: _angular_core.InputSignal<AssayNavGroup[]>;
    readonly ariaLabel: _angular_core.InputSignal<string>;
    /** Fires on every item click — hosts typically use this to close a mobile drawer. */
    readonly itemClick: _angular_core.OutputEmitterRef<assay_ui.AssayNavItem>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<AssayRailComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<AssayRailComponent, "assay-rail", never, { "service": { "alias": "service"; "required": true; "isSignal": true; }; "groups": { "alias": "groups"; "required": true; "isSignal": true; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; "isSignal": true; }; }, { "itemClick": "itemClick"; }, never, ["[assayRailFooter]"], true, never>;
}

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
declare class AssayTopbarComponent {
    readonly showMenuToggle: _angular_core.InputSignal<boolean>;
    readonly menuToggle: _angular_core.OutputEmitterRef<void>;
    readonly serviceLabel: _angular_core.InputSignal<string>;
    readonly envLabel: _angular_core.InputSignal<string>;
    readonly showSearch: _angular_core.InputSignal<boolean>;
    readonly searchPlaceholder: _angular_core.InputSignal<string>;
    readonly searchAriaLabel: _angular_core.InputSignal<string>;
    readonly searchSubmit: _angular_core.OutputEmitterRef<string>;
    readonly userName: _angular_core.InputSignal<string>;
    readonly userRole: _angular_core.InputSignal<string>;
    readonly userEmail: _angular_core.InputSignal<string>;
    readonly userInitials: _angular_core.InputSignal<string>;
    readonly accountMenuItems: _angular_core.InputSignal<AssayAccountMenuItem[]>;
    readonly signOut: _angular_core.OutputEmitterRef<void>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<AssayTopbarComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<AssayTopbarComponent, "assay-topbar", never, { "showMenuToggle": { "alias": "showMenuToggle"; "required": false; "isSignal": true; }; "serviceLabel": { "alias": "serviceLabel"; "required": false; "isSignal": true; }; "envLabel": { "alias": "envLabel"; "required": false; "isSignal": true; }; "showSearch": { "alias": "showSearch"; "required": false; "isSignal": true; }; "searchPlaceholder": { "alias": "searchPlaceholder"; "required": false; "isSignal": true; }; "searchAriaLabel": { "alias": "searchAriaLabel"; "required": false; "isSignal": true; }; "userName": { "alias": "userName"; "required": true; "isSignal": true; }; "userRole": { "alias": "userRole"; "required": false; "isSignal": true; }; "userEmail": { "alias": "userEmail"; "required": false; "isSignal": true; }; "userInitials": { "alias": "userInitials"; "required": true; "isSignal": true; }; "accountMenuItems": { "alias": "accountMenuItems"; "required": false; "isSignal": true; }; }, { "menuToggle": "menuToggle"; "searchSubmit": "searchSubmit"; "signOut": "signOut"; }, never, ["[assayTopbarBetween]", "[assayTopbarActions]"], true, never>;
}

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
declare class AssayAccountMenuComponent {
    readonly name: _angular_core.InputSignal<string>;
    readonly role: _angular_core.InputSignal<string>;
    readonly email: _angular_core.InputSignal<string>;
    readonly initials: _angular_core.InputSignal<string>;
    readonly items: _angular_core.InputSignal<AssayAccountMenuItem[]>;
    readonly signOut: _angular_core.OutputEmitterRef<void>;
    protected readonly open: _angular_core.WritableSignal<boolean>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<AssayAccountMenuComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<AssayAccountMenuComponent, "assay-account-menu", never, { "name": { "alias": "name"; "required": true; "isSignal": true; }; "role": { "alias": "role"; "required": false; "isSignal": true; }; "email": { "alias": "email"; "required": false; "isSignal": true; }; "initials": { "alias": "initials"; "required": true; "isSignal": true; }; "items": { "alias": "items"; "required": false; "isSignal": true; }; }, { "signOut": "signOut"; }, never, never, true, never>;
}

/**
 * The Assay page footer — the literal `a-footer` every Conduit service shares, rendered at
 * the bottom of every page's content region. Pins to the bottom of short pages when its
 * containing element is a flex column (see the toolkit's own `.a-main` for the canonical
 * case, or replicate `margin-top: auto` on a custom content wrapper).
 *
 * @example `<assay-footer />` or `<assay-footer><a assayFooterLink routerLink="/privacy">Privacy</a></assay-footer>`
 */
declare class AssayFooterComponent {
    readonly year: _angular_core.InputSignal<number>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<AssayFooterComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<AssayFooterComponent, "assay-footer", never, { "year": { "alias": "year"; "required": false; "isSignal": true; }; }, {}, never, ["[assayFooterLink]"], true, never>;
}

export { AssayAccountMenuComponent, AssayFooterComponent, AssayRailComponent, AssayTopbarComponent };
export type { AssayAccountMenuItem, AssayNavGroup, AssayNavItem };
