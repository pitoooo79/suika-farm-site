/* =========================================================
  更新しやすい設定
  LINE_URL を実際のLINE公式アカウントURLに変更してください。
  商品情報: data/products.json
  お知らせ: data/news.json
========================================================= */
const LINE_URL = "#";
const GAS_URL = "https://script.google.com/macros/s/AKfycbzqOtMoIol1v9Y7QruI3TnySPpnmACGFuCnYl_sOtcGEHMokj03Et9ex2Pv257BsRPD/exec";

// ヒーロー画像を追加・変更する場合はここを編集してください。
const HERO_IMAGES = [
  {
    src: "images/hero.jpg",
    alt: "スイカ畑で収穫したスイカを持つ農家の家族"
  },
  {
    src: "images/hero-02.jpg",
    alt: "山に囲まれたスイカ畑と収穫されたスイカ"
  },
  {
    src: "images/hero-03.jpg",
    alt: "畑のそばに置かれた採れたてスイカ"
  }
];

const statusClassMap = {
  "販売中": "",
  "予約受付中": "is-reserve",
  "今季終了": "is-ended"
};

document.addEventListener("DOMContentLoaded", () => {
  applyLineLinks();
  setupMobileMenu();
  setupMissingImageFallbacks();
  fetchProducts();
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

  const openMenu = () => {
    toggle.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "メニューを閉じる");
    menu.hidden = false;
  };

  toggle.addEventListener("click", () => {
    if (menu.hidden) {
      openMenu();
    } else {
      closeMenu();
    }
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 640) closeMenu();
  });
}

function setupHeroSlideshow() {
  const heroBg = document.querySelector(".hero-bg");
  if (!heroBg || HERO_IMAGES.length < 2) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const slides = Array.from(heroBg.querySelectorAll(".hero-bg-layer"));

  HERO_IMAGES.forEach((image, index) => {
    let slide = slides[index];

    if (!slide) {
      slide = document.createElement("span");
      slide.className = "hero-bg-layer";
      slide.setAttribute("aria-hidden", "true");
      heroBg.appendChild(slide);
      slides.push(slide);
    }

    slide.style.setProperty("--hero-bg-image", `url("${image.src}")`);
    slide.classList.toggle("is-active", index === 0);
  });

  let currentIndex = 0;

  window.setInterval(() => {
    const nextIndex = (currentIndex + 1) % HERO_IMAGES.length;
    const nextSlide = slides[nextIndex];

    slides[currentIndex].classList.remove("is-active");
    nextSlide.classList.add("is-active");

    currentIndex = nextIndex;
  }, 7000);
}

function setupMissingImageFallbacks() {
  document.querySelectorAll("img").forEach((img) => {
    if (img.complete && img.naturalWidth === 0) {
      img.classList.add("is-missing");
      img.removeAttribute("src");
    }

    img.addEventListener("error", () => {
      img.classList.add("is-missing");
      img.removeAttribute("src");
    });
  });
}

async function fetchProducts() {
  const container = document.getElementById("product-list");
  if (!container) return;

  const url = `${GAS_URL}?action=products`;

  try {
    console.log("[products] fetch url:", url);

    const response = await fetch(url);
    const text = await response.text();

    console.log("[products] response.status:", response.status);
    console.log("[products] response.ok:", response.ok);
    console.log("[products] response.text():", text);

    if (!response.ok) {
      throw new Error(`spreadsheet products could not be loaded: ${response.status}`);
    }

    let products;
    try {
      products = JSON.parse(text);
    } catch (parseError) {
      console.error("[products] JSON parse error:", parseError);
      throw parseError;
    }

    container.innerHTML = products.map(createProductCard).join("");
    setupMissingImageFallbacks();
  } catch (error) {
    console.error("[products] fetchProducts error:", error);
    container.innerHTML = '<p class="error-text">スプレッドシートの商品情報を読み込めませんでした。</p>';
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
    const response = await fetch(`${GAS_URL}?action=news`);
    if (!response.ok) throw new Error("spreadsheet news could not be loaded");

    const newsItems = await response.json();
    container.innerHTML = newsItems.map(createNewsItem).join("");
  } catch (error) {
    container.innerHTML = '<p class="error-text">スプレッドシートのお知らせ情報を読み込めませんでした。</p>';
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
  const value = String(dateString);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
