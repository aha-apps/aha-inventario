// search-palette.js — Command Palette (Cmd+K) global con navegacion de modulos
// window.searchPalette expuesto globalmente
// Dependencias: Alpine.js, window.MODULES, window.APP_CONFIG

(function () {
  'use strict';

  if (typeof window.searchPalette !== 'undefined') return;

  var isOpen = false;
  var currentQuery = '';
  var selectedIndex = -1;
  var lastActiveElement = null;

  var DEFAULT_MODULES = [
    { id: 'inventario', titulo: 'Inventario', icono: 'bi-box-seam' },
    { id: 'categorias', titulo: 'Categorias', icono: 'bi-tags' },
    { id: 'movimientos', titulo: 'Movimientos', icono: 'bi-arrow-left-right' },
    { id: 'alertas', titulo: 'Alertas', icono: 'bi-exclamation-triangle' },
    { id: 'reportes', titulo: 'Reportes', icono: 'bi-graph-up' }
  ];

  function getModules() {
    var configModules = window.APP_CONFIG && window.APP_CONFIG.modulos;
    if (configModules && configModules.length) {
      return configModules;
    }
    return DEFAULT_MODULES;
  }

  function getModuleIcon(id) {
    for (var i = 0; i < DEFAULT_MODULES.length; i++) {
      if (DEFAULT_MODULES[i].id === id) return DEFAULT_MODULES[i].icono;
    }
    return 'bi-box-seam';
  }

  function getModuleTitle(id) {
    var mod = window.MODULES && window.MODULES[id];
    return mod ? mod.titulo : id;
  }

  function openPalette() {
    if (isOpen) return;
    isOpen = true;
    selectedIndex = -1;
    currentQuery = '';
    lastActiveElement = document.activeElement;

    var overlay = document.createElement('div');
    overlay.id = 'palette-overlay';
    overlay.className = 'fixed inset-0 z-[60] flex items-start justify-center pt-[12vh]';
    overlay.innerHTML =
      '<div class="absolute inset-0 bg-base-300/60 backdrop-blur-sm" data-palette-close></div>' +
      '<div class="relative w-full max-w-xl mx-4">' +
        '<div class="bg-base-100 rounded-2xl shadow-2xl border border-base-300 overflow-hidden">' +
          '<div class="flex items-center gap-3 px-5 py-4 border-b border-base-200">' +
            '<svg class="w-5 h-5 text-base-content/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>' +
            '</svg>' +
            '<input id="palette-input" type="text" class="flex-1 bg-transparent border-0 outline-none text-base placeholder:text-base-content/30" placeholder="Buscar modulos...">' +
            '<kbd class="hidden sm:inline-flex px-2 py-0.5 text-xs rounded bg-base-200 text-base-content/50">ESC</kbd>' +
          '</div>' +
          '<div id="palette-results" class="max-h-80 overflow-y-auto p-2">' +
            '<div class="px-3 py-2 text-xs font-semibold text-base-content/40 uppercase tracking-wider">Modulos</div>' +
          '</div>' +
          '<div class="flex items-center gap-4 px-5 py-2.5 border-t border-base-200 text-xs text-base-content/40">' +
            '<span class="flex items-center gap-1"><kbd class="kbd kbd-xs">&uarr;&darr;</kbd> Navegar</span>' +
            '<span class="flex items-center gap-1"><kbd class="kbd kbd-xs">Enter</kbd> Abrir</span>' +
            '<span class="flex items-center gap-1"><kbd class="kbd kbd-xs">Esc</kbd> Cerrar</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    var input = document.getElementById('palette-input');
    input.focus();
    input.addEventListener('input', function () {
      currentQuery = this.value;
      renderResults(currentQuery);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveSelection(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveSelection(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectCurrent();
      } else if (e.key === 'Escape') {
        closePalette();
      }
    });

    var closeButtons = overlay.querySelectorAll('[data-palette-close]');
    for (var i = 0; i < closeButtons.length; i++) {
      closeButtons[i].addEventListener('click', closePalette);
    }

    renderResults('');
  }

  function renderResults(query) {
    var resultsEl = document.getElementById('palette-results');
    if (!resultsEl) return;

    var modules = getModules();
    var filtered = [];
    var q = query.toLowerCase().trim();

    if (q) {
      for (var i = 0; i < modules.length; i++) {
        if (modules[i].titulo.toLowerCase().indexOf(q) !== -1 || modules[i].id.indexOf(q) !== -1) {
          filtered.push(modules[i]);
        }
      }
    } else {
      filtered = modules.slice();
    }

    selectedIndex = -1;

    if (filtered.length === 0 && q.length >= 2) {
      resultsEl.innerHTML =
        '<div class="px-3 py-8 text-center text-sm text-base-content/40">' +
          '<svg class="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' +
          '</svg>' +
          'Sin resultados para <strong>' + escapeHtml(q) + '</strong>' +
        '</div>';
      return;
    }

    var html = '';
    if (!q) {
      html += '<div class="px-3 py-2 text-xs font-semibold text-base-content/40 uppercase tracking-wider">Modulos</div>';
    }
    for (var j = 0; j < filtered.length; j++) {
      html +=
        '<div class="palette-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors hover:bg-base-200" data-index="' + j + '">' +
          '<div class="flex items-center justify-center w-8 h-8 rounded-lg bg-base-200 text-base-content/60 shrink-0">' +
            '<i class="bi ' + filtered[j].icono + ' text-sm"></i>' +
          '</div>' +
          '<div class="flex-1 min-w-0">' +
            '<div class="text-sm font-medium truncate">' + filtered[j].titulo + '</div>' +
          '</div>' +
          '<span class="badge badge-ghost badge-sm">modulo</span>' +
        '</div>';
    }
    resultsEl.innerHTML = html;

    var items = resultsEl.querySelectorAll('.palette-item');
    for (var k = 0; k < items.length; k++) {
      (function (idx) {
        items[idx].addEventListener('click', function () {
          var modId = filtered[idx].id;
          closePalette();
          if (window.appRouter) {
            window.appRouter.navigate(modId);
          }
        });
        items[idx].addEventListener('mouseenter', function () {
          selectedIndex = idx;
          updateSelection(items);
        });
      })(k);
    }
  }

  function moveSelection(direction) {
    var items = document.querySelectorAll('.palette-item');
    if (items.length === 0) return;
    selectedIndex += direction;
    if (selectedIndex < 0) selectedIndex = 0;
    if (selectedIndex >= items.length) selectedIndex = items.length - 1;
    updateSelection(items);
  }

  function updateSelection(items) {
    for (var i = 0; i < items.length; i++) {
      if (i === selectedIndex) {
        items[i].classList.add('bg-primary/10', 'text-primary');
        items[i].classList.remove('hover:bg-base-200');
        items[i].scrollIntoView({ block: 'nearest' });
      } else {
        items[i].classList.remove('bg-primary/10', 'text-primary');
        items[i].classList.add('hover:bg-base-200');
      }
    }
  }

  function selectCurrent() {
    var items = document.querySelectorAll('.palette-item');
    if (selectedIndex >= 0 && selectedIndex < items.length) {
      items[selectedIndex].click();
    }
  }

  function closePalette() {
    if (!isOpen) return;
    isOpen = false;
    var overlay = document.getElementById('palette-overlay');
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    if (lastActiveElement && lastActiveElement.focus) {
      lastActiveElement.focus();
    }
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ─── Global keyboard shortcut ────────────────────────
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openPalette();
    }
    if (e.key === 'Escape' && isOpen) {
      closePalette();
    }
  });

  // ─── Export ───────────────────────────────────────────
  window.searchPalette = {
    open: openPalette,
    close: closePalette,
    isOpen: function () { return isOpen; }
  };

  console.log('[search-palette] Inicializado');
})();
