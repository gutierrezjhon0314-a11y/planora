# PLANORA – aplicación web de viajes

## Funciones
- Catálogo de países conectado a countries.dev.
- Búsqueda por país, capital o región y filtros por continente.
- Detalle dinámico de cada país: bandera, capital, población, idiomas y moneda.
- Favoritos guardados en el navegador mediante localStorage.
- Creación, consulta y eliminación de itinerarios con fechas, viajeros, presupuesto y notas.
- Clima actual y pronóstico con Open-Meteo.
- Mapa interactivo con Leaflet y OpenStreetMap.
- Diseño adaptable a móviles y computadores, conservando la identidad visual original.

## Ejecutar en Visual Studio Code
1. Descomprime el ZIP.
2. Abre la carpeta `planora` en Visual Studio Code.
3. Abre `index.html` con Live Server.

También puedes iniciar un servidor local desde una terminal ubicada dentro de `planora` con `python -m http.server 8000` y abrir `http://localhost:8000`.

## APIs utilizadas
- Países: [countries.dev](https://countries.dev/docs), API pública sin clave ni registro.
- Clima: [Open-Meteo](https://open-meteo.com/).
- Mapas: [Leaflet](https://leafletjs.com/) y [OpenStreetMap](https://www.openstreetmap.org/).

Se necesita conexión a internet para consultar las APIs, cargar mapas y banderas.

## Almacenamiento
Los favoritos y los itinerarios se guardan en el navegador mediante LocalStorage. No se sincronizan entre dispositivos y pueden perderse si se borran los datos del navegador.
