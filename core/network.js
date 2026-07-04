// network.js — Monitoreo de conectividad offline-first
// window.network expuesto globalmente
// Dependencias: Alpine.js

(function () {
  'use strict';

  if (typeof window.network !== 'undefined') return;

  window.network = {
    online: navigator.onLine,

    init: function () {
      var self = this;
      window.addEventListener('online', function () {
        self.online = true;
        self._notify();
      });
      window.addEventListener('offline', function () {
        self.online = false;
        self._notify();
      });
    },

    _notify: function () {
      var evt = new CustomEvent('connection-change', {
        detail: { online: this.online }
      });
      window.dispatchEvent(evt);
      if (typeof Alpine !== 'undefined') {
        Alpine.store('network', { online: this.online });
      }
    }
  };

  window.network.init();
  console.log('[network] Inicializado');
})();
