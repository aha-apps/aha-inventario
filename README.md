# AHA Inventario

Control de stock **offline-first** con gestión de productos, categorías, movimientos, alertas y reportes.

## Características

- **Offline-first**: funciona 100% sin internet (IndexedDB + Service Worker)
- **5 módulos**: Inventario, Categorías, Movimientos, Alertas, Reportes
- **PWA**: instalable en móvil y desktop
- **Multi-perfil**: Lite (GitHub Pages), Professional (.exe + .apk), Business (white-label)
- **QR**: genera códigos QR para productos
- **Reportes**: dashboard con gráficos Chart.js y export CSV

## Stack técnico

| Componente | Tecnología |
|------------|-----------|
| UI | Alpine.js 3 + DaisyUI 4 + Tailwind CSS |
| Base de datos | Dexie.js (IndexedDB) |
| Cifrado | CryptoJS |
| Gráficos | Chart.js 4 |
| QR | QRCode.js |
| Perfil actual | Lite (Essential) |

## Perfiles disponibles

| Perfil | Entrega | Precio |
|--------|---------|:------:|
| **Lite** | ZIP + GitHub Pages | Desde $19 |
| **Professional** | .exe + .apk | Desde $49 |
| **Business** | .exe + .apk + white-label | Desde $99 |

## Uso

1. Abre `index.html` en tu navegador (doble clic)
2. O visita la [versión online](https://aha-apps.github.io/aha-inventario)
3. Comienza agregando categorías y productos

### Navegación

- **Inventario**: CRUD completo con SKU, precio, stock, imagen y umbral mínimo
- **Categorías**: organiza productos por categorías con color
- **Movimientos**: registra entradas y salidas de stock
- **Alertas**: notifica cuando el stock baja del umbral
- **Reportes**: dashboard con totales, stock bajo y actividad

## Licencia

Este producto usa licenciamiento AHA. Genera tu licencia en el meta-repo Ateje con `/licencia`.

## Créditos

Generado con [Ateje Stack](https://github.com/angelcamel/ateje) — Skill-Layer Architecture para apps offline-first.
