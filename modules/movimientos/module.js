// modules/movimientos/module.js — Registro de entradas y salidas de stock
// window.MODULES.movimientos

(function () {
  'use strict';

  if (window.MODULES && window.MODULES.movimientos) return;

  var Movimientos = {
    id: 'movimientos',
    titulo: 'Movimientos',
    icono: 'bi bi-arrow-left-right',
    datos: [],
    cargando: false,
    busqueda: '',

    init: function () {
      console.log('[movimientos] Inicializado');
      this.cargarDatos();
    },

    render: function (params) {
      var html = '';
      html += '<div class="animate__animated animate__fadeInUp" x-data="movimientosData" x-init="init()">';
      html += '  <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">';
      html += '    <i class="bi bi-arrow-left-right"></i> Movimientos';
      html += '  </h2>';
      html += '  <div class="flex flex-wrap gap-2 mb-4">';
      html += '    <button class="btn btn-primary" onclick="window.MODULES.inventario.abrirForm(null)">';
      html += '      <i class="bi bi-plus-lg"></i> Nuevo Movimiento desde Inventario';
      html += '    </button>';
      html += '    <input type="search" id="mov-busqueda" onkeyup="window.MODULES.movimientos.filtrar()" placeholder="Buscar..." class="input input-bordered flex-1 min-w-[200px]" />';
      html += '    <select id="mov-filtro-tipo" onchange="window.MODULES.movimientos.filtrar()" class="select select-bordered w-36">';
      html += '      <option value="">Todos</option>';
      html += '      <option value="entrada">Entradas</option>';
      html += '      <option value="salida">Salidas</option>';
      html += '    </select>';
      html += '  </div>';

      // Tabla
      html += '  <template x-if="items && items.length">';
      html += '    <div class="overflow-x-auto">';
      html += '      <table class="table table-zebra">';
      html += '        <thead>';
      html += '          <tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Motivo</th></tr>';
      html += '        </thead>';
      html += '        <tbody>';
      html += '          <tr x-for="item in items" :key="item.id">';
      html += '            <td><span class="text-sm" x-text="item._fechaFormateada || \'\'"></span></td>';
      html += '            <td><span class="font-medium" x-text="item._productoNombre || \'...\'"></span></td>';
      html += '            <td>';
      html += '              <span class="badge" :class="item.tipo === \'entrada\' ? \'badge-success\' : \'badge-error\'" x-text="item.tipo"></span>';
      html += '            </td>';
      html += '            <td><span class="font-bold" :class="item.tipo === \'entrada\' ? \'text-success\' : \'text-error\'" x-text="item.cantidad"></span></td>';
      html += '            <td><span class="text-sm text-base-content/60" x-text="item.motivo || \'\'"></span></td>';
      html += '          </tr>';
      html += '        </tbody>';
      html += '      </table>';
      html += '    </div>';
      html += '  </template>';

      // Empty state
      html += '  <template x-if="(!items || !items.length) && !cargando">';
      html += '    <div class="flex flex-col items-center justify-center py-16 text-base-content/50">';
      html += '      <i class="bi bi-arrow-left-right text-6xl mb-4"></i>';
      html += '      <p class="text-lg mb-4">No hay movimientos registrados</p>';
      html += '      <p class="text-sm mb-4">Los movimientos se crean al ajustar stock desde Inventario</p>';
      html += '      <button class="btn btn-primary" onclick="window.appRouter.navigate(\'inventario\')">';
      html += '        <i class="bi bi-box-seam"></i> Ir a Inventario';
      html += '      </button>';
      html += '    </div>';
      html += '  </template>';

      // Loading skeleton
      html += '  <template x-if="cargando">';
      html += '    <div class="space-y-3">';
      html += '      <div class="skeleton h-12 w-full"></div>';
      html += '      <div class="skeleton h-12 w-full"></div>';
      html += '      <div class="skeleton h-12 w-full"></div>';
      html += '    </div>';
      html += '  </template>';
      html += '</div>';

      return html;
    },

    destroy: function () {},

    filtrar: function () {
      var q = document.getElementById('mov-busqueda');
      this.busqueda = q ? q.value : '';
    },

    cargarDatos: function () {
      var self = this;
      self.cargando = true;
      db.movimientos.orderBy('createdAt').reverse().toArray().then(function (items) {
        var promises = items.map(function (item) {
          item._fechaFormateada = UI.formatDate(item.createdAt);
          if (item.productoId) {
            return db.productos.get(item.productoId).then(function (prod) {
              item._productoNombre = prod ? prod.nombre : '(producto eliminado)';
            }).catch(function () {
              item._productoNombre = '(producto eliminado)';
            });
          } else {
            item._productoNombre = '';
            return Promise.resolve();
          }
        });
        return Promise.all(promises).then(function () {
          self.datos = items;
          self.cargando = false;
        });
      }).catch(function (err) {
        console.error('[movimientos] Error al cargar:', err);
        self.cargando = false;
      });
    }
  };

  window.MODULES = window.MODULES || {};
  window.MODULES.movimientos = Movimientos;

  // Alpine data
  document.addEventListener('alpine:init', function () {
    if (typeof Alpine === 'undefined') return;
    Alpine.data('movimientosData', function () {
      var mod = window.MODULES.movimientos;
      return {
        items: [],
        cargando: true,
        init: function () {
          var self = this;
          setInterval(function () {
            var raw = mod.datos || [];
            var q = (mod.busqueda || '').toLowerCase();
            var tipoFilter = document.getElementById('mov-filtro-tipo');
            var tipoVal = tipoFilter ? tipoFilter.value : '';

            self.items = raw.filter(function (i) {
              if (q && i._productoNombre && i._productoNombre.toLowerCase().indexOf(q) === -1) return false;
              if (tipoVal && i.tipo !== tipoVal) return false;
              return true;
            });
            self.cargando = mod.cargando;
          }, 200);
        }
      };
    });
  });

  console.log('[movimientos] Modulo registrado');
})();
