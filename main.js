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
    var hero = document.querySelector(".hero");
    var figure = document.querySelector(".hero-figure");
    var name = document.querySelector(".hero-name");
    var video = document.querySelector(".particle-text__bg");
    var maskVideo = document.querySelector(".hero-name-mask__source");
    if (!button || !hero || !figure || !name) return;
    var swapTimer = null;
    button.addEventListener("click", function () {
      var willExpand = !hero.classList.contains("is-expanded");
      if (willExpand) {
        hero.classList.add("is-expanded");
        figure.classList.remove("is-hidden");
        if (video) video.play().catch(function () {});
      } else {
        window.clearTimeout(swapTimer);
        hero.classList.remove("is-expanded");
        figure.classList.add("is-hidden");
        if (video) video.pause();
        if (maskVideo) maskVideo.play().catch(function () {});
        syncHeroNameMask();
      }
      button.setAttribute("aria-expanded", String(willExpand));
      var label = button.querySelector("span");
      if (label) label.textContent = willExpand ? "隐藏形象照" : "查看形象照";
    });
  }

  function syncHeroNameMask() {
    var root = document.getElementById("hero-name-mask");
    var clip = document.getElementById("hero-name-mask-clip");
    if (!root || !clip) return;
    var measure = root.querySelector(".hero-name-mask__measure");
    if (!measure) return;
    clip.innerHTML = "";
    var cs = window.getComputedStyle(measure);
    measure.querySelectorAll(".hero-name-mask__word").forEach(function (word) {
      var base = word.querySelector(".hero-name-mask__baseline");
      var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.textContent = word.textContent.replace(/\s+/g, " ").trim();
      text.setAttribute("x", String(word.offsetLeft));
      text.setAttribute("y", String(base.offsetTop));
      text.style.fontFamily = cs.fontFamily;
      text.style.fontSize = cs.fontSize;
      text.style.fontWeight = cs.fontWeight;
      text.style.fontStyle = cs.fontStyle;
      text.style.letterSpacing = cs.letterSpacing;
      clip.appendChild(text);
    });
  }

  function initMagicBento() {
    var cards = document.querySelectorAll(".work-card");
    if (!cards.length) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var mobile = window.innerWidth <= 768;
    var finePointer = window.matchMedia("(hover: hover)").matches;
    if (reduce || mobile || !finePointer) return;

    var glowColor = "212, 175, 109";
    cards.forEach(function (card) {
      card.classList.add("magic-bento-card", "magic-bento-card--border-glow");
      card.style.setProperty("--glow-color", glowColor);

      var hovered = false;

      function onEnter() {
        hovered = true;
      }

      function onMove(e) {
        if (!hovered) return;
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var cx = rect.width / 2;
        var cy = rect.height / 2;
        var rx = ((y - cy) / cy) * -8;
        var ry = ((x - cx) / cx) * 8;
        var mx = (x - cx) * 0.05;
        var my = (y - cy) * 0.05;
        card.style.transform =
          "perspective(900px) rotateX(" + rx.toFixed(2) +
          "deg) rotateY(" + ry.toFixed(2) +
          "deg) translate3d(" + mx.toFixed(2) + "px, " + my.toFixed(2) + "px, 0)";
        card.style.setProperty("--glow-x", (x / rect.width) * 100 + "%");
        card.style.setProperty("--glow-y", (y / rect.height) * 100 + "%");
        card.style.setProperty("--glow-intensity", "1");
      }

      function onLeave() {
        hovered = false;
        card.style.transform = "";
        card.style.setProperty("--glow-intensity", "0");
      }

      function onClick(e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var maxD = Math.max(
          Math.hypot(x, y),
          Math.hypot(x - rect.width, y),
          Math.hypot(x, y - rect.height),
          Math.hypot(x - rect.width, y - rect.height)
        );
        var ripple = document.createElement("span");
        ripple.className = "magic-ripple";
        ripple.style.width = maxD * 2 + "px";
        ripple.style.height = maxD * 2 + "px";
        ripple.style.left = x - maxD + "px";
        ripple.style.top = y - maxD + "px";
        card.appendChild(ripple);
        window.setTimeout(function () {
          ripple.remove();
        }, 800);
      }

      card.addEventListener("mouseenter", onEnter);
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);
      card.addEventListener("click", onClick);
    });

    var spotlight = document.createElement("div");
    spotlight.className = "global-spotlight";
    document.body.appendChild(spotlight);
    var works = document.getElementById("works");
    document.addEventListener("pointermove", function (e) {
      if (!works) return;
      var r = works.getBoundingClientRect();
      var inside =
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom;
      spotlight.style.left = e.clientX + "px";
      spotlight.style.top = e.clientY + "px";
      spotlight.style.opacity = inside ? "0.6" : "0";
    });
  }

  function initParticleText() {
    var container = document.getElementById("particle-text");
    var canvas = container ? container.querySelector(".particle-text__canvas") : null;
    if (!container || !canvas) return;
    var bg = container.querySelector(".particle-text__bg");
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var text = data.heroGreeting || "你好，\n很高兴认识你！";
    var particleSize = 2.5;
    var density = 3;
    var color = "#ffffff";
    var highlightColor = "#d4af6d";
    var scatter = 160;
    var gatherDuration = 1400;
    var stagger = 300;
    var pointerRepel = 30;
    var repelRadius = 140;
    var idleDrift = 0.6;
    var trigger = "mount";
    var fontSize = "84px";
    var fontWeight = 800;
    var fontFamily = "inherit";
    var glow = false;

    function hexToRgb(hex) {
      var clean = String(hex).replace("#", "").trim();
      if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
      return {
        r: parseInt(clean.slice(0, 2), 16),
        g: parseInt(clean.slice(2, 4), 16),
        b: parseInt(clean.slice(4, 6), 16)
      };
    }

    function mixRgb(from, to, amount) {
      return {
        r: Math.round(from.r + (to.r - from.r) * amount),
        g: Math.round(from.g + (to.g - from.g) * amount),
        b: Math.round(from.b + (to.b - from.b) * amount)
      };
    }

    function rgbToCss(rgb) {
      return "rgb(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ")";
    }

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function resolveFontSize(value, el, weight, family) {
      if (typeof value === "number") return value;
      var probe = document.createElement("span");
      probe.textContent = "M";
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      probe.style.pointerEvents = "none";
      probe.style.fontSize = value;
      probe.style.fontWeight = String(weight);
      probe.style.fontFamily = family;
      el.appendChild(probe);
      var size = parseFloat(window.getComputedStyle(probe).fontSize) || 96;
      probe.remove();
      return size;
    }

    function waitForFonts(font) {
      if (!("fonts" in document)) return Promise.resolve();
      return document.fonts
        .load(font)
        .catch(function () {})
        .then(function () {
          return document.fonts.ready;
        });
    }

    var particles = [];
    var animationFrame = null;
    var resizeFrame = null;
    var buildId = 0;
    var gathering = false;
    var gatherStart = 0;
    var reducedMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var width = 0;
    var height = 0;
    var dpr = 1;
    var videoCanvas = null;
    var videoCtx = null;

    var pointer = { active: false, x: 0, y: 0, smoothX: 0, smoothY: 0 };

    function startGather(fromScatter) {
      if (!particles.length) return;
      var now = performance.now();
      var spread = reducedMotion ? 0 : scatter;
      particles.forEach(function (particle) {
        if (fromScatter) {
          var angle = particle.seed * Math.PI * 2;
          var distance = spread * (0.35 + particle.depth * 0.75);
          particle.x =
            particle.targetX + Math.cos(angle) * distance + (particle.depth - 0.5) * spread * 0.55;
          particle.y =
            particle.targetY + Math.sin(angle) * distance + (particle.seed - 0.5) * spread * 0.55;
        }
        particle.startX = particle.x;
        particle.startY = particle.y;
        particle.delay = reducedMotion ? 0 : particle.seed * stagger;
      });
      gatherStart = now;
      gathering = true;
    }

    function drawParticle(particle) {
      var size = particle.size;
      ctx.fillStyle = particle.color;
      if (size <= 2.1) {
        ctx.fillRect(particle.x - size / 2, particle.y - size / 2, size, size);
        return;
      }
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    function render(now) {
      ctx.clearRect(0, 0, width, height);
      if (glow && !reducedMotion) {
        ctx.shadowBlur = particleSize * 3;
        ctx.shadowColor = highlightColor;
      } else {
        ctx.shadowBlur = 0;
      }

      pointer.smoothX += (pointer.x - pointer.smoothX) * 0.18;
      pointer.smoothY += (pointer.y - pointer.smoothY) * 0.18;

      if (videoCtx && bg && bg.readyState >= 2) {
        try {
          videoCtx.drawImage(bg, 0, 0, videoCanvas.width, videoCanvas.height);
          var frame = videoCtx.getImageData(0, 0, videoCanvas.width, videoCanvas.height).data;
          particles.forEach(function (particle) {
            var px = clamp(
              Math.round((particle.targetX / Math.max(1, width)) * videoCanvas.width),
              0,
              videoCanvas.width - 1
            );
            var py = clamp(
              Math.round((particle.targetY / Math.max(1, height)) * videoCanvas.height),
              0,
              videoCanvas.height - 1
            );
            var idx = (py * videoCanvas.width + px) * 4;
            particle.color =
              "rgb(" + frame[idx] + ", " + frame[idx + 1] + ", " + frame[idx + 2] + ")";
          });
        } catch (e) {}
      }

      var complete = true;
      particles.forEach(function (particle) {
        var baseX = particle.targetX;
        var baseY = particle.targetY;
        var progress = 1;

        if (gathering) {
          var local =
            (now - gatherStart - particle.delay) /
            Math.max(1, reducedMotion ? 1 : gatherDuration);
          progress = clamp(local, 0, 1);
          var eased = easeOutCubic(progress);
          baseX = particle.startX + (particle.targetX - particle.startX) * eased;
          baseY = particle.startY + (particle.targetY - particle.startY) * eased;
          if (progress < 1) complete = false;
        } else if (!reducedMotion && idleDrift > 0) {
          var driftTime = now * 0.001;
          baseX += Math.sin(driftTime * 0.9 + particle.seed * 10) * idleDrift * particle.depth;
          baseY += Math.cos(driftTime * 0.75 + particle.depth * 10) * idleDrift * particle.depth;
        }

        if (pointer.active && !reducedMotion && pointerRepel > 0 && repelRadius > 0) {
          var dx = baseX - pointer.smoothX;
          var dy = baseY - pointer.smoothY;
          var distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < repelRadius) {
            var force = Math.pow(1 - distance / repelRadius, 2) * pointerRepel;
            baseX += (dx / distance) * force;
            baseY += (dy / distance) * force;
          }
        }

        var follow = reducedMotion ? 1 : 0.22;
        particle.x += (baseX - particle.x) * follow;
        particle.y += (baseY - particle.y) * follow;

        ctx.globalAlpha = clamp(0.35 + progress * 0.65, 0, 1);
        drawParticle(particle);
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      if (gathering && complete) gathering = false;
      animationFrame = window.requestAnimationFrame(render);
    }

    function ensureRenderLoop() {
      if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(render);
      }
    }

    function sampleText() {
      var currentBuild = ++buildId;
      var rect = container.getBoundingClientRect();
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);
      if (width <= 0 || height <= 0) return;

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!videoCanvas) {
        videoCanvas = document.createElement("canvas");
        videoCtx = videoCanvas.getContext("2d", { willReadFrequently: true });
      }
      videoCanvas.width = width;
      videoCanvas.height = height;

      var computed = window.getComputedStyle(container);
      var resolvedFamily =
        fontFamily === "inherit" ? computed.fontFamily || "sans-serif" : fontFamily;
      var resolvedSize = resolveFontSize(fontSize, container, fontWeight, resolvedFamily);
      var font = fontWeight + " " + resolvedSize + "px " + resolvedFamily;

      waitForFonts(font).then(function () {
        if (currentBuild !== buildId) return;
        var offscreen = document.createElement("canvas");
        var offCtx = offscreen.getContext("2d", { willReadFrequently: true });
        if (!offCtx) return;

        var content = String(text || " ");
        var maxTextWidth = width * 0.92;
        offCtx.font = font;
        var lineWidths = content.split("\n").map(function (line) {
          return offCtx.measureText(line).width;
        });
        var measuredWidth = Math.max(1, Math.max.apply(null, lineWidths));
        if (measuredWidth > maxTextWidth) {
          resolvedSize = Math.max(18, resolvedSize * (maxTextWidth / measuredWidth));
          font = fontWeight + " " + resolvedSize + "px " + resolvedFamily;
          waitForFonts(font).then(function () {
            if (currentBuild !== buildId) return;
            offCtx.font = font;
            buildParticles(offCtx, content, currentBuild);
          });
          return;
        }
        buildParticles(offCtx, content, currentBuild);
      });
    }

    function buildParticles(offCtx, content, currentBuild) {
      var lines = String(content).split("\n");
      var resolved = resolvedSizeForFont(offCtx.font);
      var lineHeight = Math.ceil(resolved * 1.35);
      var padding = Math.max(12, Math.ceil(resolved * 0.08));
      var lineWidths = lines.map(function (line) {
        return Math.ceil(offCtx.measureText(line).width);
      });
      var textWidth = Math.max(1, Math.max.apply(null, lineWidths));
      var textHeight = Math.max(1, lines.length * lineHeight);

      var offscreen = document.createElement("canvas");
      offscreen.width = textWidth + padding * 2;
      offscreen.height = textHeight + padding * 2;
      var offCtx2 = offscreen.getContext("2d", { willReadFrequently: true });
      if (!offCtx2) return;
      offCtx2.clearRect(0, 0, offscreen.width, offscreen.height);
      offCtx2.font = offCtx.font;
      offCtx2.textAlign = "center";
      offCtx2.textBaseline = "alphabetic";
      offCtx2.fillStyle = "#ffffff";
      lines.forEach(function (line, i) {
        if (!line) return;
        offCtx2.fillText(
          line,
          offscreen.width / 2,
          padding + i * lineHeight + Math.ceil(resolved * 0.78)
        );
      });

      var imageData = offCtx2.getImageData(0, 0, offscreen.width, offscreen.height);
      var targets = [];
      var step = Math.max(2, Math.floor(density));
      for (var y = 0; y < offscreen.height; y += step) {
        for (var x = 0; x < offscreen.width; x += step) {
          var alpha = imageData.data[(y * offscreen.width + x) * 4 + 3];
          if (alpha > 40) {
            targets.push({
              x: width / 2 - offscreen.width / 2 + x,
              y: height / 2 - offscreen.height / 2 + y,
              alpha: alpha / 255
            });
          }
        }
      }

      var maxParticles = Math.max(900, Math.min(5200, Math.floor((width * height) / 90)));
      var stride = Math.max(1, Math.ceil(targets.length / maxParticles));
      var baseRgb = hexToRgb(color);
      var highlightRgb = hexToRgb(highlightColor);
      var selected = targets.filter(function (_, index) {
        return index % stride === 0;
      });

      particles = selected.map(function (target, index) {
        var seed = ((index * 9301 + 49297) % 233280) / 233280;
        var depth = 0.45 + (((index * 233 + 97) % 1000) / 1000) * 0.9;
        var blend = baseRgb && highlightRgb
          ? clamp(target.x / Math.max(1, width) + (seed - 0.5) * 0.35, 0, 1)
          : 0;
        var particleColor =
          baseRgb && highlightRgb ? rgbToCss(mixRgb(baseRgb, highlightRgb, blend)) : color;
        var angle = seed * Math.PI * 2;
        var distance = (reducedMotion ? 0 : scatter) * (0.35 + depth * 0.75);
        var startX = target.x + Math.cos(angle) * distance + (seed - 0.5) * scatter * 0.45;
        var startY = target.y + Math.sin(angle) * distance + (depth - 0.9) * scatter * 0.45;
        return {
          x: reducedMotion ? target.x : startX,
          y: reducedMotion ? target.y : startY,
          startX: startX,
          startY: startY,
          targetX: target.x,
          targetY: target.y,
          size: Math.max(0.6, particleSize * (0.75 + target.alpha * 0.45)),
          color: particleColor,
          seed: seed,
          depth: depth,
          delay: seed * stagger
        };
      });

      pointer.x = width / 2;
      pointer.y = height / 2;
      pointer.smoothX = pointer.x;
      pointer.smoothY = pointer.y;

      if (reducedMotion) {
        particles.forEach(function (particle) {
          particle.x = particle.targetX;
          particle.y = particle.targetY;
          particle.startX = particle.targetX;
          particle.startY = particle.targetY;
          particle.delay = 0;
        });
        gathering = false;
      } else {
        startGather(false);
      }
      ensureRenderLoop();
    }

    function resolvedSizeForFont(font) {
      var m = String(font).match(/([\d.]+)px/);
      return m ? parseFloat(m[1]) : 84;
    }

    function queueSample() {
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(sampleText);
    }

    function handlePointerMove(event) {
      var rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    }

    function handlePointerLeave() {
      pointer.active = false;
    }

    function handlePointerEnter(event) {
      handlePointerMove(event);
      if (trigger === "hover") startGather(true);
    }

    function handleClick() {
      if (trigger === "click") startGather(true);
    }

    canvas.addEventListener("pointerenter", handlePointerEnter);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    canvas.addEventListener("click", handleClick);

    var resizeObserver = new ResizeObserver(queueSample);
    resizeObserver.observe(container);
    sampleText();

    if (bg) bg.pause();
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
  initMagicBento();
  bindHeroImageToggle();
  initParticleText();
  syncHeroNameMask();
  var nameMaskRoot = document.getElementById("hero-name-mask");
  if (nameMaskRoot && "ResizeObserver" in window) {
    var nameMaskResize = new ResizeObserver(syncHeroNameMask);
    nameMaskResize.observe(nameMaskRoot);
  }
  var nameMaskVideo = document.querySelector(".hero-name-mask__source");
  if (nameMaskVideo) nameMaskVideo.play().catch(function () {});
  bindLightbox();
  bindTheme();
  bindNav();
  bindReveal();
  bindNavHighlight();
  bindBackTop();
  setYear();
})();
