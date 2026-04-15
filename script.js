// script.js - updated to handle category links in footer
(function () {
  const KEYS = {
    products: "tbs_products",
    categories: "tbs_categories",
    users: "tbs_users",
    userSession: "tbs_user_session",
    carts: "tbs_carts_by_user",
    wishlists: "tbs_wishlists_by_user",
    reviews: "tbs_reviews",
    coupons: "tbs_coupons",
    appliedCoupon: "tbs_applied_coupon",
    orders: "tbs_orders",
    marketing: "tbs_marketing"
  };

  const BRANDS = ["CK", "Armani Exchange", "Lacoste", "Rare Rabbit", "Maserati"];
  const DEFAULT_CATEGORIES = ["T-Shirts", "Polo Shirts", "Shirts", "Perfumes", "Watches", "Accessories"];
  const DEFAULT_PRODUCTS = [
    { id: "p1", name: "CK Signature Tee", category: "T-Shirts", brand: "CK", price: 1499, discount: 15, description: "Soft cotton T-shirt with a premium fit.", images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80"], featured: true },
    { id: "p2", name: "Armani Exchange Polo", category: "Polo Shirts", brand: "Armani Exchange", price: 2499, discount: 10, description: "Refined polo shirt for smart-casual style.", images: ["https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80"], featured: true },
    { id: "p3", name: "Lacoste White Shirt", category: "Shirts", brand: "Lacoste", price: 2899, discount: 20, description: "Crisp and breathable tailored shirt.", images: ["https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80"], featured: false },
    { id: "p4", name: "Rare Rabbit Noir Perfume", category: "Perfumes", brand: "Rare Rabbit", price: 3299, discount: 12, description: "Sophisticated fragrance with woody notes.", images: ["https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80"], featured: true },
    { id: "p5", name: "Maserati Chrono Watch", category: "Watches", brand: "Maserati", price: 5499, discount: 18, description: "Bold chronograph watch with luxury finish.", images: ["https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=800&q=80"], featured: true },
    { id: "p6", name: "CK Leather Wallet", category: "Accessories", brand: "CK", price: 1299, discount: 0, description: "Compact leather wallet with subtle branding.", images: ["https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80"], featured: false }
  ];

  const DEFAULT_MARKETING = {
    sale: { active: false, extraDiscountPercent: 0, label: "" },
    banners: [
      { id: "b1", title: "Luxury Summer Drop", subtitle: "Fresh arrivals from premium labels", ctaLabel: "Shop Now", ctaTarget: "shop", image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1000&q=80" },
      { id: "b2", title: "Signature Accessories", subtitle: "Watches, perfumes and statement picks", ctaLabel: "View Collection", ctaTarget: "shop", image: "https://images.unsplash.com/photo-1475180098004-ca77a66827be?auto=format&fit=crop&w=1000&q=80" }
    ]
  };

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

  function ensureSeedData() {
    if (!read(KEYS.products, null)) write(KEYS.products, DEFAULT_PRODUCTS);
    if (!read(KEYS.categories, null)) write(KEYS.categories, DEFAULT_CATEGORIES);
    if (!read(KEYS.users, null)) write(KEYS.users, []);
    if (!read(KEYS.carts, null)) write(KEYS.carts, {});
    if (!read(KEYS.wishlists, null)) write(KEYS.wishlists, {});
    if (!read(KEYS.reviews, null)) write(KEYS.reviews, []);
    if (!read(KEYS.orders, null)) write(KEYS.orders, []);
    if (!read(KEYS.coupons, null)) write(KEYS.coupons, [{ id: "c1", code: "WELCOME10", type: "percent", value: 10, minOrder: 1500, active: true, expiresAt: "" }]);
    if (!read(KEYS.marketing, null)) write(KEYS.marketing, DEFAULT_MARKETING);
  }

  const getProducts = () => read(KEYS.products, []);
  const getCategories = () => read(KEYS.categories, DEFAULT_CATEGORIES);
  const getUsers = () => read(KEYS.users, []);
  const setUsers = (v) => write(KEYS.users, v);
  const getReviews = () => read(KEYS.reviews, []);
  const setReviews = (v) => write(KEYS.reviews, v);
  const getCoupons = () => read(KEYS.coupons, []);
  const getOrders = () => read(KEYS.orders, []);
  const setOrders = (v) => write(KEYS.orders, v);
  const getMarketing = () => read(KEYS.marketing, DEFAULT_MARKETING);
  const getAppliedCoupon = () => read(KEYS.appliedCoupon, null);
  const setAppliedCoupon = (v) => v ? write(KEYS.appliedCoupon, v) : localStorage.removeItem(KEYS.appliedCoupon);

  function currentUserId() {
    const s = read(KEYS.userSession, null);
    return s ? s.userId : "guest";
  }

  function getCurrentUser() {
    const s = read(KEYS.userSession, null);
    if (!s) return null;
    return getUsers().find((u) => u.id === s.userId) || null;
  }

  function setSession(userId) { write(KEYS.userSession, { userId, at: new Date().toISOString() }); }
  function clearSession() { localStorage.removeItem(KEYS.userSession); localStorage.removeItem(KEYS.appliedCoupon); }

  function getCart() {
    const map = read(KEYS.carts, {});
    return map[currentUserId()] || [];
  }

  function setCart(cart) {
    const map = read(KEYS.carts, {});
    map[currentUserId()] = cart;
    write(KEYS.carts, map);
    updateCartCount();
  }

  function getWishlist() {
    const map = read(KEYS.wishlists, {});
    return map[currentUserId()] || [];
  }

  function setWishlist(list) {
    const map = read(KEYS.wishlists, {});
    map[currentUserId()] = list;
    write(KEYS.wishlists, map);
    updateWishlistCount();
  }

  function finalPrice(product) {
    const sale = getMarketing().sale;
    const extra = sale.active ? Number(sale.extraDiscountPercent || 0) : 0;
    const discount = Math.min(80, Number(product.discount || 0) + extra);
    return Math.round(product.price * (1 - discount / 100));
  }

  function ratingsMap() {
    return getReviews().reduce((acc, r) => {
      if (!acc[r.productId]) acc[r.productId] = { total: 0, count: 0 };
      acc[r.productId].total += Number(r.rating);
      acc[r.productId].count += 1;
      return acc;
    }, {});
  }

  function ratingOf(productId) {
    const rec = ratingsMap()[productId];
    return rec ? { avg: rec.total / rec.count, count: rec.count } : { avg: 0, count: 0 };
  }

  const stars = (n) => "★".repeat(Math.round(n)) + "☆".repeat(Math.max(0, 5 - Math.round(n)));

  function mustLogin(actionLabel) {
    if (getCurrentUser()) return false;
    showAuthModal("login");
    showToast(`Please login to ${actionLabel}`);
    return true;
  }

  function updateAuthUi() {
    const user = getCurrentUser();
    const authBtn = $("authButton");
    if (user) {
      authBtn.innerHTML = `<i class="fas fa-user"></i> ${user.name}`;
    } else {
      authBtn.innerHTML = `<i class="fas fa-user"></i> Login`;
    }
    $("logoutButton").classList.toggle("hidden", !user);
    $("welcomeText").textContent = user ? `Welcome back, ${user.name}.` : "Sign in to save wishlist and write reviews.";
  }

  function updateCartCount() {
    const cartQty = getCart().reduce((s, i) => s + i.qty, 0);
    $("cartCount").textContent = cartQty;
    const bottomCartBadge = $("bottomCartCount");
    if (bottomCartBadge) {
      bottomCartBadge.textContent = cartQty;
      bottomCartBadge.style.display = cartQty > 0 ? "flex" : "none";
    }
  }

  function updateWishlistCount() {
    const wishlistCount = getWishlist().length;
    $("wishlistCount").textContent = wishlistCount;
    const bottomWishBadge = $("bottomWishlistCount");
    if (bottomWishBadge) {
      bottomWishBadge.textContent = wishlistCount;
      bottomWishBadge.style.display = wishlistCount > 0 ? "flex" : "none";
    }
  }

  function productCard(p) {
    const r = ratingOf(p.id);
    const inWish = getWishlist().includes(p.id);
    const sale = getMarketing().sale;
    return `
      <article class="product-card reveal-up">
        <div class="product-image-wrap">
          <img class="product-image" src="${p.images[0]}" alt="${p.name}" />
          ${(p.discount > 0 || sale.active) ? '<span class="discount-badge">Sale</span>' : ""}
          <button class="wish-btn ${inWish ? "active" : ""}" data-wish-toggle="${p.id}"><i class="${inWish ? "fas" : "far"} fa-heart"></i></button>
        </div>
        <div class="product-content">
          <div class="product-meta"><span>${p.brand}</span><span>${p.category}</span></div>
          <h3 class="product-title">${p.name}</h3>
          <div class="rating-line">${r.count ? `${stars(r.avg)} (${r.count})` : "No reviews yet"}</div>
          <div class="price-wrap"><span class="price">${money(finalPrice(p))}</span>${finalPrice(p) < p.price ? `<span class="old-price">${money(p.price)}</span>` : ""}</div>
          <div class="card-actions">
            <button class="btn btn-outline" data-view-product="${p.id}"><i class="fas fa-eye"></i> View</button>
            <button class="btn btn-gold" data-add-cart="${p.id}"><i class="fas fa-cart-plus"></i> Add</button>
          </div>
        </div>
      </article>
    `;
  }

  function fillFilters() {
    $("categoryFilter").innerHTML = ["<option value='all'>All Categories</option>", ...getCategories().map((c) => `<option value='${c}'>${c}</option>`)].join("");
    $("brandFilter").innerHTML = ["<option value='all'>All Brands</option>", ...BRANDS.map((b) => `<option value='${b}'>${b}</option>`)].join("");
  }

  function filterProducts() {
    const filters = {
      search: $("searchInput").value.trim().toLowerCase(),
      category: $("categoryFilter").value,
      brand: $("brandFilter").value,
      price: $("priceFilter").value,
      sort: $("sortFilter").value
    };

    let list = [...getProducts()];
    if (filters.search) list = list.filter((p) => `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(filters.search));
    if (filters.category !== "all") list = list.filter((p) => p.category === filters.category);
    if (filters.brand !== "all") list = list.filter((p) => p.brand === filters.brand);
    if (filters.price !== "all") {
      const [min, max] = filters.price.split("-").map(Number);
      list = list.filter((p) => finalPrice(p) >= min && finalPrice(p) <= max);
    }
    if (filters.sort === "priceAsc") list.sort((a, b) => finalPrice(a) - finalPrice(b));
    if (filters.sort === "priceDesc") list.sort((a, b) => finalPrice(b) - finalPrice(a));
    if (filters.sort === "ratingDesc") list.sort((a, b) => ratingOf(b.id).avg - ratingOf(a.id).avg);
    return list;
  }

  function renderFeatured() {
    $("featuredGrid").innerHTML = getProducts().filter((p) => p.featured).slice(0, 4).map(productCard).join("");
  }

  function renderShop() {
    const list = filterProducts();
    $("shopGrid").innerHTML = list.length ? list.map(productCard).join("") : "<p>No products found.</p>";
  }

  function renderWishlist() {
    const ids = getWishlist();
    const list = ids.map((id) => getProducts().find((p) => p.id === id)).filter(Boolean);
    $("wishlistGrid").innerHTML = list.length ? list.map(productCard).join("") : "<p>Your wishlist is empty.</p>";
  }

  function renderBanners() {
    const banners = getMarketing().banners || [];
    $("bannerGrid").innerHTML = banners.map((b) => `
      <article class="banner-card" style="background-image:linear-gradient(120deg, rgba(0,0,0,.75), rgba(0,0,0,.35)),url('${b.image}');">
        <h3>${b.title}</h3><p>${b.subtitle}</p>
        <a href="#${b.ctaTarget || "shop"}" data-nav="${b.ctaTarget || "shop"}" class="btn btn-gold"><i class="fas fa-arrow-right"></i> ${b.ctaLabel || "Explore"}</a>
      </article>
    `).join("");
  }

  function couponMeta(subtotal) {
    const code = getAppliedCoupon();
    if (!code) return { code: "", discount: 0, reason: "" };
    const c = getCoupons().find((x) => x.code.toLowerCase() === code.toLowerCase());
    if (!c || !c.active) return { code: "", discount: 0, reason: "Coupon inactive" };
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) return { code: "", discount: 0, reason: "Coupon expired" };
    if (subtotal < Number(c.minOrder || 0)) return { code: c.code, discount: 0, reason: `Min order ${money(c.minOrder)}` };
    const discount = c.type === "percent" ? Math.round(subtotal * Number(c.value) / 100) : Number(c.value);
    return { code: c.code, discount: Math.min(subtotal, discount), reason: "" };
  }

  function cartData() {
    const cart = getCart();
    const products = getProducts();
    let subtotal = 0;
    let savings = 0;
    const detailed = cart.map((i) => {
      const p = products.find((x) => x.id === i.productId);
      if (!p) return null;
      const fp = finalPrice(p);
      subtotal += fp * i.qty;
      savings += (p.price - fp) * i.qty;
      return { item: i, product: p, final: fp };
    }).filter(Boolean);
    const coupon = couponMeta(subtotal);
    const delivery = subtotal > 0 ? 99 : 0;
    const total = Math.max(0, subtotal + delivery - coupon.discount);
    return { detailed, subtotal, savings, delivery, total, coupon };
  }

  function renderCart() {
    const { detailed, subtotal, savings, delivery, total, coupon } = cartData();
    if (!detailed.length) {
      $("cartItems").innerHTML = "<p>Your cart is empty.</p>";
      $("cartSummary").innerHTML = "";
      return;
    }

    $("cartItems").innerHTML = detailed.map(({ item, product, final }) => `
      <article class="cart-row">
        <img src="${product.images[0]}" alt="${product.name}" />
        <div><h4>${product.name}</h4><p>${product.brand} | ${product.category}</p><strong>${money(final)}</strong></div>
        <div class="qty-box"><button class="qty-btn" data-qty="-1" data-pid="${product.id}"><i class="fas fa-minus"></i></button><span>${item.qty}</span><button class="qty-btn" data-qty="1" data-pid="${product.id}"><i class="fas fa-plus"></i></button></div>
        <button class="btn btn-danger" data-remove-cart="${product.id}"><i class="fas fa-trash-alt"></i></button>
      </article>
    `).join("");

    $("cartSummary").innerHTML = `
      <div class="coupon-row"><input id="couponInput" placeholder="Enter coupon code" value="${getAppliedCoupon() || ""}" /><button class="btn btn-outline" id="applyCouponBtn" type="button"><i class="fas fa-ticket-alt"></i> Apply</button><button class="btn btn-danger" id="clearCouponBtn" type="button"><i class="fas fa-times"></i> Clear</button></div>
      <div class="summary-row"><span>Subtotal</span><span>${money(subtotal)}</span></div>
      <div class="summary-row"><span>Delivery</span><span>${money(delivery)}</span></div>
      <div class="summary-row"><span>You Save</span><span>${money(savings)}</span></div>
      <div class="summary-row"><span>Coupon ${coupon.code ? `(${coupon.code})` : ""}</span><span>- ${money(coupon.discount)}</span></div>
      ${coupon.reason ? `<div class="muted-small">${coupon.reason}</div>` : ""}
      <div class="summary-row total-row"><span>Total</span><span>${money(total)}</span></div>
      <a href="#checkout" data-nav="checkout" class="btn btn-gold"><i class="fas fa-arrow-right"></i> Proceed to Checkout</a>
    `;
  }

  function renderCheckoutSummary() {
    const { detailed, subtotal, delivery, total, coupon } = cartData();
    if (!detailed.length) { $("checkoutSummary").innerHTML = "<p>No items in cart yet.</p>"; return; }
    $("checkoutSummary").innerHTML = `
      <h3><i class="fas fa-receipt"></i> Order Summary</h3>
      ${detailed.map(({ item, product, final }) => `<div class="summary-row"><span>${product.name} x${item.qty}</span><span>${money(final * item.qty)}</span></div>`).join("")}
      <div class="summary-row"><span>Subtotal</span><span>${money(subtotal)}</span></div>
      <div class="summary-row"><span>Delivery</span><span>${money(delivery)}</span></div>
      <div class="summary-row"><span>Coupon ${coupon.code || ""}</span><span>- ${money(coupon.discount)}</span></div>
      <div class="summary-row total-row"><span>Total</span><span>${money(total)}</span></div>
    `;
  }

  function renderProductDetail(productId) {
    const p = getProducts().find((x) => x.id === productId);
    if (!p) { $("productDetail").innerHTML = "<p>Product not found.</p>"; return; }
    const reviews = getReviews().filter((r) => r.productId === p.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const r = ratingOf(p.id);
    const inWish = getWishlist().includes(p.id);
    const isMobile = window.innerWidth <= 760;

    $("productDetail").innerHTML = `
      <div>
        <img id="mainProductImage" class="gallery-main" src="${p.images[0]}" alt="${p.name}" />
        <div class="thumb-row">${p.images.map((img, i) => `<img class="thumb ${i === 0 ? "active" : ""}" data-thumb="${img}" src="${img}" alt="thumb ${i + 1}" />`).join("")}</div>
      </div>
      <div class="detail-info">
        <p>${p.brand} | ${p.category}</p>
        <h2>${p.name}</h2>
        <div class="rating-line">${r.count ? `${stars(r.avg)} ${r.avg.toFixed(1)} (${r.count} reviews)` : "No ratings yet"}</div>
        <div class="price-wrap"><span class="price">${money(finalPrice(p))}</span>${finalPrice(p) < p.price ? `<span class="old-price">${money(p.price)}</span>` : ""}</div>
        <p>${p.description}</p>
        <div class="card-actions" id="desktopProductActions">
          <button class="btn btn-gold" data-add-cart="${p.id}"><i class="fas fa-cart-plus"></i> Add to Cart</button>
          <button class="btn btn-outline ${inWish ? "active-btn" : ""}" data-wish-toggle="${p.id}"><i class="${inWish ? "fas" : "far"} fa-heart"></i> ${inWish ? "Wishlisted" : "Add to Wishlist"}</button>
          <button class="btn btn-outline" id="goCart"><i class="fas fa-shopping-cart"></i> Go to Cart</button>
        </div>

        <section class="review-box">
          <h3><i class="fas fa-star"></i> Product Reviews</h3>
          <form id="reviewForm" class="review-form" data-product-id="${p.id}">
            <div class="field"><label><i class="fas fa-star"></i> Rating</label><select id="reviewRating" required><option value="">Select rating</option><option value="5">5 - Excellent</option><option value="4">4 - Great</option><option value="3">3 - Good</option><option value="2">2 - Fair</option><option value="1">1 - Poor</option></select></div>
            <div class="field"><label><i class="fas fa-comment"></i> Comment</label><textarea id="reviewComment" rows="3" required></textarea></div>
            <button class="btn btn-gold" type="submit"><i class="fas fa-paper-plane"></i> Submit Review</button>
          </form>
          <div class="review-list">${reviews.length ? reviews.map((rv) => `<article class="review-item"><strong><i class="fas fa-user"></i> ${rv.userName}</strong><div class="rating-line">${stars(rv.rating)} (${rv.rating}/5)</div><p>${rv.comment}</p><span class="muted-small"><i class="far fa-calendar-alt"></i> ${new Date(rv.createdAt).toLocaleDateString("en-IN")}</span></article>`).join("") : "<p>No reviews yet. Be the first one.</p>"}</div>
        </section>
      </div>
    `;

    if (isMobile) {
      const stickyBar = document.createElement('div');
      stickyBar.className = 'sticky-add-cart';
      stickyBar.id = 'stickyAddCart';
      stickyBar.innerHTML = `
        <button class="btn btn-gold" data-add-cart="${p.id}"><i class="fas fa-cart-plus"></i> Add to Cart</button>
        <button class="btn btn-outline ${inWish ? "active-btn" : ""}" data-wish-toggle="${p.id}"><i class="${inWish ? "fas" : "far"} fa-heart"></i></button>
      `;
      const existing = document.getElementById('stickyAddCart');
      if (existing) existing.remove();
      document.getElementById('productDetail').appendChild(stickyBar);
    }
  }

  function showView(name) {
    const views = { home: "homeView", shop: "shopView", product: "productView", wishlist: "wishlistView", cart: "cartView", checkout: "checkoutView" };
    Object.values(views).forEach((id) => $(id).classList.remove("active"));
    $(views[name]).classList.add("active");
    if (name === "shop") renderShop();
    if (name === "wishlist") renderWishlist();
    if (name === "cart") renderCart();
    if (name === "checkout") renderCheckoutSummary();
    highlightBottomNav(name);
  }

  function highlightBottomNav(viewName) {
    document.querySelectorAll('.bottom-nav-item').forEach(link => {
      link.classList.remove('active');
      if (link.dataset.nav === viewName) link.classList.add('active');
    });
  }

  function route() {
    const hash = location.hash.replace("#", "") || "home";
    if (hash.startsWith("product-")) {
      showView("product");
      renderProductDetail(hash.replace("product-", ""));
      return;
    }
    showView(["home", "shop", "wishlist", "cart", "checkout"].includes(hash) ? hash : "home");
  }

  function showAuthModal(tab) {
    $("authModal").classList.remove("hidden");
    $("loginUserForm").classList.toggle("hidden", tab !== "login");
    $("registerUserForm").classList.toggle("hidden", tab !== "register");
  }

  function hideAuthModal() { $("authModal").classList.add("hidden"); }

  function registerUser(e) {
    e.preventDefault();
    const name = $("regName").value.trim();
    const email = $("regEmail").value.trim().toLowerCase();
    const phone = $("regPhone").value.trim();
    const password = $("regPassword").value;
    if (password.length < 6) return showToast("Password must be at least 6 characters");
    const users = getUsers();
    if (users.some((u) => u.email === email)) return showToast("Email already registered");
    const user = { id: `u${Date.now()}`, name, email, phone, password, blocked: false, createdAt: new Date().toISOString(), visits: 1 };
    users.push(user); setUsers(users); setSession(user.id); hideAuthModal();
    updateAuthUi(); updateCartCount(); updateWishlistCount(); renderShop(); renderFeatured(); renderWishlist();
    showToast("Registration successful");
  }

  function loginUser(e) {
    e.preventDefault();
    const email = $("loginEmail").value.trim().toLowerCase();
    const password = $("loginPassword").value;
    const users = getUsers();
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) return showToast("Invalid email or password");
    if (user.blocked) return showToast("Your account is blocked");
    user.visits = Number(user.visits || 0) + 1;
    setUsers(users); setSession(user.id); hideAuthModal();
    updateAuthUi(); updateCartCount(); updateWishlistCount(); renderShop(); renderFeatured(); renderWishlist();
    showToast("Login successful");
  }

  function logoutUser() {
    clearSession(); updateAuthUi(); updateCartCount(); updateWishlistCount(); renderCart(); renderCheckoutSummary(); renderWishlist();
    showToast("Logged out");
  }

  function placeOrder() {
    const user = getCurrentUser();
    if (!user) { showAuthModal("login"); return showToast("Please login to place order"); }
    if (user.blocked) return showToast("Blocked users cannot place orders");
    const cd = cartData();
    if (!cd.detailed.length) return showToast("Cart is empty");
    const payment = document.querySelector("input[name='payment']:checked").value;
    const order = {
      id: `ord${Date.now()}`,
      userId: user.id,
      userName: user.name,
      email: user.email,
      phone: $("coPhone").value.trim(),
      shippingAddress: { fullName: $("coName").value.trim(), address: $("coAddress").value.trim(), city: $("coCity").value.trim(), pincode: $("coPincode").value.trim() },
      paymentMethod: payment,
      items: cd.detailed.map(({ item, product, final }) => ({ productId: product.id, name: product.name, price: final, qty: item.qty })),
      subtotal: cd.subtotal,
      delivery: cd.delivery,
      couponCode: cd.coupon.code,
      couponDiscount: cd.coupon.discount,
      total: cd.total,
      status: "Pending",
      refunded: false,
      createdAt: new Date().toISOString()
    };
    const orders = getOrders(); orders.push(order); setOrders(orders);
    setCart([]); setAppliedCoupon(""); renderCart(); renderCheckoutSummary(); updateCartCount();
    showToast("Order placed successfully"); location.hash = "home";
  }

  function wireEvents() {
    document.addEventListener("click", (e) => {
      const add = e.target.closest("[data-add-cart]");
      if (add) { if (mustLogin("add items to cart")) return; const id = add.dataset.addCart; const cart = getCart(); const existing = cart.find((i) => i.productId === id); existing ? existing.qty++ : cart.push({ productId: id, qty: 1 }); setCart(cart); renderCart(); renderCheckoutSummary(); showToast("Added to cart"); }

      const wish = e.target.closest("[data-wish-toggle]");
      if (wish) { if (mustLogin("manage wishlist")) return; const id = wish.dataset.wishToggle; const list = getWishlist(); setWishlist(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]); renderShop(); renderFeatured(); renderWishlist(); if (location.hash.startsWith("#product-")) renderProductDetail(location.hash.replace("#product-", "")); showToast("Wishlist updated"); }

      const view = e.target.closest("[data-view-product]");
      if (view) location.hash = `product-${view.dataset.viewProduct}`;

      const rem = e.target.closest("[data-remove-cart]");
      if (rem) { setCart(getCart().filter((i) => i.productId !== rem.dataset.removeCart)); renderCart(); renderCheckoutSummary(); showToast("Removed from cart"); }

      const qty = e.target.closest("[data-qty]");
      if (qty) { const cart = getCart(); const item = cart.find((i) => i.productId === qty.dataset.pid); if (item) { item.qty += Number(qty.dataset.qty); if (item.qty <= 0) setCart(cart.filter((i) => i.productId !== qty.dataset.pid)); else setCart(cart); renderCart(); renderCheckoutSummary(); } }

      const nav = e.target.closest("[data-nav]");
      if (nav) { e.preventDefault(); location.hash = nav.dataset.nav; if (window.innerWidth <= 760) $("mainNav").classList.remove("open"); }

      const chip = e.target.closest("[data-brand-filter]");
      if (chip) { location.hash = "shop"; setTimeout(() => { $("brandFilter").value = chip.dataset.brandFilter; renderShop(); }, 10); }

      // Handle category links in footer
      const categoryLink = e.target.closest("[data-category]");
      if (categoryLink) {
        e.preventDefault();
        location.hash = "shop";
        setTimeout(() => {
          $("categoryFilter").value = categoryLink.dataset.category;
          renderShop();
        }, 10);
      }

      if (e.target.id === "goCart") location.hash = "cart";
      if (e.target.id === "backToShop") location.hash = "shop";
      if (e.target.id === "mobileMenuBtn") $("mainNav").classList.toggle("open");
      if (e.target.id === "authButton") getCurrentUser() ? showToast("Already logged in") : showAuthModal("login");
      if (e.target.id === "logoutButton") logoutUser();
      if (e.target.id === "closeAuthModal") hideAuthModal();
      if (e.target.id === "showLoginTab") showAuthModal("login");
      if (e.target.id === "showRegisterTab") showAuthModal("register");
      if (e.target.id === "applyCouponBtn") {
        const code = ($("couponInput")?.value || "").trim();
        if (!code) return showToast("Enter coupon code");
        const c = getCoupons().find((x) => x.code.toLowerCase() === code.toLowerCase());
        if (!c) return showToast("Coupon not found");
        if (!c.active) return showToast("Coupon inactive");
        if (c.expiresAt && new Date(c.expiresAt) < new Date()) return showToast("Coupon expired");
        setAppliedCoupon(c.code); renderCart(); renderCheckoutSummary(); showToast(`Coupon ${c.code} applied`);
      }
      if (e.target.id === "clearCouponBtn") { setAppliedCoupon(""); renderCart(); renderCheckoutSummary(); showToast("Coupon cleared"); }

      const thumb = e.target.closest("[data-thumb]");
      if (thumb) { document.querySelectorAll(".thumb").forEach((el) => el.classList.remove("active")); thumb.classList.add("active"); $("mainProductImage").src = thumb.dataset.thumb; }
      if (e.target.id === "authModal") hideAuthModal();

      // Newsletter form
      if (e.target.closest(".newsletter-form")) {
        e.preventDefault();
        const emailInput = e.target.closest(".newsletter-form").querySelector("input");
        if (emailInput.value) {
          showToast("Thank you for subscribing!");
          emailInput.value = "";
        }
      }
    });

    document.addEventListener("submit", (e) => {
      if (e.target.id === "registerUserForm") return registerUser(e);
      if (e.target.id === "loginUserForm") return loginUser(e);
      if (e.target.id === "checkoutForm") { e.preventDefault(); return placeOrder(); }
      if (e.target.id === "reviewForm") {
        e.preventDefault();
        if (mustLogin("submit a review")) return;
        const pid = e.target.dataset.productId;
        const rating = Number($("reviewRating").value);
        const comment = $("reviewComment").value.trim();
        if (!rating || !comment) return;
        const user = getCurrentUser();
        const reviews = getReviews();
        reviews.push({ id: `r${Date.now()}`, productId: pid, userId: user.id, userName: user.name, rating, comment, createdAt: new Date().toISOString() });
        setReviews(reviews); renderProductDetail(pid); renderShop(); renderFeatured(); showToast("Review submitted");
      }
      if (e.target.classList.contains("newsletter-form")) {
        e.preventDefault();
      }
    });

    ["searchInput", "categoryFilter", "brandFilter", "priceFilter", "sortFilter"].forEach((id) => $(id).addEventListener(id === "searchInput" ? "input" : "change", renderShop));
    window.addEventListener("hashchange", route);
    window.addEventListener("resize", () => { if (location.hash.startsWith("#product-")) renderProductDetail(location.hash.replace("#product-", "")); });
    window.addEventListener("storage", () => { fillFilters(); updateAuthUi(); updateCartCount(); updateWishlistCount(); renderBanners(); renderFeatured(); renderShop(); renderWishlist(); renderCart(); renderCheckoutSummary(); route(); });
  }

  function init() {
    ensureSeedData();
    fillFilters();
    updateAuthUi();
    updateCartCount();
    updateWishlistCount();
    renderBanners();
    renderFeatured();
    renderShop();
    renderWishlist();
    renderCart();
    renderCheckoutSummary();
    wireEvents();
    route();
  }

  init();
})();