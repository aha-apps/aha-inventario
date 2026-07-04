// feature-flags.js — Sistema de feature flags basado en plan/licencia
// window.FF expuesto globalmente
// Dependencias: APP_CONFIG, Alpine.js

(function () {
  'use strict';

  if (typeof window.FF !== 'undefined') return;

  var PLAN_HIERARCHY = { lite: 0, professional: 1, business: 2 };

  var BUILTIN = {
    lite: {
      maxRecords: 30,
      canExport: false,
      canSync: false,
      canBackup: false,
      canWhiteLabel: false,
      iaTier: 'lite',
      multiUser: false,
      apiAccess: false,
      maxDevices: 1
    },
    professional: {
      maxRecords: 999999,
      canExport: true,
      canSync: true,
      canBackup: true,
      canWhiteLabel: false,
      iaTier: 'full',
      multiUser: false,
      apiAccess: false,
      maxDevices: 5
    },
    business: {
      maxRecords: 999999,
      canExport: true,
      canSync: true,
      canBackup: true,
      canWhiteLabel: true,
      iaTier: 'full',
      multiUser: true,
      apiAccess: true,
      maxDevices: 200
    }
  };

  var plan = 'lite';
  var features = {};
  var brandFeatures = {};

  function getPlan() {
    return window.APP_CONFIG && window.APP_CONFIG.plan
      ? window.APP_CONFIG.plan
      : 'lite';
  }

  function getPlanIndex(p) {
    return PLAN_HIERARCHY[p] !== undefined ? PLAN_HIERARCHY[p] : 0;
  }

  function minPlan(required) {
    return getPlanIndex(getPlan()) >= getPlanIndex(required);
  }

  var FF = {
    init: function () {
      plan = getPlan();
      var bp = BUILTIN[plan] || BUILTIN.lite;
      features = JSON.parse(JSON.stringify(bp));

      var brand = window.brandLoader ? window.brandLoader.get() : null;
      brandFeatures = (brand && brand.features) || {};

      Object.keys(brandFeatures).forEach(function (key) {
        if (brandFeatures[key] === true || brandFeatures[key] === false) {
          features[key] = brandFeatures[key];
        }
      });

      if (typeof Alpine !== 'undefined' && Alpine.store) {
        Alpine.store('ff', {
          list: function () { return JSON.parse(JSON.stringify(features)); },
          enabled: FF.enabled,
          require: FF.require
        });
      }
    },

    enabled: function (key) {
      if (key in features) return !!features[key];
      if (key in brandFeatures) return !!brandFeatures[key];
      return false;
    },

    require: function (key) {
      if (!FF.enabled(key)) {
        throw new Error('Funcionalidad no disponible: ' + key + ' (plan: ' + plan + ')');
      }
      return true;
    },

    plan: function () { return plan; },

    is: function (p) {
      return getPlanIndex(plan) >= getPlanIndex(p);
    },

    list: function () {
      return JSON.parse(JSON.stringify(features));
    }
  };

  window.FF = FF;

  document.addEventListener('alpine:init', function () {
    setTimeout(FF.init, 50);
  });

  console.log('[feature-flags] Inicializado');
})();
