// ui.js: funciones para dibujar cosas en pantalla y conectar vistas con APIs y storage

import { obtenerPaises, obtenerPais, obtenerClima, obtenerUbicacion } from "./api.js";
import {
  obtenerFavoritos,
  esFavorito,
  alternarFavorito,
  obtenerPlanes,
  agregarPlan
} from "./storage.js";

const REGIONES = {
  Americas: "Américas",
  Europe: "Europa",
  Asia: "Asia",
  Africa: "África",
  Oceania: "Oceanía",
  Antarctic: "Antártida"
};

export function traducirRegion(region) {
  return REGIONES[region] || region;
}

export function formatearPoblacion(numero) {
  return Number(numero || 0).toLocaleString("es-CO");
}

// Crea el HTML de una tarjeta de país
export function crearTarjeta(pais, esFav) {
  return `
    <li>
      <article class="card">
        <div class="card-flag">
          <img src="${pais.bandera}" alt="Bandera de ${pais.nombre}">
        </div>
        <div class="card-body">
          <h3>${pais.nombre}</h3>
          <p><strong>Capital:</strong> ${pais.capital}</p>
          <p><strong>Región:</strong> ${traducirRegion(pais.region)}</p>
          <p><strong>Población:</strong> ${formatearPoblacion(pais.poblacion)}</p>
          <a class="btn" href="detalle.html?code=${encodeURIComponent(pais.cca2)}">Ver detalles</a>
          <button class="btn btn-outline" type="button" data-fav="${pais.cca2}">
            ${esFav ? "Quitar de favoritos" : "Agregar a favoritos"}
          </button>
        </div>
      </article>
    </li>`;
}

// Convierte el código de clima de Open-Meteo en texto
export function describirClima(codigo) {
  if (codigo === 0) return "Despejado";
  if (codigo <= 2) return "Parcialmente nublado";
  if (codigo === 3) return "Nublado";
  if (codigo === 45 || codigo === 48) return "Niebla";
  if (codigo >= 51 && codigo <= 57) return "Llovizna";
  if (codigo >= 61 && codigo <= 67) return "Lluvia";
  if (codigo >= 71 && codigo <= 77) return "Nieve";
  if (codigo >= 80 && codigo <= 82) return "Chubascos";
  if (codigo >= 95) return "Tormenta";
  return "Sin datos";
}

function vincularBotonesFavoritos(contenedor, paisesDisponibles, alCambiar) {
  contenedor.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-fav]");
    if (!boton) return;

    const codigo = boton.dataset.fav;
    const pais = paisesDisponibles.find((item) => item.cca2 === codigo);
    if (!pais) return;

    const guardado = alternarFavorito(pais);
    boton.textContent = guardado ? "Quitar de favoritos" : "Agregar a favoritos";
    if (typeof alCambiar === "function") alCambiar(codigo, guardado);
  });
}

async function iniciarCatalogo(grid, { limite = null, permitirFiltros = false } = {}) {
  const params = new URLSearchParams(window.location.search);
  const queryInicial = (params.get("q") || "").trim().toLowerCase();
  const inputBusqueda = document.getElementById("q");
  const formBusqueda = document.getElementById("form-busqueda");
  const filtrosEl = document.getElementById("filtros-region");
  const estadoEl = document.getElementById("estado-busqueda");

  if (inputBusqueda && queryInicial) {
    inputBusqueda.value = params.get("q");
  }

  let regionActiva = "Todos";
  let textoBusqueda = queryInicial;
  let paises = [];

  try {
    paises = await obtenerPaises();
  } catch (error) {
    if (estadoEl) estadoEl.textContent = error.message;
    return;
  }

  function renderizar() {
    let filtrados = [...paises];

    if (permitirFiltros && regionActiva !== "Todos") {
      filtrados = filtrados.filter(
        (p) => traducirRegion(p.region).toLowerCase() === regionActiva.toLowerCase()
      );
    }

    if (textoBusqueda) {
      filtrados = filtrados.filter(
        (p) =>
          p.nombre.toLowerCase().includes(textoBusqueda) ||
          p.capital.toLowerCase().includes(textoBusqueda) ||
          traducirRegion(p.region).toLowerCase().includes(textoBusqueda)
      );
    }

    if (typeof limite === "number") {
      filtrados = filtrados.slice(0, limite);
    }

    if (estadoEl) {
      estadoEl.textContent = filtrados.length
        ? `Mostrando ${filtrados.length} destino(s).`
        : "No se encontraron destinos con ese criterio.";
    }

    grid.innerHTML = filtrados
      .map((pais) => crearTarjeta(pais, esFavorito(pais.cca2)))
      .join("");
  }

  renderizar();
  vincularBotonesFavoritos(grid, paises);

  if (permitirFiltros && formBusqueda && inputBusqueda) {
    formBusqueda.addEventListener("submit", (e) => {
      e.preventDefault();
      textoBusqueda = inputBusqueda.value.trim().toLowerCase();
      renderizar();
    });
    inputBusqueda.addEventListener("input", () => {
      textoBusqueda = inputBusqueda.value.trim().toLowerCase();
      renderizar();
    });
  }

  if (permitirFiltros && filtrosEl) {
    filtrosEl.addEventListener("click", (e) => {
      const enlace = e.target.closest("a[data-region]");
      if (!enlace) return;
      e.preventDefault();
      regionActiva = enlace.dataset.region;

      filtrosEl.querySelectorAll("a[data-region]").forEach((a) => {
        const esActual = a === enlace;
        a.setAttribute("aria-current", esActual ? "true" : "false");
        a.classList.toggle("active", esActual);
      });

      renderizar();
    });
  }
}

async function iniciarFavoritos(grid) {
  const vacioEl = document.getElementById("estado-vacio");

  function pintar() {
    const favoritos = obtenerFavoritos();
    if (!favoritos.length) {
      grid.innerHTML = "";
      if (vacioEl) vacioEl.hidden = false;