// Albos HVAC — site interactions
document.addEventListener('DOMContentLoaded', function () {

  /* Mobile nav toggle */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { nav.classList.remove('open'); });
    });
  }

  /* Scroll reveal — .js-ready class (set inline in <head>, before this file even
     loads) is what makes .reveal elements start hidden; if that class is missing
     for any reason, content is already visible via plain CSS. As a second safety
     net, force-reveal everything after 3s in case the observer never fires. */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -10% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      revealEls.forEach(function (el) { el.classList.add('in-view'); });
    }, 3000);
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* Animated stat counters */
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    var counterIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        var suffix = el.getAttribute('data-suffix') || '';
        var duration = 1200;
        var start = null;
        function step(ts) {
          if (!start) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target) + suffix;
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        counterIO.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { counterIO.observe(el); });
  }

  /* Sticky header shadow on scroll */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 8) header.style.boxShadow = '0 6px 24px rgba(15,23,42,.08)';
      else header.style.boxShadow = 'none';
    };
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Back to top */
  var backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    document.addEventListener('scroll', function () {
      backToTop.classList.toggle('show', window.scrollY > 500);
    }, { passive: true });
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* Contact form — demo submit handling (no backend wired up yet) */
  var form = document.querySelector('#quote-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var successBox = document.querySelector('#form-success');
      if (successBox) {
        successBox.classList.add('show');
        successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      form.reset();
    });
  }

  /* Hero parallax — desktop pointer devices only. Elements tagged [data-depth]
     drift toward the cursor at different speeds (smaller depth = further away
     / moves less), giving the hero a layered, "moving with the mouse" feel.
     Movement is eased with a simple lerp toward a target offset each frame,
     rather than jumping straight to the pointer position, so it reads as
     smooth rather than jittery. Skips entirely for touch devices and for
     people who've asked the OS for reduced motion. */
  var parallaxRoot = document.querySelector('#heroParallax');
  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isFinePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (parallaxRoot && isFinePointer && !prefersReducedMotion) {
    var depthEls = Array.prototype.slice.call(parallaxRoot.querySelectorAll('[data-depth]'));
    var targetX = 0, targetY = 0, curX = 0, curY = 0;
    var raf = null;

    parallaxRoot.addEventListener('mousemove', function (e) {
      var rect = parallaxRoot.getBoundingClientRect();
      targetX = (e.clientX - rect.left - rect.width / 2);
      targetY = (e.clientY - rect.top - rect.height / 2);
      if (!raf) raf = requestAnimationFrame(tick);
    });
    parallaxRoot.addEventListener('mouseleave', function () {
      targetX = 0; targetY = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    });

    function tick() {
      curX += (targetX - curX) * 0.08;
      curY += (targetY - curY) * 0.08;
      depthEls.forEach(function (el) {
        var depth = parseFloat(el.getAttribute('data-depth')) || 0;
        el.style.transform = 'translate3d(' + (curX * depth).toFixed(1) + 'px, ' + (curY * depth).toFixed(1) + 'px, 0)';
      });
      if (Math.abs(targetX - curX) > 0.1 || Math.abs(targetY - curY) > 0.1) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    }
  }

  /* Card spotlight — sets --mx/--my custom properties to the pointer position
     within each .card on mousemove; the CSS radial-gradient in styles.css
     reads them, so this is just cheap event-driven property updates, no
     animation loop needed. Desktop pointer devices only, same as above. */
  if (isFinePointer && !prefersReducedMotion) {
    document.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100) + '%');
      });
    });
  }

  /* Set active nav link based on current page */
  var path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* Current year in footer */
  var yearEl = document.querySelector('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
