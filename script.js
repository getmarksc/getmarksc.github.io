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

  Uses body.qf-lock{overflow:hidden} (see styles.css) rather than
  toggling position:fixed on body. overflow:hidden blocks background
  scrolling without ever removing body from document flow. Shared by
  both the quote form modal and the mobile full-screen menu below.
*/
function qfLockScroll() {
  document.body.classList.add('qf-lock');
}
function qfUnlockScroll() {
  document.body.classList.remove('qf-lock');
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

/* ══════════════════════════════════
   MOBILE FULL-SCREEN MENU
══════════════════════════════════ */
function openMobileMenu() {
  var overlay = document.getElementById('mf-menu-overlay');
  var btn = document.getElementById('mf-menu-open-btn');
  if (!overlay) return;
  showMenuPanel('main');
  overlay.classList.add('open');
  if (btn) btn.setAttribute('aria-expanded', 'true');
  qfLockScroll();
}
function closeMobileMenu() {
  var overlay = document.getElementById('mf-menu-overlay');
  var btn = document.getElementById('mf-menu-open-btn');
  if (!overlay) return;
  overlay.classList.remove('open');
  if (btn) btn.setAttribute('aria-expanded', 'false');
  qfUnlockScroll();
}
function showMenuPanel(name) {
  var panels = document.querySelectorAll('.mf-menu-panel');
  panels.forEach(function (p) {
    p.classList.toggle('is-active', p.getAttribute('data-panel') === name);
  });
}
function goHomeAndCloseMenu() {
  closeMobileMenu();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  var menuOverlay = document.getElementById('mf-menu-overlay');
  if (menuOverlay && menuOverlay.classList.contains('open')) closeMobileMenu();
});
