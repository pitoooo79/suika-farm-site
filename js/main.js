const LINE_URL = "#";

const statusClassMap = {
  "販売中": "",
  "予約受付中": "is-reserve",
  "今季終了": "is-ended"
};

document.addEventListener("DOMContentLoaded", () => {
  applyLineLinks();
  setupMobileMenu();
  setupMissingImageFallbacks();
  loadProducts();
  loadNews();
});

function applyLineLinks() {
  document.querySelectorAll("[data-line-link]").forEach((link) => {
    link.href = LINE_URL;
  });
}

function setupMobileMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("mobile-menu");
  if (!toggle || !menu) return;

  const closeMenu = () => {
    toggle.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "メニューを開く");
    menu.hidden = true;
  };

  toggle.addEventListener("click", () => {
    const willOpen = menu.hidden;
    toggle.classList.toggle("is-open", willOpen);
    toggle.setAttribute("aria-expanded", String(willOpen));
    toggle.setAttribute("aria-label", willOpen ? "メニューを閉じる" : "メニューを開く");
    menu.hidden = !willOpen;
  });

  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 640) closeMenu();
  });
}

function setupMissingImageFallbacks() {
  document.querySelectorAll("img").forEach((img) => {
    img.addEventListener("error", () => {
      img.classList.add("is-missing");
      img.removeAttribute("src");
    });
  });
}

async function loadProducts() {
  const container = document.getElementById("product-list");
  if (!container) return;

  try {
    const response = await fetch("data/products.json");
    if (!response.ok) throw new Error("products.json could not be loaded");
    const products = await response.json();
    container.innerHTML = products.map(createProductCard).join("");
    setupMissingImageFallbacks();
  } catch {
    container.innerHTML = '<p class="error-text">商品情報を読み込めませんでした。data/products.jsonをご確認ください。</p>';
  }
}

function createProductCard(product) {
  const statusClass = statusClassMap[product.status] || "";

  return `
    <article class="product-card">
      <div class="product-image image-frame">
        <span class="product-status ${statusClass}">${escapeHtml(product.status)}</span>
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.alt)}">
      </div>
      <div class="product-body">
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.description)}</p>
        <p class="product-price">${escapeHtml(product.price)}</p>
      </div>
    </article>
  `;
}

async function loadNews() {
  const container = document.getElementById("news-list");
  if (!container) return;

  try {
    const response = await fetch("data/news.json");
    if (!response.ok) throw new Error("news.json could not be loaded");
    const newsItems = await response.json();
    container.innerHTML = newsItems.map(createNewsItem).join("");
  } catch {
    container.innerHTML = '<p class="error-text">お知らせを読み込めませんでした。data/news.jsonをご確認ください。</p>';
  }
}

function createNewsItem(news) {
  return `
    <article class="news-item">
      <time class="news-date" datetime="${escapeHtml(news.date)}">${formatDate(news.date)}</time>
      <span class="news-title">${escapeHtml(news.title)}</span>
      <span class="news-category">${escapeHtml(news.category)}</span>
    </article>
  `;
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
