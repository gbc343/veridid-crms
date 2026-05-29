/* ============================================================
   Stride — shared interactive logic
   - cart in localStorage
   - segment / filter switching
   - color & size selection
   - QR modal flow + simulated payment confirmation
   ============================================================ */

(function () {
  const CART_KEY = "stride.cart";

  function readCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  }
  function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateCartBadge();
  }
  function updateCartBadge() {
    const el = document.querySelector("[data-cart-count]");
    if (!el) return;
    const total = readCart().reduce((s, i) => s + i.qty, 0);
    el.textContent = total;
    el.style.display = total > 0 ? "flex" : "none";
  }

  function addToCart(item) {
    const cart = readCart();
    const key = `${item.id}|${item.color || ""}|${item.size || ""}`;
    const existing = cart.find(
      (i) => `${i.id}|${i.color || ""}|${i.size || ""}` === key
    );
    if (existing) existing.qty += item.qty || 1;
    else cart.push({ ...item, qty: item.qty || 1 });
    writeCart(cart);
  }

  function removeFromCart(idx) {
    const cart = readCart();
    cart.splice(idx, 1);
    writeCart(cart);
  }

  function setQty(idx, qty) {
    const cart = readCart();
    if (qty <= 0) cart.splice(idx, 1);
    else cart[idx].qty = qty;
    writeCart(cart);
  }

  // expose
  window.Stride = { readCart, writeCart, addToCart, removeFromCart, setQty, updateCartBadge };

  /* ----------  Segment switcher (Men / Women on home) ---------- */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-segment]");
    if (!btn) return;
    const group = btn.closest(".segment");
    group.querySelectorAll("button").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    const target = btn.getAttribute("data-segment");
    document.querySelectorAll("[data-segment-panel]").forEach((p) => {
      p.style.display = p.getAttribute("data-segment-panel") === target ? "" : "none";
    });
  });

  /* ----------  Color & size selectors on detail page ---------- */
  document.addEventListener("click", (e) => {
    const sw = e.target.closest(".color-swatch");
    if (sw) {
      sw.parentElement.querySelectorAll(".color-swatch").forEach((s) => s.classList.remove("is-active"));
      sw.classList.add("is-active");
      const label = document.querySelector("[data-color-label]");
      if (label) label.textContent = sw.getAttribute("data-color-name") || "";
    }
    const sz = e.target.closest(".size-pill");
    if (sz) {
      sz.parentElement.querySelectorAll(".size-pill").forEach((s) => s.classList.remove("is-active"));
      sz.classList.add("is-active");
    }
    const th = e.target.closest(".detail-thumbs button");
    if (th) {
      th.parentElement.querySelectorAll("button").forEach((b) => b.classList.remove("is-active"));
      th.classList.add("is-active");
      const url = th.getAttribute("data-image");
      const main = document.querySelector(".detail-main-image");
      if (main && url) main.style.backgroundImage = `url(${url})`;
    }
  });

  /* ----------  Add-to-cart from detail page ---------- */
  const addBtn = document.querySelector("[data-add-to-cart]");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const card = document.querySelector("[data-product]");
      const color = document.querySelector(".color-swatch.is-active");
      const size = document.querySelector(".size-pill.is-active");
      addToCart({
        id: card.dataset.id,
        name: card.dataset.name,
        price: parseFloat(card.dataset.price),
        image: card.dataset.image,
        color: color ? color.getAttribute("data-color-name") : "",
        size: size ? size.textContent.trim() : "",
        qty: 1,
      });
      addBtn.textContent = "Added to bag ✓";
      addBtn.classList.add("added");
      setTimeout(() => {
        addBtn.textContent = "Add to Shopping Bag";
        addBtn.classList.remove("added");
      }, 1600);
    });
  }

  /* ----------  Cart page rendering ---------- */
  function renderCart() {
    const list = document.querySelector("[data-cart-list]");
    if (!list) return;
    const cart = readCart();

    if (cart.length === 0) {
      list.innerHTML = `
        <div style="padding:60px 20px;text-align:center;color:var(--ink-soft);">
          <h3 style="font-size:20px;color:var(--ink);margin:0 0 8px;">Your bag is empty</h3>
          <p style="margin:0 0 18px;">Add some gear to get started.</p>
          <a class="btn btn-dark" href="women.html">Shop Women</a>
          <a class="btn btn-primary" href="men.html" style="margin-left:8px;">Shop Men</a>
        </div>`;
      updateTotals(0);
      return;
    }

    list.innerHTML = cart
      .map(
        (i, idx) => `
        <div class="cart-row">
          <div class="cart-thumb" style="background-image:url('${i.image}')"></div>
          <div class="cart-info">
            <h3>${i.name}</h3>
            <div class="variant">${[i.color, i.size].filter(Boolean).join(" • ")}</div>
            <div class="qty-stepper">
              <button data-qty-dec="${idx}">−</button>
              <span>${i.qty}</span>
              <button data-qty-inc="${idx}">+</button>
            </div>
          </div>
          <div class="cart-line-price">
            $${(i.price * i.qty).toFixed(2)}
            <button class="remove" data-remove="${idx}">Remove</button>
          </div>
        </div>`
      )
      .join("");

    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    updateTotals(subtotal);
  }

  function updateTotals(subtotal) {
    const tax = subtotal * 0.08;
    const shipping = subtotal > 0 ? 0 : 0; // free
    const total = subtotal + tax + shipping;

    const set = (sel, val) => {
      const el = document.querySelector(sel);
      if (el) el.textContent = "$" + val.toFixed(2);
    };
    set("[data-subtotal]", subtotal);
    set("[data-tax]", tax);
    set("[data-total]", total);

    const qrAmt = document.querySelector("[data-qr-amount]");
    if (qrAmt) qrAmt.textContent = total.toFixed(2);
  }

  document.addEventListener("click", (e) => {
    const inc = e.target.closest("[data-qty-inc]");
    const dec = e.target.closest("[data-qty-dec]");
    const rm = e.target.closest("[data-remove]");
    const cart = readCart();
    if (inc) { setQty(+inc.dataset.qtyInc, cart[+inc.dataset.qtyInc].qty + 1); renderCart(); }
    if (dec) { setQty(+dec.dataset.qtyDec, cart[+dec.dataset.qtyDec].qty - 1); renderCart(); }
    if (rm) { removeFromCart(+rm.dataset.remove); renderCart(); }
  });

  /* ----------  Coin selector on checkout ---------- */
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".coin-chip");
    if (!chip) return;
    chip.parentElement.querySelectorAll(".coin-chip").forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    const label = document.querySelector("[data-coin-label]");
    if (label) label.textContent = chip.getAttribute("data-coin");
  });

  /* ----------  QR overlay ---------- */
  const overlay = document.querySelector("[data-qr-overlay]");
  const openBtn = document.querySelector("[data-pay-btn]");
  const closeBtn = document.querySelector("[data-qr-close]");

  function openQr() {
    if (readCart().length === 0) return;
    overlay.classList.add("is-open");
    // simulate detection of an on-chain payment after a few seconds
    window._strideQrTimer = setTimeout(() => {
      localStorage.setItem("stride.lastReceipt", JSON.stringify({
        ts: Date.now(),
        txid: "0x" + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10),
        items: readCart(),
      }));
      writeCart([]);
      window.location.href = "success.html";
    }, 8000);
  }
  function closeQr() {
    overlay.classList.remove("is-open");
    clearTimeout(window._strideQrTimer);
  }

  if (openBtn) openBtn.addEventListener("click", openQr);
  if (closeBtn) closeBtn.addEventListener("click", closeQr);
  if (overlay) overlay.addEventListener("click", (e) => { if (e.target === overlay) closeQr(); });

  const confirmLink = document.querySelector("[data-qr-confirm]");
  if (confirmLink) confirmLink.addEventListener("click", () => {
    clearTimeout(window._strideQrTimer);
    localStorage.setItem("stride.lastReceipt", JSON.stringify({
      ts: Date.now(),
      txid: "0x" + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10),
      items: readCart(),
    }));
    writeCart([]);
    window.location.href = "success.html";
  });

  /* ----------  Success page ---------- */
  const receiptEl = document.querySelector("[data-receipt]");
  if (receiptEl) {
    try {
      const r = JSON.parse(localStorage.getItem("stride.lastReceipt") || "{}");
      if (r.txid) receiptEl.textContent = "Tx " + r.txid;
    } catch {}
  }

  /* ----------  Init ---------- */
  updateCartBadge();
  renderCart();
})();
