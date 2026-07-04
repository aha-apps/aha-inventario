// sync.js — Export/Import de datos en formato .ahabackup (ZIP)
// Contenido del ZIP: data.json + metadata.json
// window.SyncEngine expuesto globalmente
// Dependencias: JSZip, CryptoJS, pako

(function () {
  'use strict';

  var DEFAULT_PASSWORD = '';
  var EXCLUDE_TABLES = ['modelos_cache', '_ia_sqlite', '_file_blobs'];

  if (typeof window.SyncEngine !== 'undefined') return;

  window.SyncEngine = {
    _password: DEFAULT_PASSWORD,

    setPassword: function (pwd) {
      this._password = pwd || '';
    },

    exportarBackup: function (password) {
      var pwd = password || this._password;
      var self = this;
      try {
        UI.toast('Preparando respaldo...', 'info');
        var zip = new JSZip();
        var appConfig = window.APP_CONFIG || {};
        var appConfigApp = appConfig.app || {};
        var appName = appConfigApp.nombre || 'app';
        var tables = {};
        var files = [];
        var recordCount = 0;

        var metaSteps = [];

        var dbRef = window.db;
        if (dbRef && dbRef._files) {
          metaSteps.push(
            dbRef._files.toArray().then(function (fileRows) {
              files = fileRows;
              var appId = appConfig.app ? (appConfig.app.id || '') : '';
              var platform = window.Neutralino ? 'neutralino' : (window.Capacitor ? 'capacitor' : 'web');
              zip.file('metadata.json', JSON.stringify({
                version: 2,
                app: appName,
                appId: appId,
                exportedAt: new Date().toISOString(),
                fileCount: files.length,
                platform: platform
              }, null, 2));
            })
          );
        }

        var dbTables = dbRef && dbRef.tables ? dbRef.tables : [];
        for (var i = 0; i < dbTables.length; i++) {
          (function (table) {
            if (EXCLUDE_TABLES.indexOf(table.name) !== -1) return;
            if (table.name === '_files' || table.name === '_file_blobs') return;
            metaSteps.push(
              table.toArray().then(function (records) {
                if (records.length) {
                  tables[table.name] = records;
                  recordCount += records.length;
                }
              })
            );
          })(dbTables[i]);
        }

        return Promise.all(metaSteps).then(function () {
          for (var f = 0; f < files.length; f++) {
            (function (file) {
              var key = file.id || file.name;
              if (key && (typeof key === 'string') && key.indexOf('/') !== -1) {
                zip.file('assets/' + key, file.data || file.blob || '');
              }
            })(files[f]);
          }

          var data = {
            version: 2,
            app: appName,
            exportedAt: new Date().toISOString(),
            recordCount: recordCount,
            tables: tables
          };
          var json = JSON.stringify(data, null, 2);

          if (pwd) {
            var encrypted = CryptoJS.AES.encrypt(json, pwd).toString();
            zip.file('data.json', encrypted);
          } else {
            try {
              var compressed = window.pako ? pako.gzip(json) : json;
              zip.file('data.json', compressed);
            } catch (e) {
              zip.file('data.json', json);
            }
          }

          return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        }).then(function (blob) {
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          var timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          a.download = appName + '-' + timestamp + '.ahabackup';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          UI.toast('Respaldo exportado correctamente', 'success');
          return true;
        }).catch(function (err) {
          UI.toast('Error al exportar: ' + (err.message || 'Error desconocido'), 'error');
          throw err;
        });
      } catch (err) {
        UI.toast('Error al exportar: ' + (err.message || 'Error desconocido'), 'error');
        return Promise.reject(err);
      }
    },

    importarBackup: function (file, password) {
      var self = this;
      try {
        UI.toast('Importando respaldo...', 'info');
        var reader = new FileReader();
        return new Promise(function (resolve, reject) {
          reader.onload = function () {
            var arrayBuffer = reader.result;
            try {
              JSZip.loadAsync(arrayBuffer).then(function (zip) {
                var dataFile = zip.file('data.json');
                if (!dataFile) {
                  UI.toast('Archivo de respaldo invalido: no se encontro data.json', 'error');
                  reject(new Error('Invalid backup'));
                  return;
                }
                dataFile.async('string').then(function (content) {
                  var json;
                  if (password) {
                    try {
                      var decrypted = CryptoJS.AES.decrypt(content, password).toString(CryptoJS.enc.Utf8);
                      if (!decrypted) throw new Error('Contrasena incorrecta');
                      json = JSON.parse(decrypted);
                    } catch (e) {
                      UI.toast('Contrasena incorrecta o archivo corrupto', 'error');
                      reject(e);
                      return;
                    }
                  } else {
                    try {
                      json = JSON.parse(content);
                    } catch (e) {
                      try {
                        var decompressed = pako.ungzip(content, { to: 'string' });
                        json = JSON.parse(decompressed);
                      } catch (e2) {
                        json = JSON.parse(content);
                      }
                    }
                  }

                  if (!json || !json.tables) {
                    UI.toast('Formato de respaldo invalido', 'error');
                    reject(new Error('Invalid format'));
                    return;
                  }

                  var tableNames = Object.keys(json.tables);
                  var ps = [];
                  var dbRef = window.db;
                  if (!dbRef) {
                    UI.toast('Base de datos no disponible', 'error');
                    reject(new Error('No DB'));
                    return;
                  }

                  for (var i = 0; i < tableNames.length; i++) {
                    (function (tableName) {
                      var records = json.tables[tableName];
                      if (!records || !records.length) return;
                      var targetTable = null;
                      for (var t = 0; t < dbRef.tables.length; t++) {
                        if (dbRef.tables[t].name === tableName) {
                          targetTable = dbRef.tables[t];
                          break;
                        }
                      }
                      if (targetTable) {
                        ps.push(targetTable.bulkPut(records));
                      }
                    })(tableNames[i]);
                  }

                  var metaFile = zip.file('metadata.json');
                  if (metaFile) {
                    ps.push(
                      metaFile.async('string').then(function (metaContent) {
                        try {
                          JSON.parse(metaContent);
                        } catch (e) {}
                      })
                    );
                  }

                  Promise.all(ps).then(function () {
                    UI.toast('Respaldo importado correctamente (' + json.recordCount + ' registros)', 'success');
                    resolve(true);
                  }).catch(function (err) {
                    UI.toast('Error al importar datos: ' + (err.message || 'Error'), 'error');
                    reject(err);
                  });
                }).catch(reject);
              }).catch(reject);
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = function () { reject(new Error('Error al leer archivo')); };
          reader.readAsArrayBuffer(file);
        });
      } catch (err) {
        UI.toast('Error al importar: ' + (err.message || 'Error'), 'error');
        return Promise.reject(err);
      }
    }
  };
})();
