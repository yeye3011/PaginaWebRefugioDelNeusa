/* ==========================================================================
   Galería de fotos: arma las fotos a partir de js/galeria-datos.js, con filtros por
   categoría, "Cargar más fotos" y visor ampliado. Para agregar fotos NO hay que tocar
   este archivo: solo se edita js/galeria-datos.js.
   ========================================================================== */
(function () {
  "use strict";
  var data = window.FOTOS_GALERIA || [];
  var categories = window.CATEGORIAS_GALERIA || [];
  var grid = document.getElementById("gallery-grid");
  var bar = document.getElementById("gallery-filters");
  var more = document.getElementById("gallery-more");
  if (!grid || !bar || !more) return;

  var PAGE = 6;          // fotos que se muestran al inicio y cada vez que se pulsa "Cargar más fotos"
  var filter = "Todo";
  var limit = PAGE;
  var tiles = [];

  // Botones de filtro: Todo, las categorías de galeria-datos.js y Videos (este último hace scroll a los videos)
  var instagram = bar.querySelector("a");
  var buttons = ["Todo"].concat(categories, ["Videos"]).map(function (name) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = name;
    b.setAttribute("data-filter", name);
    b.setAttribute("aria-pressed", String(name === filter));
    if (name === filter) b.className = "active";
    bar.insertBefore(b, instagram);
    return b;
  });

  // Fotos
  data.forEach(function (item) {
    var tile = document.createElement("button");
    tile.type = "button";
    tile.setAttribute("data-category", item.categoria);

    var figure = document.createElement("figure");
    figure.className = "photo";
    var img = document.createElement("img");
    img.src = item.src; img.alt = item.alt; img.loading = "lazy"; img.decoding = "async";
    var caption = document.createElement("figcaption");
    var icon = document.createElement("img");
    icon.className = "icon"; icon.src = "assets/icons/foto.svg"; icon.alt = ""; icon.setAttribute("aria-hidden", "true");
    caption.appendChild(icon);
    caption.appendChild(document.createTextNode(item.alt));
    figure.appendChild(img);
    figure.appendChild(caption);
    tile.appendChild(figure);

    tile.addEventListener("click", function () {
      var visible = tiles.filter(function (t) { return !t.el.hidden; });
      var list = visible.map(function (t) { return { src: t.item.src, alt: t.item.alt }; });
      var start = visible.map(function (t) { return t.el; }).indexOf(tile);
      if (window.Refugio && window.Refugio.viewer) window.Refugio.viewer.open(list, Math.max(0, start));
    });
    grid.appendChild(tile);
    tiles.push({ el: tile, item: item });
  });

  function render() {
    var matching = tiles.filter(function (t) { return filter === "Todo" || t.item.categoria === filter; });
    tiles.forEach(function (t) { t.el.hidden = true; t.el.className = ""; });
    // g1, g2, g3... dan la forma de mosaico a las primeras fotos visibles (ver css/styles.css)
    matching.slice(0, limit).forEach(function (t, i) { t.el.hidden = false; t.el.className = "g" + (i + 1); });
    buttons.forEach(function (b) {
      var on = b.getAttribute("data-filter") === filter;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    more.hidden = matching.length <= limit;
  }

  buttons.forEach(function (b) {
    b.addEventListener("click", function () {
      var name = b.getAttribute("data-filter");
      if (name === "Videos") {
        var videos = document.getElementById("videos");
        if (videos) videos.scrollIntoView(); // el scroll suave lo da el CSS (scroll-behavior)
        return;
      }
      filter = name;
      limit = PAGE;
      render();
    });
  });
  more.addEventListener("click", function () { limit += PAGE; render(); });

  render();
  if (window.Refugio) { window.Refugio.apply(bar); window.Refugio.apply(grid); }
})();
