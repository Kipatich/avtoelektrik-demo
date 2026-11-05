/* ============================================================
   ВОЛЬТ — интерактив демо-сайта
   Без внешних библиотек. Форма работает в демо-режиме.
   ============================================================ */
(function () {
  "use strict";

  const cfg = window.VOLT_CONFIG || {};
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Config ---------- */
  function applyConfig() {
    if (cfg.brand) $$("[data-brand]").forEach((el) => (el.textContent = cfg.brand));
    if (cfg.tagline) $$("[data-tagline]").forEach((el) => (el.textContent = cfg.tagline));
    if (cfg.phoneDisplay) $$("[data-phone]").forEach((el) => (el.textContent = cfg.phoneDisplay));
    if (cfg.phoneRaw) $$("[data-phone-link]").forEach((el) => (el.href = "tel:" + cfg.phoneRaw));
    if (cfg.whatsapp) $$("[data-wa-link]").forEach((el) => (el.href = "https://wa.me/" + cfg.whatsapp));
    if (cfg.telegram) {
      $$("[data-tg-link]").forEach((el) => (el.href = "https://t.me/" + cfg.telegram));
      const handle = $(".contact-row[data-tg-link] .contact-row__text strong");
      if (handle) handle.textContent = "@" + cfg.telegram;
    }
    if (cfg.city) $$("[data-city]").forEach((el) => (el.textContent = cfg.city));
    if (cfg.cityShort) $$("[data-city-short]").forEach((el) => (el.textContent = cfg.cityShort));
    if (cfg.hours) $$("[data-hours]").forEach((el) => (el.textContent = cfg.hours));
    if (cfg.email) {
      $$("[data-email]").forEach((el) => (el.textContent = cfg.email));
      $$("[data-email-link]").forEach((el) => (el.href = "mailto:" + cfg.email));
    }
    const year = $("#year");
    if (year) year.textContent = new Date().getFullYear();
  }
  applyConfig();

  /* ---------- Header ---------- */
  const header = $("#header");
  let scrollTicking = false;
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(() => {
        onScroll();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = $(".burger");
  const mobileMenu = $("#mobileMenu");
  let lastFocused = null;

  function setMenu(open) {
    if (!burger || !mobileMenu) return;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    mobileMenu.classList.toggle("is-open", open);
    mobileMenu.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("menu-open", open);
    if (open) {
      lastFocused = document.activeElement;
      const first = $("a", mobileMenu);
      if (first) window.setTimeout(() => first.focus(), 120);
    } else if (lastFocused) {
      lastFocused.focus({ preventScroll: true });
    }
  }

  if (burger && mobileMenu) {
    burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
    $$("a", mobileMenu).forEach((link) => link.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (burger.getAttribute("aria-expanded") === "true") setMenu(false);
    });
    // Keep keyboard focus inside the open menu.
    mobileMenu.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const focusable = $$("a, button", mobileMenu).filter((el) => el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }
  window.addEventListener("resize", () => {
    if (window.innerWidth > 960 && document.body.classList.contains("menu-open")) setMenu(false);
  });

  /* ---------- Reveal ---------- */
  const revealItems = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -40px 0px" });
    revealItems.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Counters ---------- */
  const counters = $$("[data-count]");
  function animateCounter(el) {
    const target = Number(el.getAttribute("data-count"));
    const suffix = el.getAttribute("data-suffix") || "";
    if (!Number.isFinite(target)) return;
    if (reduceMotion) {
      el.textContent = target.toLocaleString("ru-RU") + suffix;
      return;
    }
    const duration = 1300;
    const started = performance.now();
    function frame(now) {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = value.toLocaleString("ru-RU") + suffix;
      if (progress < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }
  if (counters.length) {
    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCounter);
    } else {
      const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        });
      }, { threshold: 0.5 });
      counters.forEach((el) => counterObserver.observe(el));
    }
  }

  /* ---------- Active nav link ---------- */
  const navLinks = $$("[data-nav]");
  const navSections = navLinks
    .map((link) => document.getElementById(link.getAttribute("data-nav")))
    .filter(Boolean);

  function updateActiveNav() {
    if (!navSections.length) return;
    const marker = window.innerHeight * 0.35;
    let activeId = "";
    navSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= marker && rect.bottom > marker) activeId = section.id;
    });
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("data-nav") === activeId);
    });
  }

  let navTicking = false;
  window.addEventListener("scroll", () => {
    if (!navTicking) {
      window.requestAnimationFrame(() => {
        updateActiveNav();
        navTicking = false;
      });
      navTicking = true;
    }
  }, { passive: true });
  updateActiveNav();

  /* ---------- Symptoms ---------- */
  const symptoms = {
    "no-start": {
      tag: "Частый случай",
      code: "DIAG / 01",
      title: "Не заводится",
      desc: "Стартер молчит или крутит, но двигатель не схватывает. Причина может быть в питании, стартере, массе или иммобилайзере.",
      causes: ["Аккумулятор", "Стартер", "Реле", "Масса", "Иммобилайзер"],
      action: "Замеряю напряжение и просадку, проверяю цепь стартера и сигнал иммобилайзера. Нахожу точку отказа — не меняю детали по очереди.",
      price: "от 2 500 ₽",
      time: "30–60 мин",
      problem: "Не заводится"
    },
    "check-engine": {
      tag: "Диагностика",
      code: "DIAG / 02",
      title: "Горит Check Engine",
      desc: "Ошибка может означать что угодно — от датчика до плохого контакта. Код неисправности сам по себе не является приговором детали.",
      causes: ["Датчики", "Проводка", "Разъёмы", "Питание", "ЭБУ"],
      action: "Считываю ошибки всех блоков, смотрю параметры в реальном времени и проверяю цепь по схеме. Отличаю реальную неисправность от старой записи в памяти.",
      price: "от 2 000 ₽",
      time: "20–40 мин",
      problem: "Горит Check Engine"
    },
    battery: {
      tag: "Частый случай",
      code: "DIAG / 03",
      title: "Садится аккумулятор",
      desc: "Утром машина не открывается или стартер еле крутит. Новый АКБ не решит проблему, если в сети есть утечка или неисправен заряд.",
      causes: ["Утечка тока", "Генератор", "АКБ", "Магнитола", "Сигнализация"],
      action: "Замеряю ток покоя, по очереди исключаю потребителей и проверяю заряд генератора. Нахожу виновника, а не просто продаю новый аккумулятор.",
      price: "от 2 500 ₽",
      time: "40–90 мин",
      problem: "Садится аккумулятор"
    },
    lights: {
      tag: "Электрика",
      code: "DIAG / 04",
      title: "Не работает свет",
      desc: "Не горят фары, габариты, поворотники или подсветка. Причина может быть в предохранителе, реле, блоке комфорта или проводке.",
      causes: ["Предохранители", "Реле", "Лампы", "Блок комфорта", "Проводка"],
      action: "Проверяю питание и массу на разъёме, исключаю предохранитель и реле, прозваниваю цепь. Меняю только то, что действительно вышло из строя.",
      price: "от 1 800 ₽",
      time: "30–90 мин",
      problem: "Свет или допоборудование"
    },
    alarm: {
      tag: "Безопасность",
      code: "DIAG / 05",
      title: "Глючит сигнализация",
      desc: "Машина не снимается с охраны, срабатывает без причины, не видит метку или блокирует запуск. Здесь важна аккуратность, а не скорость.",
      causes: ["Метка", "Иммобилайзер", "CAN-шина", "Питание", "Блокировка"],
      action: "Проверяю питание и соединения, считываю события блока, проверяю метку и обход иммобилайзера. Штатные функции сохраняю.",
      price: "от 3 000 ₽",
      time: "60–120 мин",
      problem: "Сигнализация или иммобилайзер"
    },
    wiring: {
      tag: "Срочно",
      code: "DIAG / 06",
      title: "Пахнет проводкой",
      desc: "Запах пластмассы, дым, оплавленные разъёмы или предохранитель, который перегорает сразу после замены. Это не то, что стоит откладывать.",
      causes: ["Короткое замыкание", "Перегруз", "Оплавление", "Плохой контакт", "Допоборудование"],
      action: "Обесточиваю повреждённый участок, ищу место короткого замыкания и причину перегрева. Восстанавливаю проводку по схеме, с защитой цепи.",
      price: "от 2 500 ₽",
      time: "срочный выезд",
      problem: "Проблема с проводкой"
    }
  };

  const symptomTabs = $$(".symptom-tab");
  const symptomPanel = $("#symptomPanel");
  const symptomTitle = $("#symptomTitle");
  const symptomDesc = $("#symptomDesc");
  const symptomCode = $("#symptomCode");
  const symptomCauses = $("#symptomCauses");
  const symptomAction = $("#symptomAction");
  const symptomPrice = $("#symptomPrice");
  const symptomTime = $("#symptomTime");
  const symptomTag = symptomPanel ? $(".tag", symptomPanel) : null;
  let activeSymptom = "no-start";

  function renderSymptom(key) {
    const data = symptoms[key];
    if (!data || !symptomPanel) return;
    activeSymptom = key;
    symptomTabs.forEach((tab) => {
      const active = tab.getAttribute("data-symptom") === key;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    if (symptomTag) symptomTag.textContent = data.tag;
    symptomCode.textContent = data.code;
    symptomTitle.textContent = data.title;
    symptomDesc.textContent = data.desc;
    symptomAction.textContent = data.action;
    symptomPrice.textContent = data.price;
    symptomTime.textContent = data.time;
    symptomCauses.replaceChildren(
      ...data.causes.map((cause) => {
        const li = document.createElement("li");
        li.textContent = cause;
        return li;
      })
    );
  }

  if (symptomTabs.length) {
    symptomTabs.forEach((tab, index) => {
      tab.tabIndex = index === 0 ? 0 : -1;
      tab.addEventListener("click", () => renderSymptom(tab.getAttribute("data-symptom")));
      tab.addEventListener("keydown", (event) => {
        const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        let nextIndex = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % symptomTabs.length;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + symptomTabs.length) % symptomTabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = symptomTabs.length - 1;
        const next = symptomTabs[nextIndex];
        next.focus();
        renderSymptom(next.getAttribute("data-symptom"));
      });
    });
    renderSymptom(activeSymptom);
  }

  /* ---------- Prefill form from CTA ---------- */
  const problemSelect = $("#problem");
  const commentField = $("#comment");
  const nameField = $("#name");

  function prefill(problem, note) {
    if (!problemSelect) return;
    const options = Array.from(problemSelect.options);
    const match = options.find((option) => option.textContent === problem);
    problemSelect.value = match ? match.value : "Другое";
    if (commentField && note && !commentField.value.trim()) commentField.value = note;
  }

  const symptomLead = $("[data-symptom-lead]");
  if (symptomLead) {
    symptomLead.addEventListener("click", () => {
      const data = symptoms[activeSymptom];
      if (data) prefill(data.problem, "Интересует: " + data.title.toLowerCase());
    });
  }

  $$("[data-service]").forEach((link) => {
    link.addEventListener("click", () => {
      const service = link.getAttribute("data-service");
      const map = {
        "Компьютерная диагностика": "Горит Check Engine",
        "Ремонт стартера или генератора": "Не заводится",
        "Поиск утечки тока": "Садится аккумулятор",
        "Ремонт проводки и разъёмов": "Проблема с проводкой",
        "Сигнализация или иммобилайзер": "Сигнализация или иммобилайзер",
        "Свет или дополнительное оборудование": "Свет или допоборудование"
      };
      prefill(map[service] || "Другое", "Интересует услуга: " + service.toLowerCase());
    });
  });

  /* ---------- Phone mask ---------- */
  const phoneField = $("#phone");
  function formatPhone(raw) {
    let digits = String(raw).replace(/\D/g, "");
    if (!digits) return "";
    if (digits[0] === "8") digits = "7" + digits.slice(1);
    if (digits[0] !== "7") digits = "7" + digits;
    digits = digits.slice(0, 11);
    let out = "+7";
    if (digits.length > 1) out += " (" + digits.slice(1, 4);
    if (digits.length >= 4) out += ") " + digits.slice(4, 7);
    if (digits.length >= 7) out += "-" + digits.slice(7, 9);
    if (digits.length >= 9) out += "-" + digits.slice(9, 11);
    return out;
  }
  if (phoneField) {
    phoneField.addEventListener("input", () => {
      const atEnd = phoneField.selectionStart === phoneField.value.length;
      phoneField.value = formatPhone(phoneField.value);
      if (atEnd) phoneField.setSelectionRange(phoneField.value.length, phoneField.value.length);
      clearError("phone");
    });
    phoneField.addEventListener("focus", () => {
      if (!phoneField.value) phoneField.value = "+7 (";
    });
    phoneField.addEventListener("blur", () => {
      if (phoneField.value.replace(/\D/g, "").length <= 1) phoneField.value = "";
    });
  }

  /* ---------- Form validation ---------- */
  const form = $("#leadForm");
  const successPanel = $("#formSuccess");
  const submitBtn = $("#submitBtn");
  const toast = $("#tgToast");
  const toastBody = $("#toastBody");
  let toastTimer = null;

  function setError(name, message) {
    const input = form ? form.elements[name] : null;
    const error = form ? $(`[data-error-for="${name}"]`, form) : null;
    if (error) error.textContent = message;
    if (input) {
      input.classList.add("is-invalid");
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", "error-" + name);
      if (error) error.id = "error-" + name;
    }
  }

  function clearError(name) {
    if (!form) return;
    const input = form.elements[name];
    const error = $(`[data-error-for="${name}"]`, form);
    if (error) error.textContent = "";
    if (input) {
      input.classList.remove("is-invalid");
      input.removeAttribute("aria-invalid");
    }
  }

  function validate(data) {
    let firstInvalid = null;
    if (data.name.trim().length < 2) {
      setError("name", "Напишите, как к вам обращаться");
      firstInvalid = firstInvalid || form.elements.name;
    } else clearError("name");

    const digits = data.phone.replace(/\D/g, "");
    if (digits.length !== 11 || digits[0] !== "7") {
      setError("phone", "Введите номер полностью");
      firstInvalid = firstInvalid || form.elements.phone;
    } else clearError("phone");

    if (!data.problem) {
      setError("problem", "Выберите, что происходит");
      firstInvalid = firstInvalid || form.elements.problem;
    } else clearError("problem");

    if (!data.consent) {
      setError("consent", "Нужно согласие на обработку данных");
      firstInvalid = firstInvalid || form.elements.consent;
    } else clearError("consent");

    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: true });
      const rect = firstInvalid.getBoundingClientRect();
      if (rect.top < 100 || rect.bottom > window.innerHeight - 80) {
        firstInvalid.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      }
    }
    return !firstInvalid;
  }

  function makeId() {
    const stored = getLeads();
    const max = stored.reduce((highest, lead) => {
      const number = Number(String(lead.id || "").replace(/\D/g, ""));
      return Number.isFinite(number) ? Math.max(highest, number) : highest;
    }, 2400);
    return "V-" + (max + 1);
  }

  function getLeads() {
    try {
      const raw = window.localStorage.getItem("volt_demo_leads");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function saveLead(lead) {
    try {
      const leads = getLeads();
      leads.unshift(lead);
      window.localStorage.setItem("volt_demo_leads", JSON.stringify(leads.slice(0, 20)));
    } catch (error) {
      /* localStorage may be unavailable — the demo still works. */
    }
  }

  function addSummaryRow(label, value) {
    const row = document.createElement("div");
    const key = document.createElement("span");
    const val = document.createElement("b");
    key.textContent = label;
    val.textContent = value;
    row.append(key, val);
    return row;
  }

  function showSuccess(lead, live) {
    if (!form || !successPanel) return;
    form.hidden = true;
    successPanel.hidden = false;
    const eyebrow = $("#successEyebrow");
    const title = $("#successTitle");
    const text = $("#successText");
    if (live) {
      if (eyebrow) eyebrow.textContent = "Заявка отправлена";
      if (title) title.textContent = "Скоро свяжусь с вами";
      if (text) text.textContent = "Заявка ушла мастеру. Перезвоню в течение 15 минут, уточню детали и назову ориентир по стоимости.";
    }
    const summary = $("#successSummary");
    if (summary) {
      summary.replaceChildren(
        addSummaryRow("Номер", lead.id),
        addSummaryRow("Имя", lead.name),
        addSummaryRow("Телефон", lead.phone),
        addSummaryRow("Авто", lead.car || "не указано"),
        addSummaryRow("Проблема", lead.problem)
      );
    }
    showToast(lead, "Новая заявка");
    successPanel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }

  function showToast(lead, title) {
    if (!toast || !toastBody) return;
    const heading = document.createElement("div");
    heading.className = "tg-toast__heading";
    const strong = document.createElement("b");
    strong.textContent = title + " " + lead.id;
    heading.append(strong);

    const lines = [
      ["Имя", lead.name],
      ["Телефон", lead.phone],
      ["Авто", lead.car || "не указано"],
      ["Проблема", lead.problem],
      ["Комментарий", lead.comment || "—"]
    ];
    toastBody.replaceChildren(heading);
    lines.forEach(([label, value]) => {
      const row = document.createElement("div");
      row.className = "tg-line";
      const key = document.createElement("span");
      const val = document.createElement("strong");
      key.textContent = label;
      val.textContent = value;
      row.append(key, val);
      toastBody.append(row);
    });
    toast.classList.add("is-visible");
    toast.setAttribute("aria-hidden", "false");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
      toast.setAttribute("aria-hidden", "true");
    }, 10000);
  }

  function resetSubmitButton() {
    if (!submitBtn) return;
    submitBtn.disabled = false;
    const span = $("span", submitBtn);
    if (span) span.textContent = "Отправить заявку";
  }

  function showFormError(message) {
    const error = $("#formError");
    if (!error) return;
    error.textContent = message;
    error.hidden = false;
  }

  function resetForm() {
    if (!form || !successPanel) return;
    form.reset();
    form.hidden = false;
    successPanel.hidden = true;
    ["name", "phone", "problem", "consent"].forEach(clearError);
    const formError = $("#formError");
    if (formError) {
      formError.hidden = true;
      formError.textContent = "";
    }
    resetSubmitButton();
    if (nameField) nameField.focus({ preventScroll: true });
  }

  if (form) {
    ["name", "phone", "problem", "consent"].forEach((name) => {
      const input = form.elements[name];
      if (!input) return;
      const eventName = input.type === "checkbox" ? "change" : "input";
      input.addEventListener(eventName, () => clearError(name));
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = {
        name: form.elements.name.value.trim(),
        phone: form.elements.phone.value.trim(),
        car: form.elements.car.value.trim(),
        problem: form.elements.problem.value,
        comment: form.elements.comment.value.trim(),
        consent: form.elements.consent.checked
      };
      if (!validate(data)) return;

      const formError = $("#formError");
      if (formError) {
        formError.hidden = true;
        formError.textContent = "";
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        const span = $("span", submitBtn);
        if (span) span.textContent = "Отправляем…";
      }

      const lead = {
        ...data,
        id: makeId(),
        createdAt: new Date().toISOString()
      };
      const endpoint = typeof cfg.leadEndpoint === "string" ? cfg.leadEndpoint.trim() : "";

      function complete(live) {
        lead.demo = !live;
        saveLead(lead);
        showSuccess(lead, live);
      }

      if (endpoint) {
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({
            name: lead.name,
            phone: lead.phone,
            car: lead.car,
            problem: lead.problem,
            comment: lead.comment,
            consent: lead.consent,
            id: lead.id,
            page: window.location.href
          })
        })
          .then((response) => {
            if (!response.ok) throw new Error("HTTP " + response.status);
            complete(true);
          })
          .catch(() => {
            resetSubmitButton();
            showFormError("Не получилось отправить заявку. Позвоните " + (cfg.phoneDisplay || "мастеру") + " — так быстрее.");
          });
      } else {
        window.setTimeout(() => complete(false), reduceMotion ? 50 : 650);
      }
    });
  }

  const sampleButton = $("#sampleNotification");
  if (sampleButton) {
    sampleButton.addEventListener("click", () => {
      showToast({
        id: "V-2417",
        name: "Алексей",
        phone: "+7 (999) 123-45-67",
        car: "Kia Rio, 2018",
        problem: "Не заводится",
        comment: "Стоит во дворе, стартер не крутит. Прикуривал — не помогло."
      }, "Новая заявка");
    });
  }

  const closeToast = $("#closeToast");
  if (closeToast && toast) {
    closeToast.addEventListener("click", () => {
      toast.classList.remove("is-visible");
      toast.setAttribute("aria-hidden", "true");
      window.clearTimeout(toastTimer);
    });
  }

  const showSaved = $("#showSavedNotification");
  if (showSaved) {
    showSaved.addEventListener("click", () => {
      const leads = getLeads();
      if (leads.length) showToast(leads[0], "Новая заявка");
    });
  }

  const newRequest = $("#newRequest");
  if (newRequest) newRequest.addEventListener("click", resetForm);

  /* ---------- Privacy modal ---------- */
  const privacyDialog = $("#privacyDialog");
  if (privacyDialog) {
    $$("[data-open-privacy]").forEach((button) => {
      button.addEventListener("click", () => {
        if (typeof privacyDialog.showModal === "function") {
          privacyDialog.showModal();
          document.body.classList.add("dialog-open");
        }
      });
    });
    const closePrivacy = () => {
      privacyDialog.close();
      document.body.classList.remove("dialog-open");
    };
    $$("[data-close-privacy]").forEach((button) => button.addEventListener("click", closePrivacy));
    privacyDialog.addEventListener("click", (event) => {
      if (event.target === privacyDialog) closePrivacy();
    });
    privacyDialog.addEventListener("close", () => document.body.classList.remove("dialog-open"));
  }

  /* ---------- Footer year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
