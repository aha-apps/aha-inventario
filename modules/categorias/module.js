// modules/categorias/module.js — CRUD de categorias
// window.MODULES.categorias

(function () {
  'use strict';

  if (window.MODULES && window.MODULES.categorias) return;

  var Categorias = {
    id: 'categorias',
    titulo: 'Categorias',
    icono: 'bi bi-tags',
    datos: [],
    cargando: false,
    busqueda: '',

    init: function () {
      console.log('[categorias] Inicializado');
      this.cargarDatos();
    },

    render: function (params) {
      var html = '';
      html += '<div class="animate__animated animate__fadeInUp" x-data="categoriasData" x-init="init()">';
      html += '  <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">';
      html += '    <i class="bi bi-tags"></i> Categorias';
      html += '  </h2>';
      html += '  <div class="flex flex-wrap gap-2 mb-4">';
      html += '    <button class="btn btn-primary" onclick="window.MODULES.categorias.abrirForm(null)">';
      html += '      <i class="bi bi-plus-lg"></i> Agregar';
      html += '    </button>';
      html += '    <input type="search" id="cat-busqueda" onkeyup="window.MODULES.categorias.filtrar(this.value)" placeholder="Buscar..." class="input input-bordered flex-1 min-w-[200px]" />';
      html += '  </div>';

      // Tabla
      html += '  <template x-if="items && items.length">';
      html += '    <div class="overflow-x-auto">';
      html += '      <table class="table table-zebra">';
      html += '        <thead>';
      html += '          <tr><th>Nombre</th><th>Color</th><th>Acciones</th></tr>';
      html += '        </thead>';
      html += '        <tbody>';
      html += '          <tr x-for="item in items" :key="item.id">';
      html += '            <td><span class="font-medium" x-text="item.nombre"></span></td>';
      html += '            <td>';
      html += '              <div class="flex items-center gap-2">';
      html += '                <div class="w-5 h-5 rounded-full" :style="\'background-color: \' + item.color"></div>';
      html += '                <span class="text-sm text-base-content/60" x-text="item.color"></span>';
      html += '              </div>';
      html += '            </td>';
      html += '            <td>';
      html += '              <button class="btn btn-sm btn-ghost" @click="editar(item)"><i class="bi bi-pencil"></i></button>';
      html += '              <button class="btn btn-sm btn-ghost text-error" @click="eliminar(item)"><i class="bi bi-trash"></i></button>';
      html += '            </td>';
      html += '          </tr>';
      html += '        </tbody>';
      html += '      </table>';
      html += '    </div>';
      html += '  </template>';

      // Empty state
      html += '  <template x-if="!items || !items.length">';
      html += '    <div class="flex flex-col items-center justify-center py-16 text-base-content/50">';
      html += '      <i class="bi bi-tags text-6xl mb-4"></i>';
      html += '      <p class="text-lg mb-4">No hay categorias aun</p>';
      html += '      <button class="btn btn-primary" onclick="window.MODULES.categorias.abrirForm(null)">';
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

    filtrar: function (q) {
      this.busqueda = q;
    },

    cargarDatos: function () {
      var self = this;
      self.cargando = true;
      db.categorias.orderBy('nombre').toArray().then(function (items) {
        self.datos = items;
        self.cargando = false;
      }).catch(function (err) {
        console.error('[categorias] Error al cargar:', err);
        self.cargando = false;
      });
    },

    abrirForm: function (item) {
      var editando = !!item;
      var html = '';
      html += '<div class="space-y-4">';
      html += '  <label class="form-control w-full">';
      html += '    <span class="label-text">Nombre</span>';
      html += '    <input type="text" x-model="form.nombre" class="input input-bordered" placeholder="Nombre de la categoria" required>';
      html += '  </label>';
      html += '  <label class="form-control w-full">';
      html += '    <span class="label-text">Color</span>';
      html += '    <div class="flex items-center gap-3">';
      html += '      <input type="color" x-model="form.color" class="w-10 h-10 rounded cursor-pointer border border-base-300">';
      html += '      <input type="text" x-model="form.color" class="input input-bordered flex-1" placeholder="#3b82f6">';
      html += '    </div>';
      html += '  </label>';
      html += '</div>';

      if (editando) {
        window._modalFormData = {
          nombre: item.nombre || '',
          color: item.color || '#3b82f6'
        };
      } else {
        window._modalFormData = {
          nombre: '',
          color: '#3b82f6'
        };
      }

      var self = this;
      UI.modalForm(
        editando ? 'Editar Categoria' : 'Nueva Categoria',
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
        color: datos.color || '#3b82f6',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return db.categorias.put(registro).then(function () {
        UI.toast('Categoria guardada', 'success');
        self.cargarDatos();
      }).catch(function (err) {
        UI.toast('Error al guardar: ' + err.message, 'error');
        throw err;
      });
    },

    actualizar: function (id, datos) {
      var self = this;
      return db.categorias.get(id).then(function (existente) {
        if (!existente) {
          UI.toast('Categoria no encontrada', 'error');
          return Promise.reject(new Error('Not found'));
        }
        existente.nombre = datos.nombre;
        existente.color = datos.color || '#3b82f6';
        existente.updatedAt = new Date();
        return db.categorias.put(existente).then(function () {
          UI.toast('Categoria actualizada', 'success');
          self.cargarDatos();
        });
      }).catch(function (err) {
        UI.toast('Error al actualizar: ' + err.message, 'error');
        throw err;
      });
    },

    eliminar: function (item) {
      var self = this;
      UI.confirm('Eliminar la categoria "' + item.nombre + '"?').then(function (ok) {
        if (!ok) return;
        db.categorias.delete(item.id).then(function () {
          UI.toast('Categoria eliminada', 'success');
          self.cargarDatos();
        }).catch(function (err) {
          UI.toast('Error al eliminar: ' + err.message, 'error');
        });
      });
    }
  };

  window.MODULES = window.MODULES || {};
  window.MODULES.categorias = Categorias;

  // Alpine data
  document.addEventListener('alpine:init', function () {
    if (typeof Alpine === 'undefined') return;
    Alpine.data('categoriasData', function () {
      var self = this;
      return {
        items: [],
        cargando: true,
        init: function () {
          var mod = window.MODULES.categorias;
          var check = setInterval(function () {
            if (mod.datos) {
              self.items = mod.datos;
              self.cargando = mod.cargando;
              clearInterval(check);
            }
          }, 100);
          // Escuchar cambios
          setInterval(function () {
            self.items = mod.datos;
            self.cargando = mod.cargando;
            // Filtro
            if (mod.busqueda) {
              var q = mod.busqueda.toLowerCase();
              self.items = mod.datos.filter(function (i) {
                return i.nombre.toLowerCase().indexOf(q) !== -1;
              });
            }
          }, 200);
        },
        editar: function (item) { mod.abrirForm(item); },
        eliminar: function (item) { mod.eliminar(item); }
      };
      var mod = window.MODULES.categorias;
    });
  });

  console.log('[categorias] Modulo registrado');
})();
