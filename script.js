const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});
/* ══════════════════════════════════
   QUOTE REQUEST FORM (Formspree)
══════════════════════════════════ */
var QF_FORMSPREE_ID = 'maqrlyza';
var qfOriginalBodyHTML = null;

/*
  Background scroll-lock while modal is open.

  Rationale: while the popup is open, the page behind it is still
  scrollable (confirmed by observation), alongside the modal's own
  internal overflow-y:auto scroll region. Two independent active
  scroll contexts at once, combined with the keyboard opening/closing
  as the user fills the form, is a plausible contributor to iOS's
  visualViewport desync behavior addressed elsewhere in this file.

  Note: a scroll-lock attempt was tried previously (see project
  handoff) using position:fixed + top:-Npx on <body>, and held up for
  one test sequence before breaking on a slightly different one. This
  implementation is deliberately identical in technique (the standard
  approach) but is being reintroduced as an addition alongside the
  separately-proven visualViewport ceiling/overscroll guard below,
  rather than as a replacement for it — so if this alone doesn't
  fully resolve things, it can be isolated and removed without
  affecting the parts already confirmed working.
*/
var qfScrollLockY = 0;
function qfLockScroll() {
  qfScrollLockY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = '-' + qfScrollLockY + 'px';
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
}
function qfUnlockScroll() {
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  window.scrollTo(0, qfScrollLockY);
}

function openQuoteForm() {
  var body = document.getElementById('qf-body');
  if (qfOriginalBodyHTML === null) {
    qfOriginalBodyHTML = body.innerHTML;
  } else {
    body.innerHTML = qfOriginalBodyHTML;
  }
  document.getElementById('qf-overlay').classList.add('open');
  qfLockScroll();
  qfBindForm();
}
function closeQuoteForm() {
  document.getElementById('qf-overlay').classList.remove('open');
  qfUnlockScroll();
}
function qfCloseOnOverlay(e) {
  if (e.target === document.getElementById('qf-overlay')) closeQuoteForm();
}
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeQuoteForm();
});
function qfBindForm() {
  var form = document.getElementById('qf-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    var first = document.getElementById('qf-first');
    var phone = document.getElementById('qf-phone');
    var email = document.getElementById('qf-email');
    var errorEl = document.getElementById('qf-error');
    if (!first.value.trim() || !phone.value.trim() || !email.value.trim()) {
      errorEl.classList.add('show');
      return;
    }
    errorEl.classList.remove('show');
    var payload = {
      _subject: 'New Quote Request — Get Mark Professional Cleaning',
      first_name: first.value.trim(),
      last_name: document.getElementById('qf-last').value.trim(),
      phone: phone.value.trim(),
      email: email.value.trim(),
      property_type: document.getElementById('qf-type').value,
      details: document.getElementById('qf-desc').value.trim(),
      preferred_contact_time: document.getElementById('qf-avail').value.trim()
    };
    var submitBtn = form.querySelector('.qf-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    fetch('https://formspree.io/f/' + QF_FORMSPREE_ID, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function () { qfShowThanks(); })
      .catch(function () { qfShowThanks(); });
  });
}
function qfShowThanks() {
  document.getElementById('qf-body').innerHTML =
    '<div class="qf-thanks">' +
      '<div class="qf-thanks-icon">&#10003;</div>' +
      '<h2 class="qf-title">Request received</h2>' +
      '<p class="qf-sub">Thank you for reaching out. Mark will review your request and get back to you soon &mdash; usually within a day.</p>' +
      '<button class="qf-submit" type="button" onclick="closeQuoteForm()">Close</button>' +
    '</div>';
}

/*
  iOS Safari visualViewport / fixed-header desync — CONFIRMED via live
  device inspection. Ceiling + overscroll guard, proven in testing to
  fix partial-covering and edge-of-page bounce, kept unchanged from
  the currently-deployed version. This is the safety net for any
  residual desync not addressed by the scroll-lock above.
*/
(function () {
  var topbar = document.querySelector('.mf-topbar');
  if (!topbar || !window.visualViewport) return;

  topbar.style.transition = 'transform .12s ease-out';

  var ticking = false;

  function syncTopbarToViewport() {
    ticking = false;
    var offset = window.visualViewport.offsetTop;

    var atTop = window.scrollY <= 0;
    var atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1;

    var maxSensible = topbar.offsetHeight || 100;
    if (offset && offset > 0 && offset <= maxSensible && !atTop && !atBottom) {
      topbar.style.transform = 'translateY(' + offset + 'px)';
    } else {
      topbar.style.transform = '';
    }
  }

  function requestSync() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(syncTopbarToViewport);
  }

  window.visualViewport.addEventListener('resize', requestSync);
  window.visualViewport.addEventListener('scroll', requestSync);
})();
