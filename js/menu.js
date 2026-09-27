/* ==========================================================================
   Страница меню: табы категорий, сетка карточек, модалка блюда.
   Данные — в js/menu-data.js (window.MENU_DATA).
   ========================================================================== */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const KB = window.KB;
    const data = window.MENU_DATA;
    if (!KB || !data) return;
    const tabsEl = KB.qs("#menu-tabs");
    const panel = KB.qs("#menu-panel");
    if (!tabsEl || !panel) return;

    const { categories, items } = data;
    const esc = KB.escape;
    const byId = new Map(items.map((item) => [item.id, item]));
    const categoryTitle = new Map(categories.map((c) => [c.id, c.title]));
    const tabs = [{ id: "all", title: "Всё меню" }, ...categories];
    const SWITCH_MS = 250;

    let current = null;

    /* ---------- Табы ---------- */
    tabsEl.innerHTML =
      tabs
        .map((tab) => {
          const count = tab.id === "all" ? items.length : items.filter((i) => i.category === tab.id).length;
          return `<button class="tab" type="button" role="tab" id="tab-${tab.id}" data-tab="${tab.id}"
              aria-controls="menu-panel" aria-selected="false" tabindex="-1">${esc(tab.title)}<span class="tab__count" aria-hidden="true">${count}</span></button>`;
        })
        .join("") + '<span class="tabs__indicator" aria-hidden="true"></span>';

    const tabButtons = KB.qsa(".tab", tabsEl);
    const indicator = KB.qs(".tabs__indicator", tabsEl);

    function moveIndicator(btn) {
      indicator.style.width = `${btn.offsetWidth}px`;
      indicator.style.transform = `translateX(${btn.offsetLeft}px)`;
    }

    function scrollTabIntoView(btn) {
      const left = btn.offsetLeft - (tabsEl.clientWidth - btn.offsetWidth) / 2;
      tabsEl.scrollTo({ left: Math.max(0, left), behavior: KB.scrollBehavior() });
    }

    /* ---------- Карточки ---------- */
    function cardHTML(item, index) {
      const price = KB.formatPrice(item.price);
      return `
        <button class="dish-card reveal" type="button" data-dish="${esc(item.id)}" style="--i:${index % 3}"
          aria-haspopup="dialog" aria-label="${esc(item.name)}, ${price}. Подробнее о блюде">
          <span class="media dish-card__media">
            <img src="${esc(item.image)}" alt="${esc(item.name)}" width="1000" height="1000" loading="lazy" decoding="async">
            ${item.badge ? `<span class="dish-card__badge">${esc(item.badge)}</span>` : ""}
            <span class="dish-card__more">Подробнее ${KB.icon("i-arrow-right")}</span>
          </span>
          <span class="dish-card__row">
            <span class="dish-card__name">${esc(item.name)}</span>
            <span class="price dish-card__price">${price}</span>
          </span>
          <span class="dish-card__excerpt">${esc(item.excerpt)}</span>
          <span class="dish-card__weight">${esc(item.weight)}</span>
        </button>`;
    }

    function groupHTML(category) {
      const list = items.filter((item) => item.category === category.id);
      return `
        <section class="menu-group" aria-labelledby="group-${category.id}">
          <header class="menu-group__head reveal">
            <h2 class="menu-group__title" id="group-${category.id}">${esc(category.title)}</h2>
            ${category.note ? `<p class="menu-group__note">${esc(category.note)}</p>` : ""}
          </header>
          <div class="menu-grid">${list.map(cardHTML).join("")}</div>
        </section>`;
    }

    function renderPanel(id) {
      const groups = id === "all" ? categories : categories.filter((c) => c.id === id);
      panel.innerHTML = groups.map(groupHTML).join("");
      panel.setAttribute("aria-labelledby", `tab-${id}`);
      KB.initMedia(panel);
      KB.observeReveal(KB.qsa(".reveal", panel));
    }

    function select(id, { focus = false, animate = true } = {}) {
      if (!tabs.some((t) => t.id === id)) id = "all";
      if (id === current) return;
      current = id;

      tabButtons.forEach((btn) => {
        const active = btn.dataset.tab === id;
        btn.setAttribute("aria-selected", String(active));
        btn.tabIndex = active ? 0 : -1;
        if (active) {
          moveIndicator(btn);
          scrollTabIntoView(btn);
          if (focus) btn.focus();
        }
      });

      const url = id === "all" ? window.location.pathname + window.location.search : `#${id}`;
      history.replaceState(null, "", url);

      if (!animate) {
        renderPanel(id);
        return;
      }

      // Если тулбар «прилип», возвращаемся к началу списка, чтобы гость видел новый раздел
      const section = KB.qs("#menu");
      const toolbar = KB.qs(".menu-toolbar");
      const header = KB.qs(".site-header");
      const top = section.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight : 0);
      const needsScroll = toolbar.getBoundingClientRect().top <= (header ? header.offsetHeight : 0) + 1;

      panel.classList.add("is-switching");
      window.setTimeout(() => {
        renderPanel(id);
        if (needsScroll) window.scrollTo({ top, behavior: "auto" });
        panel.classList.remove("is-switching");
      }, SWITCH_MS);
    }

    tabsEl.addEventListener("click", (event) => {
      const btn = event.target.closest(".tab");
      if (btn) select(btn.dataset.tab);
    });

    // Клавиатура: ←/→, Home/End — по паттерну WAI-ARIA Tabs
    tabsEl.addEventListener("keydown", (event) => {
      const index = tabButtons.findIndex((b) => b.dataset.tab === current);
      let nextIndex = null;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabButtons.length;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabButtons.length - 1;
      if (nextIndex === null) return;
      event.preventDefault();
      select(tabButtons[nextIndex].dataset.tab, { focus: true });
    });

    window.addEventListener("resize", () => {
      const active = tabButtons.find((b) => b.dataset.tab === current);
      if (active) moveIndicator(active);
    });

    // Шрифты влияют на ширину табов — пересчитываем индикатор после загрузки
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        const active = tabButtons.find((b) => b.dataset.tab === current);
        if (active) moveIndicator(active);
      });
    }

    window.addEventListener("hashchange", () => select(window.location.hash.slice(1) || "all"));

    /* ---------- Модалка блюда ---------- */
    const dishModal = KB.qs("#dish-modal");
    const el = {
      media: KB.qs("#dish-media"),
      category: KB.qs("#dish-category"),
      title: KB.qs("#dish-title"),
      price: KB.qs("#dish-price"),
      desc: KB.qs("#dish-desc"),
      b: KB.qs("#dish-b"),
      zh: KB.qs("#dish-zh"),
      u: KB.qs("#dish-u"),
      kcal: KB.qs("#dish-kcal"),
      weight: KB.qs("#dish-weight"),
      weightLabel: KB.qs("#dish-weight-label"),
    };

    // <img> создаём при первом открытии: картинка без src в разметке считалась бы битой
    function dishImage() {
      let img = KB.qs("img", el.media);
      if (!img) {
        img = document.createElement("img");
        img.id = "dish-img";
        img.width = 1000;
        img.height = 1000;
        img.decoding = "async";
        el.media.appendChild(img);
      }
      return img;
    }

    function openDish(id, opener) {
      const item = byId.get(id);
      if (!item) return;
      dishModal.dataset.dish = item.id;
      KB.setImage(dishImage(), item.image, item.name);
      el.category.textContent = categoryTitle.get(item.category) || "";
      el.title.textContent = item.name;
      el.price.textContent = KB.formatPrice(item.price);
      el.desc.textContent = item.desc;
      el.b.textContent = `${item.kbzhu.б} г`;
      el.zh.textContent = `${item.kbzhu.ж} г`;
      el.u.textContent = `${item.kbzhu.у} г`;
      el.kcal.textContent = `${item.kbzhu.ккал.toLocaleString("ru-RU")} ккал`;
      el.weight.textContent = item.weight;
      // \b в JS не работает с кириллицей — поэтому проверяем границы явно
      el.weightLabel.textContent = /(^|\s)м?л(\s|$)/.test(item.weight) ? "Объём" : "Вес порции";
      KB.openModal("dish-modal", opener);
    }

    panel.addEventListener("click", (event) => {
      const card = event.target.closest(".dish-card");
      if (card) openDish(card.dataset.dish, card);
    });

    /* ---------- Старт ---------- */
    select(window.location.hash.slice(1) || "all", { animate: false });
  });
})();
