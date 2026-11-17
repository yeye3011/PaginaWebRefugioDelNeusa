/* ==========================================================================
   FOTOS DE LA GALERÍA
   Para agregar una foto: 1) guarda la imagen en assets/img (mejor en .webp y de menos de 300 KB)
   y 2) agrega una línea nueva a la lista de abajo. Nada más.
     src       ruta de la imagen
     alt       descripción corta (aparece sobre la foto y la leen los lectores de pantalla)
     categoria debe ser uno de los nombres de CATEGORIAS_GALERIA, o uno nuevo que agregues allí
   ========================================================================== */

// Botones de filtro, en este orden (el botón "Todo" y el de "Videos" se agregan solos).
var CATEGORIAS_GALERIA = ["Cabañas", "Paisajes y amaneceres", "Experiencias", "Restaurante"];

var FOTOS_GALERIA = [
  { src: "assets/img/galeria-cabana-bosque.webp", alt: "Cabaña entre el bosque", categoria: "Cabañas" },
  { src: "assets/img/restaurante.webp", alt: "Restaurante del Refugio", categoria: "Restaurante" },
  { src: "assets/img/galeria-amanecer.svg", alt: "Vista del amanecer", categoria: "Paisajes y amaneceres" },
  { src: "assets/img/galeria-letrero.webp", alt: "Letrero de bienvenida", categoria: "Experiencias" },
  { src: "assets/img/galeria-sendero.webp", alt: "Sendero del Refugio", categoria: "Paisajes y amaneceres" },
  { src: "assets/img/galeria-granja.webp", alt: "Experiencia en la granja", categoria: "Experiencias" },
  { src: "assets/img/galeria-paisaje-neusa.webp", alt: "Paisaje del Neusa", categoria: "Paisajes y amaneceres" },
  { src: "assets/img/vista-aerea.webp", alt: "Vista aérea del Refugio", categoria: "Cabañas" },
  { src: "assets/img/potreros.webp", alt: "Potreros del Refugio", categoria: "Experiencias" },
];
