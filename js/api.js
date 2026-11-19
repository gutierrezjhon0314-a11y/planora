// PLANORA usa countries.dev: API pública sin clave ni registro.
// Documentación: https://countries.dev/docs
const BASE = "https://countries.dev";

function resumirPais(p = {}) {
  const code = p.alpha2Code || p.cca2 || p.iso2 || p.Iso2 || "";
  const flag = p.flags?.png || p.flag || (code ? `https://flagcdn.com/w320/${String(code).toLowerCase()}.png` : "");
  const languages = Array.isArray(p.languages)
    ? p.languages.map(x => typeof x === "string" ? x : x.name).filter(Boolean)
    : Object.values(p.languages || {});
  const currencies = Array.isArray(p.currencies)
    ? p.currencies.map(x => typeof x === "string" ? x : `${x.name || x.code || ""}${x.symbol ? ` (${x.symbol})` : ""}`).filter(Boolean)
    : Object.values(p.currencies || {}).map(x => typeof x === "string" ? x : `${x.name || ""}${x.symbol ? ` (${x.symbol})` : ""}`);
  return {
    cca2: code,
    nombre: p.name?.common || p.name || p.nombre || "Destino",
    capital: Array.isArray(p.capital) ? (p.capital[0] || "Sin capital") : (p.capital || "Sin capital"),
    region: p.region || "Sin región",
    poblacion: Number(p.population ?? p.poblacion ?? 0),
    bandera: flag,
    latlng: p.latlng || p.coordinates || [],
    idiomas: languages,
    monedas: currencies
  };
}

async function solicitar(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`La API respondió con el error ${response.status}. Intenta nuevamente.`);
  return response.json();
}

export async function obtenerPaises() {
  const payload = await solicitar(`${BASE}/countries?limit=300&fields=name,alpha2Code,capital,region,population,flags,flag,latlng,currencies,languages`);
  const rows = Array.isArray(payload) ? payload : (payload.data || payload.countries || []);
  if (!rows.length) throw new Error("La API no devolvió destinos. Comprueba tu conexión e inténtalo otra vez.");
  return rows.map(resumirPais).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export async function obtenerPais(code) {
  const payload = await solicitar(`${BASE}/alpha/${encodeURIComponent(code)}`);
  const country = Array.isArray(payload) ? payload[0] : (payload.data || payload);
  if (!country || !(country.name || country.nombre)) throw new Error("No encontramos ese destino.");
  return resumirPais(country);
}

export async function obtenerClima(lat, lon) {
  if (lat == null || lon == null) throw new Error("Este destino no tiene coordenadas disponibles.");
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=4&timezone=auto`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("No se pudo consultar el clima.");
  return response.json();
}
