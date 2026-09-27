/* ==========================================================================
   Страница банкетов: залы, готовые сеты, калькулятор, смета и заявка.
   Данные — в js/banquet-data.js (window.BANQUET_DATA).

   Логика итога:
     итог = (цена_сета × гостей, если сет выбран) + Σ(цена позиции × количество)
   Позиции калькулятора ПРИБАВЛЯЮТСЯ к сету, а не заменяют его.
   Итог пересчитывается мгновенно: при выборе сета, изменении позиций
   и при смене количества гостей (в форме заявки или в панели сметы).
   ========================================================================== */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const KB = window.KB;
    const data = window.BANQUET_DATA;
    if (!KB || !data) return;

    const { qs, qsa, escape: esc, formatPrice: fmt, plural } = KB;
    const { halls, sets, calculator } = data;
    const LIMITS = data.guests;
    const guestWord = (n) => plural(n, ["гость", "гостя", "гостей"]);
    const guestWordGen = (n) => plural(n, ["гостя", "гостей", "гостей"]);

    const state = {
      setId: null,
      guests: LIMITS.default,
      qty: {}, // id позиции → количество
    };

    /* ---------- Рендер: залы ---------- */
    const hallsGrid = qs("#halls-grid");
    hallsGrid.innerHTML = halls
      .map(
        (hall, i) => `
        <article class="hall-card reveal" style="--i:${i}">
          <div class="media hall-card__media">
            <img src="${esc(hall.image)}" alt="${esc(hall.name)}" width="1000" height="750" loading="lazy" decoding="async">
            <span class="chip hall-card__chip">${KB.icon("i-users")}до ${hall.capacity} ${guestWordGen(hall.capacity)}</span>
          </div>
          <div class="hall-card__body">
            <h3 class="h3">${esc(hall.name)}</h3>
            <p>${esc(hall.desc)}</p>
            <ul class="feature-list">${hall.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
            <div class="hall-card__footer">
              <button class="btn btn--outline btn--sm" type="button" data-hall="${esc(hall.id)}">
                Выбрать зал ${KB.icon("i-arrow-right")}
              </button>
            </div>
          </div>
        </article>`
      )
      .join("");

    /* ---------- Рендер: сеты ---------- */
    const setsGrid = qs("#sets-grid");
    setsGrid.innerHTML = sets
      .map(
        (set, i) => `
        <article class="set-card reveal${set.badge ? " set-card--featured" : ""}" style="--i:${i}" data-set-card="${esc(set.id)}">
          <div class="media set-card__media">
            <img src="${esc(set.image)}" alt="Сет «${esc(set.name)}»" width="1000" height="625" loading="lazy" decoding="async">
            <span class="chip set-card__format">${esc(set.format)}</span>
            ${set.badge ? `<span class="set-card__badge">${esc(set.badge)}</span>` : ""}
            <span class="set-card__check" aria-hidden="true">${KB.icon("i-check")}</span>
          </div>
          <div class="set-card__body">
            <h3 class="set-card__name">«${esc(set.name)}»</h3>
            <p class="set-card__lead">${esc(set.lead)}</p>
            <ul class="set-list" aria-label="Состав сета на одного гостя">
              ${set.items
                .map(
                  (it) => `<li>
                    <span class="set-list__name">${esc(it.name)}</span>
                    <span class="set-list__leader" aria-hidden="true"></span>
                    <span class="set-list__weight">${esc(it.weight)}</span>
                  </li>`
                )
                .join("")}
            </ul>
            <div class="set-card__price">
              <span class="set-card__price-value">${fmt(set.pricePerGuest)}</span>
              <span class="set-card__price-unit">за гостя</span>
              <span class="set-card__min">от ${set.minGuests} ${guestWordGen(set.minGuests)}</span>
            </div>
            <div class="set-card__actions">
              <button class="btn btn--gold btn--block" type="button" data-set-select="${esc(set.id)}" aria-pressed="false">
                Выбрать этот сет
              </button>
              <button class="btn btn--outline btn--sm btn--block" type="button" data-pdf="Сет «${esc(set.name)}» в PDF">
                ${KB.icon("i-download")}Скачать в PDF
              </button>
              <button class="btn btn--ghost btn--sm btn--block" type="button" data-set-book="${esc(set.id)}">
                Перейти к бронированию ${KB.icon("i-arrow-right")}
              </button>
            </div>
          </div>
        </article>`
      )
      .join("");

    /* ---------- Рендер: калькулятор ---------- */
    const calcGroups = qs("#calc-groups");
    const itemRow = (item) => `
      <li class="calc-item" data-item="${esc(item.id)}">
        <div class="calc-item__info">
          <span class="calc-item__name">${esc(item.name)}</span>
          <span class="calc-item__weight">${esc(item.weight)}</span>
        </div>
        <span class="price calc-item__price">${fmt(item.price)}</span>
        <div class="stepper" role="group" aria-label="Количество: ${esc(item.name)}">
          <button class="stepper__btn" type="button" data-step="-1" aria-label="Убрать: ${esc(item.name)}" disabled>${KB.icon("i-minus")}</button>
          <output class="stepper__value" aria-live="polite">0</output>
          <button class="stepper__btn" type="button" data-step="1" aria-label="Добавить: ${esc(item.name)}">${KB.icon("i-plus")}</button>
        </div>
      </li>`;

    calcGroups.innerHTML = calculator
      .map(
        (group, i) => `
        <section class="calc-group reveal" style="--i:${i % 2}" aria-labelledby="calc-${esc(group.id)}">
          <header class="calc-group__head">
            <h3 class="calc-group__title" id="calc-${esc(group.id)}">${KB.icon(group.icon)}${esc(group.title)}</h3>
            <span class="calc-group__sum" data-group-sum="${esc(group.id)}">Не выбрано</span>
          </header>
          <ul>${group.items.map(itemRow).join("")}</ul>
        </section>`
      )
      .join("");

    KB.initMedia(hallsGrid);
    KB.initMedia(setsGrid);
    KB.observeReveal(qsa(".reveal", hallsGrid).concat(qsa(".reveal", setsGrid), qsa(".reveal", calcGroups)));

    /* ---------- Элементы сметы и формы ---------- */
    const ui = {
      guests: qs("#sum-guests"),
      guestsMinus: qs('[data-guests-step="-1"]'),
      guestsPlus: qs('[data-guests-step="1"]'),
      set: qs("#sum-set"),
      setLabel: qs("#sum-set-label"),
      setTotal: qs("#sum-set-total"),
      itemsTotal: qs("#sum-items-total"),
      items: qs("#sum-items"),
      itemsEmpty: qs("#sum-items-empty"),
      warn: qs("#sum-warn"),
      total: qs("#sum-total"),
      perGuest: qs("#sum-per-guest"),
      barTotal: qs("#bar-total"),
      budget: qs("#budget-value"),
      budgetBreakdown: qs("#budget-breakdown"),
    };

    const form = qs("#banquet-form");
    const shell = qs("#banquet-shell");
    const guestsInput = form.elements.guests;
    const hallSelect = form.elements.hall;

    const currentSet = () => sets.find((s) => s.id === state.setId) || null;

    /* ---------- Расчёт ---------- */
    function computeTotals() {
      const set = currentSet();
      const setSum = set ? set.pricePerGuest * state.guests : 0;
      const lines = [];
      const groupSums = {};
      calculator.forEach((group) => {
        groupSums[group.id] = { count: 0, sum: 0 };
        group.items.forEach((item) => {
          const q = state.qty[item.id] || 0;
          if (!q) return;
          const sum = item.price * q;
          lines.push({ item, q, sum });
          groupSums[group.id].count += q;
          groupSums[group.id].sum += sum;
        });
      });
      const itemsSum = lines.reduce((acc, l) => acc + l.sum, 0);
      return { set, setSum, itemsSum, total: setSum + itemsSum, lines, groupSums };
    }

    function bump(el) {
      el.classList.remove("is-bumped");
      void el.offsetWidth; // перезапуск CSS-анимации
      el.classList.add("is-bumped");
    }

    let lastTotal = null;

    /* ---------- Обновление интерфейса ---------- */
    function update() {
      const t = computeTotals();

      // Строки калькулятора
      qsa(".calc-item", calcGroups).forEach((row) => {
        const q = state.qty[row.dataset.item] || 0;
        qs(".stepper__value", row).textContent = q;
        qs('[data-step="-1"]', row).disabled = q === 0;
        qs('[data-step="1"]', row).disabled = q >= 99;
        row.classList.toggle("is-active", q > 0);
      });
      Object.entries(t.groupSums).forEach(([id, g]) => {
        const el = qs(`[data-group-sum="${id}"]`, calcGroups);
        el.innerHTML = g.count ? `${g.count} шт. · <strong>${fmt(g.sum)}</strong>` : "Не выбрано";
      });

      // Карточки сетов
      qsa("[data-set-card]", setsGrid).forEach((card) => {
        const selected = card.dataset.setCard === state.setId;
        card.classList.toggle("is-selected", selected);
        const btn = qs("[data-set-select]", card);
        btn.setAttribute("aria-pressed", String(selected));
        btn.innerHTML = selected ? `${KB.icon("i-check")}Сет выбран` : "Выбрать этот сет";
      });

      // Гости
      ui.guests.textContent = state.guests || "—";
      ui.guestsMinus.disabled = state.guests <= LIMITS.min;
      ui.guestsPlus.disabled = state.guests >= LIMITS.max;

      // Сет
      ui.set.innerHTML = "";
      if (t.set) {
        const label = document.createElement("span");
        label.textContent = `«${t.set.name}»`;
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "summary__remove";
        remove.setAttribute("aria-label", `Убрать сет «${t.set.name}» из сметы`);
        remove.innerHTML = KB.icon("i-close");
        remove.addEventListener("click", () => selectSet(null));
        ui.set.append(label, remove);
      } else {
        ui.set.textContent = "Не выбран";
      }
      ui.setLabel.textContent = t.set
        ? `${fmt(t.set.pricePerGuest)} × ${state.guests} ${guestWordGen(state.guests)}`
        : "Сет × гостей";
      ui.setTotal.textContent = t.set ? fmt(t.setSum) : "—";
      ui.itemsTotal.textContent = t.itemsSum ? fmt(t.itemsSum) : "—";

      // Список докупленных позиций
      ui.items.innerHTML = t.lines
        .map(
          (l) => `<li><span>${esc(l.item.name)} × ${l.q}</span><span>${fmt(l.sum)}</span></li>`
        )
        .join("");
      ui.items.hidden = t.lines.length === 0;
      ui.itemsEmpty.hidden = t.lines.length > 0;

      // Предупреждение о минимуме гостей для сета
      const tooFew = t.set && state.guests > 0 && state.guests < t.set.minGuests;
      ui.warn.hidden = !tooFew;
      if (tooFew) {
        ui.warn.textContent = `Сет «${t.set.name}» рассчитан минимум на ${t.set.minGuests} ${guestWordGen(t.set.minGuests)}`;
      }

      // Итог
      const totalText = fmt(t.total);
      ui.total.textContent = totalText;
      ui.barTotal.textContent = totalText;
      ui.budget.textContent = totalText;
      if (lastTotal !== null && lastTotal !== t.total) {
        bump(ui.total);
        bump(ui.budget);
      }
      lastTotal = t.total;

      ui.perGuest.textContent =
        t.total && state.guests
          ? `≈ ${fmt(t.total / state.guests)} на гостя · ${state.guests} ${guestWord(state.guests)}`
          : "Выберите сет или добавьте позиции из калькулятора";

      // Расшифровка бюджета в форме
      const parts = [];
      if (t.set) parts.push(`сет «${t.set.name}» × ${state.guests} ${guestWord(state.guests)}`);
      if (t.itemsSum) parts.push(`доп. позиции на ${fmt(t.itemsSum)}`);
      ui.budgetBreakdown.textContent = parts.length
        ? parts.join(" + ").replace(/^./, (c) => c.toUpperCase())
        : "Выберите сет или соберите меню в калькуляторе";
    }

    /* ---------- Действия ---------- */
    function scrollToId(id) {
      const target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: KB.scrollBehavior(), block: "start" });
    }

    function revalidateGuests() {
      if (validator.isAttempted() || guestsInput.closest(".field").classList.contains("is-invalid")) {
        validator.validate("guests");
      }
    }

    function selectSet(id, { notify = false } = {}) {
      state.setId = id;
      update();
      revalidateGuests();
      const set = currentSet();
      if (notify && set) {
        KB.toast({
          title: `Сет «${set.name}» добавлен в смету`,
          text: `${fmt(set.pricePerGuest)} × ${state.guests} ${guestWord(state.guests)} = ${fmt(set.pricePerGuest * state.guests)}`,
          icon: "i-check",
        });
      }
    }

    function changeQty(id, delta) {
      const q = Math.max(0, Math.min(99, (state.qty[id] || 0) + delta));
      if (q) state.qty[id] = q;
      else delete state.qty[id];
      update();
    }

    function setGuests(n, { syncInput = true } = {}) {
      state.guests = n;
      if (syncInput) guestsInput.value = n;
      update();
      revalidateGuests();
    }

    hallsGrid.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-hall]");
      if (!btn) return;
      const hall = halls.find((h) => h.id === btn.dataset.hall);
      hallSelect.value = hall.id;
      hallSelect.dispatchEvent(new Event("change", { bubbles: true }));
      KB.toast({
        title: `Зал «${hall.name}» выбран`,
        text: "Мы отметили его в заявке — осталось указать дату и контакты",
        icon: "i-check",
      });
      scrollToId("request");
    });

    setsGrid.addEventListener("click", (event) => {
      const selectBtn = event.target.closest("[data-set-select]");
      if (selectBtn) {
        const id = selectBtn.dataset.setSelect;
        selectSet(state.setId === id ? null : id, { notify: state.setId !== id });
        return;
      }
      const bookBtn = event.target.closest("[data-set-book]");
      if (bookBtn) {
        if (state.setId !== bookBtn.dataset.setBook) selectSet(bookBtn.dataset.setBook);
        scrollToId("request");
      }
    });

    calcGroups.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-step]");
      if (!btn || btn.disabled) return;
      changeQty(btn.closest("[data-item]").dataset.item, Number(btn.dataset.step));
    });

    qsa("[data-guests-step]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const base = state.guests || LIMITS.min;
        const next = Math.max(LIMITS.min, Math.min(LIMITS.max, base + Number(btn.dataset.guestsStep)));
        setGuests(next);
      })
    );

    // Количество гостей в форме заявки — итог пересчитывается сразу
    guestsInput.addEventListener("input", () => {
      const raw = guestsInput.value.trim();
      const n = /^\d+$/.test(raw) ? Number(raw) : 0;
      setGuests(n, { syncInput: false });
    });

    hallSelect.addEventListener("change", revalidateGuests);

    qs("#calc-reset").addEventListener("click", () => {
      state.qty = {};
      state.setId = null;
      update();
      revalidateGuests();
      KB.toast({ title: "Смета очищена", text: "Сет и позиции калькулятора сброшены", icon: "i-info" });
    });

    /* ---------- Форма заявки ---------- */
    const durationSelect = form.elements.duration;
    const dateInput = form.elements.date;

    const refreshDateLimits = () => {
      const today = KB.startOfToday();
      dateInput.min = KB.toISODate(KB.addDays(today, 1));
      dateInput.max = KB.toISODate(KB.addDays(today, 365));
    };

    const validator = KB.initForm(form, {
      fields: {
        date: [
          KB.rules.required("Выберите дату мероприятия"),
          KB.rules.dateFrom(1, 365, {
            early: "Банкет можно запланировать не раньше завтрашнего дня",
            late: "Принимаем заявки не дальше чем на год вперёд",
          }),
        ],
        duration: [KB.rules.required("Выберите длительность")],
        guests: [
          KB.rules.required("Укажите количество гостей"),
          KB.rules.intRange(LIMITS.min, LIMITS.max, `Укажите от ${LIMITS.min} до ${LIMITS.max} гостей`),
          (value, f) => {
            const n = Number(value);
            const hall = halls.find((h) => h.id === f.elements.hall.value);
            if (hall && n > hall.capacity) {
              return `В зале «${hall.name}» помещается до ${hall.capacity} ${guestWordGen(hall.capacity)}`;
            }
            const set = currentSet();
            if (set && n < set.minGuests) {
              return `Сет «${set.name}» рассчитан минимум на ${set.minGuests} ${guestWordGen(set.minGuests)}`;
            }
            return "";
          },
        ],
        name: [KB.rules.required("Как к вам обращаться?"), KB.rules.name()],
        phone: [KB.rules.required("Укажите телефон — координатор перезвонит"), KB.rules.phone()],
        email: [KB.rules.required("Укажите email для подтверждения"), KB.rules.email()],
        comment: [KB.rules.maxLength(1000)],
      },
      onSubmit(values) {
        const t = computeTotals();
        const guests = Number(values.guests);
        const hall = halls.find((h) => h.id === values.hall);
        const date = KB.parseISODate(values.date);
        KB.showSuccess(shell, {
          name: values.name.trim(),
          date: KB.formatDate(date),
          dateShort: date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }),
          phone: values.phone.trim(),
          email: values.email.trim(),
          guests: `${guests} ${guestWord(guests)}`,
          duration: durationSelect.selectedOptions[0].textContent.trim(),
          hall: hall ? hall.name : "Подберёт координатор",
          set: t.set ? `«${t.set.name}»` : "Без готового сета",
          budget: fmt(t.total),
        });
        shell.scrollIntoView({ behavior: KB.scrollBehavior(), block: "center" });
      },
    });

    qs("[data-banquet-reset]").addEventListener("click", () => {
      KB.hideSuccess(shell);
      validator.reset();
      guestsInput.value = state.guests || LIMITS.default;
      state.guests = Number(guestsInput.value);
      refreshDateLimits();
      update();
      dateInput.focus();
    });

    /* ---------- Мобильная панель итога ---------- */
    const bar = qs("#calc-bar");
    const mq = window.matchMedia("(max-width: 980px)");
    const visibility = { calculator: false, summary: false };
    const syncBar = () => {
      const show = visibility.calculator && !visibility.summary;
      bar.classList.toggle("is-visible", show);
      document.body.classList.toggle("has-calc-bar", show && mq.matches);
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => (visibility[e.target.id] = e.isIntersecting));
        syncBar();
      });
      io.observe(qs("#calculator"));
      io.observe(qs("#summary"));
      mq.addEventListener("change", syncBar);
    }

    /* ---------- Старт ---------- */
    guestsInput.value = state.guests;
    refreshDateLimits();
    update();
  });
})();
