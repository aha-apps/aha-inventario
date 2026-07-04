// db.js — Inicializacion Dexie con tablas de AHA Inventario
// window.db expuesto globalmente
// window.DB_VERSION auto-gestionado
// Dependencias: Dexie.js, APP_CONFIG

(function () {
  'use strict';

  if (typeof window.db !== 'undefined') return;

  var DB_NAME = window.APP_CONFIG && window.APP_CONFIG.app
    ? (window.APP_CONFIG.app.id || 'aha-inventario') : 'aha-inventario';

  var db = new Dexie(DB_NAME);

  window.DB_VERSION = 1;

  db.version(1).stores({
    // Tablas del negocio
    categorias: 'id, nombre, *color, createdAt, updatedAt',
    productos: 'id, nombre, *sku, *categoriaId, precio, cantidad, *imagen, *umbralMinimo, *createdBy, createdAt, updatedAt',
    movimientos: 'id, *productoId, *tipo, cantidad, *motivo, *createdBy, createdAt',
    alertas: 'id, *productoId, *tipo, leida, createdAt',

    // Tablas de sistema
    _sync_log: 'id, *tabla, *operacion, *idRegistro, *estado, *fecha, *createdBy, createdAt',
    _ia_chats: 'id, *titulo, *modelo, *createdBy, createdAt, updatedAt',
    _ia_messages: 'id, *chatId, *rol, contenido, *createdBy, createdAt',
    _files: '&path, tipo, nombre, mime, size, hash, refCount, createdAt, updatedAt',
    _analytics: 'id, *page, *category, *action, *synced, *timestamp, createdAt'
  });

  // En perfil Lite, anadir tabla de blobs para file:// sin acceso a disco
  if (!window.NL_OS && !window.Capacitor) {
    db.version(1).stores({
      _file_blobs: '&path'
    });
  }

  window.db = db;
  console.log('[db] Inicializado: ' + DB_NAME);
})();
