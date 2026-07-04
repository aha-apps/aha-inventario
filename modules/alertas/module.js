// modules/alertas/module.js — Alertas de stock bajo y notificaciones
// window.MODULES.alertas

(function () {
  'use strict';

  if (window.MODULES && window.MODULES.alertas) return;

  var Alertas = {
    id: 'alertas',
    titulo: 'Alertas',
    icono: 'bi bi-exclamation-triangle',
    datos: [],
    cargando: false,

    init: function () {
      console.log('[alertas] Inicializado');
      this.cargarDatos();
    },

    render: function (params) {
      var html = '';
      html += '<div class="animate__animated animate__fadeInUp" x-data="alertasData" x-init="init()">';
      html += '  <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">';
      html += '    <i class="bi bi-exclamation-triangle"></i> Alertas';
      html += '  </h2>';
      html += '  <div class="flex flex-wrap gap-2 mb-4">';
      html += '    <button class="btn btn-ghost" onclick="window.MODULES.alertas.marcarTodasLeidas()">';
      html += '      <i class="bi bi-check-all"></i> Marcar todas leidas';
      html += '    </button>';
      html += '    <button class="btn btn-ghost" onclick="window.MODULES.alertas.actualizarAlertas()">';
      html += '      <i class="bi bi-arrow-clockwise"></i> Verificar stock';
      html += '    </button>';
      html += '  </div>';

      // Lista de alertas
      html += '  <template x-if="items && items.length">';
      html += '    <div class="space-y-3">';
      html += '      <template x-for="item in items" :key="item.id">';
      html += '        <div class="card bg-base-100 border shadow-sm" :class="item.leida ? \'opacity-60\' : \'border-warning\'">';
      html += '          <div class="card-body p-4">';
      html += '            <div class="flex items-start gap-3">';
      html += '              <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0" :class="item.leida ? \'bg-base-200\' : \'bg-warning/20\'">';
      html += '                <i class="bi bi-exclamation-triangle text-lg" :class="item.leida ? \'text-base-content/40\' : \'text-warning\'"></i>';
      html += '              </div>';
      html += '              <div class="flex-1 min-w-0">';
      html += '                <div class="flex items-center gap-2">';
      html += '                  <span x-show="!item.leida" class="badge badge-warning badge-xs">Nueva</span>';
      html += '                  <h3 class="font-medium text-sm truncate" x-text="item._productoNombre || \'Producto\'"></h3>';
      html += '                </div>';
      html += '                <p class="text-sm text-base-content/60 mt-1">';
      html += '                  Stock actual: <span class="font-bold text-error" x-text="item._stockActual || \'0\'"></span> unidades';
      html += '                  (minimo: <span x-text="item._umbralMinimo || \'0\'"></span>)';
      html += '                </p>';
      html += '                <p class="text-xs text-base-content/40 mt-1" x-text="\'Creada: \' + (item._fechaFormateada || \'\')"></p>';
      html += '              </div>';
      html += '              <div class="flex gap-1 shrink-0">';
      html += '                <button class="btn btn-sm btn-ghost" @click="marcarLeida(item)" title="Marcar como leida" x-show="!item.leida">';
      html += '                  <i class="bi bi-check-lg"></i>';
      html += '                </button>';
      html += '                <button class="btn btn-sm btn-ghost" @click="irAProducto(item)" title="Ir al producto">';
      html += '                  <i class="bi bi-box-seam"></i>';
      html += '                </button>';
      html += '              </div>';
      html += '            </div>';
      html += '          </div>';
      html += '        </div>';
      html += '      </template>';
      html += '    </div>';
      html += '  </template>';

      // Empty state
      html += '  <template x-if="(!items || !items.length) && !cargando">';
      html += '    <div class="flex flex-col items-center justify-center py-16 text-base-content/50">';
      html += '      <i class="bi bi-check-circle text-6xl mb-4 text-success"></i>';
      html += '      <p class="text-lg mb-2">No hay alertas</p>';
      html += '      <p class="text-sm">Todo el inventario esta en niveles optimos</p>';
      html += '    </div>';
      html += '  </template>';

      // Loading skeleton
      html += '  <template x-if="cargando">';
      html += '    <div class="space-y-3">';
      html += '      <div class="skeleton h-24 w-full"></div>';
      html += '      <div class="skeleton h-24 w-full"></div>';
      html += '    </div>';
      html += '  </template>';
      html += '</div>';

      return html;
    },

    destroy: function () {},

    actualizarAlertas: function () {
      var self = this;
      // Escanear todos los productos y crear alertas para los que esten bajo minimo
      UI.toast('Verificando stock...', 'info');
      db.productos.toArray().then(function (productos) {
        var alertas = [];
        for (var i = 0; i < productos.length; i++) {
          var p = productos[i];
          if (p.cantidad <= p.umbralMinimo) {
            alertas.push({
              id: window.uuid(),
              productoId: p.id,
              tipo: 'stock_bajo',
              leida: false,
              createdAt: new Date()
            });
          }
        }
        if (alertas.length === 0) {
          UI.toast('Todo en orden, sin alertas nuevas', 'success');
          self.cargarDatos();
          return;
        }
        // Agregar alertas que no existan ya
        return db.alertas.where('leida').equals(false).toArray().then(function (existentes) {
          var existentesMap = {};
          for (var j = 0; j < existentes.length; j++) {
            existentesMap[existentes[j].productoId] = true;
          }
          var nuevas = alertas.filter(function (a) { return !existentesMap[a.productoId]; });
          if (nuevas.length === 0) {
            UI.toast('Sin alertas nuevas', 'info');
          } else {
            var ops = [];
            for (var k = 0; k < nuevas.length; k++) {
              ops.push(db.alertas.put(nuevas[k]));
            }
            return Promise.all(ops).then(function () {
              UI.toast(nuevas.length + ' alerta(s) generada(s)', 'warning');
              self.cargarDatos();
            });
          }
        });
      }).catch(function (err) {
        console.error('[alertas] Error al verificar:', err);
      });
    },

    marcarTodasLeidas: function () {
      var self = this;
      db.alertas.where('leida').equals(false).modify({ leida: true }).then(function () {
        UI.toast('Todas las alertas marcadas como leidas', 'success');
        self.cargarDatos();
      }).catch(function (err) {
        UI.toast('Error: ' + err.message, 'error');
      });
    },

    cargarDatos: function () {
      var self = this;
      self.cargando = true;
      db.alertas.orderBy('createdAt').reverse().toArray().then(function (items) {
        var promises = items.map(function (item) {
          item._fechaFormateada = UI.formatDate(item.createdAt);
          if (item.productoId) {
            return db.productos.get(item.productoId).then(function (prod) {
              item._productoNombre = prod ? prod.nombre : '(producto eliminado)';
              item._stockActual = prod ? prod.cantidad : 0;
              item._umbralMinimo = prod ? prod.umbralMinimo : 0;
            }).catch(function () {
              item._productoNombre = '(producto eliminado)';
              item._stockActual = 0;
              item._umbralMinimo = 0;
            });
          } else {
            item._productoNombre = '';
            item._stockActual = 0;
            item._umbralMinimo = 0;
            return Promise.resolve();
          }
        });
        return Promise.all(promises).then(function () {
          self.datos = items;
          self.cargando = false;
        });
      }).catch(function (err) {
        console.error('[alertas] Error al cargar:', err);
        self.cargando = false;
      });
    },

    marcarLeida: function (item) {
      var self = this;
      db.alertas.update(item.id, { leida: true }).then(function () {
        self.cargarDatos();
      }).catch(function (err) {
        UI.toast('Error: ' + err.message, 'error');
      });
    }
  };

  window.MODULES = window.MODULES || {};
  window.MODULES.alertas = Alertas;

  // Alpine data
  document.addEventListener('alpine:init', function () {
    if (typeof Alpine === 'undefined') return;
    Alpine.data('alertasData', function () {
      var mod = window.MODULES.alertas;
      return {
        items: [],
        cargando: true,
        init: function () {
          var self = this;
          setInterval(function () {
            self.items = mod.datos || [];
            self.cargando = mod.cargando;
          }, 200);
        },
        marcarLeida: function (item) { mod.marcarLeida(item); },
        irAProducto: function (item) {
          window.appRouter.navigate('inventario');
        }
      };
    });
  });

  console.log('[alertas] Modulo registrado');
})();
