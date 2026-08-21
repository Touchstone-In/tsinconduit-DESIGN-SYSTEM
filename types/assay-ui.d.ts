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
 * reference mockups that have no headers at all, e.g. Connect, Insights). A labeled group
 * with more than one item renders as a collapsible accordion section (one group open at a
 * time, auto-expanding to reveal the active route) — see {@link AssayRailComponent}'s own doc
 * comment for the full behaviour. A labeled group with exactly one item still renders flat,
 * since there's nothing to disclose.
 */
interface AssayNavGroup {
    label?: string;
    /**
     * Icon standing in for the whole group when the rail is collapsed to its icon-only width.
     * Optional — a labeled group without one falls back to its first item's icon, so existing
     * navs keep working; supply it when that first icon reads as the item rather than the group.
     */
    icon?: string;
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
 * brand mark, `a-rail__item` links with the active item marked via `aria-current="page"`
 * (which `assay-ui/styles/toolkit.css` renders as the Current-gradient slice).
 *
 * A labeled group with more than one item renders as a collapsible accordion section — a
 * clickable header with a chevron, one group open at a time, auto-expanding to reveal
 * whichever group owns the active route (on load and on navigation) and otherwise remembering
 * the rider's last choice per `service()` in `localStorage`. An unlabeled group, or a labeled
 * group with exactly one item, renders flat instead — there's nothing to disclose.
 *
 * The rail also reduces itself to an icon-only strip (`var(--a-rail-collapsed)`, 72px) when the
 * viewport drops below `autoCollapseBelow()`, and can be toggled either way by hand. Collapsed,
 * a labeled group shows one icon standing for the whole category — clicking it restores the full
 * rail with that group open — while an unlabeled group shows its items' own icons. Expanded, every
 * row shows icon and label together.
 *
 * Host apps compose this inside their own drawer/sidenav (e.g. Angular Material's
 * `mat-sidenav`) rather than this library owning that responsibility, since hosts differ in
 * whether they use Material at all. The rail sizes its own host element between
 * `var(--a-rail-width)` and `var(--a-rail-collapsed)`; if your drawer sets its own fixed width,
 * let it size to content (`width: auto`) or react to `collapsedChange`.
 *
 * @example
 * ```html
 * <assay-rail service="CELBAN" [groups]="navGroups" (itemClick)="onNavClick()">
 *   <div assayRailFooter>© 2026 Touchstone Institute.</div>
 * </assay-rail>
 * ```
 */
declare class AssayRailComponent {
    /** Shown under "CONDUIT" in the brand block, e.g. "CELBAN", "Campus", "Insights". Also
     *  scopes the accordion's remembered-open-group `localStorage` key, so multiple Conduit
     *  apps in the same browser don't stomp on each other's rail state. */
    readonly service: _angular_core.InputSignal<string>;
    readonly groups: _angular_core.InputSignal<AssayNavGroup[]>;
    readonly ariaLabel: _angular_core.InputSignal<string>;
    /** Set false to pin the rail open — no toggle, no auto-reduction. */
    readonly collapsible: _angular_core.InputSignal<boolean>;
    /** Viewport width (px) under which the rail reduces itself to icons on its own. Set 0 to
     *  leave collapsing entirely to the rider's toggle. */
    readonly autoCollapseBelow: _angular_core.InputSignal<number>;
    /** Fires on every item click — hosts typically use this to close a mobile drawer. */
    readonly itemClick: _angular_core.OutputEmitterRef<AssayNavItem>;
    /** Fires whenever the rail reduces or restores, so a host drawer can resize with it. */
    readonly collapsedChange: _angular_core.OutputEmitterRef<boolean>;
    private readonly router;
    private readonly currentUrl;
    /** True while the viewport sits below `autoCollapseBelow()`. Drives the rail on its own
     *  unless the rider has since overridden it by hand. */
    private readonly viewportNarrow;
    /** The rider's explicit choice, or null to follow the viewport. Crossing the breakpoint
     *  clears it, so a resize hands control back to the automatic behaviour. */
    private readonly manuallyCollapsed;
    readonly collapsed: _angular_core.Signal<boolean>;
    constructor();
    protected toggleCollapsed(): void;
    /** Collapsed, a category icon is the only handle onto its items — so clicking it restores
     *  the full rail with that group open rather than navigating somewhere arbitrary. */
    protected revealGroup(group: AssayNavGroup): void;
    /** Falls back to the first item's icon so navs written before groups had icons still
     *  collapse to something meaningful. */
    protected groupIcon(group: AssayNavGroup): string;
    /** The one open group, by label. Seeded from the group owning the active route if there is
     *  one, else the rider's last manual choice for this `service()`, else nothing. Recomputes
     *  on navigation so following a link (including from outside the rail, e.g. a search jump)
     *  always reveals its own group — this is deliberately a `computed()`, not a persisted
     *  signal, so navigation always wins over a stale manual choice. */
    private readonly activeGroupLabel;
    private readonly manuallyOpenedLabel;
    private readonly expandedGroupLabel;
    /** A group is worth collapsing behind a toggle only if it has a label AND more than one
     *  item — an unlabeled group has no header to click, and a single-item group renders as a
     *  flat link using that item's own icon instead (nothing to disclose). */
    protected isCollapsible(group: AssayNavGroup): boolean;
    protected isExpanded(group: AssayNavGroup): boolean;
    /** Marks the collapsed rail's category icon for whichever group owns the active route. */
    protected isActiveGroup(group: AssayNavGroup): boolean;
    protected groupId(index: number): string;
    protected toggleGroup(group: AssayNavGroup): void;
    private itemMatchesUrl;
    private get storageKey();
    private loadRememberedGroup;
    private saveRememberedGroup;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<AssayRailComponent, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<AssayRailComponent, "assay-rail", never, { "service": { "alias": "service"; "required": true; "isSignal": true; }; "groups": { "alias": "groups"; "required": true; "isSignal": true; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; "isSignal": true; }; "collapsible": { "alias": "collapsible"; "required": false; "isSignal": true; }; "autoCollapseBelow": { "alias": "autoCollapseBelow"; "required": false; "isSignal": true; }; }, { "itemClick": "itemClick"; "collapsedChange": "collapsedChange"; }, never, ["[assayRailFooter]"], true, never>;
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
