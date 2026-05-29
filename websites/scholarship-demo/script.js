/* ============================================================
   Granted — scholarship platform
   - region dropdown
   - category filter chips
   - QR apply flow with simulated wallet confirmation
   ============================================================ */

(function () {
  /* ---------- Region dropdown ---------- */
  const regionBtn = document.querySelector("[data-region-toggle]");
  const regionPanel = document.querySelector("[data-region-panel]");
  if (regionBtn && regionPanel) {
    regionBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      regionPanel.classList.toggle("is-open");
    });
    document.addEventListener("click", (e) => {
      if (!regionPanel.contains(e.target) && e.target !== regionBtn) {
        regionPanel.classList.remove("is-open");
      }
    });
  }

  /* ---------- Filter chips (index + region pages) ---------- */
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".filter-chip[data-filter]");
    if (!chip) return;
    const wrap = chip.closest(".filters");
    if (!wrap) return;
    wrap.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");

    const filter = chip.getAttribute("data-filter");
    document.querySelectorAll("[data-cat]").forEach((card) => {
      const cats = (card.getAttribute("data-cat") || "").split(",");
      card.style.display = !filter || filter === "all" || cats.includes(filter) ? "" : "none";
    });
  });

  /* ---------- Card click → detail ---------- */
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".scholar-card[data-link]");
    if (!card) return;
    if (e.target.closest("a, button")) return;
    window.location.href = card.getAttribute("data-link");
  });

  /* ---------- QR overlay (scholarship detail page) ---------- */
  const overlay = document.querySelector("[data-qr-overlay]");
  const applyBtn = document.querySelector("[data-apply-btn]");
  const closeBtn = document.querySelector("[data-qr-close]");

  function openQr() {
    if (!overlay) return;
    overlay.classList.add("is-open");
    window._grantedTimer = setTimeout(finishApply, 8000);
  }
  function closeQr() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    clearTimeout(window._grantedTimer);
  }
  function finishApply() {
    const card = document.querySelector("[data-scholarship]");
    const payload = {
      ts: Date.now(),
      txid: "0x" + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 14),
      appId: "GR-" + Math.floor(Math.random() * 9e5 + 1e5),
      sponsor: card?.dataset.sponsor || "Sponsor",
      title: card?.dataset.title || "Scholarship",
      amount: card?.dataset.amount || "—",
      deadline: card?.dataset.deadline || "—",
    };
    localStorage.setItem("granted.lastApp", JSON.stringify(payload));
    window.location.href = "success.html";
  }

  if (applyBtn) applyBtn.addEventListener("click", openQr);
  if (closeBtn) closeBtn.addEventListener("click", closeQr);
  if (overlay) overlay.addEventListener("click", (e) => { if (e.target === overlay) closeQr(); });

  const confirmLink = document.querySelector("[data-qr-confirm]");
  if (confirmLink) confirmLink.addEventListener("click", () => {
    clearTimeout(window._grantedTimer);
    finishApply();
  });

  /* ---------- Success page ---------- */
  const successMeta = document.querySelector("[data-success-meta]");
  if (successMeta) {
    try {
      const r = JSON.parse(localStorage.getItem("granted.lastApp") || "{}");
      if (r.txid) {
        const dt = new Date(r.ts);
        successMeta.querySelector("[data-meta-app]").textContent = r.appId;
        successMeta.querySelector("[data-meta-scholar]").textContent = r.title;
        successMeta.querySelector("[data-meta-sponsor]").textContent = r.sponsor;
        successMeta.querySelector("[data-meta-amount]").textContent = r.amount;
        successMeta.querySelector("[data-meta-deadline]").textContent = r.deadline;
        successMeta.querySelector("[data-meta-time]").textContent = dt.toLocaleString();
        successMeta.querySelector("[data-meta-tx]").textContent = r.txid;
      }
    } catch {}
  }
})();
