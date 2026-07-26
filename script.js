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
  document.dispatchEvent(new Event('qf:closed'));
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
  own compositor layer were both entirely correct — this is iOS's
  visual viewport briefly sitting offset from the layout viewport
  right after the on-screen keyboard dismisses.

  Per explicit preference: zero visible motion is the priority, even
  if that means the correction occasionally doesn't fully catch a
  rare case (which would then just fall back to the original
  behavior of self-correcting on the next scroll, same as before any
  of this code existed). So: no live tracking, no transition, no
  motion the user can see. Instead, correct once, silently, at the
  moment the modal closes — before the user has resumed scrolling —
  using visibility:hidden to make the adjustment happen off-screen
  from the user's perspective, then reveal already-correct.
*/
(function () {
  var topbar = document.querySelector('.mf-topbar');
  if (!topbar || !window.visualViewport) return;

  function silentlyCorrectTopbar() {
    // Give iOS a moment to finish its own keyboard-dismiss viewport
    // settling before we even check — most of the time this alone
    // means offsetTop is already back to 0 and we do nothing.
    setTimeout(function () {
      var offset = window.visualViewport.offsetTop;
      var maxSensible = topbar.offsetHeight || 100;
      if (!offset || offset <= 0 || offset > maxSensible) return;

      // Apply the correction while invisible, so the user never sees
      // the movement itself — only the already-corrected end state.
      topbar.style.visibility = 'hidden';
      topbar.style.transform = 'translateY(' + offset + 'px)';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          topbar.style.visibility = '';
        });
      });
    }, 350);
  }

  // Only check once, right after the modal closes — not continuously
  // while scrolling. If the offset is still present after 350ms it
  // gets corrected invisibly; otherwise nothing happens and no motion
  // is ever visible.
  document.addEventListener('qf:closed', silentlyCorrectTopbar);
})();
