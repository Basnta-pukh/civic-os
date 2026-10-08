
/* =========================================================
   CIVIC OS — AI4 MANIPUR HACKATHON UPGRADE
   Killer Feature 1: Explainable PWD Priority Lab
   Killer Feature 2: Incident Fusion (duplicate consolidation)
   This layer is demo-safe: no fabricated government data,
   and all simulated inputs are explicitly labelled.
   ========================================================= */
(() => {
  "use strict";

  const esc = (v) => {
    if (typeof window.escapeHtml === "function") return window.escapeHtml(String(v ?? ""));
    return String(v ?? "").replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
  };

  const getIssues = () => Array.isArray(window.CivicOS?.issues) ? window.CivicOS.issues : [];
  const roads = () => getIssues().filter(i => i && i.category === "roads");

  const normalize = (s) => String(s || "").toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter(w => !["near","road","street","main","area","ward","the","and","with","from"].includes(w));

  const similarity = (a,b) => {
    const A = new Set(normalize((a.location||"")+" "+(a.title||"")+" "+(a.description||"")));
    const B = new Set(normalize((b.location||"")+" "+(b.title||"")+" "+(b.description||"")));
    if (!A.size || !B.size) return 0;
    let common = 0; A.forEach(x => { if (B.has(x)) common++; });
    return common / Math.max(1, Math.min(A.size,B.size));
  };

  const clusters = () => {
    const result = [];
    roads().forEach(issue => {
      let cluster = result.find(c => similarity(c[0], issue) >= .42);
      if (!cluster) { cluster = [issue]; result.push(cluster); }
      else cluster.push(issue);
    });
    return result.filter(c => c.length >= 2).sort((a,b) => b.length-a.length);
  };

  const inferDefaults = issue => {
    const text = ((issue?.description||"")+" "+(issue?.title||"")).toLowerCase();
    return {
      safety: /danger|unsafe|accident|school|children|deep|blocked|collapse|sinkhole/.test(text) ? 85 : issue?.priority === "High" ? 75 : 45,
      traffic: /traffic|junction|highway|bus|market|school|main road|ring road/.test(text) ? 80 : 50,
      connectivity: /hospital|school|market|bus|bridge|highway|junction/.test(text) ? 75 : 45,
      recurrence: Math.min(100, 25 + Math.max(0, Number(issue?.supporters||0))*1.5),
      evidence: issue?.status ? 80 : 55
    };
  };

  const calc = f => Math.round(
    f.safety*.30 +
    f.traffic*.20 +
    f.connectivity*.15 +
    f.recurrence*.20 +
    f.evidence*.15
  );

  function createPanel() {
    if (document.querySelector(".civic-killer-grid")) return;
    const body = document.getElementById("pwdIntelligenceBody");
    if (!body) return;

    const road = roads().sort((a,b) => {
      const pa = typeof window.calculateRoadPriority === "function" ? window.calculateRoadPriority(a) : 0;
      const pb = typeof window.calculateRoadPriority === "function" ? window.calculateRoadPriority(b) : 0;
      return pb-pa;
    })[0] || roads()[0];

    let selected = road || {
      id:"DEMO-ROAD", title:"Sample road segment", location:"Demo location",
      priority:"Medium", supporters:10, status:"Reported", description:"Demo scenario"
    };

    const defaults = inferDefaults(selected);
    const panel = document.createElement("section");
    panel.className = "civic-killer-grid";
    panel.innerHTML = `
      <section class="civic-killer-panel">
        <div class="civic-killer-head">
          <div>
            <span class="civic-killer-eyebrow">KILLER FEATURE · PWD-03</span>
            <h3>Explainable Priority Lab</h3>
            <p>Show a PWD officer why one road should be inspected before another — without hiding the scoring logic.</p>
          </div>
          <span class="civic-demo-chip">Prototype model</span>
        </div>
        <div class="civic-score-hero">
          <div class="civic-score-ring" id="civicPriorityRing"><strong id="civicPriorityScore">0</strong><small>/100</small></div>
          <div class="civic-score-copy">
            <strong id="civicPriorityLabel">Maintenance priority</strong>
            <span id="civicPriorityText">AI recommendation is advisory; officials make the final decision.</span>
          </div>
        </div>
        <div id="civicFactors"></div>
        <div class="civic-formula"><b>Demo formula:</b> Safety 30% + Traffic 20% + Connectivity 15% + Repeat reports 20% + Evidence quality 15%.</div>
        <div class="civic-decision"><strong id="civicDecisionTitle">Decision support</strong><p id="civicDecisionText"></p></div>
        <p class="civic-killer-note">Important: traffic, connectivity and historical maintenance values are simulated in this MVP. Production would connect verified PWD/GIS/inspection datasets.</p>
      </section>
      <section class="civic-killer-panel">
        <div class="civic-killer-head">
          <div>
            <span class="civic-killer-eyebrow">KILLER FEATURE · PWD-01</span>
            <h3>Incident Fusion</h3>
            <p>Turn multiple reports of the same road defect into one incident instead of sending the department ten duplicate tickets.</p>
          </div>
          <span class="civic-demo-chip">Evidence clustering</span>
        </div>
        <div class="civic-fusion-list" id="civicFusionList"></div>
        <p class="civic-killer-note">The prototype clusters reports using text/location similarity. A production system would use geospatial radius + image embeddings + time windows.</p>
      </section>
    `;
    body.prepend(panel);

    const fields = [
      ["safety","Safety risk",defaults.safety],
      ["traffic","Traffic importance",defaults.traffic],
      ["connectivity","Connectivity",defaults.connectivity],
      ["recurrence","Repeat reports",defaults.recurrence],
      ["evidence","Evidence quality",defaults.evidence]
    ];
    const factors = document.getElementById("civicFactors");
    fields.forEach(([key,label,value]) => {
      const row = document.createElement("div");
      row.className = "civic-factor";
      row.innerHTML = `<label for="cf-${key}">${label}</label><input id="cf-${key}" type="range" min="0" max="100" value="${value}"><output id="co-${key}">${value}</output>`;
      factors.appendChild(row);
    });

    const update = () => {
      const f = Object.fromEntries(fields.map(([key]) => [key, Number(document.getElementById("cf-"+key).value)]));
      const score = calc(f);
      document.getElementById("civicPriorityScore").textContent = score;
      document.getElementById("civicPriorityRing").style.setProperty("--score-pct", score+"%");
      fields.forEach(([key]) => document.getElementById("co-"+key).textContent = f[key]);
      const label = score >= 80 ? "P1 · Urgent inspection" : score >= 60 ? "P2 · High priority" : score >= 40 ? "P3 · Planned maintenance" : "Monitor";
      document.getElementById("civicPriorityLabel").textContent = label;
      document.getElementById("civicPriorityText").textContent =
        score >= 80 ? "Strong combined risk/impact signal. Move this segment toward field verification." :
        score >= 60 ? "Multiple factors justify placing this segment ahead of routine maintenance." :
        "The available evidence does not justify urgent dispatch yet.";
      document.getElementById("civicDecisionText").textContent =
        `For ${selected.location || "this segment"}, the model recommends ${label.toLowerCase()}. Human verification remains required before action.`;
      document.querySelectorAll(".civic-factor-bar").forEach(el => el.remove());
      fields.forEach(([key]) => {
        const input = document.getElementById("cf-"+key);
        const bar = document.createElement("div");
        bar.className = "civic-factor-bar";
        bar.innerHTML = `<i style="width:${f[key]}%"></i>`;
        input.parentElement.insertAdjacentElement("afterend", bar);
      });
    };
    fields.forEach(([key]) => document.getElementById("cf-"+key).addEventListener("input", update));
    update();

    renderFusion();
  }

  function renderFusion() {
    const list = document.getElementById("civicFusionList");
    if (!list) return;
    const cs = clusters();
    if (!cs.length) {
      list.innerHTML = '<div class="civic-fusion-empty">No duplicate road cluster detected in the current demo dataset. Submit similar reports to demonstrate fusion.</div>';
      return;
    }
    list.innerHTML = cs.slice(0,5).map((cluster,index) => {
      const leader = cluster[0];
      const id = "fusion-"+index;
      return `
        <div class="civic-fusion-card">
          <div class="civic-fusion-count">${cluster.length}</div>
          <div class="civic-fusion-main">
            <strong>${esc(leader.location || leader.title)}</strong>
            <span>${cluster.length} citizen reports → 1 maintenance incident</span>
          </div>
          <button type="button" data-fusion="${id}">View evidence</button>
        </div>
        <div class="civic-fusion-detail" id="${id}" hidden>
          ${cluster.map(i => `<div><span>${esc(i.id)} · ${esc(i.title)}</span><span>${esc(i.status)} · ${Number(i.supporters||0)} affected</span></div>`).join("")}
        </div>
      `;
    }).join("");
    list.querySelectorAll("[data-fusion]").forEach(btn => btn.addEventListener("click", () => {
      const detail = document.getElementById(btn.dataset.fusion);
      if (detail) detail.hidden = !detail.hidden;
    }));
  }

  function init() {
    if (window.__civicHackathonUpgrade) return;
    window.__civicHackathonUpgrade = true;
    const mount = () => {
      if (document.getElementById("pwdIntelligenceBody")) createPanel();
    };
    mount();
    new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});
    window.addEventListener("hashchange", () => setTimeout(mount, 50));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
