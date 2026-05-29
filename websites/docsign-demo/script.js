/* ============================================================
   Sigil — document signing flow
   States in the sign stage: empty → uploaded → qr → signed
   ============================================================ */

(function () {
  const stage = document.querySelector("[data-stage]");
  if (!stage) return;

  const empty = stage.querySelector("[data-state='empty']");
  const uploaded = stage.querySelector("[data-state='uploaded']");
  const qr = stage.querySelector("[data-state='qr']");
  const signed = stage.querySelector("[data-state='signed']");
  const input = stage.querySelector("input[type='file']");

  function show(name) {
    [empty, uploaded, qr, signed].forEach((el) => {
      if (!el) return;
      el.style.display = el.dataset.state === name ? "" : "none";
    });
  }

  function bytesToHuman(n) {
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
    return (n / 1024 / 1024).toFixed(2) + " MB";
  }

  function handleFile(file) {
    if (!file) return;
    const ext = (file.name.split(".").pop() || "").toUpperCase();
    uploaded.querySelector("[data-file-name]").textContent = file.name;
    uploaded.querySelector("[data-file-meta]").textContent =
      `${bytesToHuman(file.size)} · uploaded just now`;
    const extLabel = uploaded.querySelector("[data-file-ext]");
    if (extLabel) extLabel.textContent = ext.slice(0, 4) || "FILE";
    show("uploaded");
  }

  /* ---------- Drag & drop + file picker ---------- */
  const drop = stage.querySelector(".dropzone");
  if (drop) {
    drop.addEventListener("click", () => input && input.click());
    drop.addEventListener("dragover", (e) => {
      e.preventDefault();
      drop.classList.add("is-hover");
    });
    drop.addEventListener("dragleave", () => drop.classList.remove("is-hover"));
    drop.addEventListener("drop", (e) => {
      e.preventDefault();
      drop.classList.remove("is-hover");
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      handleFile(file);
    });
  }
  if (input) {
    input.addEventListener("change", (e) => handleFile(e.target.files[0]));
  }

  /* ---------- State transitions ---------- */
  document.addEventListener("click", (e) => {
    if (e.target.matches("[data-action='proceed']")) {
      show("qr");
      window._sigilTimer = setTimeout(finalize, 8000);
    }
    if (e.target.matches("[data-action='change-file']")) {
      if (input) input.value = "";
      show("empty");
    }
    if (e.target.matches("[data-action='confirm-signed']")) {
      clearTimeout(window._sigilTimer);
      finalize();
    }
    if (e.target.matches("[data-action='start-over']")) {
      if (input) input.value = "";
      show("empty");
    }
  });

  function finalize() {
    const fileName = uploaded.querySelector("[data-file-name]")?.textContent || "Document";
    const txid = "0x" + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 14);
    const sigHash = "sha256:" + Math.random().toString(16).slice(2, 18) + Math.random().toString(16).slice(2, 18);

    signed.querySelector("[data-signed-name]").textContent = fileName;
    signed.querySelector("[data-signed-tx]").textContent = txid;
    signed.querySelector("[data-signed-hash]").textContent = sigHash;
    signed.querySelector("[data-signed-time]").textContent = new Date().toLocaleString();
    show("signed");
  }

  /* ---------- Saved-page filter chips ---------- */
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".filter-chip");
    if (!chip || !chip.parentElement.classList.contains("filter-bar")) return;
    chip.parentElement.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");

    const filter = chip.getAttribute("data-filter");
    document.querySelectorAll("[data-doc-status]").forEach((card) => {
      const status = card.getAttribute("data-doc-status");
      card.style.display = !filter || filter === "all" || filter === status ? "" : "none";
    });
  });

  /* ---------- Init ---------- */
  show("empty");
})();
