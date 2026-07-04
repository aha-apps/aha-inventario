# AHA Inventario

Control de stock offline-first con gestion de productos, categorias, movimientos y alertas.

## Perfil

Lite (primera version). Despliegue via doble clic en `index.html` o GitHub Pages.

## Modulos

- **Inventario** — CRUD de productos con SKU, categoria, precio, cantidad, imagen y umbral minimo
- **Categorias** — CRUD de categorias con nombre y color
- **Movimientos** — Entradas y salidas de stock vinculadas a productos
- **Alertas** — Notificaciones de stock por debajo del umbral minimo
- **Reportes** — Dashboard con totales, stock bajo, actividad reciente y grafico Chart.js

## Stack

- Offline-first (Dexie/IndexedDB)
- Interfaz: Alpine.js + DaisyUI + Bootstrap Icons
- Cifrado: CryptoJS AES
- PWA: Service Worker + Manifest

## Estructura

```
aha-inventario/
├── index.html
├── manifest.json
├── sw.js
├── project.config.js
├── core/           (13 archivos)
├── modules/        (5 modulos, 10 archivos)
├── assets/         (CSS + JS librerias)
├── data/           (defaults SVG)
└── README.md
```

## Uso

Abrir `index.html` en cualquier navegador moderno. No requiere servidor web.
