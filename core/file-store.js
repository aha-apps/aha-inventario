// file-store.js — Gestion unificada de archivos (avatares, fotos, documentos)
// window.FileStore expuesto globalmente
// Dependencias: Dexie, APP_CONFIG

(function () {
  'use strict';

  if (typeof window.FileStore !== 'undefined') return;

  var APP_DATA_DIR = 'data/';
  var isNeutralino = typeof window.NL_OS !== 'undefined' && window.NL_OS;
  var isCapacitor = typeof window.Capacitor !== 'undefined' && window.Capacitor;

  function getDefaultPath() {
    if (isNeutralino) return APP_DATA_DIR;
    if (isCapacitor) return APP_DATA_DIR;
    return APP_DATA_DIR;
  }

  // ─── Save file ────────────────────────────────────────
  function save(tipo, nombre, blob) {
    return new Promise(function (resolve, reject) {
      try {
        var ext = nombre.split('.').pop() || 'bin';
        var id = window.uuid();
        var path = tipo + '/' + id + '.' + ext;

        var reader = new FileReader();
        reader.onload = function () {
          var arrayBuffer = reader.result;
          var hash = simpleHash(arrayBuffer);

          var fileRecord = {
            path: path,
            tipo: tipo,
            nombre: nombre,
            mime: blob.type || 'application/octet-stream',
            size: blob.size,
            hash: hash,
            refCount: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          var ops = [];
          ops.push(db._files.put(fileRecord));

          // En perfil Lite, guardar blob en _file_blobs
          if (db._file_blobs) {
            ops.push(db._file_blobs.put({ path: path, data: arrayBuffer }));
          }

          Promise.all(ops).then(function () {
            var url = getObjectURL(path);
            resolve({ path: path, hash: hash, url: url });
          }).catch(reject);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      } catch (e) {
        reject(e);
      }
    });
  }

  // ─── Get URL ─────────────────────────────────────────
  function getObjectURL(path) {
    if (!path) return '';
    if (isNeutralino) return 'resources/' + path;
    if (isCapacitor) return APP_DATA_DIR + path;
    // En web puro, generamos object URL desde el blob almacenado
    return path; // Se resuelve via read()
  }

  function getURL(path) {
    if (!path) return '';
    if (path.indexOf('blob:') === 0 || path.indexOf('data:') === 0) return path;
    if (path.indexOf('http://') === 0 || path.indexOf('https://') === 0) return path;
    return getObjectURL(path);
  }

  // ─── Read file ───────────────────────────────────────
  function read(path) {
    return new Promise(function (resolve, reject) {
      if (!path) { reject(new Error('Path requerido')); return; }
      if (!db._file_blobs) { reject(new Error('Almacenamiento de archivos no disponible')); return; }
      db._file_blobs.get(path).then(function (record) {
        if (!record || !record.data) { reject(new Error('Archivo no encontrado: ' + path)); return; }
        var blob = new Blob([record.data]);
        resolve(blob);
      }).catch(reject);
    });
  }

  // ─── Get blob URL from stored file ───────────────────
  function getBlobURL(path) {
    return new Promise(function (resolve, reject) {
      read(path).then(function (blob) {
        var url = URL.createObjectURL(blob);
        resolve(url);
      }).catch(reject);
    });
  }

  // ─── Delete file ─────────────────────────────────────
  function deleteFile(path) {
    return new Promise(function (resolve, reject) {
      if (!path) { resolve(); return; }
      var ops = [];
      ops.push(db._files.where('path').equals(path).delete());
      if (db._file_blobs) {
        ops.push(db._file_blobs.where('path').equals(path).delete());
      }
      Promise.all(ops).then(resolve).catch(reject);
    });
  }

  // ─── Meta data ───────────────────────────────────────
  function meta(path) {
    return db._files.where('path').equals(path).first();
  }

  // ─── Clean orphans ───────────────────────────────────
  function cleanOrphans() {
    return db._files.where('refCount').equals(0).delete().then(function () {
      if (db._file_blobs) {
        return db._files.toArray().then(function (files) {
          var validPaths = files.map(function (f) { return f.path; });
          return db._file_blobs.toArray().then(function (blobs) {
            var ops = [];
            for (var i = 0; i < blobs.length; i++) {
              if (validPaths.indexOf(blobs[i].path) === -1) {
                ops.push(db._file_blobs.where('path').equals(blobs[i].path).delete());
              }
            }
            return Promise.all(ops);
          });
        });
      }
    });
  }

  // ─── Avatar default ──────────────────────────────────
  function avatarDefault() {
    var path = 'data/defaults/avatar.svg';
    if (window.APP_CONFIG && window.APP_CONFIG.data && window.APP_CONFIG.data.avatars && window.APP_CONFIG.data.avatars.default) {
      path = window.APP_CONFIG.data.avatars.default;
    }
    if (isNeutralino) return 'resources/' + path.replace(/^data\//, '');
    return path;
  }

  // ─── Simple hash (SHA-256 simulation) ─────────────────
  function simpleHash(buffer) {
    var view = new Uint8Array(buffer);
    var hash = 0;
    for (var i = 0; i < view.length; i++) {
      hash = ((hash << 5) - hash) + view[i];
      hash = hash & hash;
    }
    return 'hash_' + Math.abs(hash).toString(16);
  }

  // ─── Export ───────────────────────────────────────────
  window.FileStore = {
    APP_DATA_DIR: APP_DATA_DIR,
    save: save,
    getURL: getURL,
    read: read,
    getBlobURL: getBlobURL,
    delete: deleteFile,
    meta: meta,
    cleanOrphans: cleanOrphans,
    avatarDefault: avatarDefault
  };

  console.log('[file-store] Inicializado');
})();
