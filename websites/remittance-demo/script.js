/* ============================================================
   Drift — remittance demo
   - account picker
   - amount field updates a live "you receive" preview
   - business / personal toggle
   - QR modal with simulated on-chain settlement
   ============================================================ */

(function () {
  /* ---------- Demo FX rates (USD pivot) ---------- */
  const RATES = {
    USD: 1, EUR: 0.92, GBP: 0.79, MXN: 17.10,
    NGN: 1580, INR: 83.4, BRL: 5.05, PHP: 56.7,
    JPY: 154.2, KES: 132.5, COP: 4150, CAD: 1.36,
  };

  function fx(amount, from, to) {
    if (!RATES[from] || !RATES[to]) return amount;
    const usd = amount / RATES[from];
    return usd * RATES[to];
  }
  function fmt(n, code) {
    const opts = { maximumFractionDigits: code === "JPY" || code === "COP" ? 0 : 2 };
    return n.toLocaleString("en-US", opts);
  }

  /* ---------- Generic active-pick toggler ---------- */
  document.addEventListener("click", (e) => {
    const acc = e.target.closest(".account-pick");
    if (acc) {
      acc.parentElement.querySelectorAll(".account-pick").forEach((b) => b.classList.remove("is-active"));
      acc.classList.add("is-active");
      const from = acc.getAttribute("data-currency");
      const sel = document.querySelector("[data-from-currency]");
      if (sel) sel.value = from;
      recompute();
    }
    const tg = e.target.closest(".toggle-group button");
    if (tg) {
      tg.parentElement.querySelectorAll("button").forEach((b) => b.classList.remove("is-active"));
      tg.classList.add("is-active");
      const sel = document.querySelector("[data-purpose-kind]");
      if (sel) sel.value = tg.getAttribute("data-kind");
    }
  });

  /* ---------- Live amount/route recompute ---------- */
  function recompute() {
    const amountInput = document.querySelector("[data-send-amount]");
    const fromSel = document.querySelector("[data-from-currency]");
    const toSel = document.querySelector("[data-to-currency]");
    if (!amountInput || !fromSel || !toSel) return;

    const amt = parseFloat(amountInput.value) || 0;
    const from = fromSel.value;
    const to = toSel.value;

    const received = fx(amt, from, to);
    const set = (sel, v) => { const el = document.querySelector(sel); if (el) el.textContent = v; };

    set("[data-receive-amount]", fmt(received, to));
    set("[data-receive-code]", to);
    set("[data-send-code]", from);
    set("[data-send-display]", fmt(amt, from));
    set("[data-rate-display]", `1 ${from} = ${fmt(fx(1, from, to), to)} ${to}`);

    // fee: flat 0.10% in source currency
    const fee = amt * 0.001;
    const totalCharge = amt + fee;
    set("[data-fee]", fmt(fee, from) + " " + from);
    set("[data-total]", fmt(totalCharge, from) + " " + from);
    set("[data-qr-amount]", fmt(totalCharge, from) + " " + from);
    set("[data-qr-receive]", fmt(received, to) + " " + to);
  }

  document.addEventListener("input", (e) => {
    if (e.target.matches("[data-send-amount], [data-from-currency], [data-to-currency]")) {
      recompute();
    }
  });
  document.addEventListener("change", (e) => {
    if (e.target.matches("[data-from-currency], [data-to-currency]")) recompute();
  });

  /* ---------- QR overlay ---------- */
  const overlay = document.querySelector("[data-qr-overlay]");
  const openBtn = document.querySelector("[data-pay-btn]");
  const closeBtn = document.querySelector("[data-qr-close]");

  function openQr(e) {
    if (e) e.preventDefault();
    overlay.classList.add("is-open");
    // simulate wallet confirming on-chain payment after a few seconds
    window._qrTimer = setTimeout(finishTx, 8000);
  }
  function closeQr() {
    overlay.classList.remove("is-open");
    clearTimeout(window._qrTimer);
  }
  function finishTx() {
    const from = document.querySelector("[data-from-currency]")?.value || "USD";
    const to = document.querySelector("[data-to-currency]")?.value || "EUR";
    const amt = parseFloat(document.querySelector("[data-send-amount]")?.value || "0");
    const recipient = document.querySelector("[data-recipient]")?.value || "Recipient";
    const kind = document.querySelector("[data-purpose-kind]")?.value || "personal";
    const purpose = document.querySelector("[data-purpose-text]")?.value || "";

    const receipt = {
      ts: Date.now(),
      txid: "0x" + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 14),
      from, to, amount: amt,
      received: fx(amt, from, to),
      recipient, kind, purpose,
    };
    localStorage.setItem("drift.lastTx", JSON.stringify(receipt));
    window.location.href = "success.html";
  }

  if (openBtn) openBtn.addEventListener("click", openQr);
  if (closeBtn) closeBtn.addEventListener("click", closeQr);
  if (overlay) overlay.addEventListener("click", (e) => { if (e.target === overlay) closeQr(); });

  const confirmLink = document.querySelector("[data-qr-confirm]");
  if (confirmLink) confirmLink.addEventListener("click", () => {
    clearTimeout(window._qrTimer);
    finishTx();
  });

  /* ---------- Success page ---------- */
  const successMeta = document.querySelector("[data-success-meta]");
  if (successMeta) {
    try {
      const r = JSON.parse(localStorage.getItem("drift.lastTx") || "{}");
      if (r.txid) {
        const dt = new Date(r.ts);
        successMeta.querySelector("[data-meta-tx]").textContent = r.txid;
        successMeta.querySelector("[data-meta-recipient]").textContent = r.recipient || "—";
        successMeta.querySelector("[data-meta-sent]").textContent = `${fmt(r.amount, r.from)} ${r.from}`;
        successMeta.querySelector("[data-meta-received]").textContent = `${fmt(r.received, r.to)} ${r.to}`;
        successMeta.querySelector("[data-meta-kind]").textContent = r.kind === "business" ? "Business" : "Personal";
        successMeta.querySelector("[data-meta-time]").textContent = dt.toLocaleString();
      }
    } catch {}
  }

  /* ---------- Init ---------- */
  recompute();
})();
