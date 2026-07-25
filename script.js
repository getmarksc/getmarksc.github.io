const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

/* ══════════════════════════════════
   KEEP FIXED HEADERS PINNED ON MOBILE
   Mobile browsers can leave fixed-position
   elements slightly offset when the on-screen
   keyboard opens/closes (e.g. after filling out
   the quote form). This keeps them locked to the
   true visible top of the screen at all times.
══════════════════════════════════ */
if (window.visualViewport) {
  var mfTopbar = document.querySelector('.mf-topbar');
  function pinFixedHeaders() {
    var offset = window.visualViewport.offsetTop || 0;
    var shift = offset ? 'translateY(' + offset + 'px)' : '';
    if (mfTopbar) mfTopbar.style.transform = shift;
    nav.style.transform = shift;
  }
  window.visualViewport.addEventListener('resize', pinFixedHeaders);
  window.visualViewport.addEventListener('scroll', pinFixedHeaders);
}

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
  document.body.style.overflow = 'hidden';
  qfBindForm();
}

function closeQuoteForm() {
  document.getElementById('qf-overlay').classList.remove('open');
  document.body.style.overflow = '';
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

    var first = document.getElementById('qf-first');
    var phone = document.getElementById('qf-phone');
    var email = document.getElementById('qf-email');
    var errorEl = document.getElementById('qf-error');

    if (!first.value.trim() || !phone.value.trim() || !email.value.trim()) {
      errorEl.classList.add('show');
      if (!first.value.trim()) first.focus();
      else if (!phone.value.trim()) phone.focus();
      else email.focus();
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
