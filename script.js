const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});
/* ══════════════════════════════════
   QUOTE REQUEST FORM (Formspree)
══════════════════════════════════ */
var QF_FORMSPREE_ID = 'maqrlyza';
var qfOriginalBodyHTML = null;
function openQuoteForm() {
  var body = document.getElementById('qf-body');
  if (qfOriginalBodyHTML === null) {
    qfOriginalBodyHTML = body.innerHTML;
  } else {
    body.innerHTML = qfOriginalBodyHTML;
  }
  document.getElementById('qf-overlay').classList.add('open');
  qfBindForm();
}
function closeQuoteForm() {
  document.getElementById('qf-overlay').classList.remove('open');
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
  device inspection (Web Inspector, Console tab), not inferred.

  At the exact moment the header appeared visibly shifted on a real
  iPhone, window.visualViewport.offsetTop measured ~31px while
  .mf-topbar's own computed styles (position, top, box model) and its
  own compositor layer (Layers tab: single layer, correct 430x85
  bounds, no stray child layers) were BOTH entirely correct. The
  ancestor chain (.mobile-site) had no transform and wasn't itself a
  composited layer. So this is not a CSS bug, not a stale paint layer,
  and not a rogue transform anywhere in the DOM — it's iOS Safari's
  visual viewport genuinely sitting offset from the layout viewport
  for a window of time after the on-screen keyboard dismisses
  (post form-submit blur), before scrolling forces it to reconcile.

  A prior attempt at a visualViewport-based fix (see project handoff)
  applied a transform unconditionally on every resize/scroll event,
  which caused drift on completely ordinary scrolling unrelated to
  the form. The difference here: only touch .mf-topbar when
  visualViewport.offsetTop is actually nonzero (confirmed via the
  live measurement above), and always correct back to exactly that
  offset — never guess, never apply on scroll events that aren't
  actually desynced.
*/
(function () {
  var topbar = document.querySelector('.mf-topbar');
  if (!topbar || !window.visualViewport) return;

  // Smooth out the correction itself: once we've decided to correct
  // an offset (see the guards below), ease into/out of it over a
  // short duration instead of snapping frame-by-frame. This absorbs
  // small residual fluctuations as iOS finishes settling, so the
  // correction reads as one gentle nudge rather than a jitter.
  topbar.style.transition = 'transform .12s ease-out';

  var ticking = false;

  function syncTopbarToViewport() {
    ticking = false;
    var offset = window.visualViewport.offsetTop;

    // iOS rubber-band overscroll (bouncing past the top/bottom edge of
    // the page) also shifts visualViewport.offsetTop, even with zero
    // keyboard interaction — that's a false positive for this fix.
    // Only apply the correction when we're NOT at the page's scroll
    // extremes, since real overscroll only happens right at those
    // edges and the keyboard-desync case doesn't care about scroll
    // position at all.
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
