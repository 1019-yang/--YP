(function () {
  "use strict";

  var data = window.PORTFOLIO_DATA;
  if (!data) return;

  function getPath(obj, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc == null ? undefined : acc[key];
    }, obj);
  }

  function fillFields() {
    document.querySelectorAll("[data-field]").forEach(function (el) {
      var value = getPath(data, el.getAttribute("data-field"));
      if (value == null) return;
      el.textContent = value;
    });

    var heroImage = document.getElementById("hero-image");
    if (heroImage && data.heroImage) {
      heroImage.src = data.heroImage;
      heroImage.alt = data.heroImageAlt || data.name;
    }

    var contactCta = document.querySelector(".contact-cta");
    var mailItem = (data.contact || []).find(function (item) {
      return item.icon === "mail";
    });
    if (contactCta && mailItem) {
      contactCta.href = "mailto:" + mailItem.value;
    }
  }

  function renderTabs() {
    var wrap = document.getElementById("work-tabs");
    if (!wrap) return;
    var categories = data.categories || [];
    var hasWorks = {};
    (data.works || []).forEach(function (work) {
      hasWorks[work.category] = true;
    });

    var html = "";
    categories.forEach(function (cat, index) {
      if (cat.id !== "all" && !hasWorks[cat.id]) return;
      var active = index === 0 ? " active" : "";
      html +=
        '<button class="tab' + active + '" type="button" role="tab" data-filter="' +
        cat.id + '">' + cat.label + "</button>";
    });
    wrap.innerHTML = html;
  }

  function renderWorks() {
    var grid = document.getElementById("works-grid");
    if (!grid) return;

    var html = "";
    (data.works || []).forEach(function (work, index) {
      var isVideo = work.type === "video";
      var media;
      if (isVideo) {
        media =
          '<video src="' + work.src + '" poster="' + (work.poster || "") +
          '" preload="metadata" muted playsinline aria-label="' + (work.alt || work.title) + '"></video>';
      } else {
        media =
          '<img src="' + work.src + '" alt="' + (work.alt || work.title) +
          '" loading="lazy" decoding="async" width="' + (work.width || "") + '" height="' + (work.height || "") + '">';
      }

      var chipIcon = isVideo ? "play" : "zoom-in";
      var chipText = isVideo
        ? (work.duration || work.ratio || "视频")
        : work.ratio;

      html +=
        '<article class="work-card ' + work.category + '" data-category="' + work.category +
        '" data-index="' + index + '" role="button" tabindex="0" aria-label="' + work.title + '">' +
        '<div class="work-thumb">' + media +
        '<div class="work-overlay"><span class="work-meta-chip"><i data-lucide="' + chipIcon + '"></i>' +
        chipText + "</span></div></div>" +
        '<div class="work-body"><h3>' + work.title + "</h3><p>" +
        (work.tools || "") + " · " + (work.year || "") + "</p></div>" +
        "</article>";
    });
    grid.innerHTML = html;
  }

  function bindFilters() {
    var wrap = document.getElementById("work-tabs");
    var grid = document.getElementById("works-grid");
    if (!wrap || !grid) return;

    wrap.addEventListener("click", function (event) {
      var button = event.target.closest(".tab");
      if (!button) return;
      wrap.querySelectorAll(".tab").forEach(function (tab) {
        tab.classList.toggle("active", tab === button);
      });
      var filter = button.getAttribute("data-filter");
      Array.prototype.forEach.call(grid.children, function (card) {
        var show = filter === "all" || card.getAttribute("data-category") === filter;
        card.style.display = show ? "" : "none";
      });
    });
  }

  function bindLightbox() {
    var lightbox = document.getElementById("lightbox");
    var image = document.getElementById("lightbox-image");
    var video = document.getElementById("lightbox-video");
    var title = document.getElementById("lightbox-title");
    var meta = document.getElementById("lightbox-meta");
    if (!lightbox || !image || !video) return;

    function openWork(work) {
      var isVideo = work.type === "video";
      if (isVideo) {
        image.hidden = true;
        video.hidden = false;
        video.src = work.src;
        video.poster = work.poster || "";
        video.play().catch(function () {});
      } else {
        video.pause();
        video.hidden = true;
        image.hidden = false;
        image.src = work.src;
        image.alt = work.alt || work.title;
      }
      title.textContent = work.title;
      var metaParts = [work.tools, work.year, work.ratio];
      if (work.size) metaParts.push(work.size);
      if (work.duration) metaParts.push(work.duration);
      meta.textContent = metaParts.filter(Boolean).join(" · ");
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
    }

    function closeWork() {
      lightbox.hidden = true;
      video.pause();
      document.body.style.overflow = "";
    }

    var grid = document.getElementById("works-grid");
    grid.addEventListener("click", function (event) {
      var card = event.target.closest(".work-card");
      if (!card) return;
      openWork(data.works[Number(card.getAttribute("data-index"))]);
    });
    grid.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      var card = event.target.closest(".work-card");
      if (!card) return;
      event.preventDefault();
      openWork(data.works[Number(card.getAttribute("data-index"))]);
    });

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) closeWork();
    });
    document.querySelector(".lightbox-close").addEventListener("click", closeWork);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !lightbox.hidden) closeWork();
    });
  }

  function renderExperience() {
    var timeline = document.getElementById("timeline");
    if (!timeline) return;
    var html = "";
    (data.experience || []).forEach(function (item) {
      html +=
        '<li class="timeline-item">' +
        '<p class="timeline-period">' + item.period + "</p>" +
        "<h3>" + item.role + "</h3>" +
        '<p class="timeline-org">' + item.org + "</p>" +
        '<p class="timeline-desc">' + item.desc + "</p>" +
        "</li>";
    });
    timeline.innerHTML = html;
  }

  function renderSkills() {
    var list = document.getElementById("skill-list");
    if (!list) return;
    list.innerHTML = (data.skills || [])
      .map(function (skill) {
        return "<li>" + skill + "</li>";
      })
      .join("");
  }

  function renderContact() {
    var list = document.getElementById("contact-list");
    if (!list) return;
    list.innerHTML = (data.contact || [])
      .map(function (item) {
        return (
          "<li><i data-lucide=\"" + item.icon + "\"></i>" +
          '<span class="contact-label">' + item.label + "</span>" +
          "<span>" + item.value + "</span></li>"
        );
      })
      .join("");
  }

  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function bindTheme() {
    var saved = null;
    try {
      saved = localStorage.getItem("portfolio-theme");
    } catch (e) {}
    if (saved) {
      document.documentElement.setAttribute("data-theme", saved);
    }
    var toggle = document.querySelector(".theme-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", function () {
      var next =
        document.documentElement.getAttribute("data-theme") === "dark"
          ? "light"
          : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("portfolio-theme", next);
      } catch (e) {}
    });
  }

  function bindNav() {
    var header = document.getElementById("site-header");
    var toggle = document.querySelector(".nav-toggle");
    if (!header || !toggle) return;
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.innerHTML = open ? '<i data-lucide="x"></i>' : '<i data-lucide="menu"></i>';
      refreshIcons();
    });
    header.querySelectorAll(".mobile-menu a").forEach(function (link) {
      link.addEventListener("click", function () {
        header.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.innerHTML = '<i data-lucide="menu"></i>';
        refreshIcons();
      });
    });
  }

  function bindReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("visible");
      });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  function bindNavHighlight() {
    var links = document.querySelectorAll(".nav-links a");
    if (!links.length) return;
    var sections = ["works", "experience", "about", "contact"].map(function (id) {
      return document.getElementById(id);
    });
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) {
            link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
          });
        });
      },
      { rootMargin: "-38% 0px -56% 0px", threshold: 0 }
    );
    sections.forEach(function (section) {
      if (section) observer.observe(section);
    });
  }

  function bindBackTop() {
    var button = document.getElementById("back-top");
    if (!button) return;
    window.addEventListener("scroll", function () {
      button.classList.toggle("show", window.scrollY > 600);
    });
    button.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function setYear() {
    var el = document.getElementById("current-year");
    if (el) el.textContent = new Date().getFullYear();
  }

  fillFields();
  renderTabs();
  renderWorks();
  renderExperience();
  renderSkills();
  renderContact();
  refreshIcons();
  bindFilters();
  bindLightbox();
  bindTheme();
  bindNav();
  bindReveal();
  bindNavHighlight();
  bindBackTop();
  setYear();
})();
