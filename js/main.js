/* ==========================================================================
   Общая логика для всех страниц:
   утилиты, хедер, мобильное меню, reveal-анимации, изображения,
   модальные окна, валидация форм, toast, карусель, бронирование стола.
   Страничные скрипты (menu.js, banquets.js) используют window.KB.
   ========================================================================== */
(function () {
  "use strict";

  const KB = (window.KB = window.KB || {});
  const NBSP = " ";

  /* ---------- Утилиты ---------- */
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const pad = (n) => String(n).padStart(2, "0");

  KB.qs = qs;
  KB.qsa = qsa;

  /** 12500 → «12 500 ₽» (разделитель тысяч и знак рубля неразрывные) */
  KB.formatPrice = (value) =>
    Math.round(value).toLocaleString("ru-RU").replace(/\s/g, NBSP) + NBSP + "₽";

  /** plural(5, ["гость", "гостя", "гостей"]) → «гостей» */
  KB.plural = (n, forms) => {
    const n10 = n % 10;
    const n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return forms[0];
    if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return forms[1];
    return forms[2];
  };

  KB.escape = (str) =>
    String(str).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

  KB.toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  /** Разбирает «ГГГГ-ММ-ДД» в локальную дату без сдвига часового пояса */
  KB.parseISODate = (str) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || "");
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.getMonth() === +m[2] - 1 ? d : null;
  };

  KB.startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  KB.addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  KB.formatDate = (d) => d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "long" });

  KB.icon = (id, extraClass = "") =>
    `<svg class="icon ${extraClass}" aria-hidden="true" focusable="false"><use href="#${id}"></use></svg>`;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  KB.scrollBehavior = () => (reducedMotion.matches ? "auto" : "smooth");

  /* ---------- Блокировка прокрутки (со счётчиком) ---------- */
  let lockCount = 0;
  KB.lockScroll = () => {
    if (lockCount++ === 0) {
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = scrollbar > 0 ? `${scrollbar}px` : "";
      document.body.classList.add("is-locked");
    }
  };
  KB.unlockScroll = () => {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.body.classList.remove("is-locked");
      document.body.style.paddingRight = "";
    }
  };

  /* ---------- Фокус внутри диалога ---------- */
  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const focusables = (root) =>
    qsa(FOCUSABLE, root).filter((el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement);

  function trapTab(event, root) {
    const items = focusables(root);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ---------- Изображения: плавное появление и фолбэк ---------- */
  function watchImage(img) {
    const media = img.parentElement;
    if (!media || !media.classList.contains("media")) return;
    if (img.complete && img.getAttribute("src")) {
      media.classList.add(img.naturalWidth > 0 ? "is-loaded" : "is-broken");
      return;
    }
    img.addEventListener("load", () => media.classList.add("is-loaded"), { once: true });
    img.addEventListener("error", () => media.classList.add("is-broken"), { once: true });
  }

  KB.initMedia = (root = document) => qsa(".media > img", root).forEach(watchImage);

  /** Смена картинки в уже существующем .media (например, в модалке блюда) */
  KB.setImage = (img, src, alt) => {
    const media = img.parentElement;
    media.classList.remove("is-loaded", "is-broken");
    img.alt = alt || "";
    img.src = src;
    watchImage(img);
  };

  /* ---------- Появление при скролле ---------- */
  let revealObserver = null;

  function finishReveal(el) {
    el.classList.remove("reveal", "is-visible");
  }

  function showReveal(el) {
    el.classList.add("is-visible");
    // После завершения анимации снимаем служебные классы, чтобы задержки
    // stagger не мешали hover-эффектам карточек.
    const onEnd = (event) => {
      if (event.target !== el || event.propertyName !== "opacity") return;
      el.removeEventListener("transitionend", onEnd);
      finishReveal(el);
    };
    el.addEventListener("transitionend", onEnd);
    const delay = parseFloat(getComputedStyle(el).getPropertyValue("--i")) || 0;
    window.setTimeout(() => el.classList.contains("is-visible") && finishReveal(el), 1400 + delay * 100);
  }

  KB.observeReveal = (nodes) => {
    nodes.forEach((el) => {
      if (revealObserver) revealObserver.observe(el);
      else showReveal(el);
    });
  };

  function initReveal() {
    if ("IntersectionObserver" in window) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            revealObserver.unobserve(entry.target);
            showReveal(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
      );
    }
    KB.observeReveal(qsa(".reveal"));
  }

  /* ---------- Хедер ---------- */
  function initHeader() {
    const header = qs(".site-header");
    if (!header) return;
    const update = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ---------- Мобильное меню ---------- */
  const nav = { el: null, burger: null, open: false };

  function openNav() {
    if (nav.open) return;
    nav.open = true;
    nav.el.removeAttribute("inert");
    nav.el.setAttribute("aria-hidden", "false");
    nav.el.classList.add("is-open");
    nav.burger.setAttribute("aria-expanded", "true");
    nav.burger.setAttribute("aria-label", "Закрыть меню");
    KB.lockScroll();
    const first = qs(".mobile-nav__link", nav.el);
    window.setTimeout(() => first && first.focus({ preventScroll: true }), 60);
  }

  function closeNav({ restoreFocus = true } = {}) {
    if (!nav.open) return;
    nav.open = false;
    nav.el.classList.remove("is-open");
    nav.el.setAttribute("aria-hidden", "true");
    nav.el.setAttribute("inert", "");
    nav.burger.setAttribute("aria-expanded", "false");
    nav.burger.setAttribute("aria-label", "Открыть меню");
    KB.unlockScroll();
    if (restoreFocus) nav.burger.focus({ preventScroll: true });
  }

  KB.closeNav = closeNav;

  function initMobileNav() {
    nav.el = qs("#mobile-nav");
    nav.burger = qs(".burger");
    if (!nav.el || !nav.burger) return;

    nav.burger.addEventListener("click", () => (nav.open ? closeNav() : openNav()));
    nav.el.addEventListener("click", (event) => {
      if (event.target.closest("[data-nav-close]")) closeNav();
      else if (event.target.closest(".mobile-nav__link")) closeNav({ restoreFocus: false });
    });
    nav.el.addEventListener("keydown", (event) => {
      if (event.key === "Tab") trapTab(event, qs(".mobile-nav__panel", nav.el));
    });
    window.matchMedia("(min-width: 981px)").addEventListener("change", (mq) => {
      if (mq.matches) closeNav({ restoreFocus: false });
    });
  }

  /* ---------- Модальные окна ---------- */
  const modal = { current: null, returnFocus: null };

  KB.openModal = (id, opener) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (nav.open) closeNav({ restoreFocus: false });
    if (modal.current && modal.current !== el) {
      closeModal(modal.current, { chained: true });
    } else if (!modal.current) {
      modal.returnFocus = opener || document.activeElement;
    }
    el.dispatchEvent(new CustomEvent("modal:beforeopen", { detail: { opener } }));
    el.removeAttribute("inert");
    el.setAttribute("aria-hidden", "false");
    el.classList.add("is-open");
    modal.current = el;
    KB.lockScroll();
    const dialog = qs(".modal__dialog", el);
    dialog.scrollTop = 0;
    window.setTimeout(() => {
      const target = qs("[data-autofocus]", el) || focusables(dialog)[0];
      if (target) target.focus({ preventScroll: true });
    }, 80);
  };

  function closeModal(el = modal.current, { chained = false } = {}) {
    if (!el || !el.classList.contains("is-open")) return;
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden", "true");
    el.setAttribute("inert", "");
    KB.unlockScroll();
    if (modal.current === el) modal.current = null;
    el.dispatchEvent(new CustomEvent("modal:close"));
    if (!chained && modal.returnFocus && document.contains(modal.returnFocus)) {
      modal.returnFocus.focus({ preventScroll: true });
      modal.returnFocus = null;
    }
  }

  KB.closeModal = closeModal;

  function initModals() {
    document.addEventListener("click", (event) => {
      const opener = event.target.closest("[data-modal-open]");
      if (opener) {
        event.preventDefault();
        KB.openModal(opener.getAttribute("data-modal-open"), opener);
        return;
      }
      const closer = event.target.closest("[data-modal-close]");
      if (closer) closeModal(closer.closest(".modal"));
    });

    qsa(".modal").forEach((el) =>
      el.addEventListener("keydown", (event) => {
        if (event.key === "Tab") trapTab(event, qs(".modal__dialog", el));
      })
    );

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (modal.current) closeModal();
      else if (nav.open) closeNav();
    });
  }

  /* ---------- Toast ---------- */
  let toastRegion = null;

  KB.toast = ({ title, text = "", icon = "i-info", timeout = 5200 }) => {
    if (!toastRegion) {
      toastRegion = document.createElement("div");
      toastRegion.className = "toast-region";
      toastRegion.setAttribute("role", "status");
      toastRegion.setAttribute("aria-live", "polite");
      document.body.appendChild(toastRegion);
    }
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      <span class="toast__icon">${KB.icon(icon)}</span>
      <div>
        <p class="toast__title"></p>
        ${text ? '<p class="toast__text"></p>' : ""}
      </div>
      <button class="toast__close" type="button" aria-label="Закрыть уведомление">${KB.icon("i-close")}</button>`;
    qs(".toast__title", toast).textContent = title;
    if (text) qs(".toast__text", toast).textContent = text;
    toastRegion.appendChild(toast);

    // не больше трёх уведомлений одновременно
    const all = qsa(".toast", toastRegion);
    if (all.length > 3) all[0].remove();

    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add("is-visible")));

    let timer = null;
    const dismiss = () => {
      window.clearTimeout(timer);
      toast.classList.remove("is-visible");
      window.setTimeout(() => toast.remove(), 520);
    };
    const schedule = () => (timer = window.setTimeout(dismiss, timeout));
    qs(".toast__close", toast).addEventListener("click", dismiss);
    toast.addEventListener("mouseenter", () => window.clearTimeout(timer));
    toast.addEventListener("mouseleave", schedule);
    schedule();
    return toast;
  };

  /* ---------- Валидация форм ---------- */
  const PHONE_CHARS = /^[+\d\s()\-.]+$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;
  const NAME_RE = /^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё\s'’\-]*$/;

  KB.rules = {
    required: (message) => (value) => (String(value).trim() ? "" : message),
    name: () => (value) => {
      const v = value.trim();
      if (v.length < 2) return "Имя должно содержать минимум 2 буквы";
      if (!NAME_RE.test(v)) return "Используйте только буквы, пробел и дефис";
      return "";
    },
    phone: () => (value) => {
      const v = value.trim();
      if (!PHONE_CHARS.test(v)) return "Допустимы цифры, пробелы, скобки, дефис и «+»";
      const digits = v.replace(/\D/g, "");
      if (digits.length < 10) return "Номер слишком короткий — нужно минимум 10 цифр";
      if (digits.length > 15) return "Слишком длинный номер — проверьте цифры";
      return "";
    },
    email: () => (value) =>
      EMAIL_RE.test(value.trim()) ? "" : "Проверьте адрес: например, anna@mail.ru",
    intRange: (min, max, message) => (value) => {
      const v = String(value).trim();
      if (!/^\d+$/.test(v)) return "Введите целое число";
      const n = Number(v);
      return n < min || n > max ? message : "";
    },
    dateFrom: (minDaysAhead, maxDaysAhead, messages) => (value) => {
      const d = KB.parseISODate(value);
      if (!d) return "Укажите дату в формате ДД.ММ.ГГГГ";
      const today = KB.startOfToday();
      if (d < KB.addDays(today, minDaysAhead)) return messages.early;
      if (maxDaysAhead && d > KB.addDays(today, maxDaysAhead)) return messages.late;
      return "";
    },
    maxLength: (max) => (value) => (value.length > max ? `Не больше ${max} символов` : ""),
  };

  /**
   * Подключает валидацию к форме.
   * fields: { имяПоля: [правило, …] } — правило возвращает текст ошибки или "".
   * Ошибка подсвечивается классом .is-invalid на обёртке .field.
   */
  KB.initForm = (form, { fields, onSubmit }) => {
    const names = Object.keys(fields);
    let attempted = false;

    const control = (name) => form.elements[name];
    const fieldOf = (name) => control(name).closest(".field");

    function setError(name, message) {
      const field = fieldOf(name);
      const input = control(name);
      const error = qs(".field__error", field);
      field.classList.toggle("is-invalid", Boolean(message));
      input.setAttribute("aria-invalid", message ? "true" : "false");
      if (error) error.textContent = message;
    }

    function validate(name) {
      const value = control(name).value;
      let message = "";
      for (const rule of fields[name]) {
        message = rule(value, form) || "";
        if (message) break;
      }
      setError(name, message);
      return !message;
    }

    const onEdit = (event) => {
      const name = event.target.name;
      if (!fields[name]) return;
      if (attempted || fieldOf(name).classList.contains("is-invalid")) validate(name);
    };
    form.addEventListener("input", onEdit);
    form.addEventListener("change", onEdit);

    // Проверка при уходе с заполненного поля — без «придирок» к пустым
    form.addEventListener(
      "blur",
      (event) => {
        const name = event.target.name;
        if (fields[name] && String(event.target.value).trim()) validate(name);
      },
      true
    );

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      attempted = true;
      const invalid = names.filter((name) => !validate(name));
      if (invalid.length) {
        const first = control(invalid[0]);
        first.focus({ preventScroll: true });
        first.closest(".field").scrollIntoView({ block: "center", behavior: KB.scrollBehavior() });
        return;
      }
      onSubmit(Object.fromEntries(new FormData(form)));
    });

    return {
      validate,
      isAttempted: () => attempted,
      reset() {
        attempted = false;
        form.reset();
        names.forEach((name) => setError(name, ""));
      },
    };
  };

  /** Показывает success-состояние: .form-shell получает .is-success */
  KB.showSuccess = (shell, values) => {
    Object.entries(values).forEach(([key, value]) => {
      qsa(`[data-success="${key}"]`, shell).forEach((el) => (el.textContent = value));
    });
    shell.classList.add("is-success");
    const success = qs(".form-success", shell);
    success.focus({ preventScroll: true });
  };

  KB.hideSuccess = (shell) => shell.classList.remove("is-success");

  /* ---------- Карусель ---------- */
  function initCarousel(root) {
    const track = qs(".carousel__track", root);
    const slides = qsa(".carousel__slide", track);
    const prev = qs("[data-carousel-prev]", root);
    const next = qs("[data-carousel-next]", root);
    const dotsWrap = qs(".dots", root);
    if (!track || !slides.length) return;

    let pages = 1;
    let step = 1;

    const metrics = () => {
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      step = slides[0].getBoundingClientRect().width + gap;
      const perView = Math.max(1, Math.round((track.clientWidth + gap) / step));
      pages = Math.max(1, slides.length - perView + 1);
    };

    const currentIndex = () => {
      const max = track.scrollWidth - track.clientWidth;
      if (track.scrollLeft >= max - 4) return pages - 1;
      return Math.min(pages - 1, Math.round(track.scrollLeft / step));
    };

    const goTo = (index) => {
      const i = Math.max(0, Math.min(pages - 1, index));
      track.scrollTo({ left: i * step, behavior: KB.scrollBehavior() });
    };

    function renderDots() {
      dotsWrap.innerHTML = "";
      for (let i = 0; i < pages; i++) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "dot";
        dot.setAttribute("aria-label", `Фото ${i + 1} из ${pages}`);
        dot.addEventListener("click", () => goTo(i));
        dotsWrap.appendChild(dot);
      }
    }

    function sync() {
      const index = currentIndex();
      qsa(".dot", dotsWrap).forEach((dot, i) => dot.setAttribute("aria-current", String(i === index)));
      if (prev) prev.disabled = index <= 0;
      if (next) next.disabled = index >= pages - 1;
    }

    let raf = 0;
    track.addEventListener("scroll", () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(sync);
    }, { passive: true });

    prev && prev.addEventListener("click", () => goTo(currentIndex() - 1));
    next && next.addEventListener("click", () => goTo(currentIndex() + 1));

    track.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(currentIndex() + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(currentIndex() - 1);
      }
    });

    const rebuild = () => {
      metrics();
      renderDots();
      sync();
    };
    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(rebuild, 150);
    });
    rebuild();
  }

  /* ---------- Бронирование стола (общая модалка) ---------- */
  function initBooking() {
    const modalEl = qs("#booking-modal");
    const form = qs("#booking-form");
    const shell = qs("#booking-shell");
    if (!modalEl || !form || !shell) return;

    const dateInput = form.elements.date;
    const timeSelect = form.elements.time;
    const MAX_DAYS_AHEAD = 90;

    const refreshDateLimits = () => {
      const today = KB.startOfToday();
      dateInput.min = KB.toISODate(today);
      dateInput.max = KB.toISODate(KB.addDays(today, MAX_DAYS_AHEAD));
    };

    const timeHasPassed = (dateValue, timeValue) => {
      const d = KB.parseISODate(dateValue);
      if (!d || !timeValue) return false;
      const [h, m] = timeValue.split(":").map(Number);
      d.setHours(h, m, 0, 0);
      return d.getTime() < Date.now() + 30 * 60 * 1000;
    };

    // Для сегодняшней даты отключаем уже прошедшие слоты
    const refreshTimeSlots = () => {
      Array.from(timeSelect.options).forEach((opt) => {
        if (!opt.value) return;
        opt.disabled = timeHasPassed(dateInput.value, opt.value);
      });
    };

    const validator = KB.initForm(form, {
      fields: {
        table: [KB.rules.required("Выберите, где вам удобнее сидеть")],
        guests: [
          KB.rules.required("Укажите количество гостей"),
          KB.rules.intRange(1, 12, "От 1 до 12 гостей. Для большой компании оформите банкет"),
        ],
        date: [
          KB.rules.required("Выберите дату визита"),
          KB.rules.dateFrom(0, MAX_DAYS_AHEAD, {
            early: "Эта дата уже прошла — выберите сегодня или позже",
            late: "Бронируем не дальше чем на 3 месяца вперёд",
          }),
        ],
        time: [
          KB.rules.required("Выберите время"),
          (value, f) =>
            timeHasPassed(f.elements.date.value, value) ? "Это время уже прошло — выберите более позднее" : "",
        ],
        name: [KB.rules.required("Как к вам обращаться?"), KB.rules.name()],
        phone: [KB.rules.required("Укажите телефон для подтверждения"), KB.rules.phone()],
        comment: [KB.rules.maxLength(500)],
      },
      onSubmit(data) {
        const tableLabel = form.elements.table.selectedOptions[0].textContent.trim();
        const date = KB.parseISODate(data.date);
        const guests = Number(data.guests);
        KB.showSuccess(shell, {
          name: data.name.trim(),
          table: tableLabel,
          date: KB.formatDate(date),
          time: data.time,
          guests: `${guests} ${KB.plural(guests, ["гость", "гостя", "гостей"])}`,
          phone: data.phone.trim(),
        });
      },
    });

    dateInput.addEventListener("change", () => {
      refreshTimeSlots();
      if (validator.isAttempted() || timeSelect.value) validator.validate("time");
    });

    modalEl.addEventListener("modal:beforeopen", () => {
      KB.hideSuccess(shell);
      validator.reset();
      refreshDateLimits();
      refreshTimeSlots();
    });
  }

  /* ---------- Прочее ---------- */
  function initYear() {
    qsa("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  function initPdfToasts() {
    document.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-pdf]");
      if (!btn) return;
      event.preventDefault();
      KB.toast({
        title: btn.getAttribute("data-pdf") || "Скачивание PDF",
        text: "PDF-выгрузка подключается на этапе интеграции с бэкендом",
        icon: "i-download",
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initHeader();
    initMobileNav();
    initModals();
    KB.initMedia();
    initReveal();
    qsa("[data-carousel]").forEach(initCarousel);
    initBooking();
    initPdfToasts();
    initYear();
    document.dispatchEvent(new CustomEvent("kb:ready"));
  });
})();
