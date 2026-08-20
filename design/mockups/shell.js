/* Assay mockup harness — renders the shared Conduit application shell.
   Every service mockup calls renderShell() with its own nav; the shell
   itself (rail, top bar, switcher, account affordances) is identical
   across the whole suite. */

const MARK_SVG =
  '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">' +
  '<defs><linearGradient id="cur" x1="0" y1="0" x2="22" y2="0" gradientUnits="userSpaceOnUse">' +
  '<stop offset="0" stop-color="#4C5BC4"/><stop offset="0.55" stop-color="#19B0D4"/>' +
  '<stop offset="1" stop-color="#A8D44E"/></linearGradient></defs>' +
  '<path d="M1 13 H8 C9.5 13 9.5 7 11 7 C12.5 7 12.5 15 14 15 C15.2 15 15.4 13 16.5 13 H21"' +
  ' stroke="url(#cur)" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>';

const PULSE_SVG = (w, h) =>
  '<svg width="' + w + '" height="' + h + '" viewBox="0 0 220 26" fill="none" aria-hidden="true" preserveAspectRatio="none">' +
  '<defs><linearGradient id="cur2" x1="0" y1="0" x2="220" y2="0" gradientUnits="userSpaceOnUse">' +
  '<stop offset="0" stop-color="#4C5BC4"/><stop offset="0.55" stop-color="#19B0D4"/>' +
  '<stop offset="1" stop-color="#A8D44E"/></linearGradient></defs>' +
  '<path d="M2 16 H120 C126 16 126 5 132 5 C138 5 138 22 144 22 C149 22 150 16 155 16 H218"' +
  ' stroke="url(#cur2)" stroke-width="3" stroke-linecap="round" fill="none"/></svg>';

function renderShell(cfg) {
  const nav = cfg.nav
    .map(function (item) {
      if (item.section) {
        return '<div class="a-rail__section">' + item.section + '</div>';
      }
      const current = item.active ? ' aria-current="page"' : '';
      const badge = item.badge
        ? '<span class="a-rail__badge">' + item.badge + '</span>'
        : '';
      return (
        '<a class="a-rail__item" href="#"' + current + '>' +
        '<span class="a-icon" aria-hidden="true">' + item.icon + '</span>' +
        item.label + badge + '</a>'
      );
    })
    .join('');

  const user = cfg.user || { name: 'Amara Osei', role: 'Program Operations', initials: 'AO' };

  document.write(
    '<nav class="a-rail" aria-label="' + cfg.service + ' navigation">' +
      '<div class="a-rail__brand">' +
        '<span class="a-mark">' + MARK_SVG + '</span>' +
        '<span><span class="a-rail__brand-name">CONDUIT</span><br>' +
        '<span class="a-rail__brand-service">' + cfg.service + '</span></span>' +
      '</div>' +
      nav +
      '<div class="a-rail__spacer"></div>' +
      '<a class="a-rail__item" href="#"><span class="a-icon" aria-hidden="true">apps</span>All Conduit apps</a>' +
      '<a class="a-rail__item" href="#"><span class="a-icon" aria-hidden="true">settings</span>Settings</a>' +
    '</nav>' +

    '<header class="a-topbar">' +
      '<div class="a-topbar__context">' +
        '<span class="a-topbar__service">' + (cfg.pageContext || cfg.service) + '</span>' +
        '<span class="a-topbar__env">' + (cfg.env || 'Touchstone Institute · Conduit') + '</span>' +
      '</div>' +
      '<div class="a-topbar__search"><span class="a-icon a-icon--sm" aria-hidden="true">search</span>' +
        '<input type="search" aria-label="Search" placeholder="Search ' +
        (cfg.searchScope || cfg.service.toLowerCase()) + '…"><kbd>/</kbd></div>' +
      '<div class="a-topbar__actions">' +
        '<button class="a-icon-btn" aria-label="Help"><span class="a-icon">help</span></button>' +
        '<button class="a-icon-btn" aria-label="Notifications"><span class="a-icon">notifications</span><span class="a-icon-btn__dot"></span></button>' +
        '<button class="a-icon-btn" aria-label="Conduit apps"><span class="a-icon">apps</span></button>' +
        '<div class="a-account">' +
          '<button class="a-account__trigger" aria-label="Account menu" aria-haspopup="menu"' +
            ' aria-expanded="' + (cfg.accountMenuOpen ? 'true' : 'false') + '">' +
            '<span class="a-avatar">' + user.initials + '</span>' +
            '<span class="a-icon a-icon--xs" aria-hidden="true">expand_more</span>' +
          '</button>' +
          (cfg.accountMenuOpen
            ? '<div class="a-account-menu" role="menu">' +
                '<div class="a-account-menu__id">' +
                  '<span class="a-avatar a-avatar--lg">' + user.initials + '</span>' +
                  '<span><span class="a-account-menu__name">' + user.name + '</span><br>' +
                  '<span class="a-account-menu__meta">' + user.role + '</span><br>' +
                  '<span class="a-account-menu__meta">' + (user.email || 'signed in with Conduit SSO') + '</span></span>' +
                '</div>' +
                '<hr class="a-divider" style="margin:var(--space-2) 0">' +
                '<a class="a-account-menu__item" role="menuitem" href="#"><span class="a-icon a-icon--sm">person</span>My profile</a>' +
                '<a class="a-account-menu__item" role="menuitem" href="#"><span class="a-icon a-icon--sm">settings</span>Account settings</a>' +
                '<hr class="a-divider" style="margin:var(--space-2) 0">' +
                '<a class="a-account-menu__item a-account-menu__item--signout" role="menuitem" href="#">' +
                  '<span class="a-icon a-icon--sm">logout</span>Sign out of Conduit</a>' +
              '</div>'
            : '') +
        '</div>' +
      '</div>' +
    '</header>'
  );
}

/* Shared page footer — rendered at the end of every service page's content. */
function renderFooter() {
  document.write(
    '<footer class="a-footer">' +
      '<span>© 2026 Touchstone Institute. All rights reserved.</span>' +
      '<span class="a-footer__links">' +
        '<a href="#">Privacy</a> · <a href="#">Accessibility</a> · ' +
        '<a href="#">Terms of use</a> · <a href="#">Français</a>' +
      '</span>' +
    '</footer>'
  );
}
