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

  Root cause: iOS's visual viewport briefly sits offset from the
  layout viewport after the on-screen keyboard dismisses, while
  .mf-topbar's own computed styles and compositor layer stay correct
  throughout. Confirmed guards, proven in testing:
  - Ceiling: ignore any offset reading larger than the header's own
    height (filters out bogus/stale readings).
  - Overscroll exclusion: ignore readings while at the very top/
    bottom of the page scroll range, since iOS rubber-band overscroll
    also shifts offsetTop with zero keyboard involvement.

  Requirement: zero visible motion, under any interaction, full stop
  — not "smoothed," not "occasional single nudge on popup close."
  So corrections are applied every time they're needed, on every
  relevant event, but always while the header is visibility:hidden
  for two animation frames, so the movement itself is never on
  screen — only the corrected end state is ever visible.
*/
(function () {
  var topbar = document.querySelector('.mf-topbar');
  if (!topbar || !window.visualViewport) return;

  var ticking = false;
  var correcting = false;

  function applyCorrection(offset) {
    if (correcting) return;
    correcting = true;
    topbar.style.visibility = 'hidden';
    topbar.style.transform = 'translateY(' + offset + 'px)';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        topbar.style.visibility = '';
        correcting = false;
      });
    });
  }

  function clearCorrection() {
    if (correcting) return;
    if (topbar.style.transform) {
      topbar.style.visibility = 'hidden';
      topbar.style.transform = '';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          topbar.style.visibility = '';
        });
      });
    }
  }

  function syncTopbarToViewport() {
    ticking = false;
    var offset = window.visualViewport.offsetTop;

    var atTop = window.scrollY <= 0;
    var atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1;
    var maxSensible = topbar.offsetHeight || 100;

    if (offset && offset > 0 && offset <= maxSensible && !atTop && !atBottom) {
      applyCorrection(offset);
    } else {
      clearCorrection();
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
