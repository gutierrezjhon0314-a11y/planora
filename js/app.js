import { obtenerPaises, obtenerPais, obtenerClima } from "./api.js";
import { obtenerFavoritos, esFavorito, alternarFavorito, obtenerPlanes, agregarPlan, guardarPlanes } from "./storage.js";

const $ = (s, el=document) => el.querySelector(s);
const regionES = {Americas:"Américas",Europe:"Europa",Asia:"Asia",Africa:"África",Oceania:"Oceanía",Antarctic:"Antártida"};
const fmt = n => Number(n||0).toLocaleString("es-CO");
const safe = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const weather = c => c===0?"Despejado":c<=2?"Parcialmente nublado":c===3?"Nublado":[45,48].includes(c)?"Niebla":c<=57?"Llovizna":c<=67?"Lluvia":c<=77?"Nieve":c<=82?"Chubascos":c>=95?"Tormenta":"Variable";
function toast(msg){let el=$("#toast"); if(!el){el=document.createElement("div");el.id="toast";el.className="toast";document.body.append(el);}el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2300);}
function card(p){return `<li><article class="card"><div class="card-flag">${p.bandera?`<img src="${safe(p.bandera)}" alt="Bandera de ${safe(p.nombre)}" loading="lazy">`:""}</div><div class="card-body"><span class="eyebrow">${safe(regionES[p.region]||p.region)}</span><h3>${safe(p.nombre)}</h3><p><strong>Capital:</strong> ${safe(p.capital)}</p><p><strong>Población:</strong> ${fmt(p.poblacion)}</p><div class="card-actions"><a class="btn" href="detalle.html?code=${encodeURIComponent(p.cca2)}">Ver destino</a><button class="btn btn-outline" type="button" data-fav="${safe(p.cca2)}">${esFavorito(p.cca2)?"♥ Guardado":"♡ Favorito"}</button></div></div></article></li>`;}
function attachFavorites(container, countries){
 container.addEventListener("click",e=>{const b=e.target.closest("[data-fav]");if(!b)return;const p=countries.find(x=>x.cca2===b.dataset.fav);if(!p)return;const added=alternarFavorito(p);b.textContent=added?"♥ Guardado":"♡ Favorito";b.classList.toggle("is-saved",added);if(location.pathname.endsWith("favoritos.html")&&!added){b.closest("li")?.remove();const remaining=obtenerFavoritos().length;if(!remaining&&$("#estado-vacio"))$("#estado-vacio").hidden=false;}toast(added?"Destino guardado en favoritos":"Destino eliminado de favoritos");});
}
async function initCatalog({limit=null,filters=false,favorites=false}={}){
 const grid=$(".grid[data-catalog]")||$(".grid");if(!grid)return;
 const status=$("#estado-busqueda"); if(status)status.textContent="Cargando destinos…";
 try{
  let countries=favorites?obtenerFavoritos():await obtenerPaises();
  if(favorites){const empty=$("#estado-vacio"); if(empty)empty.hidden=countries.length>0;grid.innerHTML=countries.map(card).join("");attachFavorites(grid,countries);return;}
  const q=new URLSearchParams(location.search).get("q")||"";const input=$("#q");if(input)input.value=q;
  let region="Todos", query=q.trim().toLocaleLowerCase("es");
  const render=()=>{let list=countries.filter(p=>(region==="Todos"||(regionES[p.region]||p.region)===region)&&(!query||[p.nombre,p.capital,regionES[p.region]||p.region].join(" ").toLocaleLowerCase("es").includes(query)));if(limit)list=list.slice(0,limit);grid.innerHTML=list.map(card).join("");if(status)status.textContent=`${list.length} destino(s) encontrados`;};
  $("#form-busqueda")?.addEventListener("submit",e=>{e.preventDefault();query=(input?.value||"").trim().toLocaleLowerCase("es");render();});
  input?.addEventListener("input",()=>{query=input.value.trim().toLocaleLowerCase("es");render();});
  $("#filtros-region")?.addEventListener("click",e=>{const b=e.target.closest("[data-region]");if(!b)return;e.preventDefault();region=b.dataset.region;$("#filtros-region").querySelectorAll("[data-region]").forEach(x=>x.classList.toggle("active",x===b));render();});
  render();attachFavorites(grid,countries);
 }catch(err){grid.innerHTML=`<li class="notice">${safe(err.message)} <button class="btn" onclick="location.reload()">Reintentar</button></li>`;if(status)status.textContent="";}
}
async function initDetail(){
 const host=$("#detalle-dinamico");if(!host)return;const code=new URLSearchParams(location.search).get("code");if(!code){host.innerHTML="<p class='notice'>Selecciona un destino desde Explorar.</p>";return;}
 host.innerHTML="<p class='loading'>Cargando información del destino…</p>";
 try{
  const p=await obtenerPais(code);document.title=`${p.nombre} | PLANORA`;
  host.innerHTML=`<section class="detalle-layout"><div class="detalle-info"><span class="eyebrow">${safe(regionES[p.region]||p.region)}</span><h1>${safe(p.nombre)}</h1><ul class="datos"><li><strong>Capital:</strong> ${safe(p.capital)}</li><li><strong>Región:</strong> ${safe(regionES[p.region]||p.region)}</li><li><strong>Población:</strong> ${fmt(p.poblacion)}</li><li><strong>Idiomas:</strong> ${safe(p.idiomas.join(", ")||"No disponible")}</li><li><strong>Moneda:</strong> ${safe(p.monedas.join(", ")||"No disponible")}</li></ul><div class="card-actions"><button class="btn" id="add-trip">Agregar al itinerario</button><button class="btn btn-outline" id="toggle-fav">${esFavorito(p.cca2)?"♥ Guardado":"♡ Guardar favorito"}</button></div></div><div class="detalle-flag"><img src="${safe(p.bandera)}" alt="Bandera de ${safe(p.nombre)}"></div></section><section class="clima"><h2>Clima en ${safe(p.capital)}</h2><div id="weather-box" class="weather-box">Consultando clima…</div></section><section class="mapa-section"><h2>Ubicación del destino</h2><p>${safe(p.nombre)} · ${p.latlng.join(", ")}</p><div id="mapa-destino" class="mapa"></div><a class="btn btn-outline" href="https://www.openstreetmap.org/?mlat=${p.latlng[0]}&mlon=${p.latlng[1]}#map=5/${p.latlng[0]}/${p.latlng[1]}" target="_blank" rel="noopener">Abrir mapa</a></section>`;
  $("#toggle-fav").onclick=()=>{const added=alternarFavorito(p);$("#toggle-fav").textContent=added?"♥ Guardado":"♡ Guardar favorito";toast(added?"Guardado en favoritos":"Eliminado de favoritos");};
  $("#add-trip").onclick=()=>{sessionStorage.setItem("planora_destino",p.nombre);location.href="itinerario.html";};
  const [lat,lon]=p.latlng;if(lat!=null&&lon!=null){if(window.L){const map=L.map("mapa-destino").setView([lat,lon],4);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; OpenStreetMap'}).addTo(map);L.marker([lat,lon]).addTo(map).bindPopup(p.nombre).openPopup();}else $("#mapa-destino").innerHTML=`<a target="_blank" href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}">Ver ${safe(p.nombre)} en OpenStreetMap</a>`;}
  try{const w=await obtenerClima(lat,lon);const c=w.current;const days=w.daily;$("#weather-box").innerHTML=`<div class="weather-current"><strong>${Math.round(c.temperature_2m)}°C</strong><span>${weather(c.weather_code)}</span><small>Viento: ${c.wind_speed_10m} km/h</small></div><div class="weather-days">${days.time.slice(1).map((d,i)=>`<div><b>${new Date(d+"T12:00:00").toLocaleDateString("es",{weekday:"short"})}</b><span>${Math.round(days.temperature_2m_max[i+1])}° / ${Math.round(days.temperature_2m_min[i+1])}°</span><small>Lluvia ${days.precipitation_probability_max[i+1]??0}%</small></div>`).join("")}</div>`;}catch(e){$("#weather-box").textContent="El clima no está disponible en este momento.";}
 }catch(e){host.innerHTML=`<p class="notice">${safe(e.message)}</p>`;}
}
function initTrips(){
 const form=$("#form-plan");if(!form)return;const destination=$("#destino");const saved=sessionStorage.getItem("planora_destino");if(saved&&destination){destination.value=saved;sessionStorage.removeItem("planora_destino");}
 const render=()=>{const list=$("#lista-planes");if(!list)return;const plans=obtenerPlanes();$("#sin-planes").hidden=plans.length>0;list.innerHTML=plans.map((p,i)=>`<article class="trip-card"><div><span class="eyebrow">VIAJE ${plans.length-i}</span><h3>${safe(p.nombre)}</h3><p>📍 ${safe(p.destino)} · ${safe(p.inicio)} al ${safe(p.fin)}</p><p>${p.viajeros} viajero(s) · Presupuesto: ${p.presupuesto?`USD ${fmt(p.presupuesto)}`:"Sin definir"}</p>${p.comentarios?`<p>${safe(p.comentarios)}</p>`:""}</div><button class="btn btn-outline" data-delete="${p.id}">Eliminar</button></article>`).join("");};
 form.addEventListener("submit",e=>{e.preventDefault();const data=Object.fromEntries(new FormData(form));let valid=true;const errors={nombre:!data.nombre.trim(),destino:!data.destino.trim(),inicio:!data.inicio,fin:!data.fin||data.fin<data.inicio,viajeros:!data.viajeros||+data.viajeros<1,presupuesto:data.presupuesto!==""&&+data.presupuesto<0};Object.entries(errors).forEach(([k,bad])=>{const el=$("#error-"+k);if(el)el.hidden=!bad;if(bad)valid=false;});if(!valid){toast("Revisa los campos señalados");return;}agregarPlan({...data,id:crypto.randomUUID?.()||String(Date.now()),viajeros:+data.viajeros,presupuesto:data.presupuesto?+data.presupuesto:0});form.reset();$("#viajeros").value=1;render();toast("¡Tu viaje quedó guardado!");});
 $("#lista-planes")?.addEventListener("click",e=>{const b=e.target.closest("[data-delete]");if(!b)return;guardarPlanes(obtenerPlanes().filter(p=>p.id!==b.dataset.delete));render();toast("Viaje eliminado");});render();
}
document.addEventListener("DOMContentLoaded",()=>{const path=location.pathname;if(path.endsWith("favoritos.html"))initCatalog({favorites:true});else if(path.endsWith("explorar.html"))initCatalog({filters:true});else if(path.endsWith("index.html")||path.endsWith("/"))initCatalog({limit:4});initDetail();initTrips();});
