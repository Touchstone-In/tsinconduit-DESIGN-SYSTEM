/** One item in an {@link AssayNavGroup} — a single rail destination. */
export interface AssayNavItem {
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
export interface AssayNavGroup {
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
export interface AssayAccountMenuItem {
  label: string;
  icon: string;
  routerLink?: string | string[];
  href?: string;
}
