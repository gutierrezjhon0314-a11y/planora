const KEYS = { favorites: "planora_favoritos", trips: "planora_planes" };
const read = (key) => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } };
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
export const obtenerFavoritos = () => read(KEYS.favorites);
export const esFavorito = (code) => obtenerFavoritos().some(x => x.cca2 === code);
export function alternarFavorito(country) {
  const list = obtenerFavoritos();
  const exists = list.some(x => x.cca2 === country.cca2);
  write(KEYS.favorites, exists ? list.filter(x => x.cca2 !== country.cca2) : [...list, country]);
  return !exists;
}
export const obtenerPlanes = () => read(KEYS.trips);
export const guardarPlanes = (plans) => write(KEYS.trips, plans);
export function agregarPlan(plan) { const plans = obtenerPlanes(); plans.unshift(plan); guardarPlanes(plans); return plans; }
