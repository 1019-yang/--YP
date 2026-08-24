/*
 * 项目面板：公开时间线（V1–V4 演进）+ 密码栏目「AI辅助千川脚本创作」
 * 依赖：projects-data.js 提供的 window.PROJECTS_DATA
 * 交互：公开展示版本演进时间线；另设一栏「AI辅助千川脚本创作」，
 *       点击输入密码 0529 后展开「提示词详情」（按 V1/V2 形式分版块）。
 */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  var DATA = window.PROJECTS_DATA || { aiTheme: {}, timeline: [] };
  var unlocked = false;
  var editing = false;

  // ---------- 渲染小工具 ----------
  function proofHtml(node, idx) {
    var items = node.proof || [];
    if (!items.length) return "";
    var html = items.map(function (it, i) {
      if (it.file) {
        return (
          '<a class="tl-proof-file" href="' + esc(it.file) + '" target="_blank" rel="noopener">' +
          '<span class="tl-proof-file__type">' + esc(it.type || "文件") + "</span>" +
          '<span class="tl-proof-file__name">' + esc(it.caption || it.file) + "</span>" +
          '<span class="tl-proof-file__go">打开 ↗</span>' +
          "</a>"
        );
      }
      return (
        '<button class="tl-proof-thumb" type="button" data-proof="' + idx + ":" + i + '">' +
        '<img src="' + esc(it.src) + '" alt="' + esc(it.caption || "") + '" loading="lazy" />' +
        '<span>' + esc(it.type || "素材") + "</span>" +
        "</button>"
      );
    }).join("");
    return '<div class="tl-proof">' + html + "</div>";
  }

  // 编辑态：节点内联 SOARM 五段（可改）
  function detailEditHtml(node, idx) {
    var d = node.detail || {};
    var rows = [
      ["S", "背景", d.situation, "situation"],
      ["O", "障碍", d.obstacle, "obstacle"],
      ["A", "行动", d.action, "action"],
      ["R", "结果", d.result, "result"],
      ["M", "方法", d.method, "method"]
    ];
    var html = rows.map(function (r) {
      return (
        '<div class="tl-edit-row">' +
        '<span class="soarm-letter">' + r[0] + "</span>" +
        "<div><label>" + r[1] + "</label>" +
        '<div class="tl-edit-text" data-edit="timeline.' + idx + '.detail.' + r[3] + '" contenteditable="true">' + esc(r[2] || "") + "</div>" +
        "</div></div>"
      );
    }).join("");
    return '<div class="tl-edit-detail">' + html + "</div>";
  }

  function nodeHtml(node, idx, edit) {
    var ea = edit ? ' data-edit="timeline.' + idx + '.title" contenteditable="true"' : "";
    var sa = edit ? ' data-edit="timeline.' + idx + '.summary" contenteditable="true"' : "";
    return (
      '<article class="tl-node" data-idx="' + idx + '">' +
      '<div class="tl-marker"><span class="tl-version">' + esc(node.version || "") + "</span></div>" +
      '<div class="tl-card">' +
      '<div class="tl-head">' +
      '<span class="tl-phase">' + esc(node.phase || "") + "</span>" +
      (node.date ? '<span class="tl-date">' + esc(node.date) + "</span>" : "") +
      "</div>" +
      '<div class="tl-tool">' + esc(node.tool || "") + "</div>" +
      '<h3 class="tl-title"' + ea + ">" + esc(node.title || "") + "</h3>" +
      '<p class="tl-summary"' + sa + ">" + esc(node.summary || "") + "</p>" +
      '<details class="tl-prompt">' +
      '<summary>' + esc(node.promptLabel || "使用提示词") + "</summary>" +
      '<pre class="tl-prompt-text">' + esc(node.prompt || "") + "</pre>" +
      "</details>" +
      proofHtml(node, idx) +
      (edit ? detailEditHtml(node, idx) : '<button class="tl-detail-btn" type="button" data-open-v="' + idx + '">查看方法 / 数据</button>') +
      "</div>" +
      "</article>"
    );
  }

  // ---------- 提示词详情（密码栏目内，按 V1/V2 形式分版块） ----------
  function promptDetailHtml() {
    var nodes = DATA.timeline || [];
    var blocks = nodes.map(function (n) {
      return (
        '<section class="pd-block">' +
        '<div class="pd-head">' +
        '<span class="pd-version">' + esc(n.version || "") + "</span>" +
        '<span class="pd-title">' + esc(n.title || "") + "</span>" +
        '<span class="pd-tool">' + esc(n.tool || "") + "</span>" +
        "</div>" +
        '<p class="pd-summary">' + esc(n.summary || "") + "</p>" +
        '<details class="tl-prompt" open>' +
        '<summary>' + esc(n.promptLabel || "使用提示词") + "</summary>" +
        '<pre class="tl-prompt-text">' + esc(n.prompt || "") + "</pre>" +
        "</details>" +
        proofHtml(n, nodes.indexOf(n)) +
        '<button class="tl-detail-btn" type="button" data-open-v="' + nodes.indexOf(n) + '">查看方法 / 数据</button>' +
        "</section>"
      );
    }).join("");
    return '<div class="pd-wrap">' + blocks + "</div>";
  }

  function render(editMode) {
    var edit = !!editMode;
    var root = document.getElementById("project-cases");
    if (!root) return;

    var theme = DATA.aiTheme || {};
    var metrics = (theme.metrics || []).map(function (m, i) {
      var v = Array.isArray(m) ? m[0] : m.value;
      var l = Array.isArray(m) ? m[1] : m.label;
      var va = edit ? ' data-edit="aiTheme.metrics.' + i + '.0" contenteditable="true"' : "";
      var la = edit ? ' data-edit="aiTheme.metrics.' + i + '.1" contenteditable="true"' : "";
      return '<div class="ai-metric"><strong' + va + ">" + esc(v) + "</strong><span" + la + ">" + esc(l) + "</span></div>";
    }).join("");

    // 版本演进（公开，始终可见）
    var nodes = (DATA.timeline || []).map(function (n, i) {
      return nodeHtml(n, i, edit);
    }).join("");

    // 密码入口：解锁后下方就地展开提示词详情
    var colCard =
      '<button class="ai-col-card" id="ai-col-card" type="button">' +
      '<span class="ai-col-lock" id="ai-col-lock">锁定</span>' +
      '<span class="ai-col-text">' +
      '<span class="ai-col-title">提示词详情（含 V1–V4 全文）</span>' +
      '<span class="ai-col-sub" id="ai-col-sub">点击输入密码查看</span>' +
      "</span>" +
      '<span class="ai-col-arrow">›</span>' +
      "</button>" +
      '<div class="ai-col-body" id="ai-col-body" hidden>' +
      promptDetailHtml() +
      "</div>";

    // 统一栏目：AI辅助千川脚本创作
    // 收起态 = 项目封面卡（标题 + 成果指标 + 展开入口 + 视频迭代）
    // 展开态 = 时间线 + 密码入口
    root.innerHTML =
      '<section class="ai-collection" id="ai-collection">' +
      // ---- 收起态：封面卡 ----
      '<div class="ai-col-cover" id="ai-col-cover">' +
      '<div class="ai-col-cover-main">' +
      '<div class="ai-cover-head">' +
      '<p class="ai-eyebrow">' + esc(theme.eyebrow || "") + "</p>" +
      "</div>" +
      '<h2 class="ai-title"' + (edit ? ' data-edit="aiTheme.title" contenteditable="true"' : "") + ">" + esc(theme.title || "AI辅助千川脚本创作") + "</h2>" +
      '<p class="ai-subtitle"' + (edit ? ' data-edit="aiTheme.subtitle" contenteditable="true"' : "") + ">" + esc(theme.subtitle || "") + "</p>" +
      (edit ? "" : tagsHtml()) +
      (edit ? "" : stepsHtml()) +
      (metrics ? '<div class="ai-metrics">' + metrics + "</div>" : "") +
      '<button class="ai-col-toggle" id="ai-col-toggle" type="button">点击展开查看 V1–V4 演进 ›</button>' +
      (edit ? "" : '<button class="ai-edit-btn" id="ai-edit-btn" type="button">编辑文案</button>') +
      "</div>" +
      '<div class="ai-col-cover-video">' +
      videoIterHtml() +
      "</div>" +
      "</div>" +
      // ---- 展开态：内容 ----
      '<div class="ai-col-content" id="ai-col-content"' + (edit ? "" : " hidden") + ">" +
      (edit ? '<div class="ai-edit-bar">' +
        '<span class="ai-edit-hint">编辑模式 · 直接点文字修改，确认后定稿锁定</span>' +
        '<button class="ai-edit-confirm" id="ai-edit-confirm" type="button">确认定稿</button>' +
        '<button class="ai-edit-cancel" id="ai-edit-cancel" type="button">取消</button>' +
        "</div>" : "") +
      '<p class="ai-exp-label">演进经历 · V1–V4</p>' +
      '<div class="timeline">' + nodes + "</div>" +
      '<div class="ai-col-section">' + colCard + "</div>" +
      "</div>" +
      "</section>" +
      renderAmazonRoute(edit) +
      '<p class="projects-tail">更多项目正在填充中，尽情期待</p>';

    bindColumn();
    bindNodes();
    bindToggle();
    bindVideoIter();
    bindSteps();
  }

  // ---------- 第二个项目：亚马逊运营学习路线 ----------
  function renderAmazonRoute(edit) {
    var theme = DATA.amazonRoute || {};
    var modules = theme.modules || [];
    if (!modules.length) return "";

    var coverTe = edit ? ' data-edit="amazonRoute.eyebrow" contenteditable="true"' : "";
    var coverTt = edit ? ' data-edit="amazonRoute.title" contenteditable="true"' : "";
    var coverTs = edit ? ' data-edit="amazonRoute.subtitle" contenteditable="true"' : "";

    var source = "";
    if (theme.source && theme.source.url) {
      var sl = edit ? ' data-edit="amazonRoute.source.label" contenteditable="true"' : "";
      source =
        '<a class="amz-source" href="' + esc(theme.source.url) + '" target="_blank" rel="noopener">' +
        '<i data-lucide="external-link"></i>' +
        '<span' + sl + ">" + esc(theme.source.label || "学习来源") + "</span>" +
        "</a>";
    }

    var cards = modules.map(function (m, i) {
      var ta = edit ? ' data-edit="amazonRoute.modules.' + i + '.title" contenteditable="true"' : "";
      var da = edit ? ' data-edit="amazonRoute.modules.' + i + '.desc" contenteditable="true"' : "";
      return (
        '<article class="amz-module">' +
        '<span class="amz-module__index">' + esc(m.index || "") + "</span>" +
        '<h4 class="amz-module__title"' + ta + ">" + esc(m.title || "") + "</h4>" +
        '<p class="amz-module__desc"' + da + ">" + (m.desc ? esc(m.desc) : '<span class="amz-empty">内容填充中…</span>') + "</p>" +
        "</article>"
      );
    }).join("");

    return (
      '<section class="amz-route">' +
      '<div class="amz-route__cover">' +
      '<p class="ai-eyebrow"' + coverTe + ">" + esc(theme.eyebrow || "") + "</p>" +
      '<h2 class="amz-route__title"' + coverTt + ">" + esc(theme.title || "") + "</h2>" +
      '<p class="amz-route__subtitle"' + coverTs + ">" + esc(theme.subtitle || "") + "</p>" +
      (source ? '<div class="amz-route__source">' + source + "</div>" : "") +
      "</div>" +
      '<div class="amz-grid">' + cards + "</div>" +
      "</section>"
    );
  }

  // ---------- 文案编辑模式 ----------
  function setByPath(obj, path, val) {
    var keys = String(path).split(".");
    var cur = obj;
    for (var i = 0; i < keys.length - 1; i++) {
      var k = keys[i];
      if (cur[k] == null) cur[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
      cur = cur[k];
    }
    cur[keys[keys.length - 1]] = val;
  }

  function collectEdit() {
    var root = document.getElementById("project-cases");
    if (!root) return;
    root.querySelectorAll("[data-edit]").forEach(function (el) {
      var path = el.getAttribute("data-edit");
      if (path) setByPath(DATA, path, el.textContent.trim());
    });
  }

  function enterEdit() {
    editing = true;
    render(true);
    var content = document.getElementById("ai-col-content");
    if (content) content.hidden = false;
    var toggle = document.getElementById("ai-col-toggle");
    if (toggle) toggle.textContent = "收起 ‹";
  }

  function exitEdit(apply) {
    if (apply) collectEdit();
    editing = false;
    render(false);
    if (apply) exportData();
  }

  function exportData() {
    var txt = "window.PROJECTS_DATA = " + JSON.stringify(DATA, null, 2) + ";\n";
    var blob = new Blob([txt], { type: "text/javascript" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "projects-data.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (url) URL.revokeObjectURL(url);
  }


  // 视频迭代：收起态右侧，展示 V1–V4 代表成片
  function videoIterHtml() {
    var nodes = DATA.timeline || [];
    if (!nodes.length) return "";
    var items = nodes.map(function (n, i) {
      var v = n.video;
      if (!v) return "";
      return (
        '<button class="ai-vid-card" type="button" data-vidx="' + i + '">' +
        '<video class="ai-vid-thumb" src="' + esc(v.src) + '" poster="' + esc(v.poster || "") + '" muted loop playsinline preload="metadata"></video>' +
        '<span class="ai-vid-meta">' +
        '<span class="ai-vid-ver">' + esc(n.version || "") + "</span>" +
        '<span class="ai-vid-cap">' + esc(v.caption || n.title || "") + "</span>" +
        "</span>" +
        '<span class="ai-vid-play"><i data-lucide="play"></i></span>' +
        "</button>"
      );
    }).join("");
    return (
      '<p class="ai-vid-label"><i data-lucide="video"></i>视频迭代 · 点击播放</p>' +
      '<div class="ai-vid-grid">' + items + "</div>"
    );
  }

  function bindVideoIter() {
    var cover = document.getElementById("ai-col-cover");
    if (!cover) return;
    cover.querySelectorAll(".ai-vid-card").forEach(function (btn) {
      btn.addEventListener("mouseenter", function () { var v = btn.querySelector("video"); if (v) v.play().catch(function(){}); });
      btn.addEventListener("mouseleave", function () { var v = btn.querySelector("video"); if (v) { v.pause(); v.currentTime = 0; } });
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var idx = Number(btn.getAttribute("data-vidx"));
        var n = (DATA.timeline || [])[idx];
        if (n && n.video) openVideo(n.video.src, n.video.caption);
      });
    });
  }

  // 收起态：能力关键词行
  function tagsHtml() {
    var tags = (DATA.aiTheme && DATA.aiTheme.tags) || [];
    if (!tags.length) return "";
    var t = tags.map(function (tag, i) {
      return '<span class="ai-tag"' + (editing ? ' data-edit="aiTheme.tags.' + i + '" contenteditable="true"' : "") + ">" + esc(tag) + "</span>";
    }).join("");
    return '<div class="ai-tags">' + t + "</div>";
  }

  // 收起态：V1–V4 演进预览条（点击展开完整历程）
  function stepsHtml() {
    var nodes = DATA.timeline || [];
    if (!nodes.length) return "";
    var inner = nodes.map(function (n, i) {
      var arrow = i < nodes.length - 1 ? '<span class="ai-step__arrow">→</span>' : "";
      return (
        '<span class="ai-step">' +
        '<span class="ai-step__ver">' + esc(n.version || "") + "</span>" +
        '<span class="ai-step__phase">' + esc(n.phase || "") + "</span>" +
        "</span>" + arrow
      );
    }).join("");
    return '<button class="ai-steps" id="ai-steps" type="button" title="点击展开完整演进历程">' + inner + "</button>";
  }

  function bindSteps() {
    var steps = document.getElementById("ai-steps");
    if (!steps) return;
    steps.addEventListener("click", function () {
      var content = document.getElementById("ai-col-content");
      var toggle = document.getElementById("ai-col-toggle");
      if (!content || !content.hidden) return;
      content.hidden = false;
      if (toggle) toggle.textContent = "收起 ‹";
    });
  }

  function bindToggle() {
    var toggleBtn = document.getElementById("ai-col-toggle");
    if (!toggleBtn) return;
    toggleBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var content = document.getElementById("ai-col-content");
      var cover = document.getElementById("ai-col-cover");
      if (!content) return;
      var open = content.hidden;
      content.hidden = !open;
      if (cover) cover.classList.toggle("is-collapsed", open);
      toggleBtn.textContent = open ? "收起 ‹" : "点击展开查看 V1–V4 演进 ›";
    });
  }

  function bindColumn() {
    var col = document.getElementById("ai-col-card");
    if (!col) return;
    col.addEventListener("click", function () {
      if (!unlocked) {
        openPw();
      } else {
        var body = document.getElementById("ai-col-body");
        if (body) body.hidden = !body.hidden;
        var sub = document.getElementById("ai-col-sub");
        if (sub) sub.textContent = body && !body.hidden ? "已解锁 · 点击折叠" : "点击输入密码查看提示词详情";
      }
    });
  }

  function bindNodes() {
    var root = document.getElementById("project-cases");
    if (!root) return;
    root.querySelectorAll("[data-open-v]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openVersionModal(Number(btn.getAttribute("data-open-v")));
      });
    });
    root.querySelectorAll(".tl-proof-thumb").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var pa = btn.getAttribute("data-proof").split(":");
        var item = (DATA.timeline[Number(pa[0])].proof || [])[Number(pa[1])];
        if (item && item.video) openVideo(item.video, item.caption);
        else if (item) openImage(item.src, item.caption);
      });
    });
  }

  // ---------- 密码门（弹窗） ----------
  function openPw() {
    var ov = document.getElementById("pw-overlay");
    if (!ov) return;
    ov.hidden = false;
    var inp = document.getElementById("pw-input");
    if (inp) inp.focus();
  }
  function closePw() {
    var ov = document.getElementById("pw-overlay");
    if (ov) ov.hidden = true;
    var inp = document.getElementById("pw-input");
    var err = document.getElementById("pw-err");
    if (inp) inp.value = "";
    if (err) err.hidden = true;
  }
  function normalizePw(v) {
    if (!v) return "";
    // 全角数字转半角，并去掉所有空格
    return String(v)
      .replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xfee0); })
      .replace(/\s+/g, "");
  }
  function verifyPw() {
    var inp = document.getElementById("pw-input");
    var err = document.getElementById("pw-err");
    if (!inp) return;
    if (normalizePw(inp.value) === "0529") {
      unlocked = true;
      closePw();
      var body = document.getElementById("ai-col-body");
      if (body) body.hidden = false;
      var sub = document.getElementById("ai-col-sub");
      if (sub) sub.textContent = "已解锁 · 点击折叠";
    } else {
      if (err) {
        err.hidden = false;
        err.textContent = "密码错误，请重试（注意关闭中文输入法，使用半角数字）";
      }
      inp.value = "";
      inp.focus();
    }
  }

  // ---------- 版本详情弹窗 ----------
  // SOARM 五段：背景(S) / 障碍(O) / 行动(A) / 结果(R) / 方法(M)
  function soarmHtml(d) {
    var rows = [
      ["S", "背景", d.situation],
      ["O", "障碍", d.obstacle],
      ["A", "行动", d.action],
      ["R", "结果", d.result],
      ["M", "方法", d.method]
    ];
    return rows
      .map(function (r) {
        if (!r[2]) return "";
        return (
          '<div class="case-modal-section soarm-row">' +
          '<span class="soarm-letter">' + r[0] + "</span>" +
          "<div><h4>" + r[1] + "</h4><p>" + esc(r[2]) + "</p></div>" +
          "</div>"
        );
      })
      .join("");
  }

  function openVersionModal(idx) {
    var n = DATA.timeline[idx];
    if (!n) return;
    var d = n.detail || {};
    var proof = (n.proof || []).filter(function (p) { return !p.file; }).map(function (p) {
      return (
        '<button class="modal-proof" type="button" data-v="' + esc(p.video || "") + '" data-s="' + esc(p.src) + '">' +
        '<img src="' + esc(p.src) + '" alt="' + esc(p.caption || "") + '" loading="lazy" />' +
        "<span>" + esc(p.type || "素材") + " · " + esc(p.caption || "") + "</span>" +
        "</button>"
      );
    }).join("");
    var files = (n.proof || []).filter(function (p) { return p.file; }).map(function (p) {
      return '<a class="modal-file" href="' + esc(p.file) + '" target="_blank" rel="noopener">' + esc(p.caption || p.file) + " (打开)</a>";
    }).join("");

    var html =
      '<span class="case-tag">' + esc(n.version || "") + " · " + esc(n.phase || "") + "</span>" +
      '<p class="case-modal-meta">' + esc([n.tool, n.date].filter(Boolean).join("  ·  ")) + "</p>" +
      '<h3 class="case-modal-title">' + esc(n.title) + "</h3>" +
      '<p class="case-modal-oneliner">' + esc(n.summary) + "</p>" +
      soarmHtml(d) +
      (files ? '<div class="case-modal-section"><h4>交付物</h4><div class="case-modal-files">' + files + "</div></div>" : "") +
      (proof ? '<div class="case-modal-section"><h4>视觉证明</h4><div class="case-modal-proof">' + proof + "</div></div>" : "");

    var modal = document.getElementById("case-modal");
    modal.querySelector("#case-modal-body").innerHTML = html;
    modal.hidden = false;
    document.body.classList.add("modal-open");

    modal.querySelectorAll(".modal-proof").forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-v");
        if (v) openVideo(v, b.querySelector("span").textContent);
        else openImage(b.getAttribute("data-s"), b.querySelector("span").textContent);
      });
    });
  }
  function closeCaseModal() {
    var modal = document.getElementById("case-modal");
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  // ---------- 视频 / 图片预览 ----------
  function openVideo(src, caption) {
    var c = document.getElementById("media-content");
    c.innerHTML =
      '<video src="' + esc(src) + '" controls autoplay playsinline></video>' +
      (caption ? '<p class="media-cap">' + esc(caption) + "</p>" : "");
    document.getElementById("media-overlay").hidden = false;
  }
  function openImage(src, caption) {
    var c = document.getElementById("media-content");
    c.innerHTML =
      '<img src="' + esc(src) + '" alt="' + esc(caption || "") + '" />' +
      (caption ? '<p class="media-cap">' + esc(caption) + "</p>" : "");
    document.getElementById("media-overlay").hidden = false;
  }

  // ---------- 初始化 ----------
  function initStatic() {
    // 所有弹层关闭（case-modal / media / 密码）均已改为 document 级事件委托（见末尾监听），
    // 不在此处逐一绑定，避免依赖初始化时机导致首次加载失效。
  }

  window.renderProjectsPanel = function () {
    render();
    initStatic();
  };

  document.addEventListener("click", function (e) {
    var modal = document.getElementById("case-modal");
    if (modal && !modal.hidden && (e.target === modal || (e.target && e.target.id === "case-modal-close"))) closeCaseModal();
    var ov = document.getElementById("media-overlay");
    if (ov && !ov.hidden && (e.target === ov || (e.target && e.target.id === "media-close"))) { ov.hidden = true; ov.querySelector("#media-content").innerHTML = ""; }
    var pw = document.getElementById("pw-overlay");
    if (pw && !pw.hidden && e.target === pw) closePw();
    // 密码按钮/关闭：事件委托，避免依赖初始化时机
    if (e.target && e.target.id === "pw-submit") verifyPw();
    if (e.target && e.target.id === "pw-close") closePw();
    if (e.target && e.target.id === "ai-edit-btn") enterEdit();
    if (e.target && e.target.id === "ai-edit-confirm") exitEdit(true);
    if (e.target && e.target.id === "ai-edit-cancel") exitEdit(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeCaseModal();
      var ov = document.getElementById("media-overlay");
      if (ov) { ov.hidden = true; ov.querySelector("#media-content").innerHTML = ""; }
    }
    if (e.key === "Enter" && e.target && e.target.id === "pw-input") verifyPw();
  });
})();
