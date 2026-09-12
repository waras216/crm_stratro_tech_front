# Auditoría — StratoHub Frontend

Fecha: 2026-09-10
Alcance: `crm_stratro_tech_front` (Angular 21 + Tailwind 3.4)

## 1. Arquitectura detectada

- **Angular 21**, basado en **NgModule** (`standalone: false` por defecto en schematics, `angular.json`) — no standalone components, no signals adoptados aún salvo `ModuleService.activeModule` (único uso de `signal()` encontrado).
- Módulo único de declaraciones (`app-module.ts`), sin lazy loading por feature — todo se compila en un solo bundle inicial (`main.js` ~3.4MB, visto en los rebuilds del dev server).
- **Shell unificado**: un layout (`shell-layout.component`) envuelve CRM/ERP/POS con TopBar + Sidebar dinámico + FAB de cambio de módulo. CRM navega por Angular Router; ERP y POS navegan por `*ngIf` + `BehaviorSubject` (`erpTab$`/`posTab$` en `ModuleService`), no por rutas — esto es deliberado y documentado, no un descuido.
- **Formularios: 100% template-driven** (`ngModel`, 35 archivos), **cero uso de `ReactiveFormsModule`/`FormGroup`** en todo el repo. Validación manual con variables de error de string por componente (`mesaError`, `error`, etc.), sin estados `touched`/`dirty`/`pristine`.
- **Componentes compartidos ya existentes** (`components/shared/`): `empty-state`, `confirm-dialog`, `toast`, `view-toggle`, `bulk-action-bar`, `date-range`, `report-export-buttons`, `not-found`, `app-switcher`. Es decir: **EmptyState, un sistema de Toast y un Modal de confirmación ya existen** — no hay que reinventarlos, solo auditar consistencia de uso.
- **RxJS**: uso estándar de `BehaviorSubject` + `takeUntil` para limpieza de subscripciones; patrón repetido correctamente en casi todos los componentes revisados.
- **Guards/interceptors**: `auth.guard`, `admin-tenant.guard`, `superadmin.guard`, `modulo.guard` (restringe cajero/cocinero a su módulo); interceptores de auth-token y manejo de 401. RBAC dinámico (roles/permisos) ya implementado y usado en varias pantallas vía `*appPuede="'clave'"` (directiva ya existente, no hace falta crearla).

## 2. Versión de Angular

**21.2.0** — `standalone: false` por convención de proyecto (`angular.json` schematics). No convertir a standalone sin que el usuario lo pida explícitamente: sería un cambio arquitectónico masivo, no una "mejora".

## 3. Versión de Tailwind

**3.4.0** (v3, no v4 — importante porque v4 cambia la sintaxis de config a CSS-first; aquí sigue siendo `tailwind.config.js` con `theme.extend`). `darkMode: 'class'`. Config ya trae:
- Paleta `brand` (familia índigo 50–700).
- `boxShadow` custom: `card`, `hover`, `modal`, `btn`.

## 4. Sistema visual actual — ya existe un design system parcial

`src/styles.scss` ya define **tokens CSS personalizables en runtime** (`--accent`, `--radius`, `--spacing`, `--base-font`, `--bg-page`, `--bg-card`, `--text-primary`, etc.), con soporte dark mode vía `.dark`. Esto está conectado a un **panel de personalización real** en `configuracion.component.ts` (color de acento, tamaño de fuente, densidad, radio de bordes — `document.documentElement.style.setProperty(...)`, líneas 580-638).

**Hallazgo técnico crítico (P0):** el override de utilidades Tailwind con `!important` para que respondan a estos tokens **solo cubre una lista parcial de clases** (`.text-xs` a `.text-4xl`, `.text-[10px]/[11px]/[13px]/[15px]`, `.rounded-xl`, `.rounded-2xl`, `.gap-5`, `.p-6`). El resto del código usa masivamente `.p-3`, `.p-4`, `.gap-2`, `.gap-3`, `.rounded-lg`, `.text-[8px]/[9px]` (confirmado en los componentes POS/ERP revisados) — **esas clases no reaccionan a los settings de densidad/radio del usuario**, dando una personalización inconsistente a medias. Esto no es un problema visual menor: es una funcionalidad que el usuario cree que funciona globalmente y no lo hace.

## 5. Problemas UX

- **Formularios sin validación estructurada**: errores como strings sueltos por componente, sin asociar al campo, sin `aria-live`, inconsistentes entre pantallas (algunos usan `notify.error()` toast, otros un `<p>` rojo inline, sin criterio único visible).
- **Sin loading/empty/error states consistentes**: `empty-state` existe pero no confirmé que se use en todas las listas — varias pantallas ERP muestran `*ngIf="cargando"` con skeletons ad-hoc por componente en vez de un `LoadingState` compartido.
- Confirmado en esta misma sesión (no es hipotético): dos bugs reales de flujo que arreglamos hoy (botón "Enviar a Cocina" que desaparecía sin razón visible para el usuario, badge "Lista para servir" que nunca se activaba) — síntoma de que faltan pruebas visuales/QA antes de dar por buena una pantalla.

## 6. Problemas UI

- Radios de borde inconsistentes: mezcla de `rounded-lg`, `rounded-xl`, `rounded-2xl` sin regla clara de "cuándo cuál" (cards usan 2xl, inputs xl, badges full — parcialmente consistente, pero no documentado en ningún sitio).
- Botones con estilos inline (`style="background:#6366f1"`) en vez de clases/componente reutilizable — encontrado repetidamente en terminales POS. Esto hace imposible que el sistema de temas (`--accent`) los alcance: son colores hardcodeados que ignoran la personalización del usuario.
- Login usa glassmorphism + blobs + gradientes (`login.component.html`) — el propio prompt de referencia pide evitar esto "porque sí", pero aquí está bien ejecutado y no se ve genérico. Lo dejaría, con ajustes de accesibilidad (ver abajo), no lo reharía desde cero.

## 7. Problemas responsive

- Positivo: **no se usa el patrón perezoso `hidden md:block`** en ningún archivo (verificado, 0 ocurrencias) — el responsive ya se pensó por composición, no por esconder bloques.
- 18 tablas en el código, todas con `overflow-x-auto` como única estrategia móvil (scroll horizontal). Funciona pero no es la solución "real" que pide el prompt — candidato P2 para convertir tablas clave (ERP inventario, ventas) a cards en mobile.

## 8. Problemas de accesibilidad

- **Solo 6 atributos `aria-*` en los ~50+ templates de la app**, y **una sola asociación `label for=`** en todo el proyecto. Esto es el hallazgo más severo y objetivo de la auditoría: navegación por teclado, lectores de pantalla y foco visible casi no están contemplados.
- Inputs de login sin `autocomplete="email"/"current-password"`, sin `id`/`for` en sus labels.
- Botones de ícono sin texto (varios en terminales POS) sin `aria-label`.

## 9. Problemas técnicos relevantes

- Cero Reactive Forms — no es un bug, pero cualquier formulario nuevo con validación cruzada será doloroso de mantener con el patrón actual.
- Bundle único sin lazy loading — a 3.4MB de `main.js` inicial, ya vale la pena medir si lazy-load por módulo (crm/erp/pos) mejora el primer render, dado que son secciones grandes y mutuamente excluyentes por sesión de usuario.
- El propio `tsc -p tsconfig.json` sin `-b` es un falso-negativo silencioso en este repo (ya documentado en memoria del proyecto) — cualquier verificación de "compila limpio" debe usar `tsconfig.app.json` explícitamente.

## 10. Componentes que deberían reutilizarse (ya existen, faltan generalizar)

- `empty-state`, `toast` (vía `NotifyService`), `confirm-dialog` — **ya están**, hay que auditar que TODA pantalla los use en vez de reinventar variantes ad-hoc.
- Falta un **Button component real** (o al menos clases utilitarias `.btn-primary`/`.btn-secondary`) — hoy cada botón repite `class="text-xs font-bold px-4 py-2 rounded-xl border-0 cursor-pointer text-white hover:opacity-90"` + `style="background:#hex"` a mano, decenas de veces.
- Falta un **Badge/estado component** genérico — los badges de estado (mesa libre/ocupada/cuenta, comanda enviada/preparada/entregada) se repiten con `[ngClass]` manual en cada componente en vez de un `<app-badge estado="...">`.

## 11. Lista priorizada

**P0**
1. El sistema de personalización (accent/radius/densidad) solo cubre una fracción de las clases Tailwind usadas realmente — o se extiende la cobertura, o se documenta como limitación conocida.
2. Accesibilidad de formularios críticos (login, registro) — labels asociados, autocomplete, foco visible.

**P1**
3. Extraer un componente `Button` reutilizable que sí respete `--accent` (reemplazando los `style="background:#hex"` inline).
4. Extraer un componente `Badge` de estado reutilizable para mesas/comandas/pedidos.
5. Auditar uso consistente de `empty-state`/`toast`/`confirm-dialog` en todas las pantallas de listado.
6. aria-labels en botones de solo-ícono; asociación label/input en formularios restantes.

**P2**
7. Estrategia de tabla-a-cards en mobile para las tablas ERP más usadas.
8. Evaluar lazy-loading por módulo (crm/erp/pos) para reducir el bundle inicial.
9. Refinar radios/sombras a una escala documentada (actualmente funciona pero no está escrito en ningún lado más que en el código).

## 12. Plan de implementación propuesto

Fase 3 (Layout global) → Fase 4 (Login/Auth, foco en accesibilidad, sin tocar lógica) → Fase 6 (componentes Button/Badge reutilizables, base del design system) → Fase 5 (Dashboard, aplicando los componentes nuevos) → Fase 7 (pantallas secundarias) → Fase 8/9 (responsive tablas + accesibilidad general) → Fase 10 (QA visual).

**Nota sobre Fase 10:** el MCP de Playwright necesita un reinicio de la sesión de Claude Code para quedar disponible. Verificación visual real (screenshots) pendiente hasta entonces.
