/* ============================================================
   Beam — stablecoin-paid video meetings
   - landing dropdown
   - attend page: list → QR state with simulated wallet confirm
   - in-call view: simple mute/camera toggles + leave + clock
   ============================================================ */

(function () {

  /* ---------- Custom dropdown on landing ---------- */
  const trigger = document.querySelector("[data-select-trigger]");
  const panel = document.querySelector("[data-select-panel]");
  const continueBtn = document.querySelector("[data-continue-btn]");

  if (trigger && panel) {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = panel.classList.toggle("is-open");
      trigger.classList.toggle("is-open", open);
    });
    document.addEventListener("click", (e) => {
      if (!panel.contains(e.target) && e.target !== trigger) {
        panel.classList.remove("is-open");
        trigger.classList.remove("is-open");
      }
    });

    panel.querySelectorAll(".select-option").forEach((opt) => {
      opt.addEventListener("click", () => {
        const label = opt.querySelector(".label")?.textContent || "";
        const desc = opt.querySelector(".desc")?.textContent || "";
        const iconHTML = opt.querySelector(".icon")?.innerHTML || "";

        trigger.querySelector(".label").textContent = label;
        trigger.querySelector(".desc").textContent = desc;
        trigger.querySelector(".icon").innerHTML = iconHTML;
        trigger.setAttribute("data-value", opt.getAttribute("data-value"));

        panel.classList.remove("is-open");
        trigger.classList.remove("is-open");
      });
    });
  }

  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      const value = trigger?.getAttribute("data-value") || "attend";
      if (value === "attend") window.location.href = "attend.html";
      else if (value === "create") alert("Create meeting flow — not in demo scope.");
      else if (value === "schedule") alert("Schedule meeting flow — not in demo scope.");
      else if (value === "join-code") {
        const code = prompt("Enter meeting code:");
        if (code) window.location.href = "attend.html";
      }
    });
  }

  /* ---------- Attend page: meeting list → QR ---------- */
  const listView = document.querySelector("[data-meeting-list]");
  const qrView = document.querySelector("[data-qr-view]");

  document.addEventListener("click", (e) => {
    const sel = e.target.closest("[data-select-meeting]");
    if (!sel) return;

    const row = sel.closest(".meeting-row");
    const title = row.dataset.title;
    const host = row.dataset.host;
    const fee = row.dataset.fee;
    const time = row.dataset.time;

    const target = document.querySelector("[data-qr-title]");
    if (target) target.textContent = title;
    document.querySelector("[data-qr-host]") &&
      (document.querySelector("[data-qr-host]").textContent = host);
    document.querySelector("[data-qr-fee]") &&
      (document.querySelector("[data-qr-fee]").textContent = fee);
    document.querySelector("[data-qr-time]") &&
      (document.querySelector("[data-qr-time]").textContent = time);

    localStorage.setItem("beam.selectedMeeting", JSON.stringify({ title, host, fee, time }));

    if (listView) listView.style.display = "none";
    if (qrView) qrView.style.display = "";

    // simulate wallet confirming after a few seconds
    window._beamTimer = setTimeout(joinCall, 8000);
  });

  function joinCall() {
    window.location.href = "in-call.html";
  }

  const cancelQr = document.querySelector("[data-cancel-qr]");
  if (cancelQr) {
    cancelQr.addEventListener("click", () => {
      clearTimeout(window._beamTimer);
      if (qrView) qrView.style.display = "none";
      if (listView) listView.style.display = "";
    });
  }
  const confirmQr = document.querySelector("[data-qr-confirm]");
  if (confirmQr) {
    confirmQr.addEventListener("click", () => {
      clearTimeout(window._beamTimer);
      joinCall();
    });
  }

  /* ---------- In-call view ---------- */
  const meetingTitle = document.querySelector("[data-call-title]");
  if (meetingTitle) {
    try {
      const m = JSON.parse(localStorage.getItem("beam.selectedMeeting") || "{}");
      if (m.title) meetingTitle.textContent = m.title;
      const hostEl = document.querySelector("[data-call-host]");
      if (hostEl && m.host) hostEl.textContent = "Hosted by " + m.host;
    } catch {}
  }

  // mute / camera / share toggles
  document.querySelectorAll(".ctl[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("is-off");
      const which = btn.getAttribute("data-toggle");
      if (which === "mic") {
        const tile = document.querySelector(".video-tile.me .muted-ic");
        if (tile) tile.style.display = btn.classList.contains("is-off") ? "" : "none";
      }
      if (which === "cam") {
        const tile = document.querySelector(".video-tile.me");
        if (!tile) return;
        const initials = tile.querySelector(".initials");
        if (btn.classList.contains("is-off")) {
          tile.style.background = "#0a0a0a";
          if (initials) initials.style.display = "";
        } else {
          tile.style.background = "";
          if (initials) initials.style.display = "";
        }
      }
    });
  });

  // leave button
  const leaveBtn = document.querySelector("[data-leave]");
  if (leaveBtn) {
    leaveBtn.addEventListener("click", () => {
      if (confirm("Leave the meeting?")) window.location.href = "index.html";
    });
  }

  // tabs in side panel
  document.querySelectorAll(".call-side .tabs button").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.parentElement.querySelectorAll("button").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const which = btn.getAttribute("data-tab");
      document.querySelectorAll("[data-panel]").forEach((p) => {
        p.style.display = p.getAttribute("data-panel") === which ? "" : "none";
      });
    });
  });

  // call clock
  const clockEl = document.querySelector("[data-call-clock]");
  if (clockEl) {
    let seconds = 0;
    setInterval(() => {
      seconds++;
      const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
      const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
      const s = String(seconds % 60).padStart(2, "0");
      clockEl.textContent = `${h}:${m}:${s}`;
    }, 1000);
  }
})();
