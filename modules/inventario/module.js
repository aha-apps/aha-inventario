// modules/inventario/module.js — CRUD de productos con SKU, categoria, precio, cantidad, umbral minimo
// window.MODULES.inventario

(function () {
  'use strict';

  if (window.MODULES && window.MODULES.inventario) return;

  var Inventario = {
    id: 'inventario',
    titulo: 'Inventario',
    icono: 'bi bi-box-seam',
    datos: [],
    cargando: false,
    busqueda: '',
    categorias: [],

    init: function () {
      console.log('[inventario] Inicializado');
      this.cargarDatos();
      this.cargarCategorias();
    },

    render: function (params) {
      var html = '';
      html += '<div class="animate__animated animate__fadeInUp" x-data="inventarioData" x-init="init()">';
      html += '  <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">';
      html += '    <i class="bi bi-box-seam"></i> Inventario';
      html += '  </h2>';
      html += '  <div class="flex flex-wrap gap-2 mb-4">';
      html += '    <button class="btn btn-primary" onclick="window.MODULES.inventario.abrirForm(null)">';
      html += '      <i class="bi bi-plus-lg"></i> Agregar Producto';
      html += '    </button>';
      html += '    <input type="search" id="inv-busqueda" onkeyup="window.MODULES.inventario.filtrar()" placeholder="Buscar..." class="input input-bordered flex-1 min-w-[200px]" />';
      html += '    <select id="inv-filtro-categoria" onchange="window.MODULES.inventario.filtrar()" class="select select-bordered w-44">';
      html += '      <option value="">Todas las categorias</option>';
      html += '    </select>';
      html += '  </div>';

      // Tabla
      html += '  <template x-if="items && items.length">';
      html += '    <div class="overflow-x-auto">';
      html += '      <table class="table table-zebra">';
      html += '        <thead>';
      html += '          <tr><th>Producto</th><th>SKU</th><th>Categoria</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr>';
      html += '        </thead>';
      html += '        <tbody>';
      html += '          <tr x-for="item in items" :key="item.id" :class="item.cantidad <= item.umbralMinimo ? \'bg-warning/5\' : \'\'">';
      html += '            <td>';
      html += '              <div class="flex items-center gap-2">';
      html += '                <div class="avatar">';
      html += '                  <div class="w-10 rounded">';
      html += '                    <img :src="item._imgUrl || \'data/defaults/placeholder.svg\'" :alt="item.nombre" @error="$el.src=\'data/defaults/placeholder.svg\'">';
      html += '                  </div>';
      html += '                </div>';
      html += '                <span class="font-medium" x-text="item.nombre"></span>';
      html += '              </div>';
      html += '            </td>';
      html += '            <td><span class="text-sm font-mono" x-text="item.sku"></span></td>';
      html += '            <td><span x-text="item._categoriaNombre || \'\'"></span></td>';
      html += '            <td><span class="font-medium" x-text="item._precioFormateado || \'$0.00\'"></span></td>';
      html += '            <td>';
      html += '              <div class="flex items-center gap-2">';
      html += '                <span class="font-bold" :class="item.cantidad <= item.umbralMinimo ? \'text-error\' : \'text-success\'" x-text="item.cantidad"></span>';
      html += '                <span x-show="item.cantidad <= item.umbralMinimo" class="badge badge-warning badge-xs">min</span>';
      html += '              </div>';
      html += '            </td>';
      html += '            <td>';
      html += '              <button class="btn btn-sm btn-ghost" @click="editar(item)" title="Editar"><i class="bi bi-pencil"></i></button>';
      html += '              <button class="btn btn-sm btn-ghost text-info" @click="ajustarStock(item)" title="Ajustar stock"><i class="bi bi-arrow-left-right"></i></button>';
      html += '              <button class="btn btn-sm btn-ghost text-error" @click="eliminar(item)" title="Eliminar"><i class="bi bi-trash"></i></button>';
      html += '            </td>';
      html += '          </tr>';
      html += '        </tbody>';
      html += '      </table>';
      html += '    </div>';
      html += '  </template>';

      // Empty state
      html += '  <template x-if="(!items || !items.length) && !cargando">';
      html += '    <div class="flex flex-col items-center justify-center py-16 text-base-content/50">';
      html += '      <i class="bi bi-box-seam text-6xl mb-4"></i>';
      html += '      <p class="text-lg mb-4">No hay productos aun</p>';
      html += '      <button class="btn btn-primary" onclick="window.MODULES.inventario.abrirForm(null)">';
      html += '        <i class="bi bi-plus-lg"></i> Agregar primero';
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
      var q = document.getElementById('inv-busqueda');
      this.busqueda = q ? q.value : '';
    },

    cargarCategorias: function () {
      var self = this;
      db.categorias.toArray().then(function (cats) {
        self.categorias = cats;
        var select = document.getElementById('inv-filtro-categoria');
        if (select) {
          var html = '<option value="">Todas las categorias</option>';
          for (var i = 0; i < cats.length; i++) {
            html += '<option value="' + cats[i].id + '">' + cats[i].nombre + '</option>';
          }
          select.innerHTML = html;
        }
      }).catch(function (err) {
        console.error('[inventario] Error cargando categorias:', err);
      });
    },

    cargarDatos: function () {
      var self = this;
      self.cargando = true;
      db.productos.orderBy('nombre').toArray().then(function (items) {
        // Resolver nombres de categoria y formatos
        var promises = items.map(function (item) {
          item._precioFormateado = UI.formatCurrency(item.precio);
          if (item.categoriaId) {
            return db.categorias.get(item.categoriaId).then(function (cat) {
              item._categoriaNombre = cat ? cat.nombre : '...';
            }).catch(function () {
              item._categoriaNombre = '...';
            });
          } else {
            item._categoriaNombre = '';
            return Promise.resolve();
          }
        });
        return Promise.all(promises).then(function () {
          self.datos = items;
          self.cargando = false;
        });
      }).catch(function (err) {
        console.error('[inventario] Error al cargar:', err);
        self.cargando = false;
      });
    },

    abrirForm: function (item) {
      var editando = !!item;
      var self = this;

      // Construir opciones de categorias
      var catOptions = '<option value="">Sin categoria</option>';
      for (var i = 0; i < self.categorias.length; i++) {
        catOptions += '<option value="' + self.categorias[i].id + '">' + self.categorias[i].nombre + '</option>';
      }

      var html = '';
      html += '<div class="space-y-4">';
      html += '  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
      html += '    <label class="form-control w-full">';
      html += '      <span class="label-text">Nombre del producto</span>';
      html += '      <input type="text" x-model="form.nombre" class="input input-bordered" placeholder="Ej: Arroz 1kg" required>';
      html += '    </label>';
      html += '    <label class="form-control w-full">';
      html += '      <span class="label-text">SKU</span>';
      html += '      <input type="text" x-model="form.sku" class="input input-bordered" placeholder="Ej: ARR-001">';
      html += '    </label>';
      html += '  </div>';
      html += '  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
      html += '    <label class="form-control w-full">';
      html += '      <span class="label-text">Categoria</span>';
      html += '      <select x-model="form.categoriaId" class="select select-bordered">';
      html +=          catOptions;
      html += '      </select>';
      html += '    </label>';
      html += '    <label class="form-control w-full">';
      html += '      <span class="label-text">Precio</span>';
      html += '      <input type="number" x-model="form.precio" class="input input-bordered" placeholder="0.00" step="0.01" min="0">';
      html += '    </label>';
      html += '  </div>';
      html += '  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
      html += '    <label class="form-control w-full">';
      html += '      <span class="label-text">Cantidad inicial</span>';
      html += '      <input type="number" x-model="form.cantidad" class="input input-bordered" placeholder="0" min="0">';
      html += '    </label>';
      html += '    <label class="form-control w-full">';
      html += '      <span class="label-text">Umbral minimo</span>';
      html += '      <input type="number" x-model="form.umbralMinimo" class="input input-bordered" placeholder="10" min="0">';
      html += '    </label>';
      html += '  </div>';
      html += '  <label class="form-control w-full">';
      html += '    <span class="label-text">Imagen (URL)</span>';
      html += '    <input type="text" x-model="form.imagen" class="input input-bordered" placeholder="https://ejemplo.com/imagen.jpg">';
      html += '  </label>';
      html += '</div>';

      if (editando) {
        window._modalFormData = {
          nombre: item.nombre || '',
          sku: item.sku || '',
          categoriaId: item.categoriaId || '',
          precio: item.precio || 0,
          cantidad: item.cantidad || 0,
          umbralMinimo: item.umbralMinimo || 10,
          imagen: item.imagen || ''
        };
      } else {
        window._modalFormData = {
          nombre: '',
          sku: '',
          categoriaId: '',
          precio: 0,
          cantidad: 0,
          umbralMinimo: 10,
          imagen: ''
        };
      }

      UI.modalForm(
        editando ? 'Editar Producto' : 'Nuevo Producto',
        html,
        function (data) {
          if (!data.nombre) {
            UI.toast('El nombre es obligatorio', 'warning');
            return Promise.reject(new Error('Nombre requerido'));
          }
          if (editando) {
            return self.actualizar(item.id, data);
          } else {
            return self.guardar(data);
          }
        }
      );
    },

    guardar: function (datos) {
      var self = this;
      var registro = {
        id: window.uuid(),
        nombre: datos.nombre,
        sku: datos.sku || 'SKU-' + Date.now().toString(36).toUpperCase(),
        categoriaId: datos.categoriaId || '',
        precio: Number(datos.precio) || 0,
        cantidad: Number(datos.cantidad) || 0,
        imagen: datos.imagen || '',
        umbralMinimo: Number(datos.umbralMinimo) || 10,
        createdBy: 'anon',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return db.productos.put(registro).then(function () {
        UI.toast('Producto guardado', 'success');
        self.cargarDatos();
        self.cargarCategorias();
      }).catch(function (err) {
        UI.toast('Error al guardar: ' + err.message, 'error');
        throw err;
      });
    },

    actualizar: function (id, datos) {
      var self = this;
      return db.productos.get(id).then(function (existente) {
        if (!existente) {
          UI.toast('Producto no encontrado', 'error');
          return Promise.reject(new Error('Not found'));
        }
        existente.nombre = datos.nombre;
        existente.sku = datos.sku || existente.sku;
        existente.categoriaId = datos.categoriaId || '';
        existente.precio = Number(datos.precio) || 0;
        existente.cantidad = Number(datos.cantidad) || 0;
        existente.imagen = datos.imagen || '';
        existente.umbralMinimo = Number(datos.umbralMinimo) || 10;
        existente.updatedAt = new Date();
        return db.productos.put(existente).then(function () {
          UI.toast('Producto actualizado', 'success');
          self.cargarDatos();
        });
      }).catch(function (err) {
        UI.toast('Error al actualizar: ' + err.message, 'error');
        throw err;
      });
    },

    eliminar: function (item) {
      var self = this;
      UI.confirm('Eliminar el producto "' + item.nombre + '"?').then(function (ok) {
        if (!ok) return;
        db.productos.delete(item.id).then(function () {
          UI.toast('Producto eliminado', 'success');
          self.cargarDatos();
        }).catch(function (err) {
          UI.toast('Error al eliminar: ' + err.message, 'error');
        });
      });
    },

    ajustarStock: function (item) {
      var self = this;
      var html = '';
      html += '<div class="space-y-4">';
      html += '  <div class="alert alert-info">';
      html += '    <i class="bi bi-info-circle"></i>';
      html += '    <span>Stock actual: <strong>' + item.cantidad + '</strong></span>';
      html += '  </div>';
      html += '  <label class="form-control w-full">';
      html += '    <span class="label-text">Tipo de movimiento</span>';
      html += '    <select x-model="form.tipo" class="select select-bordered">';
      html += '      <option value="entrada">Entrada (+)</option>';
      html += '      <option value="salida">Salida (-)</option>';
      html += '    </select>';
      html += '  </label>';
      html += '  <label class="form-control w-full">';
      html += '    <span class="label-text">Cantidad</span>';
      html += '    <input type="number" x-model="form.cantidad" class="input input-bordered" placeholder="1" min="1" required>';
      html += '  </label>';
      html += '  <label class="form-control w-full">';
      html += '    <span class="label-text">Motivo</span>';
      html += '    <input type="text" x-model="form.motivo" class="input input-bordered" placeholder="Ej: Compra a proveedor">';
      html += '  </label>';
      html += '</div>';

      window._modalFormData = {
        tipo: 'entrada',
        cantidad: 1,
        motivo: ''
      };

      UI.modalForm('Ajustar Stock: ' + item.nombre, html, function (data) {
        var cantidad = Number(data.cantidad) || 0;
        if (cantidad <= 0) {
          UI.toast('La cantidad debe ser mayor a 0', 'warning');
          return Promise.reject(new Error('Cantidad invalida'));
        }
        var cambio = data.tipo === 'entrada' ? cantidad : -cantidad;
        var nuevoStock = (item.cantidad || 0) + cambio;
        if (nuevoStock < 0) {
          UI.toast('Stock insuficiente', 'error');
          return Promise.reject(new Error('Stock insuficiente'));
        }
        return db.productos.get(item.id).then(function (prod) {
          if (!prod) { UI.toast('Producto no encontrado', 'error'); return Promise.reject(new Error('Not found')); }
          prod.cantidad = nuevoStock;
          prod.updatedAt = new Date();
          return db.productos.put(prod);
        }).then(function () {
          // Registrar movimiento
          var mov = {
            id: window.uuid(),
            productoId: item.id,
            tipo: data.tipo,
            cantidad: cantidad,
            motivo: data.motivo || 'Ajuste manual',
            createdBy: 'anon',
            createdAt: new Date()
          };
          return db.movimientos.put(mov);
        }).then(function () {
          // Verificar alerta de stock bajo
          var umbral = item.umbralMinimo || 10;
          if (nuevoStock <= umbral) {
            var alerta = {
              id: window.uuid(),
              productoId: item.id,
              tipo: 'stock_bajo',
              leida: false,
              createdAt: new Date()
            };
            return db.alertas.put(alerta);
          }
        }).then(function () {
          UI.toast('Stock ajustado: ' + nuevoStock + ' unidades', 'success');
          self.cargarDatos();
          if (window.MODULES.movimientos) window.MODULES.movimientos.cargarDatos();
          if (window.MODULES.alertas) window.MODULES.alertas.cargarDatos();
        }).catch(function (err) {
          UI.toast('Error al ajustar stock: ' + err.message, 'error');
          throw err;
        });
      });
    }
  };

  window.MODULES = window.MODULES || {};
  window.MODULES.inventario = Inventario;

  // Alpine data
  document.addEventListener('alpine:init', function () {
    if (typeof Alpine === 'undefined') return;
    Alpine.data('inventarioData', function () {
      var mod = window.MODULES.inventario;
      var data = {
        items: [],
        cargando: true,
        init: function () {
          var self = this;
          setInterval(function () {
            var raw = mod.datos || [];
            var q = (mod.busqueda || '').toLowerCase();
            if (q) {
              self.items = raw.filter(function (i) {
                return i.nombre.toLowerCase().indexOf(q) !== -1 ||
                       (i.sku && i.sku.toLowerCase().indexOf(q) !== -1);
              });
            } else {
              self.items = raw;
            }
            // Filtrar por categoria
            var catSelect = document.getElementById('inv-filtro-categoria');
            if (catSelect && catSelect.value) {
              var catId = catSelect.value;
              self.items = self.items.filter(function (i) { return i.categoriaId === catId; });
            }
            self.cargando = mod.cargando;
          }, 200);
        },
        editar: function (item) { mod.abrirForm(item); },
        eliminar: function (item) { mod.eliminar(item); },
        ajustarStock: function (item) { mod.ajustarStock(item); }
      };
      return data;
    });
  });

  console.log('[inventario] Modulo registrado');
})();
