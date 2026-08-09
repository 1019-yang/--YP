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

  function workCardHtml(work, index, forceLandscape) {
    var isVideo = work.type === "video";
    var ratios = {
      "16:9": "16 / 9",
      "9:16": "9 / 16",
      "3:4": "3 / 4",
      "4:3": "4 / 3",
      "1:1": "1 / 1"
    };
    var layoutClass = "";
    var thumbStyle = "";
    if (isVideo && work.ratio) {
      if (forceLandscape) {
        layoutClass = " landscape";
        thumbStyle = 'style="aspect-ratio: 16 / 9"';
      } else {
        layoutClass =
          work.ratio === "9:16" || work.ratio === "3:4" ? " portrait" : " landscape";
        thumbStyle = 'style="aspect-ratio: ' + (ratios[work.ratio] || "16 / 9") + '"';
      }
    }
    var media;
    if (isVideo) {
      media =
        '<video src="' + work.src + '" poster="' + (work.poster || "") +
        '" preload="metadata" muted playsinline aria-label="' + (work.alt || work.title) + '"></video>';
    } else {
      media =
        '<img src="' + work.src + '" alt="' + (work.alt || work.title) +
        '" loading="lazy" decoding="async">';
    }

    var chipIcon = isVideo ? "play" : "zoom-in";
    var chipText = isVideo
      ? (work.duration || work.ratio || "视频")
      : work.ratio;

    return (
      '<article class="work-card ' + work.category + layoutClass + '" data-category="' + work.category +
      '" data-index="' + index + '" role="button" tabindex="0" aria-label="' + work.title + '">' +
      '<div class="work-thumb" ' + thumbStyle + ">" + media +
      '<div class="work-overlay"><span class="work-meta-chip"><i data-lucide="' + chipIcon + '"></i>' +
      chipText + "</span></div></div>" +
      '<div class="work-body"><h3>' + work.title + "</h3><p>" +
      [work.tools, work.year].filter(Boolean).join(" · ") + "</p></div>" +
      "</article>"
    );
  }

  function carouselHtml(label, items, forceLandscape) {
    var html = label
      ? '<div class="carousel-label">' + label + "</div>"
      : "";
    html += '<div class="carousel">';
    items.forEach(function (work) {
      var index = data.works.indexOf(work);
      var card = workCardHtml(work, index, forceLandscape);
      card = card.replace(
        '<article class="work-card ',
        '<article class="carousel-card work-card '
      );
      html += card;
    });
    html += "</div>";
    return html;
  }

  function renderWorkGroups() {
    var tabsWrap = document.getElementById("work-group-tabs");
    var wrap = document.getElementById("works-groups");
    if (!tabsWrap || !wrap) return;

    var tabsHtml = "";
    var panelsHtml = "";
    (data.workGroups || []).forEach(function (group, index) {
      var items = [];
      (data.works || []).forEach(function (work) {
        if (work.group === group.id) items.push(work);
      });
      var active = index === 0 ? " active" : "";

      tabsHtml +=
        '<button class="tab' + active + '" type="button" role="tab" data-group="' +
        group.id + '">' + group.label + "</button>";

      panelsHtml += '<section class="work-panel' + (active ? " active" : "") + '" data-panel="' + group.id + '">';

      if (items.length) {
        if (group.id === "feed") {
          panelsHtml += carouselHtml("", items, true);
          panelsHtml += "</section>";
          return;
        }
        var landscape = [];
        var portrait = [];
        items.forEach(function (work) {
          if (work.ratio === "9:16" || work.ratio === "3:4") {
            portrait.push(work);
          } else {
            landscape.push(work);
          }
        });
        if (landscape.length) panelsHtml += carouselHtml("横屏", landscape);
        if (portrait.length) panelsHtml += carouselHtml("竖屏", portrait);
      } else {
        panelsHtml += '<p class="group-empty">待补充</p>';
      }
      panelsHtml += "</section>";
    });
    tabsWrap.innerHTML = tabsHtml;
    wrap.innerHTML = panelsHtml;
  }

  function enableCarouselDrag() {
    document.querySelectorAll(".carousel").forEach(function (el) {
      var isDown = false;
      var startX = 0;
      var startScroll = 0;
      var moved = false;
      el.addEventListener("pointerdown", function (event) {
        isDown = true;
        moved = false;
        startX = event.clientX;
        startScroll = el.scrollLeft;
      });
      el.addEventListener("pointermove", function (event) {
        if (!isDown) return;
        var dx = event.clientX - startX;
        if (Math.abs(dx) > 6) moved = true;
        el.scrollLeft = startScroll - dx;
      });
      var endDrag = function () {
        isDown = false;
        window.__carouselDragged = moved;
      };
      el.addEventListener("pointerup", endDrag);
      el.addEventListener("pointercancel", endDrag);
      el.addEventListener("pointerleave", endDrag);
    });
  }

  function bindGroupTabs() {
    var wrap = document.getElementById("work-group-tabs");
    var panels = document.getElementById("works-groups");
    if (!wrap || !panels) return;
    wrap.addEventListener("click", function (event) {
      var button = event.target.closest(".tab");
      if (!button) return;
      wrap.querySelectorAll(".tab").forEach(function (tab) {
        tab.classList.toggle("active", tab === button);
      });
      var group = button.getAttribute("data-group");
      Array.prototype.forEach.call(panels.children, function (panel) {
        panel.classList.toggle("active", panel.getAttribute("data-panel") === group);
      });
    });
  }

  function timelineHtml(items) {
    var html = "";
    (items || []).forEach(function (item) {
      html +=
        '<li class="timeline-item">' +
        '<p class="timeline-period">' + item.period + "</p>" +
        "<h3>" + item.role + "</h3>" +
        '<p class="timeline-org">' + item.org + "</p>";
      if (item.desc) {
        html += '<p class="timeline-desc">' + item.desc + "</p>";
      }
      html += "</li>";
    });
    return html;
  }

  function renderTimelines() {
    var education = document.getElementById("education-timeline");
    var work = document.getElementById("work-timeline");
    if (education) education.innerHTML = timelineHtml(data.education);
    if (work) work.innerHTML = timelineHtml(data.work);
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

  function bindHeroImageToggle() {
    var button = document.querySelector(".hero-image-toggle");
    var figure = document.querySelector(".hero-figure");
    if (!button || !figure) return;
    button.addEventListener("click", function () {
      var hidden = figure.classList.toggle("is-hidden");
      button.setAttribute("aria-expanded", String(!hidden));
      var label = button.querySelector("span");
      if (label) label.textContent = hidden ? "查看形象照" : "隐藏形象照";
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

    var groups = document.getElementById("works-groups");
    groups.addEventListener("click", function (event) {
      if (window.__carouselDragged) {
        window.__carouselDragged = false;
        return;
      }
      var card = event.target.closest(".work-card");
      if (!card) return;
      openWork(data.works[Number(card.getAttribute("data-index"))]);
    });
    groups.addEventListener("keydown", function (event) {
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
  renderWorkGroups();
  renderTimelines();
  renderSkills();
  renderContact();
  refreshIcons();
  bindGroupTabs();
  enableCarouselDrag();
  bindHeroImageToggle();
  bindLightbox();
  bindTheme();
  bindNav();
  bindReveal();
  bindNavHighlight();
  bindBackTop();
  setYear();
})();
