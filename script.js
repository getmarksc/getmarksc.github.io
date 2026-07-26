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
  qfForceStickyReflow(); // secondary safety net — see rationale below; the
  // primary fix now fires earlier, at submit-time, while still hidden.
}

/*
  Forces iOS to fully recompute position:sticky layout for
  .mf-topbar, on demand, instead of waiting for the user to
  accidentally hit a scroll extreme (which is what was making it
  self-correct before).

  Why this exists, and why it moved: confirmed, by elimination on a
  real device, that neither the JS transform correction (removed
  entirely) nor the scroll-lock body-position toggle (tested by
  disabling it — no change) was the cause of .mf-topbar rendering
  shifted/clipped after closing the form and doing a small scroll.
  The one thing unique to that sequence and absent from ordinary
  scrolling elsewhere is the on-screen keyboard opening and
  dismissing — matching the project's original confirmed root cause
  (iOS's visual viewport briefly out of sync with the layout viewport
  after keyboard dismissal), now apparently affecting sticky's "am I
  stuck yet" calculation the same way it affected fixed positioning
  originally.

  On-device observation (not a guess): ANY subsequent interaction —
  tapping the phone link, reopening the quote form — also corrects
  the header, not just scrolling to an extreme. That means the broken
  state isn't created by closing the modal; it's created earlier,
  while the keyboard is up/dismissing during form-filling, and simply
  stays invisible the whole time because the modal (z-index 999) is
  covering the header. Close was never the trigger — it was just the
  first moment the already-wrong state became visible. So the real
  fix is to force the recompute during submit, right after blur()
  dismisses the keyboard, while it's still hidden — not to react
  after the fact once it's already on screen. The call in
  closeQuoteForm() above is kept only as a cheap secondary safety net
  in case something is still unsettled by the time of close.

  This forces a synchronous reflow on .mf-topbar specifically (rather
  than nudging window.scrollTo, which may not do anything meaningful
  while the scroll-lock has body pinned) — so it works regardless of
  scroll-lock state. This is a hypothesis to verify on-device, not a
  guaranteed fix.
*/
function qfForceStickyReflow() {
  var topbar = document.querySelector('.mf-topbar');
  if (!topbar) return;
  var prevDisplay = topbar.style.display;
  topbar.style.display = 'none';
  void topbar.offsetHeight; // reading this forces a synchronous reflow
  topbar.style.display = prevDisplay;
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
    // PRIMARY fix, moved here per on-device observation: force the
    // sticky recompute shortly after the keyboard starts dismissing,
    // while the modal still covers the header — see
    // qfForceStickyReflow() above for the full reasoning. 350ms gives
    // the keyboard-dismiss animation room to actually finish first.
    setTimeout(qfForceStickyReflow, 350);
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
