// BTN Engagement Tracking — shared across all Bankruptcy Tools Network sites
// Fires GA4 custom events so BTN property shows real engagement instead of 100% bounce
(function() {
  if (typeof gtag !== 'function') return;
  var host = location.hostname;
  var path = location.pathname;

  // 1. Scroll depth milestones
  var scrollFired = {};
  function getScrollPct() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    return h > 0 ? Math.round((window.scrollY / h) * 100) : 100;
  }
  window.addEventListener('scroll', function() {
    var pct = getScrollPct();
    [25, 50, 75, 100].forEach(function(m) {
      if (pct >= m && !scrollFired[m]) {
        scrollFired[m] = true;
        gtag('event', 'scroll_depth', {
          percent: m,
          page_path: path,
          site: host
        });
      }
    });
  }, {passive: true});

  // 2. Time on page milestones (proves reading, kills bounce)
  var timeFired = {};
  var startTime = Date.now();
  function checkTime() {
    var elapsed = Math.floor((Date.now() - startTime) / 1000);
    [15, 30, 60, 120].forEach(function(s) {
      if (elapsed >= s && !timeFired[s]) {
        timeFired[s] = true;
        gtag('event', 'time_on_page', {
          seconds: s,
          page_path: path,
          site: host
        });
      }
    });
  }
  setInterval(checkTime, 5000);

  // 3. Link clicks — internal nav vs cross-network vs external
  document.addEventListener('click', function(e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.href;
    try {
      var url = new URL(href, location.origin);
    } catch (_) { return; }

    if (url.hostname === host) {
      // Internal nav within same site
      gtag('event', 'internal_click', {
        from_page: path,
        to_page: url.pathname,
        site: host
      });
    } else if (url.hostname.match(/1328f\.(com|org)|bankruptcymill\.(com|org)|automaticstay\.org|meanstest\.org|341meeting\.org|523a\.org|109g\.org|727a8\.(com|org)|relieffromstay\.org|dischargeinjunction\.(com|org)|prosedebtors\.org/)) {
      // Cross-network link
      gtag('event', 'network_click', {
        from_site: host,
        from_page: path,
        to_site: url.hostname,
        to_page: url.pathname
      });
    } else {
      // External outbound
      gtag('event', 'outbound_click', {
        from_page: path,
        site: host,
        to_url: href.substring(0, 200)
      });
    }
  });

  // 4. FAQ accordion expand (details/summary elements)
  document.querySelectorAll('details').forEach(function(d) {
    d.addEventListener('toggle', function() {
      if (d.open) {
        var q = (d.querySelector('summary') || {}).textContent || '';
        gtag('event', 'faq_expand', {
          question: q.substring(0, 100),
          page_path: path,
          site: host
        });
      }
    });
  });

  // 5. Page engagement signal at 10s (GA4 counts as "engaged session")
  setTimeout(function() {
    gtag('event', 'page_engaged', {
      page_path: path,
      site: host
    });
  }, 10000);

})();
