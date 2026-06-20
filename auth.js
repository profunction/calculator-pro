/**
 * auth.js — Google Sign-In (One Tap + Button)
 * Pure frontend implementation using Google Identity Services
 *
 * HOW TO SET UP:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a project → APIs & Services → Credentials
 * 3. Create OAuth 2.0 Client ID (Web application)
 * 4. Add your domain to "Authorised JavaScript origins"
 * 5. Replace YOUR_GOOGLE_CLIENT_ID below with your actual Client ID
 */

(function () {
  var CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // ← Replace this!

  // ── State ──
  var currentUser = null;

  // ── DOM helpers ──
  function qs(sel) { return document.querySelector(sel); }
  function show(el) { if (el) el.style.display = ''; }
  function hide(el) { if (el) el.style.display = 'none'; }

  // ── Render user avatar in header ──
  function renderUserAvatar(user) {
    var container = qs('#authContainer');
    if (!container) return;

    container.innerHTML = [
      '<div class="user-avatar-wrap" id="userMenu">',
        '<img src="' + user.picture + '" alt="' + user.name + '" class="user-avatar" id="userAvatar" />',
        '<div class="user-dropdown" id="userDropdown">',
          '<div class="user-info">',
            '<img src="' + user.picture + '" alt="" class="user-info-avatar" />',
            '<div>',
              '<div class="user-info-name">' + user.name + '</div>',
              '<div class="user-info-email">' + user.email + '</div>',
            '</div>',
          '</div>',
          '<button class="user-signout-btn" id="signOutBtn">',
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
            ' Sign Out',
          '</button>',
        '</div>',
      '</div>',
    ].join('');

    // Toggle dropdown on avatar click
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
        renderLoginButton();
      });
    }
  }

  // ── Render login button (not signed in) ──
  function renderLoginButton() {
    var container = qs('#authContainer');
    if (!container) return;

    container.innerHTML = [
      '<button class="google-login-btn" id="googleLoginBtn" type="button">',
        '<svg width="18" height="18" viewBox="0 0 48 48">',
          '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>',
          '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>',
          '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>',
          '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>',
        '</svg>',
        '<span>Sign in with Google</span>',
      '</button>',
    ].join('');

    var btn = qs('#googleLoginBtn');
    if (btn) {
      btn.addEventListener('click', function () {
        if (!window.google || !window.google.accounts) {
          alert('Google Sign-In is loading, please try again in a moment.');
          return;
        }
        window.google.accounts.id.prompt();
      });
    }
  }

  // ── Handle credential response from Google ──
  function handleCredentialResponse(response) {
    // Decode JWT payload (base64)
    var parts = response.credential.split('.');
    var payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    currentUser = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      sub: payload.sub
    };

    // Persist to localStorage (session)
    localStorage.setItem('calcpro_user', JSON.stringify(currentUser));

    renderUserAvatar(currentUser);
  }

  // ── Load Google Identity Services SDK ──
  function loadGoogleSDK() {
    if (CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
      // Not configured yet — show placeholder
      var container = qs('#authContainer');
      if (container) {
        container.innerHTML = '<span class="auth-setup-hint">🔑 <a href="https://console.cloud.google.com/" target="_blank">Setup Google Login</a></span>';
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
        cancel_on_tap_outside: true
      });

      // Check if user was previously signed in
      var saved = localStorage.getItem('calcpro_user');
      if (saved) {
        try {
          currentUser = JSON.parse(saved);
          renderUserAvatar(currentUser);
        } catch (e) {
          localStorage.removeItem('calcpro_user');
          renderLoginButton();
        }
      } else {
        renderLoginButton();
        // Show One Tap prompt after a short delay
        setTimeout(function () {
          window.google.accounts.id.prompt();
        }, 1000);
      }
    };
    document.head.appendChild(script);
  }

  // ── Init on DOM ready ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadGoogleSDK);
  } else {
    loadGoogleSDK();
  }

  // ── Expose for other scripts ──
  window.calcProAuth = {
    getUser: function () { return currentUser; },
    isLoggedIn: function () { return !!currentUser; }
  };
})();
