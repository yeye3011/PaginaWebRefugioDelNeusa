/* ==========================================================================
   Refugio del Neusa · comportamiento del sitio (JavaScript puro, sin librerías)
   Cada bloque se activa solo si encuentra sus elementos en la página.
   Orden: configuración, utilidades, idiomas, ventanas y visor de fotos, menú,
   reservas, filtros de habitaciones, preguntas frecuentes y formulario.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- Configuración (lo único que probablemente necesites cambiar) ---------- */
  var WHATSAPP = "https://wa.me/573157660292";

  // Dirección a la que se envía el formulario de contacto (por ejemplo la de Formspree,
  // Getform o tu propio servidor). Si se deja vacío, el formulario solo SIMULA el envío:
  // valida y muestra el mensaje de éxito, pero no manda el mensaje a ningún lado.
  var FORM_ENDPOINT = "";

  /* ---------- Utilidades ---------- */
  function $(selector, root) { return (root || document).querySelector(selector); }
  function $$(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) { /* el navegador puede bloquear el almacenamiento: no pasa nada */ }
    return null;
  }

  /* ==========================================================================
     IDIOMAS (Español, English, Português, Français)
     El sitio está escrito en español. Los textos se traducen en el navegador usando
     el diccionario de js/traducciones.js (la clave es el texto en español).
     Lo que no esté en el diccionario se queda en español.
     ========================================================================== */
  var LANGS = {
    es: { code: "ES", locale: "es-CO" },
    en: { code: "EN", locale: "en-US" },
    pt: { code: "PT", locale: "pt-BR" },
    fr: { code: "FR", locale: "fr-FR" }
  };
  var DICT = window.TRADUCCIONES || {};
  var LANG_KEY = "refugio-idioma";
  var ATTRS = ["alt", "placeholder", "aria-label", "title"];
  var currentLang = "es";
  var originals = typeof WeakMap === "function" ? new WeakMap() : null;

  function norm(text) { return String(text).replace(/\s+/g, " ").trim(); }
  function translateKey(key, lang) {
    if (lang === "es") return key;
    var entry = DICT[key];
    return (entry && entry[lang]) || key;
  }
  // Traduce un texto en español al idioma activo (para textos que arma el JavaScript).
  function t(text) { return translateKey(norm(text), currentLang); }

  function isSkipped(node) {
    var el = node.nodeType === 1 ? node : node.parentElement;
    return !!(el && el.closest && el.closest("[data-i18n-skip]"));
  }

  // Recorre el contenido de `root` y traduce textos y atributos (alt, placeholder, aria-label, title).
  function applyLanguage(root) {
    root = root || document.body;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [], node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(function (n) {
      var parent = n.parentNode;
      if (!parent || /^(SCRIPT|STYLE|NOSCRIPT|TITLE)$/.test(parent.nodeName)) return;
      var known = originals.get(n);
      if (known === undefined && !/[A-Za-zÀ-ÿ]/.test(n.nodeValue)) return;
      if (isSkipped(n)) return;
      var original = known === undefined ? n.nodeValue : known;
      if (known === undefined) originals.set(n, original);
      var key = norm(original), out = translateKey(key, currentLang);
      if (out === key) { if (n.nodeValue !== original) n.nodeValue = original; return; }
      n.nodeValue = original.match(/^\s*/)[0] + out + original.match(/\s*$/)[0];
    });

    var withAttrs = $$("[alt],[placeholder],[aria-label],[title]", root);
    if (root.nodeType === 1) withAttrs.unshift(root);
    withAttrs.forEach(function (el) {
      if (isSkipped(el)) return;
      ATTRS.forEach(function (attr) {
        if (!el.hasAttribute(attr)) return;
        var saved = "data-es-" + attr;
        if (!el.hasAttribute(saved)) {
          if (!el.getAttribute(attr)) return;
          el.setAttribute(saved, el.getAttribute(attr));
        }
        var key = norm(el.getAttribute(saved)), out = translateKey(key, currentLang);
        el.setAttribute(attr, out === key ? el.getAttribute(saved) : out);
      });
    });
  }

  function applyHead() {
    var title = $("title");
    if (title) {
      if (!title.hasAttribute("data-es")) title.setAttribute("data-es", title.textContent);
      var k = norm(title.getAttribute("data-es")), o = translateKey(k, currentLang);
      document.title = o === k ? title.getAttribute("data-es") : o;
    }
    $$('meta[name="description"], meta[property="og:title"], meta[property="og:description"]').forEach(function (m) {
      if (!m.hasAttribute("data-es")) m.setAttribute("data-es", m.getAttribute("content"));
      var key = norm(m.getAttribute("data-es")), out = translateKey(key, currentLang);
      m.setAttribute("content", out === key ? m.getAttribute("data-es") : out);
    });
  }

  function setLanguage(lang, remember) {
    if (!LANGS[lang]) lang = "es";
    currentLang = lang;
    document.documentElement.lang = lang;
    if (originals) { applyLanguage(document.body); applyHead(); }
    $$("[data-lang]").forEach(function (b) { b.setAttribute("aria-current", String(b.getAttribute("data-lang") === lang)); });
    var code = $(".language__code");
    if (code) code.textContent = LANGS[lang].code;
    if (remember) store(LANG_KEY, lang);
    document.dispatchEvent(new CustomEvent("refugio:lang", { detail: { lang: lang } }));
  }

  // Menú desplegable de idioma (barra superior) y botones de idioma del menú móvil
  (function initLanguageSwitch() {
    var wrap = $("#lang-switch");
    var button = wrap && $(".language__btn", wrap);
    var menu = $("#lang-menu");

    function setMenu(open) {
      if (!menu) return;
      menu.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
    }
    if (button) {
      button.addEventListener("click", function () { setMenu(menu.hidden); });
      document.addEventListener("click", function (e) { if (menu && !menu.hidden && !wrap.contains(e.target)) setMenu(false); });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && menu && !menu.hidden) { setMenu(false); button.focus(); }
      });
    }
    document.addEventListener("click", function (e) {
      var option = e.target.closest && e.target.closest("[data-lang]");
      if (!option) return;
      setLanguage(option.getAttribute("data-lang"), true);
      setMenu(false);
    });
  })();

  /* ==========================================================================
     VENTANAS (reserva, políticas) Y VISOR DE FOTOS
     ========================================================================== */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
  var openDialog = null; // { el, opener }

  function openModal(el) {
    if (!el) return;
    closeModal();
    openDialog = { el: el, opener: document.activeElement };
    el.hidden = false;
    document.documentElement.classList.add("is-locked");
    var first = $("[data-close]", el) || $(FOCUSABLE, el);
    if (first) first.focus();
  }

  function closeModal() {
    if (!openDialog) return;
    openDialog.el.hidden = true;
    document.documentElement.classList.remove("is-locked");
    if (openDialog.opener && openDialog.opener.focus) openDialog.opener.focus();
    openDialog = null;
  }

  // Cerrar con clic en el fondo, en cualquier botón [data-close] o con Escape; mantener el foco dentro.
  document.addEventListener("click", function (e) {
    if (!openDialog) return;
    var el = openDialog.el;
    var onBackdrop = e.target === el || (e.target.classList && e.target.classList.contains("lightbox__stage"));
    if (onBackdrop || (e.target.closest && e.target.closest("[data-close]") && el.contains(e.target))) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (!openDialog) return;
    if (e.key === "Escape") { closeModal(); return; }
    if (e.key === "Tab") {
      var items = $$(FOCUSABLE, openDialog.el).filter(function (n) { return !n.hidden && n.offsetParent !== null; });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Visor de fotos: varias imágenes con flechas, miniaturas, teclado y deslizar con el dedo.
  var viewer = (function () {
    var box = $("#lightbox");
    if (!box) return null;
    var img = $(".lightbox__stage img", box), count = $(".lightbox__count", box), thumbs = $(".lightbox__thumbs", box);
    var prev = $(".lightbox__prev", box), next = $(".lightbox__next", box);
    var items = [], index = 0;

    function show(i) {
      index = (i + items.length) % items.length;
      var item = items[index];
      img.src = item.src;
      img.alt = t(item.alt || "Vista ampliada del Refugio");
      count.textContent = items.length > 1 ? (index + 1) + " / " + items.length : "";
      $$("button", thumbs).forEach(function (b, n) { b.setAttribute("aria-current", String(n === index)); });
    }

    function open(list, start) {
      items = list;
      var many = items.length > 1;
      prev.hidden = next.hidden = thumbs.hidden = !many;
      thumbs.innerHTML = "";
      if (many) {
        items.forEach(function (item, n) {
          var b = document.createElement("button");
          b.type = "button";
          b.setAttribute("data-i18n-skip", "");
          b.setAttribute("aria-label", t("Foto") + " " + (n + 1));
          var thumb = document.createElement("img");
          thumb.src = item.src; thumb.alt = ""; thumb.loading = "lazy";
          b.appendChild(thumb);
          b.addEventListener("click", function () { show(n); });
          thumbs.appendChild(b);
        });
      }
      show(start || 0);
      openModal(box);
    }

    prev.addEventListener("click", function () { show(index - 1); });
    next.addEventListener("click", function () { show(index + 1); });
    document.addEventListener("keydown", function (e) {
      if (!openDialog || openDialog.el !== box || items.length < 2) return;
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    });
    var startX = null;
    box.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", function (e) {
      if (startX === null || items.length < 2) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      startX = null;
    });

    // "Ver fotos" de las habitaciones: data-lightbox="foto1|foto2|foto3"
    document.addEventListener("click", function (e) {
      var trigger = e.target.closest && e.target.closest("[data-lightbox]");
      if (!trigger) return;
      var alt = trigger.getAttribute("data-lightbox-alt") || "";
      open(trigger.getAttribute("data-lightbox").split("|").map(function (src) { return { src: src, alt: alt }; }), 0);
    });
    return { open: open };
  })();

  // Se comparte con galeria.js
  window.Refugio = { t: t, apply: applyLanguage, viewer: viewer, lang: function () { return currentLang; } };

  /* ---------- Menú móvil ---------- */
  (function initNav() {
    var toggle = $(".hamburger");
    var nav = $("#main-navigation");
    if (!toggle || !nav) return;
    function setOpen(open) {
      nav.classList.toggle("navlinks--open", open);
      toggle.setAttribute("aria-expanded", String(open));
    }
    toggle.addEventListener("click", function () { setOpen(toggle.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
    window.addEventListener("resize", function () { if (window.innerWidth > 900) setOpen(false); });
  })();

  /* ==========================================================================
     RESERVA POR WHATSAPP Y POLÍTICAS
     ========================================================================== */
  var reserveModal = $("#reserve-modal");
  var policyModal = $("#policy-modal");
  var GUESTS_ES = { "2": "2 adultos · 0 niños", "4": "4 huéspedes", "6": "6 huéspedes" };

  // details: { dates, guests, type } en español, para el mensaje que le llega al Refugio;
  // details.summary es el texto (ya en el idioma del visitante) que se muestra en la ventana.
  function openReserve(room, details) {
    if (!reserveModal) return;
    var title = $("#reserve-title", reserveModal);
    var summary = $("#reserve-summary", reserveModal);
    var link = $("#reserve-whatsapp", reserveModal);
    title.textContent = room ? t("Consulta") + " " + t(room) : t("Planea tu escapada");
    var text = "Hola, quiero consultar disponibilidad";
    if (room) text += " para " + room;
    if (details && details.dates) text += " " + details.dates;
    if (details && details.guests) text += " para " + details.guests;
    text += ".";
    if (details && details.type) text += " Alojamiento: " + details.type + ".";
    link.href = WHATSAPP + "?text=" + encodeURIComponent(text);
    if (details && details.summary) { summary.textContent = details.summary; summary.hidden = false; }
    else summary.hidden = true;
    openModal(reserveModal);
  }

  document.addEventListener("click", function (e) {
    var reserve = e.target.closest && e.target.closest("[data-reserve]");
    if (reserve) { openReserve(reserve.getAttribute("data-room") || ""); return; }

    var policy = e.target.closest && e.target.closest("[data-policy]");
    if (policy && policyModal) {
      var name = policy.getAttribute("data-policy");
      $("#policy-title", policyModal).textContent = t(name);
      $("#policy-mail", policyModal).href = "mailto:info@refugiodelneusa.com?subject=" + encodeURIComponent("Solicitud: " + name);
      openModal(policyModal);
    }
  });

  /* ---------- Fechas de la barra de reservas (inicio) ---------- */
  (function initBookingBar() {
    var form = $("#booking-bar");
    if (!form) return;
    var arrival = form.elements.arrival, departure = form.elements.departure;

    function iso(d) {
      var m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
      return d.getFullYear() + "-" + m + "-" + day;
    }
    function addDays(value, n) {
      var d = new Date(value + "T00:00:00"); d.setDate(d.getDate() + n); return iso(d);
    }
    function pretty(value, locale) {
      return new Date(value + "T00:00:00").toLocaleDateString(locale, { day: "numeric", month: "long" });
    }

    var today = iso(new Date());
    arrival.min = today;
    // Si las fechas de ejemplo ya pasaron, se ajustan a una semana desde hoy.
    if (!arrival.value || arrival.value < today) arrival.value = addDays(today, 7);
    if (!departure.value || departure.value <= arrival.value) departure.value = addDays(arrival.value, 2);
    departure.min = addDays(arrival.value, 1);

    arrival.addEventListener("change", function () {
      departure.min = arrival.value ? addDays(arrival.value, 1) : today;
      if (arrival.value && (!departure.value || departure.value <= arrival.value)) departure.value = addDays(arrival.value, 1);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var dates = "", summary = [];
      if (arrival.value && departure.value) {
        dates = "del " + pretty(arrival.value, "es-CO") + " al " + pretty(departure.value, "es-CO");
        var locale = LANGS[currentLang].locale;
        summary.push(pretty(arrival.value, locale) + " – " + pretty(departure.value, locale));
      }
      var guestsSelect = form.elements.guests;
      summary.push(guestsSelect.options[guestsSelect.selectedIndex].text);
      var type = form.elements.type.value;
      openReserve("", {
        dates: dates,
        guests: GUESTS_ES[guestsSelect.value] || "",
        type: type === "Todos los tipos" ? "" : type,
        summary: summary.join(" · ")
      });
    });
  })();

  /* ---------- Filtros de habitaciones ---------- */
  (function initRoomFilters() {
    var cards = $$(".room-card");
    var buttons = $$(".filterbar [data-filter]");
    if (!cards.length || !buttons.length) return;
    var count = $("#room-count"), empty = $("#room-empty");
    var shown = cards.length;

    function renderCount() {
      count.textContent = shown + " " + t("alojamientos · tarifas por noche, más impuestos");
    }
    function apply(filter) {
      shown = 0;
      cards.forEach(function (card) {
        var match = filter === "Todas" || card.getAttribute("data-categories").split(",").indexOf(filter) !== -1;
        card.hidden = !match;
        if (match) shown++;
      });
      buttons.forEach(function (b) {
        var on = b.getAttribute("data-filter") === filter;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      renderCount();
      count.hidden = shown === 0;
      empty.hidden = shown !== 0;
    }
    buttons.forEach(function (b) { b.addEventListener("click", function () { apply(b.getAttribute("data-filter")); }); });
    document.addEventListener("refugio:lang", renderCount);
  })();

  /* ---------- Preguntas frecuentes (se abre una a la vez) ---------- */
  (function initFaq() {
    var items = $$(".accordion article");
    if (!items.length) return;
    function set(item, open) {
      var button = $("button", item), answer = $("p", item);
      button.setAttribute("aria-expanded", String(open));
      $("span", button).textContent = open ? "−" : "+";
      answer.hidden = !open;
    }
    items.forEach(function (item) {
      $("button", item).addEventListener("click", function () {
        var willOpen = $("button", item).getAttribute("aria-expanded") !== "true";
        items.forEach(function (other) { set(other, false); });
        set(item, willOpen);
      });
    });
  })();

  /* ---------- Formulario de contacto ---------- */
  (function initContactForm() {
    var form = $("#contact-form");
    if (!form) return;
    var submit = $("button[type=submit]", form);
    var success = $("#form-success");
    var fields = ["name", "email", "phone", "message", "privacy"];
    var sending = false, successKey = "", successIsError = false;

    function renderSubmit() { submit.textContent = sending ? t("Enviando…") : t("Enviar mensaje"); }
    function renderSuccess() {
      if (successKey) success.textContent = t(successKey);
    }

    function validate(data) {
      var errors = {};
      if (!String(data.get("name") || "").trim()) errors.name = "Escribe tu nombre.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.get("email") || "").trim())) errors.email = "Escribe un correo válido.";
      var phone = String(data.get("phone") || "").trim();
      if (phone && !/^\+?[0-9\s]{7,16}$/.test(phone)) errors.phone = "Escribe un teléfono válido.";
      if (!String(data.get("message") || "").trim()) errors.message = "Cuéntanos cómo podemos ayudarte.";
      if (!data.get("privacy")) errors.privacy = "Debes aceptar la política de datos.";
      return errors;
    }

    function showErrors(errors) {
      var firstInvalid = null;
      fields.forEach(function (name) {
        var input = form.elements[name], msg = $("#err-" + name);
        var key = errors[name];
        msg.setAttribute("data-key", key || "");
        msg.textContent = key ? t(key) : "";
        msg.hidden = !key;
        input.setAttribute("aria-invalid", key ? "true" : "false");
        if (key && !firstInvalid) firstInvalid = input;
      });
      return firstInvalid;
    }

    function setSending(value) {
      sending = value;
      submit.disabled = value;
      renderSubmit();
    }

    function showMessage(key, isError) {
      successKey = key;
      success.hidden = false;
      if (isError) { success.style.background = "#fbe3df"; success.style.color = "#8a2a1c"; }
      renderSuccess();
    }

    function done() {
      setSending(false);
      form.reset();
      showMessage("Gracias. Recibimos tu mensaje y te responderemos muy pronto.", false);
    }

    function fail() {
      setSending(false);
      showMessage("No pudimos enviar tu mensaje. Escríbenos por WhatsApp o inténtalo de nuevo en unos minutos.", true);
    }

    // Al cambiar de idioma se vuelven a escribir los textos que arma el JavaScript
    document.addEventListener("refugio:lang", function () {
      renderSubmit();
      renderSuccess();
      fields.forEach(function (name) {
        var msg = $("#err-" + name), key = msg.getAttribute("data-key");
        if (key) msg.textContent = t(key);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      success.hidden = true;
      success.removeAttribute("style");
      successKey = "";
      var data = new FormData(form);
      var errors = validate(data);
      var firstInvalid = showErrors(errors);
      if (firstInvalid) { firstInvalid.focus(); return; }

      setSending(true);
      if (!FORM_ENDPOINT) { setTimeout(done, 900); return; } // modo simulado

      fetch(FORM_ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (res) { if (res.ok) done(); else fail(); })
        .catch(fail);
    });
  })();

  /* ---------- Arranque: idioma guardado (o español) ---------- */
  var saved = store(LANG_KEY);
  setLanguage(saved && LANGS[saved] ? saved : "es", false);
})();
