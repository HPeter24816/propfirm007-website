(function () {
  "use strict";

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
      return;
    }
    fn();
  }

  function slugToLabel(slug) {
    if (!slug) return "总览";
    return slug
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, function (m) {
        return m.toUpperCase();
      });
  }

  function getHeaderOffset() {
    var raw = getComputedStyle(document.documentElement).getPropertyValue("--header-height");
    var parsed = parseInt(raw, 10);
    if (!Number.isFinite(parsed)) parsed = 64;
    return parsed + 14;
  }

  function collectTargets(root) {
    var results = [];
    var seen = new Set();
    var sections = Array.prototype.slice.call(root.querySelectorAll("section[id]"));

    sections.forEach(function (section) {
      var id = section.id;
      if (!id || seen.has(id)) return;
      var h2 = section.querySelector("h2");
      var title = section.getAttribute("data-nav-title") || (h2 ? h2.textContent : "") || slugToLabel(id);
      results.push({ id: id, title: title.trim(), element: section });
      seen.add(id);
    });

    if (results.length === 0) {
      var cardTargets = Array.prototype.slice.call(root.querySelectorAll(".card[id], [data-nav-section][id]"));
      cardTargets.forEach(function (node) {
        var id = node.id;
        if (!id || seen.has(id)) return;
        var title = node.getAttribute("data-nav-title") || "总览";
        results.push({ id: id, title: title.trim(), element: node });
        seen.add(id);
      });
    }

    return results;
  }

  function buildNavList(items, itemClass) {
    var nav = document.createElement("nav");
    nav.className = itemClass.indexOf("drawer") > -1 ? "rule-toc-drawer__nav" : "rule-toc__nav";

    items.forEach(function (item) {
      var link = document.createElement("a");
      link.className = itemClass;
      link.href = "#" + item.id;
      link.textContent = item.title;
      link.setAttribute("data-target-id", item.id);
      nav.appendChild(link);
    });

    return nav;
  }

  function initRuleNav() {
    var path = window.location.pathname.toLowerCase();
    if (path.indexOf("rule.html") === -1) return;

    var root = document.querySelector("main");
    if (!root) root = document.querySelector(".container");
    if (!root) return;

    var items = collectTargets(root);
    if (!items.length) return;

    items.forEach(function (item) {
      item.element.classList.add("rule-nav-target");
    });

    root.classList.add("rule-page-root");
    document.body.classList.add("rule-nav-enabled");

    var layout = document.createElement("div");
    layout.className = "rule-page-layout";

    var aside = document.createElement("aside");
    aside.className = "rule-toc";
    aside.setAttribute("data-rule-toc", "");

    var asideTitle = document.createElement("div");
    asideTitle.className = "rule-toc__title";
    asideTitle.textContent = "规则目录";
    aside.appendChild(asideTitle);
    aside.appendChild(buildNavList(items, "rule-toc__item"));

    var content = document.createElement("div");
    content.className = "rule-page-content";

    while (root.firstChild) {
      content.appendChild(root.firstChild);
    }

    layout.appendChild(aside);
    layout.appendChild(content);

    var toggle = document.createElement("button");
    toggle.className = "rule-toc-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "打开规则目录");
    toggle.innerHTML = '<span class="rule-toc-toggle__icon"></span><span>目录</span>';

    var drawer = document.createElement("aside");
    drawer.className = "rule-toc-drawer";
    drawer.setAttribute("aria-hidden", "true");
    drawer.innerHTML = '<div class="rule-toc-drawer__title">规则目录</div>';
    drawer.appendChild(buildNavList(items, "rule-toc-drawer__item"));

    var backdrop = document.createElement("div");
    backdrop.className = "rule-toc-backdrop";

    root.appendChild(toggle);
    root.appendChild(layout);
    root.appendChild(drawer);
    root.appendChild(backdrop);

    var desktopLinks = Array.prototype.slice.call(root.querySelectorAll(".rule-toc__item"));
    var drawerLinks = Array.prototype.slice.call(root.querySelectorAll(".rule-toc-drawer__item"));

    function setActive(id) {
      desktopLinks.forEach(function (link) {
        link.classList.toggle("is-active", link.getAttribute("data-target-id") === id);
      });
      drawerLinks.forEach(function (link) {
        link.classList.toggle("is-active", link.getAttribute("data-target-id") === id);
      });
    }

    function closeDrawer() {
      drawer.classList.remove("is-open");
      backdrop.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      document.body.classList.remove("rule-toc-open");
    }

    function openDrawer() {
      drawer.classList.add("is-open");
      backdrop.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
      document.body.classList.add("rule-toc-open");
    }

    function scrollToTarget(id) {
      var target = document.getElementById(id);
      if (!target) return;
      var top = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
      window.scrollTo({ top: top, behavior: "smooth" });
      setActive(id);
      history.replaceState(null, "", "#" + id);
    }

    function onNavClick(event) {
      var link = event.target.closest(".rule-toc__item, .rule-toc-drawer__item");
      if (!link) return;
      var id = link.getAttribute("data-target-id");
      if (!id) return;
      event.preventDefault();
      event.stopPropagation();
      scrollToTarget(id);
      closeDrawer();
    }

    root.addEventListener("click", onNavClick, true);

    toggle.addEventListener("click", function () {
      if (drawer.classList.contains("is-open")) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    backdrop.addEventListener("click", closeDrawer);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeDrawer();
    });

    var ticking = false;

    function updateActiveFromScroll() {
      var offset = getHeaderOffset();
      var activeId = items[0].id;

      items.forEach(function (item) {
        var top = item.element.getBoundingClientRect().top;
        if (top - offset <= 8) activeId = item.id;
      });

      setActive(activeId);
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(updateActiveFromScroll);
      },
      { passive: true }
    );

    window.addEventListener("resize", updateActiveFromScroll);

    var hash = window.location.hash ? window.location.hash.slice(1) : "";
    if (hash && items.some(function (item) { return item.id === hash; })) {
      setActive(hash);
      setTimeout(function () {
        scrollToTarget(hash);
      }, 0);
      return;
    }

    updateActiveFromScroll();
  }

  onReady(initRuleNav);
})();
