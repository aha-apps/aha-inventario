# AHA Inventario — Spec Funcional

## Identidad

- **Nombre:** AHA Inventario
- **Tagline:** Controla tu inventario desde cualquier lugar
- **Color:** #3b82f6 (blue-500)
- **Target:** Pequeños comercios, ferreterías, abarrotes, tiendas de conveniencia
- **Perfil:** Lite (file://, doble clic)

## Stack

- Alpine.js 3 + Dexie 3 + DaisyUI 4 + Tailwind Play CDN + Bootstrap Icons
- ES5 estricto, offline-first, sin servidor
- Chart.js 4 para gráficos en reportes

## DB Schema (Dexie)

```
productos: ++id, nombre, categoriaId, sku, codigoBarras, precioCompra, precioVenta, stockActual, stockMinimo, unidad, createdBy, createdAt, updatedAt
categorias: ++id, nombre, descripcion, createdAt, updatedAt
movimientos: ++id, productoId, tipo, cantidad, motivo, proveedorId, createdBy, createdAt
proveedores: ++id, nombre, telefono, email, direccion, createdAt, updatedAt
```

## Módulos

### 1. Productos (`#/productos`)
- Lista con búsqueda por nombre, SKU o código de barras
- CRUD: crear, editar, eliminar (con confirmación)
- Campos: nombre, categoría (select), SKU, código de barras, precio compra, precio venta, stock actual, stock mínimo, unidad (pieza/kg/litro/caja/rollo)
- Indicador visual si stockActual <= stockMinimo
- Al eliminar, verificar que no tenga movimientos asociados

### 2. Categorías (`#/categorias`)
- Lista simple con búsqueda
- CRUD: nombre + descripción
- Al eliminar, verificar que no tenga productos asociados

### 3. Movimientos (`#/movimientos`)
- Registro de entrada, salida o ajuste
- Selector de producto con búsqueda
- Selector de proveedor (opcional, solo para entradas)
- Motivo obligatorio para salidas y ajustes
- Historial paginado con filtros por tipo, producto, fecha

### 4. Proveedores (`#/proveedores`)
- Catálogo con nombre, teléfono, email, dirección
- CRUD completo
- Asociado a movimientos de entrada

### 5. Reportes (`#/reportes`)
- Dashboard con Chart.js:
  - Stock bajo: lista de productos con stock crítico
  - Valor del inventario: gráfico de barras por categoría
  - Movimientos por mes: gráfico de líneas (entradas vs salidas)
  - Top productos: tabla de productos más movidos

## Estilo

- DaisyUI tema azul (blue-500 como primario)
- Layout: sidebar + contenido principal
- Tablas responsive con scroll horizontal en móvil
- Formularios en modal (UI.modalForm)
- Toasts para feedback de operaciones
