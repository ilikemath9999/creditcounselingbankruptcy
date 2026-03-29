// BTN Engagement Tracking v2 -- shared across all Bankruptcy Tools Network sites
// Fires GA4 custom events: scroll, time, clicks, FAQ, CWV, copy, content groups
(function() {
  if (typeof gtag !== 'function') return;
  var host = location.hostname;
  var path = location.pathname;

  // 0. Content group dimension -- tag pages by category for cross-site comparison
  var group = 'general';
  if (/\/(check|screener|calculator|tool)/.test(path)) group = 'tool';
  else if (/\/judges?\//.test(path)) group = 'judge-page';
  else if (/\/districts?\/|\/states?\//.test(path)) group = 'district-guide';
  else if (/\/caselaw|\/opinions?|\/precedent/.test(path)) group = 'caselaw';
  else if (/\/(faq|glossary|timeline)/.test(path)) group = 'reference';
  else if (/\/methodology|\/research|\/reports?\//.test(path)) group = 'research';
  else if (/\/support|\/donate|ko-fi/.test(path)) group = 'support';
  else if (/explainer|guide|how-to|what-is|chapter-\d/.test(path)) group = 'explainer';
  else if (path === '/' || path === '/index.html') group = 'homepage';
  gtag('set', { content_group: group, site_domain: host });

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

  // 3. Link clicks -- internal nav vs cross-network vs external
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
    } else if (url.hostname.match(/1328f\.(com|org)|bankruptcymill\.(com|org)|automaticstay\.org|meanstest\.org|341meeting\.org|523a\.org|109g\.org|727a8\.(com|org)|relieffromstay\.org|dischargeinjunction\.(com|org)|prosedebtors\.org|whatischapter7\.(com|org)|chapter13plan\.org|lienstripping\.org|nondischargeable\.org|bankruptcyfreshstart\.org|reaffirmationagreement\.org|dischargebar\.org|section1328\.org|bankruptcytaxes\.org|dismissedbankruptcy\.org|serialfiler\.org|codebtorstay\.org|bankruptcyhardship\.org|voluntarypetition\.org|section329\.org|section1191\.org|section1192\.org|dismissalrate\.org|bankruptcymalpractice\.org|prosebankruptcy\.org|bankruptcymeanstest\.org|howtofilebankruptcy\.org|garnishedwages\.org|canifileagain\.org|chapter7vs13\.org|bankruptcystudentloans\.org|howmuchdoesbankruptcycost\.com|524injunction\.com|filebankruptcyagain\.com|prosequestion\.com|bankruptcydismissed\.com/)) {
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

  // 6. Copy-to-clipboard tracking -- signals high-intent users (attorneys, filers)
  document.addEventListener('copy', function() {
    var sel = (window.getSelection() || '').toString().trim();
    if (sel.length > 5) {
      gtag('event', 'content_copy', {
        copied_length: sel.length,
        copied_preview: sel.substring(0, 80),
        page_path: path,
        site: host
      });
    }
  });

  // 7. PDF / file download tracking
  document.addEventListener('click', function(e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.href || '';
    if (/\.(pdf|doc|docx|xls|xlsx|csv|zip)(\?|$)/i.test(href)) {
      gtag('event', 'file_download', {
        file_url: href.substring(0, 200),
        file_name: href.split('/').pop().split('?')[0],
        page_path: path,
        site: host
      });
    }
  });

  // 8. Core Web Vitals -- LCP, CLS, INP (Google ranking factors)
  // Uses PerformanceObserver API (no external library needed)
  if (typeof PerformanceObserver !== 'undefined') {
    // Largest Contentful Paint
    try {
      new PerformanceObserver(function(list) {
        var entries = list.getEntries();
        var last = entries[entries.length - 1];
        if (last) {
          gtag('event', 'web_vitals', {
            metric: 'LCP',
            value: Math.round(last.startTime),
            page_path: path,
            site: host,
            rating: last.startTime < 2500 ? 'good' : last.startTime < 4000 ? 'needs-improvement' : 'poor'
          });
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (_) {}

    // Cumulative Layout Shift
    try {
      var clsValue = 0;
      new PerformanceObserver(function(list) {
        for (var entry of list.getEntries()) {
          if (!entry.hadRecentInput) clsValue += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
      // Report CLS on page hide
      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden' && clsValue > 0) {
          gtag('event', 'web_vitals', {
            metric: 'CLS',
            value: Math.round(clsValue * 1000),
            page_path: path,
            site: host,
            rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor'
          });
        }
      });
    } catch (_) {}

    // Interaction to Next Paint (replaces FID)
    try {
      new PerformanceObserver(function(list) {
        for (var entry of list.getEntries()) {
          if (entry.interactionId) {
            gtag('event', 'web_vitals', {
              metric: 'INP',
              value: Math.round(entry.duration),
              page_path: path,
              site: host,
              rating: entry.duration < 200 ? 'good' : entry.duration < 500 ? 'needs-improvement' : 'poor'
            });
          }
        }
      }).observe({ type: 'event', buffered: true, durationThreshold: 40 });
    } catch (_) {}
  }

  // 9. Conversion goals -- key actions that define success
  // 3+ pages in session
  var pageCount = parseInt(sessionStorage.getItem('btn_pages') || '0') + 1;
  sessionStorage.setItem('btn_pages', pageCount);
  if (pageCount === 3) {
    gtag('event', 'conversion_multi_page', {
      pages_viewed: pageCount,
      site: host
    });
  }

  // Ko-fi / support click
  document.addEventListener('click', function(e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.href || '';
    if (/ko-fi\.com|\/support|\/donate/i.test(href)) {
      gtag('event', 'support_click', {
        destination: href.substring(0, 100),
        page_path: path,
        site: host
      });
    }
    // "File a complaint" or bar complaint links
    if (/complaint|bar-complaint|ocdc|disciplinary/i.test(href) || /complaint/i.test(a.textContent)) {
      gtag('event', 'complaint_link_click', {
        destination: href.substring(0, 100),
        page_path: path,
        site: host
      });
    }
  });

})();
