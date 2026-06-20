/**
 * auth.js — Google Sign-In + Auth Pages Support
 * Pure frontend (no backend required)
 *
 * SETUP:
 * 1. Get a Google OAuth Client ID from https://console.cloud.google.com/
 * 2. Replace YOUR_GOOGLE_CLIENT_ID below
 * 3. Add your domain to "Authorized JavaScript origins"
 */

(function () {
  var CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // ← Replace!

  // ── State ──
  var currentUser = null;

  // ── DOM helpers ──
  function qs(sel) { return document.querySelector(sel); }

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
        if (window.google && window.google.accounts) {
          window.google.accounts.id.disableAutoSelect();
        }
        currentUser = null;
        localStorage.removeItem('calcpro_user');
        renderAuthButtons();
        toggleMobileAuth(true);
      });
    }
    toggleMobileAuth(false);
  }

  // ── Handle Google credential response ──
  function handleCredentialResponse(response) {
    try {
      var parts = response.credential.split('.');
      var payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

      currentUser = {
        name: payload.name || 'User',
        email: payload.email || '',
        picture: payload.picture || '',
        sub: payload.sub || '',
        given_name: payload.given_name || '',
      };

      localStorage.setItem('calcpro_user', JSON.stringify(currentUser));
      renderUserAvatar(currentUser);

      // If on login/register page, redirect to home
      if (window.location.pathname.match(/login|register/)) {
        setTimeout(function () {
          window.location.href = 'index.html';
        }, 800);
      }
    } catch (e) {
      console.error('Google auth error:', e);
    }
  }

  // ── Load Google Identity Services SDK ──
  function loadGoogleSDK() {
    if (CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
      // Not configured — show login/signup buttons
      var saved = localStorage.getItem('calcpro_user');
      if (saved) {
        try {
          currentUser = JSON.parse(saved);
          renderUserAvatar(currentUser);
        } catch (e) {
          localStorage.removeItem('calcpro_user');
          renderAuthButtons();
        }
      } else {
        renderAuthButtons();
      }

      // Still show setup hint on auth pages
      if (window.location.pathname.match(/login|register/)) {
        var hint = document.createElement('div');
        hint.className = 'auth-setup-hint';
        hint.style.cssText = 'background:#fffbe6;color:#92400e;padding:10px 16px;border-radius:10px;font-size:13px;margin-bottom:16px;';
        hint.innerHTML = '⚠️ Google Login not configured yet. <a href="https://console.cloud.google.com/" target="_blank" style="color:#1d4ed8;">Get Client ID</a> and replace YOUR_GOOGLE_CLIENT_ID in auth.js';
        var wrapper = qs('.auth-form-wrapper');
        if (wrapper) wrapper.insertBefore(hint, wrapper.firstChild);
      }
      return;
    }

    var script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = function () {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Check saved user
      var saved = localStorage.getItem('calcpro_user');
      if (saved) {
        try {
          currentUser = JSON.parse(saved);
          renderUserAvatar(currentUser);
        } catch (e) {
          localStorage.removeItem('calcpro_user');
          renderAuthButtons();
        }
      } else {
        renderAuthButtons();
        // Show One Tap on home page (not on auth pages)
        if (!window.location.pathname.match(/login|register/)) {
          setTimeout(function () {
            window.google.accounts.id.prompt();
          }, 1200);
        }
      }

      // Attach Google button click handlers for auth pages
      var googleBtns = ['googleLoginBtn', 'googleSignupBtn'];
      googleBtns.forEach(function (id) {
        var btn = document.getElementById(id);
        if (btn) {
          btn.addEventListener('click', function () {
            if (window.google && window.google.accounts) {
              window.google.accounts.id.prompt();
            }
          });
        }
      });
    };
    document.head.appendChild(script);
  }

  // ── Init ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadGoogleSDK);
  } else {
    loadGoogleSDK();
  }

  // ── Expose ──
  window.calcProAuth = {
    getUser: function () { return currentUser; },
    isLoggedIn: function () { return !!currentUser; },
  };
})();
