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
  wherever the page was when the modal opened. This turned out not to
  be the driver of the header issue — that was .mf-topbar's own
  position:fixed behavior and a since-removed JS correction for it
  (see styles.css and git history for that story) — but it's real
  behavior of this function worth knowing if scrollY/scrollHeight
  ever look odd in a future debugging session.
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
  if (qfIsIOS) qfForceViewportReconcile(); // secondary safety net; the
  // focusout listener below is the primary fix and fires earlier.
}

/*
  This whole reconcile mechanism only exists to work around a
  confirmed iOS-Safari-specific rendering quirk (see
  qfForceViewportReconcile() below for the full story). It has no
  reason to run anywhere else, so it's gated behind this check —
  every other browser (Chrome, Firefox, Edge, Samsung Internet,
  desktop or mobile) never executes any of this code at all, which is
  a stronger guarantee of zero side effects elsewhere than just
  reasoning that the technique "should" be harmless.

  iPadOS reports itself as desktop Safari in the user agent string
  (no "iPhone"/"iPad" token), so it's detected via the Mac-platform +
  touch-support combination instead — a standard, widely used pattern
  for this exact situation.
*/
var qfIsIOS = /iP(hone|od|ad)/.test(navigator.platform) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/*
  Forces iOS to fully reconcile its viewport bookkeeping on demand,
  instead of waiting for the user to accidentally trigger it.

  Two things are CONFIRMED on-device to reliably fix the header:
  scrolling to a page extreme, and tapping the tel: link (which opens
  iOS's own native "Call this number?" sheet). A third thing that
  also confirmed fixes it: manually reopening this very quote form.

  Two different guesses at REPRODUCING that effect were tried and
  both failed on-device: toggling display on .mf-topbar itself (too
  local — doesn't touch whatever viewport-level state is actually
  wrong), and a 1px window.scrollTo nudge (a genuine scroll-position
  change, but still didn't do it).

  Rather than guess at a third substitute, this does the thing that's
  already proven to work, directly: it briefly shows this overlay's
  own "open" state again — the exact same DOM change a real reopen
  causes — and forces the browser to fully process it with a
  synchronous layout read, then immediately reverts it. Because both
  the show and the revert happen in the same synchronous script (no
  await, no setTimeout in between), the browser has no opportunity to
  actually paint the in-between frame, so none of this should be
  visible — but the layout work it forces is the same full-page work
  a real, visible reopen does.

  Still worth confirming on-device rather than assumed. If even this
  doesn't fix it, that's a strong signal the fix requires something
  this project's JS structurally can't replicate, and the more
  sensible next step is accepting this as a minor, hard-to-eliminate
  iOS rendering quirk (plenty of production sites carry ones like it)
  rather than continuing to patch around it.
*/
function qfForceViewportReconcile() {
  var overlay = document.getElementById('qf-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  void overlay.offsetHeight; // forces a synchronous layout pass while "open"
  overlay.classList.remove('open');
}
// General fix: any time a field inside the quote form loses focus,
// for ANY reason (submitting, tapping the X, tapping the overlay
// backdrop, tabbing to the next field), schedule this once the
// keyboard-dismiss animation has had room to actually finish. Bound
// once here, on the overlay itself (which persists across every
// open/close), rather than re-bound per open like the form's own
// submit listener — focusout bubbles, so this catches every field
// without needing a listener on each one individually. Gated to iOS
// only, same reasoning as qfIsIOS above.
document.getElementById('qf-overlay').addEventListener('focusout', function (e) {
  if (qfIsIOS && e.target && e.target.classList && e.target.classList.contains('qf-input')) {
    setTimeout(qfForceViewportReconcile, 350);
  }
});
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
  REMOVED: the visualViewport transform-correction that used to live
  here (and the qfKeyboardActiveUntil tracking that gated it) was
  built specifically to work around position:fixed's old iOS
  desync bug. .mf-topbar is now position:sticky (see styles.css),
  which doesn't have that bug — sticky is positioned through normal
  layout/scroll logic, not the separate viewport-pinned compositor
  layer fixed uses.

  Confirmed on-device that this old code was actively causing a new
  symptom rather than fixing anything: for up to a second after
  closing the quote form, it was still applying a JS transform to the
  now-sticky header, which visibly dragged it out of place while
  scrolling in that window and snapped it back once the atBottom
  guard tripped. Sticky elements don't want or need any transform, so
  the fix is removal, not another guard.
*/
