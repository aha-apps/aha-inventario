// modules/reportes/module.js — Dashboard con totales, stock bajo, actividad, graficos
// window.MODULES.reportes

(function () {
  'use strict';

  if (window.MODULES && window.MODULES.reportes) return;

  var Reportes = {
    id: 'reportes',
    titulo: 'Reportes',
    icono: 'bi bi-graph-up',
    datos: {
      totalProductos: 0,
      totalCategorias: 0,
      totalMovimientos: 0,
      alertasPendientes: 0,
      valorInventario: 0,
      stockBajo: []
    },
    cargando: false,

    init: function () {
      console.log('[reportes] Inicializado');
      this.cargarDatos();
    },

    render: function (params) {
      var html = '';
      html += '<div class="animate__animated animate__fadeInUp">';
      html += '  <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">';
      html += '    <i class="bi bi-graph-up"></i> Reportes';
      html += '  </h2>';

      // Stats cards
      html += '  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" x-data="statsData" x-init="init()">';
      html += '    <div class="stat bg-base-100 border border-base-300 rounded-xl shadow-sm">';
      html += '      <div class="stat-figure text-primary"><i class="bi bi-box-seam text-2xl"></i></div>';
      html += '      <div class="stat-title">Productos</div>';
      html += '      <div class="stat-value text-2xl" x-text="data.totalProductos">0</div>';
      html += '      <div class="stat-desc" x-text="\'En \' + data.totalCategorias + \' categorias\'"></div>';
      html += '    </div>';
      html += '    <div class="stat bg-base-100 border border-base-300 rounded-xl shadow-sm">';
      html += '      <div class="stat-figure text-success"><i class="bi bi-coin text-2xl"></i></div>';
      html += '      <div class="stat-title">Valor inventario</div>';
      html += '      <div class="stat-value text-2xl text-success" x-text="data.valorFormateado">$0</div>';
      html += '      <div class="stat-desc">Precio de compra total</div>';
      html += '    </div>';
      html += '    <div class="stat bg-base-100 border border-base-300 rounded-xl shadow-sm">';
      html += '      <div class="stat-figure text-info"><i class="bi bi-arrow-left-right text-2xl"></i></div>';
      html += '      <div class="stat-title">Movimientos</div>';
      html += '      <div class="stat-value text-2xl" x-text="data.totalMovimientos">0</div>';
      html += '      <div class="stat-desc">Entradas y salidas</div>';
      html += '    </div>';
      html += '    <div class="stat bg-base-100 border border-base-300 rounded-xl shadow-sm">';
      html += '      <div class="stat-figure text-warning"><i class="bi bi-exclamation-triangle text-2xl"></i></div>';
      html += '      <div class="stat-title">Alertas</div>';
      html += '      <div class="stat-value text-2xl" :class="data.alertasPendientes > 0 ? \'text-warning\' : \'text-success\'" x-text="data.alertasPendientes">0</div>';
      html += '      <div class="stat-desc" x-text="data.alertasPendientes > 0 ? \'Requieren atencion\' : \'Sin novedad\'"></div>';
      html += '    </div>';
      html += '  </div>';

      // Chart + Stock bajo section
      html += '  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">';
      html += '    <!-- Grafico: Productos por categoria -->';
      html += '    <div class="card bg-base-100 border border-base-300 shadow-sm" x-data="chartData" x-init="init()">';
      html += '      <div class="card-body">';
      html += '        <h3 class="card-title text-base flex items-center gap-2">';
      html += '          <i class="bi bi-pie-chart text-primary"></i>';
      html += '          <span>Productos por Categoria</span>';
      html += '        </h3>';
      html += '        <template x-if="cargando">';
      html += '          <div class="skeleton h-64 w-full rounded-lg"></div>';
      html += '        </template>';
      html += '        <template x-if="!cargando">';
      html += '          <div class="relative"><canvas x-ref="chartCategoria" class="w-full h-64"></canvas></div>';
      html += '        </template>';
      html += '      </div>';
      html += '    </div>';

      html += '    <!-- Stock bajo -->';
      html += '    <div class="card bg-base-100 border border-base-300 shadow-sm">';
      html += '      <div class="card-body">';
      html += '        <h3 class="card-title text-base flex items-center gap-2">';
      html += '          <i class="bi bi-exclamation-triangle text-warning"></i>';
      html += '          <span>Stock Bajo</span>';
      html += '        </h3>';
      html += '        <template x-if="stockBajo.length">';
      html += '          <div class="space-y-2">';
      html += '            <template x-for="item in stockBajo" :key="item.id">';
      html += '              <div class="flex items-center justify-between p-2 rounded-lg bg-base-200">';
      html += '                <div>';
      html += '                  <div class="text-sm font-medium" x-text="item.nombre"></div>';
      html += '                  <div class="text-xs text-base-content/50">Stock: <span class="text-error font-bold" x-text="item.cantidad"></span> / Min: <span x-text="item.umbralMinimo"></span></div>';
      html += '                </div>';
      html += '                <button class="btn btn-xs btn-ghost" @click="irAProducto(item)">';
  html += '                  <i class="bi bi-box-seam"></i>';
  html += '                </button>';
  html += '              </div>';
  html += '            </template>';
  html += '          </div>';
  html += '        </template>';
  html += '        <template x-if="!stockBajo.length">';
  html += '          <div class="flex flex-col items-center justify-center h-48 text-base-content/40">';
  html += '            <i class="bi bi-check-circle text-4xl mb-2 text-success"></i>';
  html += '            <p class="text-sm">Todo en orden, sin stock bajo</p>';
  html += '          </div>';
  html += '        </template>';
  html += '      </div>';
  html += '    </div>';
  html += '  </div>';

  // Actividad reciente
  html += '  <div class="card bg-base-100 border border-base-300 shadow-sm mt-6" x-data="actividadData" x-init="init()">';
  html += '    <div class="card-body">';
  html += '      <h3 class="card-title text-base flex items-center gap-2 mb-2">';
  html += '        <i class="bi bi-clock-history text-primary"></i>';
  html += '        <span>Actividad Reciente</span>';
  html += '      </h3>';
  html += '      <template x-if="cargando">';
  html += '        <div class="space-y-2">';
  html += '          <div class="skeleton h-12 w-full"></div>';
  html += '          <div class="skeleton h-12 w-full"></div>';
  html += '          <div class="skeleton h-12 w-full"></div>';
  html += '        </div>';
  html += '      </template>';
  html += '      <template x-if="!cargando && items.length">';
  html += '        <div class="space-y-2">';
  html += '          <template x-for="item in items" :key="item.id">';
  html += '            <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200 transition-colors">';
  html += '              <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"';
  html += '                   :class="item.tipo === \'entrada\' ? \'bg-success/20 text-success\' : \'bg-error/20 text-error\'">';
  html += '                <i :class="item.tipo === \'entrada\' ? \'bi bi-box-arrow-in-down\' : \'bi bi-box-arrow-up\'" class="text-sm"></i>';
  html += '              </div>';
  html += '              <div class="flex-1 min-w-0">';
  html += '                <div class="text-sm">';
  html += '                  <span class="font-medium" x-text="item._productoNombre || \'Producto\'"></span>';
  html += '                  <span :class="item.tipo === \'entrada\' ? \'text-success\' : \'text-error\'" x-text="(item.tipo === \'entrada\' ? \'+ \' : \'- \') + item.cantidad"></span>';
  html += '                </div>';
  html += '                <div class="text-xs text-base-content/40" x-text="item._fechaFormateada"></div>';
  html += '              </div>';
  html += '              <span class="badge badge-sm" :class="item.tipo === \'entrada\' ? \'badge-success\' : \'badge-error\'" x-text="item.tipo"></span>';
  html += '            </div>';
  html += '          </template>';
  html += '        </div>';
  html += '      </template>';
  html += '      <template x-if="!cargando && !items.length">';
  html += '        <div class="flex flex-col items-center justify-center h-32 text-base-content/40">';
  html += '          <p class="text-sm">Sin actividad reciente</p>';
  html += '        </div>';
  html += '      </template>';
  html += '    </div>';
  html += '  </div>';

      html += '</div>';

      return html;
    },

    destroy: function () {},

    cargarDatos: function () {
      var self = this;
      self.cargando = true;

      Promise.all([
        db.productos.count(),
        db.categorias.count(),
        db.movimientos.count(),
        db.alertas.where('leida').equals(false).count(),
        db.productos.toArray(),
        db.categorias.toArray(),
        db.movimientos.orderBy('createdAt').reverse().limit(10).toArray()
      ]).then(function (results) {
        var totalProductos = results[0];
        var totalCategorias = results[1];
        var totalMovimientos = results[2];
        var alertasPendientes = results[3];
        var productos = results[4];
        var categorias = results[5];
        var movimientos = results[6];

        // Calcular valor del inventario
        var valorInventario = 0;
        var stockBajo = [];
        for (var i = 0; i < productos.length; i++) {
          var p = productos[i];
          valorInventario += (p.precio || 0) * (p.cantidad || 0);
          if (p.cantidad <= p.umbralMinimo) {
            stockBajo.push(p);
          }
        }

        // Formatear movimientos recientes
        var movsFormateados = [];
        for (var j = 0; j < movimientos.length; j++) {
          var m = movimientos[j];
          m._fechaFormateada = UI.formatRelative(m.createdAt) || UI.formatDate(m.createdAt);
          movsFormateados.push(m);
        }

        // Resolver nombres de productos en movimientos
        var movPromises = movsFormateados.map(function (mov) {
          if (mov.productoId) {
            return db.productos.get(mov.productoId).then(function (prod) {
              mov._productoNombre = prod ? prod.nombre : '(eliminado)';
            });
          }
          return Promise.resolve();
        });

        return Promise.all(movPromises).then(function () {
          self.datos.totalProductos = totalProductos;
          self.datos.totalCategorias = totalCategorias;
          self.datos.totalMovimientos = totalMovimientos;
          self.datos.alertasPendientes = alertasPendientes;
          self.datos.valorInventario = valorInventario;
          self.datos.valorFormateado = UI.formatCurrency(valorInventario);
          self.datos.stockBajo = stockBajo;
          self.datos.categorias = categorias;
          self.datos.productos = productos;
          self.datos.movimientosRecientes = movsFormateados;
          self.cargando = false;
        });
      }).catch(function (err) {
        console.error('[reportes] Error al cargar datos:', err);
        self.cargando = false;
      });
    }
  };

  window.MODULES = window.MODULES || {};
  window.MODULES.reportes = Reportes;

  // Alpine data: Stats
  document.addEventListener('alpine:init', function () {
    if (typeof Alpine === 'undefined') return;
    Alpine.data('statsData', function () {
      var mod = window.MODULES.reportes;
      return {
        data: mod.datos,
        init: function () {
          var self = this;
          setInterval(function () {
            self.data = mod.datos;
          }, 200);
        }
      };
    });

    // Chart data: Productos por categoria
    Alpine.data('chartData', function () {
      var mod = window.MODULES.reportes;
      return {
        cargando: true,
        chartInstance: null,
        init: function () {
          var self = this;
          var check = setInterval(function () {
            if (!mod.cargando && mod.datos.productos && mod.datos.productos.length >= 0) {
              clearInterval(check);
              self.$nextTick(function () {
                self.renderChart();
              });
            }
          }, 300);
        },
        renderChart: function () {
          var self = this;
          if (this.chartInstance) this.chartInstance.destroy();

          var categorias = mod.datos.categorias || [];
          var productos = mod.datos.productos || [];
          var catMap = {};
          for (var i = 0; i < categorias.length; i++) {
            catMap[categorias[i].id] = categorias[i].nombre;
          }

          var counts = {};
          for (var j = 0; j < productos.length; j++) {
            var catId = productos[j].categoriaId;
            if (catId) {
              counts[catId] = (counts[catId] || 0) + 1;
            } else {
              counts['_sin'] = (counts['_sin'] || 0) + 1;
            }
          }

          var labels = [];
          var data = [];
          var colors = ['#1e3a5f', '#64748b', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

          Object.keys(counts).forEach(function (key, idx) {
            labels.push(key === '_sin' ? 'Sin categoria' : (catMap[key] || key));
            data.push(counts[key]);
          });

          if (data.length === 0) {
            this.cargando = false;
            return;
          }

          var bgColors = data.map(function (_, idx) { return colors[idx % colors.length]; });

          this.cargando = false;

          if (!this.$refs.chartCategoria) return;

          this.chartInstance = new Chart(this.$refs.chartCategoria, {
            type: 'doughnut',
            data: {
              labels: labels,
              datasets: [{
                data: data,
                backgroundColor: bgColors,
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: 'bottom',
                  labels: { boxWidth: 12, padding: 12, font: { size: 11 } }
                }
              }
            }
          });
        },
        destroy: function () {
          if (this.chartInstance) this.chartInstance.destroy();
        }
      };
    });

    // Actividad reciente
    Alpine.data('actividadData', function () {
      var mod = window.MODULES.reportes;
      return {
        items: [],
        cargando: true,
        init: function () {
          var self = this;
          setInterval(function () {
            self.items = mod.datos.movimientosRecientes || [];
            self.cargando = mod.cargando || false;
          }, 200);
        }
      };
    });

    // Stock bajo inline
    Alpine.data('stockBajoData', function () {
      var mod = window.MODULES.reportes;
      return {
        items: [],
        init: function () {
          var self = this;
          setInterval(function () {
            self.items = mod.datos.stockBajo || [];
          }, 200);
        }
      };
    });
  });

  console.log('[reportes] Modulo registrado');
})();
