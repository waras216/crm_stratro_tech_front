// Catálogo curado (no exhaustivo) de regímenes fiscales del SAT — solo los
// más comunes para PyMEs. Usado en Configuración → Fiscal y en el
// onboarding, donde se capturan los datos del emisor para timbrado real de
// CFDI (ver ErpFacturacionComponent / FacturaService en el backend).
export const REGIMENES_FISCALES_SAT = [
  { value: '601', label: '601 — General de Ley Personas Morales' },
  { value: '603', label: '603 — Personas Morales con Fines no Lucrativos' },
  { value: '605', label: '605 — Sueldos y Salarios' },
  { value: '606', label: '606 — Arrendamiento' },
  { value: '612', label: '612 — Personas Físicas con Actividades Empresariales y Profesionales' },
  { value: '621', label: '621 — Incorporación Fiscal' },
  { value: '626', label: '626 — Régimen Simplificado de Confianza (RESICO)' },
];
