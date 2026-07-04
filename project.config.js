// project.config.js — Configuracion de AHA Inventario
// Se carga antes que cualquier otro script

window.APP_CONFIG = {
  app: {
    id: 'aha-inventario',
    nombre: 'AHA Inventario',
    version: '1.0.0',
    tipo: 'inventario',
    descripcion: 'Control de stock offline-first'
  },
  perfil: 'lite',
  plan: 'lite',
  iaJutia: {
    perfil: 'lite'
  },
  modulosActivos: ['inventario', 'categorias', 'movimientos', 'alertas', 'reportes'],
  tema: {
    modo: 'light',
    colores: {
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
    tipografia: {
      familia: 'Inter, system-ui, sans-serif'
    },
    radius: '1rem'
  },
  cifrado: {
    camposSensibles: [],
    storageKey: 'aha-crypto-key'
  },
  ui: {
    formsMode: 'modal',
    alerts: 'toast',
    confirmDelete: true,
    avatars: false
  },
  data: {
    dir: 'data/',
    maxFileSize: 10 * 1024 * 1024,
    tipos: ['avatar', 'foto', 'doc', 'logo', 'backup'],
    avatars: {
      default: 'data/defaults/avatar.svg',
      size: 200,
      calidad: 0.8
    }
  },
  sync: {
    primaryFormat: 'json',
    secondaryFormats: [],
    includeFiles: true,
    encrypt: true,
    maxExportSize: 50 * 1024 * 1024
  },
  modulos: [
    { id: 'inventario', titulo: 'Inventario', icono: 'bi bi-box-seam' },
    { id: 'categorias', titulo: 'Categorias', icono: 'bi bi-tags' },
    { id: 'movimientos', titulo: 'Movimientos', icono: 'bi bi-arrow-left-right' },
    { id: 'alertas', titulo: 'Alertas', icono: 'bi bi-exclamation-triangle' },
    { id: 'reportes', titulo: 'Reportes', icono: 'bi bi-graph-up' }
  ]
};

window.APP_ID = 'aha-inventario';
