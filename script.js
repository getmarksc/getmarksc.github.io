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

  SIDE EFFECT worth knowing about: while body is position:fixed, it's
  removed from document flow, so document.documentElement.scrollHeight
  collapses to roughly window.innerHeight while the modal is open. On
  unlock, qfUnlockScroll() restores window.scrollY via scrollTo() to
  wherever the page was when the modal opened. This isn't the main
  driver of the header issue (see qfKeyboardActiveUntil below for
  what on-device tracing actually showed), but it's real behavior of
  this function worth knowing if scrollY/scrollHeight ever look odd
  in a future debugging session.
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

/*
  Keyboard-active window, tracked so the visualViewport correction
  below only ever runs while a keyboard could plausibly be involved.

  CONFIRMED via on-device console trace (not a guess): the ceiling +
  overscroll guard alone isn't enough to tell "keyboard just
  dismissed" apart from "Safari's toolbar is hiding/showing during
  ordinary scroll" — both produce a small, valid-looking, sub-100px
  visualViewport.offsetTop reading. A captured trace showed offset
  sitting at a steady ~42px for the full duration of an ordinary fast
  scroll fling (scrollY climbing ~750px in ~350ms, innerHeight
  oscillating ~775<->815 — the classic Safari address-bar footprint,
  not a keyboard, which would drop innerHeight by 300+px), with the
  header actively being pushed down by that amount the whole time.
  iOS already positions position:fixed elements correctly through
  toolbar animations on its own — this correction was stepping on
  top of behavior that didn't need help, which is what was visible
  as "movement" on ordinary scrolling, not just after the popup.

  Fix: only let the correction logic act while the quote form has
  been opened and hasn't been closed for more than QF_KEYBOARD_GRACE_MS.
  Everywhere else — all ordinary scrolling and toolbar transitions
  across the rest of the site — the header is left completely alone.
*/
var qfKeyboardActiveUntil = 0;
var QF_KEYBOARD_GRACE_MS = 1000; // window after close to catch a lingering desync

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
  qfKeyboardActiveUntil = Infinity; // stays open the whole time the modal is up
}
function closeQuoteForm() {
  document.getElementById('qf-overlay').classList.remove('open');
  qfUnlockScroll();
  qfKeyboardActiveUntil = Date.now() + QF_KEYBOARD_GRACE_MS; // short tail to catch a lingering desync, then fully off
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
  device inspection (original root cause), and the "when does this
  correction actually fire" behavior CONFIRMED via a separate on-device
  console trace (see qfKeyboardActiveUntil above for what that trace
  showed and why the gate below exists).

  Ceiling + overscroll guard are kept as a second layer of defense,
  but the real gate is qfKeyboardActiveUntil: this function does
  nothing at all — never touches the header's transform — unless the
  quote form is currently open or was closed within the last
  QF_KEYBOARD_GRACE_MS. Outside that window, every scroll/resize event
  on the page (ordinary scrolling, Safari's toolbar hiding/showing,
  anything) is ignored, and iOS's own correct native handling of
  position:fixed is left alone.
*/
(function () {
  var topbar = document.querySelector('.mf-topbar');
  if (!topbar || !window.visualViewport) return;

  topbar.style.transition = 'transform .12s ease-out';

  var ticking = false;

  function syncTopbarToViewport() {
    ticking = false;

    if (Date.now() > qfKeyboardActiveUntil) {
      // No recent keyboard interaction with the quote form — leave the
      // header alone. This is the branch that was missing before: it's
      // what stops ordinary scrolling/toolbar transitions from ever
      // reaching the correction logic below.
      topbar.style.transform = '';
      return;
    }

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
