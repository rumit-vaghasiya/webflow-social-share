/*!
 * share.js - lightweight social share for Webflow
 * Add buttons with data-share="x|facebook|linkedin|whatsapp|telegram|reddit|pinterest|email|instagram|copy|native"
 * Styles for the icons and buttons stay in Webflow. Only the hover tooltip is injected here.
 * Load once, site-wide:  <script src="YOUR_CDN_URL/share.js" defer></script>
 */
(function () {
  "use strict";

  // Friendly tooltip labels. Override per button with data-tooltip="..."
  var LABELS = {
    x: "X", facebook: "Facebook", linkedin: "LinkedIn", whatsapp: "WhatsApp",
    telegram: "Telegram", reddit: "Reddit", pinterest: "Pinterest",
    email: "Email", instagram: "Instagram", copy: "Copy link", native: "Share"
  };

  // Facebook and LinkedIn take only the URL on purpose. Both ignore custom text
  // now and build the preview card from your Open Graph tags instead.
  var BUILD = {
    x:         function (d) { return "https://twitter.com/intent/tweet?text=" + e(d.text) + "&url=" + e(d.url); },
    facebook:  function (d) { return "https://www.facebook.com/sharer/sharer.php?u=" + e(d.url); },
    linkedin:  function (d) { return "https://www.linkedin.com/sharing/share-offsite/?url=" + e(d.url); },
    whatsapp:  function (d) { return "https://api.whatsapp.com/send?text=" + e(d.text + " " + d.url); },
    telegram:  function (d) { return "https://t.me/share/url?url=" + e(d.url) + "&text=" + e(d.text); },
    reddit:    function (d) { return "https://www.reddit.com/submit?url=" + e(d.url) + "&title=" + e(d.title); },
    pinterest: function (d) { return "https://www.pinterest.com/pin/create/button/?url=" + e(d.url) + "&media=" + e(d.image) + "&description=" + e(d.text); },
    email:     function (d) { return "mailto:?subject=" + e(d.title) + "&body=" + e(d.text + "\n\n" + d.url); }
  };

  function e(v) { return encodeURIComponent(v || ""); }

  function meta(prop) {
    var m = document.querySelector('meta[property="' + prop + '"], meta[name="' + prop + '"]');
    return m ? m.getAttribute("content") : "";
  }

  // Per-button attributes win, then the data-share-group wrapper, then the page itself.
  function resolve(btn) {
    var group = btn.closest("[data-share-group]") || document;
    function pick(attr) {
      return btn.getAttribute("data-share-" + attr) ||
        (group.getAttribute ? group.getAttribute("data-share-" + attr) : "") || "";
    }
    return {
      url:   pick("url")   || location.href,
      title: pick("title") || document.title || "",
      text:  pick("text")  || meta("og:description") || document.title || "",
      image: pick("image") || meta("og:image") || ""
    };
  }

  function popup(u) {
    var w = 620, h = 600;
    var y = (window.top.outerHeight - h) / 2 + (window.top.screenY || 0);
    var x = (window.top.outerWidth  - w) / 2 + (window.top.screenX || 0);
    // Note: do NOT pass "noopener" in the features string. It makes window.open
    // return null even on success, which would wrongly trigger the fallback below
    // and open the link in the current tab as well.
    var win = window.open(u, "shareWindow",
      "width=" + w + ",height=" + h + ",left=" + x + ",top=" + y + ",scrollbars=yes,resizable=yes");
    if (win) {
      try { win.opener = null; } catch (err) {}   // sever the reference for safety
      if (win.focus) win.focus();
    } else {
      location.href = u;   // only reached if the browser actually blocked the popup
    }
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }).catch(fallback);
    }
    return Promise.resolve(fallback());
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:-9999px;opacity:0";
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand("copy"); } catch (err) {}
      document.body.removeChild(ta); return ok;
    }
  }

  // Flip the tooltip to a confirmation for a moment. Works on tap, not just hover.
  function confirmMsg(btn, msg) {
    var prev = btn.getAttribute("data-tooltip") || "";
    btn.setAttribute("data-tooltip", msg);
    btn.classList.add("share-active");
    clearTimeout(btn._t);
    btn._t = setTimeout(function () {
      btn.classList.remove("share-active");
      btn.setAttribute("data-tooltip", prev);
    }, 1700);
  }

  function nativeShare(d, btn) {
    if (navigator.share) {
      navigator.share({ title: d.title, text: d.text, url: d.url }).catch(function () {});
    } else {
      copy(d.url).then(function (ok) { if (ok) confirmMsg(btn, "Link copied"); });
    }
  }

  function handle(btn) {
    var type = btn.getAttribute("data-share");
    var d = resolve(btn);

    if (type === "copy") {
      copy(d.url).then(function (ok) { if (ok) confirmMsg(btn, "Copied!"); });
      return;
    }
    // Instagram has no web share URL, so use the phone share sheet, else copy the link.
    if (type === "native" || type === "instagram") {
      nativeShare(d, btn);
      return;
    }
    if (BUILD[type]) popup(BUILD[type](d));
  }

  // Inject the tooltip styles once. You can override these in Webflow with a more
  // specific selector, or change the two colors below.
  function injectStyles() {
    if (document.getElementById("share-tooltip-css")) return;
    var TIP_BG = "#14161c", TIP_FG = "#ffffff";
    var css =
      '[data-share]{position:relative}' +
      '[data-share][data-tooltip]::after{content:attr(data-tooltip);position:absolute;bottom:calc(100% + 8px);left:50%;' +
      'transform:translateX(-50%) translateY(4px);background:' + TIP_BG + ';color:' + TIP_FG + ';font-size:12px;font-weight:600;' +
      'line-height:1;white-space:nowrap;padding:6px 9px;border-radius:6px;opacity:0;pointer-events:none;' +
      'transition:opacity .16s ease,transform .16s ease;z-index:20}' +
      '[data-share][data-tooltip]::before{content:"";position:absolute;bottom:calc(100% + 3px);left:50%;' +
      'transform:translateX(-50%) translateY(4px);border:5px solid transparent;border-top-color:' + TIP_BG + ';' +
      'opacity:0;pointer-events:none;transition:opacity .16s ease,transform .16s ease;z-index:20}' +
      '[data-share]:hover::after,[data-share]:hover::before,' +
      '[data-share]:focus-visible::after,[data-share]:focus-visible::before,' +
      '[data-share].share-active::after,[data-share].share-active::before{opacity:1;transform:translateX(-50%) translateY(0)}' +
      '@media (prefers-reduced-motion:reduce){[data-share]::after,[data-share]::before{transition:none}}';
    var s = document.createElement("style");
    s.id = "share-tooltip-css";
    s.textContent = css;
    document.head.appendChild(s);
  }

  function init() {
    injectStyles();

    // Native share is a mobile feature. Hide those buttons where it is unsupported.
    if (!navigator.share) {
      document.querySelectorAll('[data-share="native"]').forEach(function (b) { b.style.display = "none"; });
    }

    document.querySelectorAll("[data-share]").forEach(function (btn) {
      if (btn._shareBound) return;
      btn._shareBound = true;
      var type = btn.getAttribute("data-share");
      if (!btn.getAttribute("data-tooltip") && LABELS[type]) btn.setAttribute("data-tooltip", LABELS[type]);
      btn.addEventListener("click", function (ev) { ev.preventDefault(); handle(btn); });
    });
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
