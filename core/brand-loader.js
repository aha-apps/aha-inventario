// brand-loader.js — Sistema de carga de configuracion de marca white-label
// window.brandLoader expuesto globalmente
// Dependencias: Alpine.js

(function () {
  'use strict';

  if (typeof window.brandLoader !== 'undefined') return;

  var DEFAULTS = {
    client: '',
    appName: 'AHA Inventario',
    appId: 'aha-inventario',
    colors: {
      primary: '#1e3a5f',
      secondary: '#64748b',
      accent: '#0ea5e9',
      neutral: '#1c1917',
      'base-100': '#ffffff',
      'base-200': '#f1f5f9',
      'base-300': '#e2e8f0',
      info: '#3b82f6',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    fonts: {
      heading: 'Inter, system-ui, sans-serif',
      body: 'Inter, system-ui, sans-serif',
      mono: 'JetBrains Mono, monospace'
    },
    logo: {
      light: '',
      dark: '',
      favicon: '',
      splash: ''
    },
    features: {},
    support: {
      email: '',
      docsUrl: '',
      phone: ''
    },
    customCss: '',
    version: '1.0.0'
  };

  var DAISYUI_MAP = {
    primary: '--p',
    secondary: '--s',
    accent: '--a',
    neutral: '--n',
    'base-100': '--b1',
    'base-200': '--b2',
    'base-300': '--b3',
    info: '--in',
    success: '--su',
    warning: '--wa',
    error: '--er'
  };

  var CONFIG_PATH = './brand.config.json';
  var STORAGE_KEY = 'ateje_brand_preview';
  var currentConfig = null;
  var listeners = [];
  var isNeutralino = typeof window.NL_OS !== 'undefined' && window.NL_OS;

  function deepMerge(base, override) {
    var result = JSON.parse(JSON.stringify(base));
    if (!override) return result;
    Object.keys(override).forEach(function (key) {
      if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
        result[key] = deepMerge(result[key] || {}, override[key]);
      } else if (override[key] !== undefined && override[key] !== '') {
        result[key] = override[key];
      }
    });
    return result;
  }

  function parseColor(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r: r, g: g, b: b };
  }

  function hexToOklch(hex) {
    var c = parseColor(hex);
    if (!c) return null;
    var r = c.r / 255;
    var g = c.g / 255;
    var b = c.b / 255;
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    var l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
    var m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
    var s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
    l = Math.cbrt(l);
    m = Math.cbrt(m);
    s = Math.cbrt(s);
    var L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    var a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    var bChroma = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
    var C = Math.sqrt(a * a + bChroma * bChroma);
    var H = Math.atan2(bChroma, a) * (180 / Math.PI);
    if (H < 0) H += 360;
    L = Math.round(L * 100) / 100;
    C = Math.round(C * 100) / 100;
    H = Math.round(H * 100) / 100;
    if (isNaN(H)) H = 0;
    return L + ' ' + C + ' ' + H;
  }

  function applyTheme(config) {
    var root = document.documentElement;
    var colors = config.colors || {};

    Object.keys(DAISYUI_MAP).forEach(function (key) {
      var hex = colors[key];
      if (hex) {
        var oklch = hexToOklch(hex);
        if (oklch) {
          root.style.setProperty(DAISYUI_MAP[key], oklch);
        }
      }
    });

    root.style.setProperty('--font-heading', config.fonts.heading);
    root.style.setProperty('--font-body', config.fonts.body);
    root.style.setProperty('--font-mono', config.fonts.mono);

    if (config.customCss) {
      var styleEl = document.getElementById('brand-custom-css');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'brand-custom-css';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = config.customCss;
    }

    if (config.logo.favicon) {
      var link = document.querySelector('link[rel="icon"]');
      if (link) link.href = config.logo.favicon;
    }

    document.title = config.appName || document.title;
  }

  function loadFromNeutralino() {
    return Neutralino.filesystem.readFile(CONFIG_PATH.replace('./', ''))
      .then(function (content) {
        return JSON.parse(content);
      })
      .catch(function () {
        return null;
      });
  }

  function loadFromFetch() {
    return fetch(CONFIG_PATH)
      .then(function (res) {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .catch(function () {
        return null;
      });
  }

  function loadConfig() {
    return new Promise(function (resolve) {
      if (currentConfig) {
        resolve(currentConfig);
        return;
      }

      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          var preview = JSON.parse(raw);
          currentConfig = deepMerge(DEFAULTS, preview);
          applyTheme(currentConfig);
          resolve(currentConfig);
          return;
        } catch (e) {
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      var loadPromise = isNeutralino ? loadFromNeutralino() : loadFromFetch();

      loadPromise.then(function (json) {
        if (json) {
          currentConfig = deepMerge(DEFAULTS, json);
          applyTheme(currentConfig);
          resolve(currentConfig);
        } else {
          currentConfig = JSON.parse(JSON.stringify(DEFAULTS));
          resolve(currentConfig);
        }
      });
    });
  }

  function notify() {
    listeners.forEach(function (fn) { fn(currentConfig); });
  }

  function setConfig(partial) {
    currentConfig = deepMerge(currentConfig || DEFAULTS, partial);
    applyTheme(currentConfig);
    notify();
  }

  function injectConfig(config) {
    currentConfig = deepMerge(DEFAULTS, config);
  }

  function exportConfig() {
    var blob = new Blob([JSON.stringify(currentConfig, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'brand.config.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function applyImported(config) {
    currentConfig = deepMerge(DEFAULTS, config);
    applyTheme(currentConfig);
    if (isNeutralino) {
      Neutralino.filesystem.writeFile('brand.config.json', JSON.stringify(currentConfig, null, 2));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentConfig));
    }
    notify();
    return currentConfig;
  }

  function importFromFile() {
    return new Promise(function (resolve, reject) {
      if (isNeutralino) {
        Neutralino.os.showOpenDialog('Seleccionar brand.config.json', {
          filters: [{ name: 'JSON', extensions: ['json'] }]
        }).then(function (result) {
          if (!result || !result.length) { reject(new Error('')); return; }
          Neutralino.filesystem.readFile(result[0]).then(function (content) {
            try { resolve(applyImported(JSON.parse(content))); }
            catch (err) { reject(err); }
          }).catch(reject);
        }).catch(reject);
      } else {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function (e) {
          var file = e.target.files[0];
          if (!file) { reject(new Error('')); return; }
          var reader = new FileReader();
          reader.onload = function (ev) {
            try { resolve(applyImported(JSON.parse(ev.target.result))); }
            catch (err) { reject(err); }
          };
          reader.readAsText(file);
        };
        input.click();
      }
    });
  }

  function resetConfig() {
    currentConfig = JSON.parse(JSON.stringify(DEFAULTS));
    applyTheme(currentConfig);
    notify();
  }

  window.brandLoader = {
    DEFAULTS: DEFAULTS,
    load: loadConfig,
    get: function () { return currentConfig || DEFAULTS; },
    set: setConfig,
    reset: resetConfig,
    injectConfig: injectConfig,
    apply: function () {
      if (currentConfig) applyTheme(currentConfig);
    },
    export: exportConfig,
    import: importFromFile,
    isNeutralino: isNeutralino,
    onChange: function (fn) { listeners.push(fn); },
    getColor: function (key) {
      var c = (currentConfig || DEFAULTS).colors;
      return c[key] || c['primary'] || '#1e3a5f';
    }
  };

  document.addEventListener('alpine:init', function () {
    if (typeof Alpine === 'undefined' || !Alpine.store) return;

    Alpine.store('brand', {
      config: DEFAULTS,
      ready: false,
      preview: false,
      saving: false,
      saved: false,
      saveError: '',
      isNeutralino: isNeutralino,

      get: function () { return this.config; },

      init: function () {
        var self = this;
        brandLoader.load().then(function (cfg) {
          self.config = cfg;
          self.ready = true;
        });
      },

      setColor: function (key, value) {
        this.config.colors[key] = value;
        brandLoader.set({ colors: this.config.colors });
      },

      setFont: function (key, value) {
        this.config.fonts[key] = value;
        brandLoader.set({ fonts: this.config.fonts });
      },

      setAppName: function (value) {
        this.config.appName = value;
        brandLoader.set({ appName: value });
      },

      setCustomCss: function (value) {
        this.config.customCss = value;
        brandLoader.set({ customCss: value });
      },

      savePreview: function () {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
          this.preview = true;
          var self = this;
          setTimeout(function () { self.preview = false; }, 3000);
        } catch (e) {
          console.warn('[brand-loader] No se pudo guardar preview:', e);
        }
      },

      clearPreview: function () {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        this.config = DEFAULTS;
        brandLoader.reset();
      },

      exportConfig: function () {
        brandLoader.export();
      }
    });
  });

  console.log('[brand-loader] Inicializado' + (isNeutralino ? ' (Neutralino)' : ''));
})();
