/**
 * auth.js — Simple Email Auth (no Google Login)
 * Pure frontend localStorage auth (demo mode)
 */

(function () {
  // ── State ──
  var currentUser = null;

  // ── DOM helpers ──
  function qs(sel) { return document.querySelector(sel); }

  // ── Check saved user from localStorage ──
  function initAuth() {
    var saved = localStorage.getItem('calcpro_user');
    if (saved) {
      try {
        currentUser = JSON.parse(saved);
        renderUserAvatar(currentUser);
      } catch (e) {
        localStorage.removeItem('calcpro_user');
        currentUser = null;
      }
    }
  }

  // ── Render user avatar (logged in) ──
  function renderUserAvatar(user) {
    var container = qs('#authContainer');
    if (!container) return;

    container.innerHTML = [
      '<div class="user-avatar-wrap" id="userMenu">',
        '<img src="' + (user.picture || 'logo.svg') + '" alt="' + (user.name || 'User') + '" class="user-avatar" id="userAvatar" />',
        '<div class="user-dropdown" id="userDropdown">',
          '<div class="user-info">',
            '<img src="' + (user.picture || 'logo.svg') + '" alt="" class="user-info-avatar" />',
            '<div>',
              '<div class="user-info-name">' + (user.name || 'User') + '</div>',
              '<div class="user-info-email">' + (user.email || '') + '</div>',
            '</div>',
          '</div>',
          '<button class="user-signout-btn" id="signOutBtn">',
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
            ' Sign Out',
          '</button>',
        '</div>',
      '</div>',
    ].join('');

    // Toggle dropdown
    var avatar = qs('#userAvatar');
    var dropdown = qs('#userDropdown');
    if (avatar && dropdown) {
      avatar.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });
      document.addEventListener('click', function () {
        dropdown.classList.remove('open');
      });
    }

    // Sign out
    var signOutBtn = qs('#signOutBtn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', function () {
        currentUser = null;
        localStorage.removeItem('calcpro_user');
        renderAuthButtons();
        toggleMobileAuth(true);
      });
    }
    toggleMobileAuth(false);
  }

  // ── Toggle mobile auth links ──
  function toggleMobileAuth(show) {
    var links = document.querySelectorAll('.mobile-auth-links');
    links.forEach(function (el) {
      if (show) {
        el.classList.remove('hide');
        el.classList.add('show');
      } else {
        el.classList.remove('show');
        el.classList.add('hide');
      }
    });
  }

  // ── Render header buttons (not logged in) ──
  function renderAuthButtons() {
    var container = qs('#authContainer');
    if (!container) return;

    container.innerHTML = [
      '<a href="login.html" class="header-login-btn" id="headerLoginBtn">',
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>',
        ' Sign In',
      '</a>',
      '<a href="register.html" class="header-signup-btn" id="headerSignupBtn">',
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>',
        ' Sign Up',
      '</a>',
    ].join('');

    toggleMobileAuth(true);
  }

  // ── Init ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }

  // ── Expose ──
  window.calcProAuth = {
    getUser: function () { return currentUser; },
    isLoggedIn: function () { return !!currentUser; },
    login: function (user) {
      currentUser = user;
      localStorage.setItem('calcpro_user', JSON.stringify(user));
      renderUserAvatar(user);
    },
  };
})();
