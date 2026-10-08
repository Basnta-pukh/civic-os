/* =========================================================
   CIVIC OS — HACKATHON INTELLIGENCE UPGRADE
   Adds: Road Passport, explainable priority, repeat-failure
   signals, repair verification workflow and PWD field brief.
   All derived intelligence is explicitly labelled as MVP/demo.
   ========================================================= */

(() => {
  "use strict";

  const safe = (value) => {
    if (typeof window.escapeHtml === "function") {
      return window.escapeHtml(String(value ?? ""));
    }
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };

  const getIssues = () => {
    if (Array.isArray(window.CivicOS?.issues)) {
      return window.CivicOS.issues;
    }
    return Array.isArray(window.issues) ? window.issues : [];
  };

  const roadIssues = () =>
    getIssues().filter((i) => i && i.category === "roads");

  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const roadKey = (issue) =>
    normalize(issue?.location || issue?.area || issue?.title)
      .split(" ")
      .slice(0, 8)
      .join(" ");

  const matchingRoadReports = (issue) => {
    if (!issue) return [];
    const key = roadKey(issue);
    return roadIssues().filter((candidate) => {
      if (candidate.id === issue.id) return true;
      return roadKey(candidate) === key ||
        normalize(candidate.area) === normalize(issue.area);
    });
  };

  const priorityScore =
    (typeof window.calculateRoadPriority === "function")
      ? window.calculateRoadPriority
      : (issue) => 0;

  const priorityReasons =
    (typeof window.getRoadPriorityReason === "function")
      ? window.getRoadPriorityReason
      : () => [];

  function healthIndex(issue) {
    const reports = matchingRoadReports(issue);
    if (!reports.length) return 50;

    const open = reports.filter((r) => r.status !== "Resolved").length;
    const resolved = reports.filter((r) => r.status === "Resolved").length;
    const repeats = Math.max(0, reports.length - 1);
    const high = reports.filter((r) => r.priority === "High").length;

    let score = 100;
    score -= Math.min(36, open * 8);
    score -= Math.min(22, high * 5);
    score -= Math.min(18, repeats * 4);
    score += Math.min(12, resolved * 3);

    return Math.max(15, Math.min(96, Math.round(score)));
  }

  function healthLabel(score) {
    if (score < 35) return { text: "Critical", cls: "critical" };
    if (score < 55) return { text: "Degrading", cls: "degrading" };
    if (score < 75) return { text: "Watch", cls: "watch" };
    return { text: "Stable", cls: "stable" };
  }

  function createPassportModal() {
    let dialog = document.getElementById("roadPassportDialog");
    if (dialog) return dialog;

    dialog = document.createElement("dialog");
    dialog.id = "roadPassportDialog";
    dialog.className = "civic-passport-dialog";
    dialog.setAttribute("aria-labelledby", "roadPassportTitle");
    dialog.innerHTML = `
      <div class="civic-passport-shell">
        <div class="civic-passport-head">
          <div>
            <span class="civic-eyebrow">ROAD PASSPORT · MVP</span>
            <h2 id="roadPassportTitle">Road segment intelligence</h2>
            <p class="civic-passport-sub">
              A persistent view of citizen evidence, priority signals and repair history.
            </p>
          </div>
          <button type="button" class="civic-icon-btn" data-road-passport-close aria-label="Close">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div id="roadPassportBody"></div>
      </div>
    `;

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
      if (event.target.closest("[data-road-passport-close]")) dialog.close();
    });

    document.body.appendChild(dialog);
    return dialog;
  }

  function openPassport(id) {
    const issue = getIssues().find((item) => item.id === id);
    if (!issue) return;

    const dialog = createPassportModal();
    const body = dialog.querySelector("#roadPassportBody");
    if (!body) return;

    const score = Math.round(priorityScore(issue));
    const health = healthIndex(issue);
    const label = healthLabel(health);
    const reports = matchingRoadReports(issue);
    const repeatFailures = Math.max(0, reports.filter((r) => r.status !== "Resolved").length - 1);
    const resolvedReports = reports.filter((r) => r.status === "Resolved").length;
    const reasons = priorityReasons(issue, score);

    body.innerHTML = `
      <div class="civic-passport-hero">
        <div>
          <span class="civic-passport-tag">PWD / ROAD ASSET</span>
          <h3>${safe(issue.location || issue.area || "Road segment")}</h3>
          <p>${safe(issue.title || "Road condition report")}</p>
        </div>
        <div class="civic-health-score ${label.cls}">
          <span>${health}</span>
          <small>${safe(label.text)}<br>mvp health index</small>
        </div>
      </div>

      <div class="civic-metric-grid">
        <div class="civic-metric">
          <span>Priority</span>
          <strong>${score}/100</strong>
        </div>
        <div class="civic-metric">
          <span>Reports at segment</span>
          <strong>${reports.length}</strong>
        </div>
        <div class="civic-metric">
          <span>Repeat signal</span>
          <strong>${repeatFailures}</strong>
        </div>
        <div class="civic-metric">
          <span>Resolved reports</span>
          <strong>${resolvedReports}</strong>
        </div>
      </div>

      <div class="civic-passport-grid">
        <section class="civic-passport-panel">
          <div class="civic-panel-kicker">WHY THIS PRIORITY?</div>
          <h4>Explainable recommendation</h4>
          <div class="civic-reason-list">
            ${(reasons.length ? reasons : ["Road condition requires field assessment."])
              .slice(0, 5)
              .map((reason) => `<div><span>✓</span>${safe(reason)}</div>`)
              .join("")}
          </div>
          <div class="civic-advisory">
            <strong>AI is advisory.</strong>
            Final prioritization and field verification remain with authorized officials.
          </div>
        </section>

        <section class="civic-passport-panel">
          <div class="civic-panel-kicker">MAINTENANCE SIGNAL</div>
          <h4>${repeatFailures ? "Repeat failure detected" : "No repeat failure signal yet"}</h4>
          <p>
            ${repeatFailures
              ? `This segment has multiple open reports in the MVP dataset. Consider an engineering inspection for an underlying cause rather than another isolated patch.`
              : `No repeated open-report pattern is detected in the current demo dataset. Continue monitoring after field verification.`}
          </p>
          <div class="civic-recommendation">
            <span class="civic-recommendation-icon">↗</span>
            <div>
              <strong>Recommended next step</strong>
              <span>${repeatFailures ? "Inspect root cause + drainage context" : "Field inspection + evidence verification"}</span>
            </div>
          </div>
        </section>
      </div>

      <section class="civic-passport-panel civic-lifecycle">
        <div class="civic-panel-kicker">REPAIR VERIFICATION</div>
        <div class="civic-lifecycle-head">
          <div>
            <h4>Evidence lifecycle</h4>
            <p>Report → Verify → Repair → Compare → Close</p>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" data-demo-verify="${safe(issue.id)}">
            Run demo comparison
          </button>
        </div>

        <div class="civic-lifecycle-track">
          <div class="civic-life-step done"><b>1</b><span>Citizen evidence</span></div>
          <div class="civic-life-step ${issue.status !== "Reported" ? "done" : "current"}"><b>2</b><span>Verification</span></div>
          <div class="civic-life-step ${issue.status === "In Progress" || issue.status === "Resolved" ? "done" : ""}"><b>3</b><span>Repair</span></div>
          <div class="civic-life-step"><b>4</b><span>Before / after</span></div>
          <div class="civic-life-step ${issue.status === "Resolved" ? "done" : ""}"><b>5</b><span>Close</span></div>
        </div>

        <div id="civicVerificationBox" class="civic-verification-box">
          <div>
            <strong>Post-repair evidence</strong>
            <span>${issue.status === "Resolved" ? "Issue marked resolved in the demo dataset; no post-repair photo is attached." : "No after-photo has been submitted yet."}</span>
          </div>
          <span class="civic-demo-chip">Demo-safe</span>
        </div>
      </section>

      <div class="civic-passport-actions">
        <button type="button" class="btn btn-primary" data-export-brief="${safe(issue.id)}">
          Download PWD field brief
        </button>
        <button type="button" class="btn btn-ghost" data-road-passport-close>
          Close
        </button>
      </div>
    `;

    dialog.showModal();
    if (typeof window.refreshIcons === "function") window.refreshIcons();
  }

  function exportBrief(id) {
    const issue = getIssues().find((item) => item.id === id);
    if (!issue) return;

    const score = Math.round(priorityScore(issue));
    const health = healthIndex(issue);
    const reports = matchingRoadReports(issue);
    const reasons = priorityReasons(issue, score);

    const text = [
      "CIVIC OS — PWD FIELD BRIEF",
      "Hackathon MVP / Demo",
      "",
      `Issue ID: ${issue.id || "—"}`,
      `Road / Location: ${issue.location || issue.area || "—"}`,
      `Problem: ${issue.title || "—"}`,
      `Status: ${issue.status || "—"}`,
      `Reported priority: ${issue.priority || "—"}`,
      `Explainable MVP priority score: ${score}/100`,
      `Road health MVP index: ${health}/100`,
      `Reports at segment: ${reports.length}`,
      `Department: ${issue.department || "Manipur PWD"}`,
      "",
      "WHY THIS PRIORITY",
      ...(reasons.length ? reasons.map((r) => `- ${r}`) : ["- Field assessment required"]),
      "",
      "RECOMMENDED ACTION",
      "Field inspection; verify evidence; confirm jurisdiction; record repair outcome.",
      "",
      "RESPONSIBLE AI NOTE",
      "AI output is advisory. Final government decisions require authorized human verification.",
      "",
      "Generated by Civic OS"
    ].join("\n");

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `civic-os-${issue.id || "field-brief"}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    if (typeof window.toast === "function") {
      window.toast("PWD field brief downloaded", "file-down");
    }
  }

  function addPassportButtons(root = document) {
    const cards = root.querySelectorAll(".issue-card[data-issue]:not([data-passport-enhanced])");
    cards.forEach((card) => {
      const id = card.getAttribute("data-issue");
      const action = document.createElement("button");
      action.type = "button";
      action.className = "civic-passport-mini";
      action.dataset.roadPassport = id;
      action.innerHTML = "Road Passport";
      card.appendChild(action);
      card.dataset.passportEnhanced = "true";
    });
  }

  function prependUpgradePanel() {
    const body = document.getElementById("pwdIntelligenceBody");
    if (!body || body.querySelector(".civic-intel-upgrade")) return;

    const roads = roadIssues()
      .map((issue) => ({ issue, score: Number(priorityScore(issue)) }))
      .sort((a, b) => b.score - a.score);

    const critical = roads.filter((r) => healthIndex(r.issue) < 35).length;
    const degrading = roads.filter((r) => {
      const s = healthIndex(r.issue);
      return s >= 35 && s < 55;
    }).length;
    const repeats = roads.filter((r) => matchingRoadReports(r.issue).length > 1).length;

    const panel = document.createElement("section");
    panel.className = "civic-intel-upgrade";
    panel.innerHTML = `
      <div class="civic-intel-upgrade-head">
        <div>
          <span class="civic-eyebrow">NEW · ROAD ASSET VIEW</span>
          <h3>From complaints to road intelligence</h3>
          <p>
            Civic OS keeps a memory of the road segment instead of treating every complaint as an isolated ticket.
          </p>
        </div>
        <div class="civic-intel-badge">
          <span>AI advisory</span>
          <strong>Human verified</strong>
        </div>
      </div>

      <div class="civic-intel-stats">
        <div><span>Critical segments</span><strong>${critical}</strong></div>
        <div><span>Degrading</span><strong>${degrading}</strong></div>
        <div><span>Repeat-failure signals</span><strong>${repeats}</strong></div>
        <div><span>Road evidence</span><strong>${roads.length}</strong></div>
      </div>

      <div class="civic-intel-table">
        <div class="civic-table-title">
          <span>Top road segments to inspect</span>
          <span class="civic-demo-chip">Explainable MVP</span>
        </div>
        ${roads.slice(0, 4).map(({ issue, score }, index) => {
          const health = healthIndex(issue);
          const lbl = healthLabel(health);
          return `
            <button type="button" class="civic-road-row" data-road-passport="${safe(issue.id)}">
              <span class="civic-road-rank">${String(index + 1).padStart(2, "0")}</span>
              <span class="civic-road-main">
                <strong>${safe(issue.location || issue.area || issue.title)}</strong>
                <small>${safe(issue.title)} · ${safe(issue.department || "PWD")}</small>
              </span>
              <span class="civic-road-score">
                <b>${health}</b>
                <small class="${lbl.cls}">${safe(lbl.text)}</small>
              </span>
              <span class="civic-road-action">Passport →</span>
            </button>
          `;
        }).join("") || `
          <div class="civic-empty-intel">
            Submit a road report to create the first Road Passport.
          </div>
        `}
      </div>

      <div class="civic-architecture-strip">
        <span>Citizen evidence</span><b>→</b>
        <span>AI analysis</span><b>→</b>
        <span>Explainable priority</span><b>→</b>
        <span>PWD queue</span><b>→</b>
        <span>Field verification</span><b>→</b>
        <span>Repair proof</span>
      </div>
    `;

    body.prepend(panel);
    addPassportButtons(body);
  }

  function wireVerification() {
    document.addEventListener("click", (event) => {
      const passport = event.target.closest("[data-road-passport]");
      if (passport) {
        openPassport(passport.getAttribute("data-road-passport"));
        return;
      }

      const exportButton = event.target.closest("[data-export-brief]");
      if (exportButton) {
        exportBrief(exportButton.getAttribute("data-export-brief"));
        return;
      }

      const verifyButton = event.target.closest("[data-demo-verify]");
      if (verifyButton) {
        const box = document.getElementById("civicVerificationBox");
        if (!box) return;
        box.classList.add("is-verified");
        box.innerHTML = `
          <div>
            <strong>Demo comparison complete</strong>
            <span>Prototype workflow: before evidence is available; after evidence would be supplied by an authorized field verification step.</span>
          </div>
          <span class="civic-demo-chip">Demo only</span>
        `;
        return;
      }
    });
  }

  function patchRenderers() {
    const originalPwd = window.renderPwdIntelligence;
    if (typeof originalPwd === "function" && !originalPwd.__civicWrapped) {
      const wrappedPwd = function (...args) {
        const result = originalPwd.apply(this, args);
        prependUpgradePanel();
        return result;
      };
      wrappedPwd.__civicWrapped = true;
      window.renderPwdIntelligence = wrappedPwd;
      try { wrappedPwd(); } catch (_) {}
    }

    const originalIssues = window.renderIssueList;
    if (typeof originalIssues === "function" && !originalIssues.__civicWrapped) {
      const wrappedIssues = function (...args) {
        const result = originalIssues.apply(this, args);
        addPassportButtons(document);
        return result;
      };
      wrappedIssues.__civicWrapped = true;
      window.renderIssueList = wrappedIssues;
      try { wrappedIssues(); } catch (_) {}
    }
  }

  function init() {
    if (window.__civicRoadUpgradeInitialized) return;
    window.__civicRoadUpgradeInitialized = true;

    createPassportModal();
    wireVerification();

    patchRenderers();

    // Re-apply decoration after navigation/rerenders without polling the network.
    const observer = new MutationObserver(() => {
      const pwd = document.getElementById("pwdIntelligenceBody");
      if (pwd) {
        prependUpgradePanel();
        addPassportButtons(pwd);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Surface the sharper product positioning on the existing PWD screen.
    document.querySelectorAll("#pwdIntelligenceScreen .screen-title").forEach((el) => {
      if (!el.dataset.civicCopy) {
        el.dataset.civicCopy = "1";
        el.textContent = "Road maintenance intelligence";
      }
    });
    document.querySelectorAll("#pwdIntelligenceScreen .screen-sub").forEach((el) => {
      if (!el.dataset.civicCopy) {
        el.dataset.civicCopy = "1";
        el.textContent = "Turn citizen evidence into an explainable PWD inspection queue — then verify the repair.";
      }
    });

    if (typeof window.refreshIcons === "function") window.refreshIcons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

/* =========================================================
   REPORT ANALYSIS — JUDGE PROOF LAYER
   ========================================================= */
(() => {
  "use strict";
  const esc = (v) => String(v ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
  const evidenceQuality = (d) => {
    const p = !!d?.hasPhoto, l = !!String(d?.location||"").trim();
    const detail = String(d?.description||"").trim().length >= 30;
    const score = (p?40:0) + (l?35:0) + (detail?25:0);
    return {score,label:score>=90?"Strong":score>=65?"Good":score>=35?"Partial":"Weak"};
  };
  function mountAudit() {
    const panel = document.getElementById("aiPanel");
    const state = window.CivicOS?.state;
    if (!panel || !state?.analysis || !state?.draft || panel.querySelector(".civic-ai-audit") || panel.querySelector(".ai-card.is-loading")) return;
    const a = state.analysis, d = state.draft, e = evidenceQuality(d);
    const score = a.priority === "High" ? 80 : a.priority === "Low" ? 35 : 60;
    const wrap = document.createElement("div");
    wrap.className = "civic-ai-audit";
    wrap.innerHTML = \`
      <div class="civic-ai-audit-head">
        <div><span class="civic-eyebrow">AI EVIDENCE REPORT · MVP</span><h3>What the system actually decided</h3></div>
        <span class="civic-demo-chip">Advisory output</span>
      </div>
      <div class="civic-ai-audit-grid">
        <div class="civic-audit-cell"><span>Classification</span><strong>\${esc(a.categoryLabel)}</strong><small>\${a.autoDetected ? "Detected from description" : "Citizen-selected category"}</small></div>
        <div class="civic-audit-cell"><span>AI confidence</span><strong>\${Number(a.confidence||0)}%</strong><div class="civic-meter"><i style="width:\${Math.min(100,Number(a.confidence||0))}%"></i></div></div>
        <div class="civic-audit-cell"><span>Evidence quality</span><strong>\${e.label}</strong><small>\${e.score}/100 · photo \${d.hasPhoto ? "available" : "missing"}</small></div>
        <div class="civic-audit-cell"><span>Priority recommendation</span><strong>\${esc(a.priority)}</strong><small>\${score}/100 · target \${esc(a.responseTime)}</small></div>
        <div class="civic-audit-cell civic-audit-wide"><span>Routing</span><strong>\${esc(a.authority||a.department)}</strong><small>\${esc(a.division||"Department routing")} · routing confidence \${Number(a.routingConfidence||0)}%</small></div>
        \${a.roadIntelligence ? \`<div class="civic-audit-cell civic-audit-wide civic-road-audit"><span>Road-specific intelligence</span><div class="civic-road-audit-row"><b>\${esc(a.roadIntelligence.issueType||"Road condition")}</b><span>\${esc(a.roadIntelligence.severity||a.priority)}</span><span>\${a.roadIntelligence.recurrence ? "Recurring signal" : "No recurrence signal"}</span></div></div>\` : ""}
        <div class="civic-audit-explain"><span class="civic-panel-kicker">WHY?</span><p>\${esc((a.signals||[]).length ? (a.signals||[]).join(" · ") : "Recommendation uses category, description, evidence and impact signals.")}</p></div>
      </div>
      <div class="civic-ai-governance"><span>✓</span><div><strong>Human verification required</strong><p>AI organizes evidence and recommends priority. It does not make the final government decision.</p></div></div>
    \`;
    panel.appendChild(wrap);
  }
  function initAudit() {
    const panel = document.getElementById("aiPanel");
    if (!panel) return;
    new MutationObserver(mountAudit).observe(panel,{childList:true,subtree:true});
    mountAudit();
  }
  if (document.readyState==="loading") document.addEventListener("DOMContentLoaded",initAudit,{once:true}); else initAudit();
})();
