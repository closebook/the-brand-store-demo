// admin.js (unchanged)
(function () {
  const KEYS = {
    products: "tbs_products",
    categories: "tbs_categories",
    users: "tbs_users",
    orders: "tbs_orders",
    coupons: "tbs_coupons",
    marketing: "tbs_marketing",
    adminSession: "tbs_admin_logged_in"
  };

  const ADMIN_PASSWORD = "demo_pass";
  const BRANDS = ["CK", "Armani Exchange", "Lacoste", "Rare Rabbit", "Maserati"];
  const DEFAULT_CATEGORIES = ["T-Shirts", "Polo Shirts", "Shirts", "Perfumes", "Watches", "Accessories"];

  const $ = (id) => document.getElementById(id);
  const read = (k, f) => { try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : f; } catch (_) { return f; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1800);
  }

  const getProducts = () => read(KEYS.products, []);
  const setProducts = (v) => write(KEYS.products, v);
  const getCategories = () => read(KEYS.categories, DEFAULT_CATEGORIES);
  const setCategories = (v) => write(KEYS.categories, v);
  const getUsers = () => read(KEYS.users, []);
  const setUsers = (v) => write(KEYS.users, v);
  const getOrders = () => read(KEYS.orders, []);
  const setOrders = (v) => write(KEYS.orders, v);
  const getCoupons = () => read(KEYS.coupons, []);
  const setCoupons = (v) => write(KEYS.coupons, v);
  const getMarketing = () => read(KEYS.marketing, { sale: { active: false, extraDiscountPercent: 0, label: "" }, banners: [] });
  const setMarketing = (v) => write(KEYS.marketing, v);

  function finalPrice(product) {
    const m = getMarketing();
    const sale = m.sale.active ? Number(m.sale.extraDiscountPercent || 0) : 0;
    const discount = Math.min(80, Number(product.discount || 0) + sale);
    return Math.round(product.price * (1 - discount / 100));
  }

  function loggedIn() { return read(KEYS.adminSession, false) === true; }
  function setLoggedIn(v) { write(KEYS.adminSession, v); }

  function ensureData() {
    if (!read(KEYS.categories, null)) setCategories(DEFAULT_CATEGORIES);
    if (!read(KEYS.coupons, null)) setCoupons([{ id: "c1", code: "WELCOME10", type: "percent", value: 10, minOrder: 1500, active: true, expiresAt: "" }]);
    if (!read(KEYS.marketing, null)) setMarketing({ sale: { active: false, extraDiscountPercent: 0, label: "" }, banners: [] });
    if (!read(KEYS.users, null)) setUsers([]);
    if (!read(KEYS.orders, null)) setOrders([]);
  }

  function renderAuth() {
    const ok = loggedIn();
    $("loginCard").classList.toggle("hidden", ok);
    $("dashboard").classList.toggle("hidden", !ok);
    if (ok) renderAll();
  }

  function fillSelects() {
    $("brand").innerHTML = BRANDS.map((b) => `<option value='${b}'>${b}</option>`).join("");
    $("category").innerHTML = getCategories().map((c) => `<option value='${c}'>${c}</option>`).join("");
  }

  function renderCategories() {
    $("categoryList").innerHTML = getCategories().map((c) => `<span class='brand-chip'>${c} <button class='btn btn-danger' style='padding:0.15rem 0.45rem;' data-remove-category='${c}'>x</button></span>`).join("");
    fillSelects();
  }

  function renderProducts() {
    $("adminProductRows").innerHTML = getProducts().map((p) => `
      <tr>
        <td><img src='${p.images[0]}' alt='${p.name}' style='width:60px;height:60px;object-fit:cover;border-radius:8px;' /></td>
        <td>${p.name}</td><td>${p.category}</td><td>${p.brand}</td><td>${money(p.price)}</td><td>${p.discount || 0}%</td><td>${money(finalPrice(p))}</td>
        <td><div class='admin-actions'><button class='btn btn-outline' data-edit-id='${p.id}'>Edit</button><button class='btn btn-danger' data-delete-id='${p.id}'>Delete</button></div></td>
      </tr>
    `).join("");
  }

  function analyticsData() {
    const orders = getOrders();
    const products = getProducts();
    const revenue = orders.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + Number(o.total || 0), 0);
    const orderCount = orders.length;
    const users = getUsers();
    const visitors = users.reduce((s, u) => s + Number(u.visits || 1), 0) || 1;
    const conversion = ((orderCount / visitors) * 100).toFixed(1);

    const sold = {};
    orders.forEach((o) => (o.items || []).forEach((i) => { sold[i.productId] = (sold[i.productId] || 0) + Number(i.qty || 0); }));
    const top = Object.entries(sold).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([pid, qty]) => {
      const p = products.find((x) => x.id === pid);
      return `${p ? p.name : pid} (${qty})`;
    }).join(", ") || "No sales yet";

    const byDay = {};
    orders.forEach((o) => {
      const d = new Date(o.createdAt || Date.now()).toLocaleDateString("en-CA");
      byDay[d] = (byDay[d] || 0) + Number(o.total || 0);
    });
    const labels = Object.keys(byDay).sort().slice(-7);
    const values = labels.map((k) => byDay[k]);

    return { revenue, orderCount, conversion, top, labels, values };
  }

  function drawChart(labels, values) {
    const c = $("salesChart");
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    const pad = 40;
    const w = c.width - pad * 2;
    const h = c.height - pad * 2;
    const max = Math.max(1, ...values, 1000);

    ctx.strokeStyle = "#444";
    ctx.strokeRect(pad, pad, w, h);

    if (!labels.length) {
      ctx.fillStyle = "#aaa";
      ctx.fillText("No order data yet", pad + 10, pad + 20);
      return;
    }

    const barW = w / labels.length - 12;
    values.forEach((v, i) => {
      const x = pad + i * (barW + 12) + 6;
      const bh = Math.max(3, (v / max) * (h - 20));
      const y = pad + h - bh;
      ctx.fillStyle = "#d4af37";
      ctx.fillRect(x, y, barW, bh);
      ctx.fillStyle = "#ddd";
      ctx.font = "12px Manrope";
      ctx.fillText(labels[i].slice(5), x, pad + h + 14);
    });
  }

  function renderAnalytics() {
    const a = analyticsData();
    $("statsGrid").innerHTML = `
      <div class='stat-card'><h4>Total Revenue</h4><p>${money(a.revenue)}</p></div>
      <div class='stat-card'><h4>Total Orders</h4><p>${a.orderCount}</p></div>
      <div class='stat-card'><h4>Conversion Rate</h4><p>${a.conversion}%</p></div>
      <div class='stat-card'><h4>Most Sold</h4><p>${a.top}</p></div>
    `;
    drawChart(a.labels, a.values);
  }

  function renderOrders() {
    $("orderRows").innerHTML = getOrders().map((o) => `
      <tr>
        <td>${o.id}</td><td>${o.userName}</td><td>${(o.items || []).reduce((s, i) => s + Number(i.qty || 0), 0)}</td><td>${money(o.total)}</td>
        <td><span class='pill'>${o.refunded ? "Refunded" : o.status}</span></td>
        <td>${new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
        <td>
          <div class='admin-actions'>
            <button class='btn btn-outline' data-order-status='${o.id}' data-status='Processing'>Processing</button>
            <button class='btn btn-outline' data-order-status='${o.id}' data-status='Delivered'>Delivered</button>
            <button class='btn btn-danger' data-order-status='${o.id}' data-status='Cancelled'>Cancel</button>
            <button class='btn btn-danger' data-order-refund='${o.id}'>Refund</button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  function renderUsers() {
    $("userRows").innerHTML = getUsers().map((u) => `
      <tr>
        <td>${u.name}</td><td>${u.email}</td><td>${u.phone || "-"}</td><td>${u.visits || 1}</td>
        <td><span class='pill'>${u.blocked ? "Blocked" : "Active"}</span></td>
        <td><button class='btn ${u.blocked ? "btn-outline" : "btn-danger"}' data-toggle-user='${u.id}'>${u.blocked ? "Unblock" : "Block"}</button></td>
      </tr>
    `).join("");
  }

  function renderCoupons() {
    $("couponRows").innerHTML = getCoupons().map((c) => `
      <tr>
        <td>${c.code}</td><td>${c.type === "percent" ? `${c.value}%` : money(c.value)} | Min ${money(c.minOrder || 0)}</td>
        <td><span class='pill'>${c.active ? "Active" : "Inactive"}</span></td>
        <td><div class='admin-actions'><button class='btn btn-outline' data-toggle-coupon='${c.id}'>${c.active ? "Deactivate" : "Activate"}</button><button class='btn btn-danger' data-delete-coupon='${c.id}'>Delete</button></div></td>
      </tr>
    `).join("");
  }

  function renderMarketing() {
    const m = getMarketing();
    $("saleActive").checked = !!m.sale.active;
    $("salePercent").value = Number(m.sale.extraDiscountPercent || 0);
    $("saleLabel").value = m.sale.label || "";
    $("bannerList").innerHTML = (m.banners || []).map((b) => `
      <article class='banner-card' style="background-image:linear-gradient(120deg, rgba(0,0,0,.75), rgba(0,0,0,.35)),url('${b.image}');">
        <h3>${b.title}</h3><p>${b.subtitle}</p>
        <div class='admin-actions'><button class='btn btn-outline' data-edit-banner='${b.id}'>Edit</button><button class='btn btn-danger' data-delete-banner='${b.id}'>Delete</button></div>
      </article>
    `).join("");
  }

  function renderAll() {
    fillSelects();
    renderCategories();
    renderProducts();
    renderAnalytics();
    renderOrders();
    renderUsers();
    renderCoupons();
    renderMarketing();
  }

  function toDataURL(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  async function saveProduct(e) {
    e.preventDefault();
    const id = $("productId").value || `p${Date.now()}`;
    const imgFile = $("imageFile").files[0];
    let image = $("imageUrl").value.trim();
    if (imgFile) image = await toDataURL(imgFile);
    if (!image) image = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80";

    const payload = {
      id,
      name: $("name").value.trim(),
      category: $("category").value,
      brand: $("brand").value,
      price: Number($("price").value),
      discount: Math.min(90, Math.max(0, Number($("discount").value || 0))),
      description: $("description").value.trim(),
      images: [image],
      featured: $("featured").checked
    };

    const products = getProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx >= 0) products[idx] = payload; else products.push(payload);
    setProducts(products);
    $("productForm").reset();
    $("productId").value = "";
    renderAll();
    showToast(idx >= 0 ? "Product updated" : "Product added");
  }

  function bindEvents() {
    $("loginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      if ($("adminPassword").value === ADMIN_PASSWORD) { setLoggedIn(true); renderAuth(); showToast("Login successful"); }
      else showToast("Invalid password");
    });

    $("logoutBtn").addEventListener("click", () => { setLoggedIn(false); renderAuth(); showToast("Logged out"); });
    $("productForm").addEventListener("submit", saveProduct);
    $("clearForm").addEventListener("click", () => { $("productForm").reset(); $("productId").value = ""; });

    $("categoryForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = $("newCategory").value.trim();
      if (!v) return;
      const cats = getCategories();
      if (cats.includes(v)) return showToast("Category already exists");
      cats.push(v); setCategories(cats); $("newCategory").value = ""; renderAll(); showToast("Category added");
    });

    $("couponForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const code = $("couponCode").value.trim().toUpperCase();
      const list = getCoupons();
      if (list.some((c) => c.code === code)) return showToast("Coupon already exists");
      list.push({ id: `cp${Date.now()}`, code, type: $("couponType").value, value: Number($("couponValue").value), minOrder: Number($("couponMinOrder").value || 0), active: true, expiresAt: $("couponExpiry").value || "" });
      setCoupons(list); $("couponForm").reset(); renderCoupons(); showToast("Coupon created");
    });

    $("saleForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const m = getMarketing();
      m.sale.active = $("saleActive").checked;
      m.sale.extraDiscountPercent = Number($("salePercent").value || 0);
      m.sale.label = $("saleLabel").value.trim();
      setMarketing(m);
      renderAll();
      showToast("Sale settings updated");
    });

    $("bannerForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const m = getMarketing();
      const id = $("bannerId").value || `b${Date.now()}`;
      const payload = { id, title: $("bannerTitle").value.trim(), subtitle: $("bannerSubtitle").value.trim(), ctaLabel: $("bannerCta").value.trim(), ctaTarget: $("bannerTarget").value.trim(), image: $("bannerImage").value.trim() };
      const idx = (m.banners || []).findIndex((b) => b.id === id);
      if (idx >= 0) m.banners[idx] = payload; else m.banners = [...(m.banners || []), payload];
      setMarketing(m);
      $("bannerForm").reset(); $("bannerId").value = ""; renderMarketing(); showToast("Banner saved");
    });

    $("clearBannerForm").addEventListener("click", () => { $("bannerForm").reset(); $("bannerId").value = ""; });

    document.addEventListener("click", (e) => {
      const edit = e.target.closest("[data-edit-id]");
      if (edit) {
        const p = getProducts().find((x) => x.id === edit.dataset.editId);
        if (!p) return;
        $("productId").value = p.id; $("name").value = p.name; $("category").value = p.category; $("brand").value = p.brand; $("price").value = p.price;
        $("discount").value = p.discount || 0; $("description").value = p.description; $("imageUrl").value = p.images[0] || ""; $("featured").checked = !!p.featured;
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      const del = e.target.closest("[data-delete-id]");
      if (del) { setProducts(getProducts().filter((p) => p.id !== del.dataset.deleteId)); renderAll(); showToast("Product deleted"); }

      const rc = e.target.closest("[data-remove-category]");
      if (rc) {
        const cat = rc.dataset.removeCategory;
        const cats = getCategories();
        if (cats.length <= 1) return showToast("At least one category required");
        if (getProducts().some((p) => p.category === cat)) return showToast("Category used by products");
        setCategories(cats.filter((c) => c !== cat)); renderAll(); showToast("Category removed");
      }

      const os = e.target.closest("[data-order-status]");
      if (os) {
        const orders = getOrders();
        const o = orders.find((x) => x.id === os.dataset.orderStatus);
        if (!o) return;
        o.status = os.dataset.status;
        setOrders(orders); renderOrders(); renderAnalytics(); showToast("Order status updated");
      }

      const ref = e.target.closest("[data-order-refund]");
      if (ref) {
        const orders = getOrders();
        const o = orders.find((x) => x.id === ref.dataset.orderRefund);
        if (!o) return;
        o.refunded = true; o.status = "Refunded";
        setOrders(orders); renderOrders(); renderAnalytics(); showToast("Refund simulated");
      }

      const tu = e.target.closest("[data-toggle-user]");
      if (tu) {
        const users = getUsers();
        const u = users.find((x) => x.id === tu.dataset.toggleUser);
        if (!u) return;
        u.blocked = !u.blocked; setUsers(users); renderUsers(); showToast(u.blocked ? "User blocked" : "User unblocked");
      }

      const tc = e.target.closest("[data-toggle-coupon]");
      if (tc) {
        const cs = getCoupons(); const c = cs.find((x) => x.id === tc.dataset.toggleCoupon); if (!c) return;
        c.active = !c.active; setCoupons(cs); renderCoupons(); showToast("Coupon updated");
      }

      const dc = e.target.closest("[data-delete-coupon]");
      if (dc) { setCoupons(getCoupons().filter((c) => c.id !== dc.dataset.deleteCoupon)); renderCoupons(); showToast("Coupon deleted"); }

      const eb = e.target.closest("[data-edit-banner]");
      if (eb) {
        const b = (getMarketing().banners || []).find((x) => x.id === eb.dataset.editBanner);
        if (!b) return;
        $("bannerId").value = b.id; $("bannerTitle").value = b.title; $("bannerSubtitle").value = b.subtitle; $("bannerCta").value = b.ctaLabel; $("bannerTarget").value = b.ctaTarget; $("bannerImage").value = b.image;
      }

      const db = e.target.closest("[data-delete-banner]");
      if (db) {
        const m = getMarketing();
        m.banners = (m.banners || []).filter((b) => b.id !== db.dataset.deleteBanner);
        setMarketing(m); renderMarketing(); showToast("Banner deleted");
      }
    });

    window.addEventListener("storage", renderAll);
  }

  function init() {
    ensureData();
    bindEvents();
    renderAuth();
  }

  init();
})();