/* --- VETS EXPLORER: CLIENT BRIDGE ------------------------------------------
 *
 * The client bridge of the rebuilt app (REBUILD_SPEC.md §9, ADR 0003); its pure
 * rules sit in node-loadable modules beside it. It is a thin bridge, not an app: R owns the workspace and renders every card and
 * panel; existing page text nodes hold only the active edit (textEditor's).
 * Auto uses DOM data-text-page=0 and ws_layout text page=0 for every field and
 * style without arranging. Text/style requests serialize on acknowledgement; chrome is omitted by capture.
 * This file only REPORTS gestures to the server as stable ids and
 * applies the few client-side effects that must not wait for a round trip
 * (card activation, drawer/rail classes, the result highlight, toasts, the
 * clipboard, localStorage autosave). Export review/confirm/cancel gestures are
 * emitted by R-built markup with job ids. Kept forms also carry opening generations.
 * What an opening reports on close, swap or an export root's close is one
 * drawerReport (www/vets-roundtrip-rules.js, #482, ADR 0123): this
 * file observes the mounted controls of every kept root (Transform/Compare
 * bodies, the export roots by the field table R renders on each, the Series
 * form) and the rule applies the one coercion and the one gate read;
 * snapshots contain only mounted native values and R-authored card/generation
 * ids. No draft lives in JS.
 * Retry reports the band's generation and checked source ids; no retry modal.
 * The drawer column (--vets-drawer-w, 320 px beside the 140 px rail, ADR 0118) collapses when closed; fitSheet() measures the canvas
 * as if it were open, so pages slide and never resize (ADR 0078). Navigation snapshots
 * mounted form fields before R changes kind or target: vetsEvent sends the
 * snapshot before every event R marks navigates, and two capture listeners
 * before a native control R lists (ui_events.R, #vets_app[data-navigates]);
 * no drawer state lives here. Selectize menus keep their DOM and use fixed viewport positioning.
 * Escape has one window capture router over ESCAPE_LADDER (ADR 0107): the
 * rungs dropdown, gesture, view_bar, canvas_text, box, chip_drag, then
 * drawer; no Tab trap. The dropdown rung closes an open Selectize list, menu
 * or calendar (a date box's datepicker, #555) alone. The box rung reverts
 * any box being edited that commits when it is left (ADR 0148: a card's
 * title, the Series drawer's label among them) and leaves it. The drawer rung closes the
 * formula sheet, then an open card drawer
 * sheet before the drawer itself (ADR 0132); the Series drawer's popovers
 * are <details> menus, which the dropdown rung closes first. What follows a
 * render of the drawer column is one ordered pass, DRAWER_RENDERED (ADR 0147):
 * the pickers' menus, the drawer gate's stamps, place, paint, then focus,
 * which is the drawer gate's one focus decision over the focus keys R stamps
 * (data-focus-key). The card drawer is one page: its sheets
 * open and close as ws_card_sheet (R keeps which is open; the drawer gate
 * returns focus to the opener), its period bounds are date boxes that commit
 * ws_display_range once complete, and its switches are Shiny inputs through
 * two bindings (vets.switch and vets.choice) so the edit registry reads them
 * as native inputs. Each control kind (ADR 0148) has one behaviour here: every
 * box's commit passes one gate (vetsBox, the verdict commitBox in
 * www/vets-roundtrip-rules.js) and every switch the client flips one flip.
 * Canvas grips and Layout controls report ws_layout; EDIT
 * layout toggles the drawer. The new-card strip is presentation of an
 * in-flight series drag only; copying still uses the shared server edit.
 * The canvas rules are not here: every pure rule of canvas geometry (snap,
 * drop and resize previews, the Fill screen and paper fits, the canvas view's
 * maths, table capacity, card zoom, the page text key and size rules) lives in
 * www/vets-canvas-rules.js (ADR 0093), loaded first and replayed in node
 * against the R fixtures. This file is its DOM adapter: it measures, calls the
 * rule with plain data, and paints the answer. The window names drivers call
 * (vetsFillScreenFit, vetsCanvasView*, vetsSnapEdge, vetsSnapAnchor,
 * vetsPageTextKey) are one-line aliases into the module. The drawer's
 * round-trip gate (ADR 0094: focus owed to a new form, the Name reload and
 * Add/Apply, stale slot renders, a rebuilt picker's focus) lives the same way
 * in www/vets-roundtrip-rules.js as the reducer drawerGate, replayed by
 * tests/test_roundtrip_rules.R against R's DRAWER_GATE_FIXTURE; this file
 * feeds it observations and performs its effects. Every clipboard copy is
 * one copy request of the reducer copyRequest there too (#610, ADR 0143;
 * copy_request.R's cases): this file reads the browser's capability and
 * performs the writes, fallbacks, labels and toasts it decides. Every table
 * of handlers here (each reducer's effects, the Escape ladder's rungs, the
 * drawer render sequence's steps) is registered through one checked helper
 * (vetsAdapter, vetsTable; ADR 0149) over the vocabularies the rules module
 * exports: a name off its list, a second registration or an effect without a
 * handler throws, and the boot smoke asks the page that each is complete.
 * The canvas view (ADR 0088) is this browser's zoom and side-by-side choice,
 * kept in localStorage and never sent to R. fitSheet() draws it as a scale
 * transform over each sheet's fit, so no layout changes; live capture lifts
 * it. The view control (a VIEW row at the rail's foot, ADR 0116), its typed
 * zoom and a pinch or Ctrl/⌘-scroll set it; placeViewControl() seats the
 * control above the rail's foot. Fill screen fits use the constants
 * R sends with each sheet (FILL_SCREEN_FIXED). Arranged and unplaced Fill
 * screen sheets keep their logical size below the threshold; Auto keeps that
 * width and its content-driven height. Table capacity uses logical CSS pixels,
 * and live sheet capture removes the display zoom. Canvas gestures read
 * geometry from retained nodes, hold only
 * pointer context, and send one command on release. Add page holds only a
 * presentation toggle on #vets_canvas and shares the drag target helpers.
 * vets-layout-result supplies
 * R's reason and reveal_page; the post-flush vets-diag version gates the next
 * gesture and the new page's canvas-only reveal. That gate (the version seal,
 * the held drawer route, the pending request, the card and page reveal and the
 * layout transport) is the reducer canvasGate in www/vets-roundtrip-rules.js
 * (ADR 0094), replayed in node against canvas_sheets.R's CANVAS_GATE_FIXTURE;
 * this file feeds it observations and performs its effects. The same gate
 * holds a live capture (vets-capture-exhibit, ADR 0110) until every chart's
 * resize has ended (class-level Highcharts resize/endResize/destroy hooks) and
 * the canvas is sealed at the version R captured it at (ADR 0113), then calls
 * window.vetsCaptureExhibit; vets-cancel-composition drops a held one. The
 * adapter publishes the gate's verdict as #vets_canvas[data-canvas-ready] (the
 * version the canvas is ready at, else ''), the one thing drivers wait on
 * (tools/layout_driver.R's canvas_ready_js). Shift follows pointer/key events
 * through release. New page is a client-only target after the last sheet; Remove
 * from page is fixed in the layer when no card is unplaced. No blank page event.
 * Clicking a card, its frame or a grip selects nothing (ADR 0083); there is no
 * keyboard placement, and no card drawer placement route (#474). An ids-only
 * ws_layout command (vetsSubmitLayout) goes through the same settle gate, which
 * holds one route while a sheet reconfiguration has cleared the version seal,
 * so none is dropped.
 * The Add drawer is the staged form alone (ADR 0085); its Name select is the
 * only series lookup, so the client holds no search field, result list or
 * queued pick intents.
 *
 * Conventions:
 *  - Every server-bound event is vetsEvent(name, payload), the file's one
 *    Shiny input call, with {priority: 'event'}, so an identical
 *    gesture fires every time (not deduped as a value change).
 *  - The vocabulary is declared ONCE, on the R side: VETS_EVENTS (every name
 *    this file and vets-export.js fire, with its payload fields) and
 *    VETS_MESSAGES (every Shiny.addCustomMessageHandler name and its fields)
 *    in vets_explorer/ui_events.R. tests/test_ui_events.R holds both files to
 *    it in both directions, so a name is always a literal here: never derived
 *    from an element id or built from parts (a card's namespaced
 *    table_capacity input is R's, read from its data-capacity-event). Table redraws briefly retain
 *    viewer position and selected period keys on the output node; this is
 *    discarded after restoration, never persisted or used as workspace state.
 *    A ResizeObserver asks widgets to reflow as the grid resizes.
 *  - Every listener is delegated on `document` and bound ONCE (the
 *    window.__vetsBound guard), so it survives the runtime add/remove of
 *    cards and panels and the re-render of a card's slots. The card
 *    containers are stable DOM nodes R inserts, removes and moves by id, not
 *    a model of the workspace (ADR 0003, updated for WF06a). The client state
 *    this file holds, none of it a workspace value: the in-flight canvas
 *    gesture, its released layer, click swallow and refusal feedback; ONE
 *    canvas gate state record for canvasGate (the last and the drawn layout
 *    version, a held drawer route, the pending request and reveal, the
 *    layout and text requests awaiting acknowledgement, the charts mid-resize
 *    or awaiting R's chart_ready answer and a held live capture); the active page text
 *    edit and its style requests; the drawer gate's state (held for
 *    www/vets-roundtrip-rules.js's drawerGate, never decided here, the
 *    focus key to give back after a render and a closed sheet's opener
 *    among it), the drawer's opener; the drawer render sequence's
 *    registered steps and its one pending pass; the Layout drawer's page-slide target; the autosave key; the canvas view
 *    (ADR 0088: the analyst's own zoom and flag, in localStorage) and each
 *    sheet's R-sent fit constants and view scale on its node; a table's
 *    viewer position, briefly, across a redraw; the Escape ladder's
 *    registered rungs (a name with its applies and consume functions, never
 *    state); each box's data-committed (R's value as last echoed or committed,
 *    ADR 0148) and a date box's picked flag between its calendar's pick and
 *    hide; the card drawer's hovered row and the prior SVG attributes and
 *    classes its highlight changed (ADR 0132 d9, inspectorHover in
 *    www/vets-canvas-rules.js names the ids); and one-shot flags for a config
 *    download and a modal removal.
 *
 * ES5 on purpose (no build step, no dependencies beyond what Shiny ships).
 */

// Fill colour is a form draft. Keep its visible controls and bound input in sync.
window.vetsChooseFillColor = function (control, color) {
  var field = control.closest('.vets-fill-color');
  if (!field || !/^#[0-9a-f]{6}$/i.test(color)) return;
  field.querySelector('#display_band_color_picker').value = color;
  field.querySelectorAll('[data-fill-color]').forEach(function (swatch) {
    swatch.setAttribute('aria-pressed', String(swatch.getAttribute('data-fill-color').toLowerCase() === color.toLowerCase()));
  });
  var input = field.querySelector('#display_band_color');
  input.value = color;
  input.dispatchEvent(new Event('change', {bubbles: true}));
};

// The canvas rules live in www/vets-canvas-rules.js (ADR 0093), loaded before
// this file. The window names drivers and the boot smoke call stay, each the
// module's own function: the boot smoke replays the R fixtures through them
// in Chrome, tests/test_canvas_rules.R through the module in node.
window.vetsFillScreenFit = window.vetsCanvasRules.fillScreenFit;
window.vetsCanvasViewRead = window.vetsCanvasRules.canvasViewRead;
window.vetsCanvasViewStep = window.vetsCanvasRules.canvasViewStep;
window.vetsCanvasViewSheetZoom = window.vetsCanvasRules.canvasViewSheetZoom;
window.vetsCanvasViewAcross = window.vetsCanvasRules.canvasViewAcross;
window.vetsCanvasViewLabel = window.vetsCanvasRules.canvasViewLabel;
window.vetsCanvasViewParse = window.vetsCanvasRules.canvasViewParse;
window.vetsSnapEdge = window.vetsCanvasRules.snapEdge;
window.vetsSnapAnchor = window.vetsCanvasRules.snapAnchor;
window.vetsPageTextKey = window.vetsCanvasRules.pageTextKey;
/* Display-only number formatting for the table view (ADR 0018), now in the
 * module (ADR 0102). Defined at top level so it exists before DataTables'
 * first draw; chart_render.R wraps it in a column render that runs for
 * type === 'display' only, so sorting, filtering and the exports keep the raw
 * numbers. Every argument is an R constant from CHART_THEME (decimals,
 * thousands separator, decimal point, U+2212 minus, em-dash missing mark). */
window.vetsFormatCell = window.vetsCanvasRules.formatCell;
window.vetsFormatDifferenceCell = window.vetsCanvasRules.formatDifferenceCell;

/* ---- the adapter tables (ADR 0149) ------------------------------------- */
// Every table of handlers this file registers goes through ONE checked helper
// in www/vets-roundtrip-rules.js: vetsTable(name, list) for a registry the
// sections fill one by one (the Escape ladder's rungs, the drawer render
// sequence's steps; the lists are the module's), vetsAdapter(name, handlers)
// for a reducer's effect handlers, one per effect of its vocabulary, all at
// once. A name off its list, a second registration or an effect without a
// handler throws where it is registered; the adapter's observe refuses an
// observation off the reducer's vocabulary. vetsAdapterTables() reports each
// table and what it still lacks: the boot smoke asks the page that every
// vocabulary the module exports has one complete table (tools/smoke_boot.R).
(function () {
  'use strict';
  var rules = window.vetsRoundtripRules, tables = [];
  function keep(t) { tables.push(t); return t; }
  window.vetsTable = function (name, keys) { return keep(rules.table(name, keys)); };
  window.vetsAdapter = function (name, handlers) { return keep(rules.adapter(name, rules[name], handlers)); };
  window.vetsAdapterTables = function () {
    return tables.map(function (t) { return {name: t.name, keys: t.keys.slice(), missing: t.missing()}; });
  };
})();

/* ---- the Escape ladder (ADR 0094 decision 6, ADR 0107) ------------------ */
// Escape has ONE owner: this router, a window capture listener registered
// before any other key listener. It walks ESCAPE_LADDER in order and the first
// rung whose applies(e) holds takes the key: preventDefault, stopPropagation
// (not the immediate kind, so the gesture's window shift tracker still sees
// it) and consume(e). No rung applies: the key goes on untouched. The order is
// the product rule: an open dropdown or menu closes first, then an in-flight
// canvas gesture or its refusal, the canvas view bar, a canvas text edit, a
// box being edited (ADR 0148), a chip drag, and last the drawer. Each section
// registers its own rung beside the state it owns with
// vetsEscapeRung(name, applies, consume), into the checked table over the
// module's ESCAPE_LADDER (ADR 0149): a name off the ladder or a second
// registration throws. The router and the rungs stay here (ADR 0094 d6).
(function () {
  'use strict';
  var ladder = window.vetsTable('ESCAPE_LADDER', window.vetsRoundtripRules.ESCAPE_LADDER);
  window.vetsEscapeRung = function (name, applies, consume) {
    ladder.add(name, {applies: applies, consume: consume});
  };
  window.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    for (var i = 0; i < ladder.keys.length; i++) {
      var rung = ladder.get(ladder.keys[i]);
      if (!rung || !rung.applies(e)) continue;
      e.preventDefault(); e.stopPropagation();
      rung.consume(e);
      return;
    }
  }, true);
})();

/* ---- after the drawer renders: one ordered sequence (ADR 0147) ---------- */
// Whatever follows R's render of the drawer column (#vets_drawer: the panel,
// its slot outputs, the formula sheet) runs in ONE ordered pass, never in
// hooks ordered by timer depth. Before an output in the column is replaced
// (its shiny:value; the markup is not in the DOM yet) the steps of
// DRAWER_RENDERING run with {name, output}: the calendars in it close, and the
// drawer gate is told a render began (the focus key held). After the column
// changes (a mutation under #vets_drawer, a binding inside it, or
// vetsDrawerRender()), the steps of DRAWER_RENDERED run once per microtask
// with {records, outputs, full}: outputs are the ids of the outputs whose
// markup the pass saw replaced, full that a binding or a request asked for a
// whole pass. In order: bind the pickers' menus; observe the drawer gate
// (stamps drawn: stale slots held, Apply released); place (the formula sheet,
// a card popover, the Layout target); paint (Copy PNG's label, the formula
// paint, the Provenance record, the Vintage picker); focus (one drawn
// observation: the drawer gate's one focus decision, performed by its
// adapter). Each section registers its step beside the state it owns with
// vetsDrawerStep(when, name, fn), as vetsEscapeRung registers rungs, into the
// checked tables over the module's DRAWER_RENDERING and DRAWER_RENDERED (ADR
// 0149); a name off its list or a second registration throws. A step's own
// mutation starts the next pass, so every step is idempotent.
(function () {
  'use strict';
  var rules = window.vetsRoundtripRules;
  var steps = {rendering: window.vetsTable('DRAWER_RENDERING', rules.DRAWER_RENDERING),
    rendered: window.vetsTable('DRAWER_RENDERED', rules.DRAWER_RENDERED)};
  window.vetsDrawerStep = function (when, name, fn) {
    if (!steps[when]) throw new Error('vetsDrawerStep: ' + when + ' is neither rendering nor rendered');
    steps[when].add(name, fn);
  };
  function run(when, arg) {
    var t = steps[when];
    t.keys.forEach(function (name) { var fn = t.get(name); if (fn) fn(arg); });
  }
  var pending = null;
  function pass() {
    var p = pending, outputs = [];
    pending = null;
    p.records.forEach(function (r) {
      var t = r.target;
      if (t && t.nodeType === 1 && t.classList.contains('shiny-html-output') && outputs.indexOf(t.id) < 0)
        outputs.push(t.id);
    });
    run('rendered', {records: p.records, outputs: outputs, full: p.full});
  }
  function schedule(records, full) {
    if (!pending) { pending = {records: [], full: false}; Promise.resolve().then(pass); }
    if (records) pending.records = pending.records.concat(records);
    if (full) pending.full = true;
  }
  // A whole pass on request: an opening whose panel may be drawn already.
  window.vetsDrawerRender = function () { schedule(null, true); };
  function inDrawer(el) { return !!(el && el.closest && el.closest('#vets_drawer')); }
  function start() {
    var drawer = document.getElementById('vets_drawer');
    if (drawer && window.MutationObserver) new MutationObserver(function (records) { schedule(records, false); })
      .observe(drawer, {childList: true, subtree: true});
    if (!window.jQuery) return;
    jQuery(document).on('shiny:value', function (e) {
      if (inDrawer(e.target)) run('rendering', {name: e.name, output: e.target});
    });
    jQuery(document).on('shiny:bound', function (e) { if (inDrawer(e.target)) schedule(null, true); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

/* ---- the formula sheet (ADR 0135 decisions 6 and 7, #564) --------------- */
// R owns the sheet (formula_sheet.R, server_formula_sheet.R): its inputs, text
// and name are R's, and R's parser decides what is valid. This block only
// paints and reports; its lexical rules are www/vets-formula-rules.js (ADR
// 0139), fed the vocabulary R renders on the field (data-formula-grammar,
// formula.R's grammar table), so nothing here names a function, a typed
// operator or a token class. The formula field is a transparent textarea over
// a painted layer (.vets-formula-paint) in the same font, so the caret and
// selection stay native: each token is painted by its kind, an input letter in
// its series' colour from data-formula-colors, and the marks R sends
// (vets-formula-sheet) are painted over the text they were computed for, never
// over other text. Typed * - become × − as they are typed (and in a paste),
// except inside a quoted date, whose hyphens stay (#577); division stays / and
// a typed or pasted ÷ becomes / (owner, #576). The text reaches R debounced;
// every other gesture carries it too, so nothing typed is lost. The key row
// inserts at the caret. Esc (the drawer rung) closes the sheet.
(function () {
  'use strict';
  var rules = window.vetsFormulaRules;
  var marks = {generation: null, text: null, list: []};
  var pending = null;
  var grammarText = null, grammarValue = null;
  function sheet() { return document.querySelector('#vets_drawer [data-formula-sheet]'); }
  function field() { var s = sheet(); return s && s.querySelector('[data-formula-input]'); }
  function generation() { var s = sheet(); return s ? Number(s.getAttribute('data-formula-generation')) : null; }
  function send(action, extra) {
    var s = sheet();
    if (!s && action !== 'open' && action !== 'edit') return;
    var box = field(), payload = {action: action, generation: generation()};
    if (box) payload.text = box.value;
    Object.keys(extra || {}).forEach(function (k) { payload[k] = extra[k]; });
    if (pending) { clearTimeout(pending); pending = null; }
    vetsEvent('ws_formula_sheet', payload);
  }
  // The one bridge function the sheet's markup calls (ui_drawer.R).
  window.vetsFormulaSheet = function (action, a, b) {
    if (action === 'open' || action === 'edit') {
      document.querySelectorAll('details.vets-menu[open]').forEach(function (d) { d.removeAttribute('open'); });
      vetsEvent('ws_formula_sheet', {action: action, cid: a, iid: b || null});
      return;
    }
    if (action === 'input') { send('input', {letter: a, id: b}); return; }
    if (action === 'remove_input') { send('remove_input', {letter: a}); return; }
    if (action === 'name') { send('name', {name: a}); return; }
    if (action === 'submit') {
      var name = sheet() && sheet().querySelector('[data-formula-name]');
      send('submit', {name: name ? name.value : null});
      return;
    }
    send(action);
  };
  window.vetsFormulaSheetEscape = function () {
    if (!sheet()) return false;
    send('close');
    return true;
  };

  function colors() {
    var f = sheet() && sheet().querySelector('[data-formula-field]');
    try { return JSON.parse(f.getAttribute('data-formula-colors') || '{}'); } catch (e) { return {}; }
  }
  // The vocabulary R renders on the field, read once per attribute value.
  function grammar() {
    var f = sheet() && sheet().querySelector('[data-formula-field]');
    var raw = f ? f.getAttribute('data-formula-grammar') : null;
    if (raw !== grammarText) {
      grammarText = raw;
      try { grammarValue = raw ? JSON.parse(raw) : null; } catch (e) { grammarValue = null; }
    }
    return grammarValue;
  }
  // Idempotent: the painted layer is replaced only when its markup changes, so
  // the drawer render pass its replacement starts paints nothing new.
  function paint() {
    var box = field(), s = sheet(), g = grammar();
    if (!box || !s || !g) return;
    var own = marks.text === box.value && marks.generation === generation();
    var layer = s.querySelector('.vets-formula-paint');
    var html = rules.paint(box.value, g, colors(), own ? marks.list : []);
    if (layer.__vetsPainted !== html) { layer.innerHTML = html; layer.__vetsPainted = html; }
    s.querySelector('[data-formula-field]').classList.toggle('vets-formula-field--bad', own && marks.list.length > 0);
  }
  function insert(box, text, back) {
    box.focus();
    if (!document.execCommand('insertText', false, text)) {
      var a = box.selectionStart, b = box.selectionEnd;
      box.value = box.value.slice(0, a) + text + box.value.slice(b);
      box.selectionStart = box.selectionEnd = a + text.length;
    }
    if (back) box.selectionStart = box.selectionEnd = box.selectionEnd - back;
    changed(box);
  }
  function changed(box) {
    paint();
    if (pending) clearTimeout(pending);
    pending = setTimeout(function () { pending = null; send('text'); }, 180);
  }
  document.addEventListener('beforeinput', function (e) {
    var box = e.target;
    if (!box.matches || !box.matches('[data-formula-input]')) return;
    if (e.inputType === 'insertLineBreak' || e.inputType === 'insertParagraph') { e.preventDefault(); return; }
    var g = grammar(), shown = g && e.inputType === 'insertText' && e.data ? rules.typedAs(e.data, g) : null;
    if (shown && !rules.inQuote(box.value, box.selectionStart, g)) {
      e.preventDefault();
      insert(box, shown);
    }
  });
  document.addEventListener('input', function (e) {
    var box = e.target;
    if (box.matches && box.matches('[data-formula-input]')) {
      var g = grammar();
      if (/[\n\r]/.test(box.value) || (g && rules.display(box.value, g) !== box.value)) {
        var at = box.selectionStart, flat = box.value.replace(/[\n\r]+/g, ' ');
        box.value = g ? rules.display(flat, g) : flat;
        box.selectionStart = box.selectionEnd = at;
      }
      changed(box);
    } else if (box.matches && box.matches('[data-formula-name]')) {
      box.setAttribute('data-name-auto', box.value.trim() ? 'false' : 'true');
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.matches && e.target.matches('[data-formula-input]')) e.preventDefault();
  });
  // The key row: a key never takes focus from the field.
  document.addEventListener('mousedown', function (e) {
    if (e.target.closest && e.target.closest('[data-formula-key]')) e.preventDefault();
  });
  document.addEventListener('click', function (e) {
    var key = e.target.closest && e.target.closest('[data-formula-key]');
    if (!key) return;
    var box = field(), g = grammar();
    if (!box || !g) return;
    // An operator spaced; a function, shift or splice key with the caret just
    // after its "(" (log(|), lag(|, 1), splice(|, "", )).
    var put = rules.keyInsert(key.getAttribute('data-formula-key'), box.value.slice(0, box.selectionStart), g);
    insert(box, put.text, put.back);
  });
  // Kept even while the sheet is not drawn (a drawer swap): the newest reading
  // is what the next paint uses.
  Shiny.addCustomMessageHandler('vets-formula-sheet', function (m) {
    if (!m) return;
    marks = {generation: m.generation, text: m.text, list: m.marks || []};
    if (m.generation !== generation()) return;
    paint();
    var name = sheet().querySelector('[data-formula-name]');
    if (name && typeof m.name === 'string' && name.getAttribute('data-name-auto') === 'true' && name.value !== m.name)
      name.value = m.name;
  });
  // The sheet sits over the drawer body: from under the Series drawer's tabs,
  // or the card drawer's header, to the drawer's foot. Presentation only.
  function place() {
    var s = sheet(), drawer = document.getElementById('vets_drawer');
    if (!s || !drawer) return;
    var anchor = drawer.querySelector('.vets-panel--series > .vets-tabs') ||
      drawer.querySelector('.vets-panel--card > .vets-inspector-head');
    var top = anchor ? anchor.getBoundingClientRect().bottom - drawer.getBoundingClientRect().top + drawer.scrollTop : 0;
    // The height is taken from the rounded top (#565): rounding both could
    // overshoot the drawer's foot by a pixel and give the drawer a scroll.
    var t = Math.round(top);
    s.style.top = t + 'px';
    s.style.height = Math.max(0, Math.floor(drawer.clientHeight - (t - drawer.scrollTop))) + 'px';
  }
  // The drawer render sequence (ADR 0147) places and paints the sheet after
  // every render in the column; whether the sheet takes focus is the drawer
  // gate's (focus_formula), and this is its entry: the first empty input's
  // picker, else the field with the caret at its end.
  window.vetsDrawerStep('rendered', 'place_formula', place);
  window.vetsDrawerStep('rendered', 'paint_formula', paint);
  window.vetsFormulaSheetFocus = function () {
    var s = sheet(), box = field();
    if (!s || !box) return;
    var empty = s.querySelector('.vets-formula-box--empty .vets-formula-picker');
    (empty || box).focus();
    if (!empty) box.selectionStart = box.selectionEnd = box.value.length;
  };
  window.addEventListener('resize', place);
})();


/* ---- the drawer control kinds (ADR 0148): the box and the switch ---------- */
// A control is one of a few kinds (control_kinds.R): R declares per control
// what it commits, and one behaviour per kind handles its gestures here.
//
// THE BOX: a box that commits when it is left ([data-box], ui_handlers.R's
// commit_box: a card's title, footnote and axis titles, the Series drawer's
// label, Opacity and Custom colour, the Transform tab's boxes, the card's
// Periods, a comparison column's name). Its onchange is R's commit behind the
// one gate vetsBox(this, event), so every commit passes the one verdict,
// commitBox (www/vets-roundtrip-rules.js; control_kinds.R's
// BOX_VERDICT_FIXTURE): a person's change commits a value the box reads as R
// declared that is not R's already; a refused text shows R's value again
// (data-committed) or is marked invalid. R's echo (a triggered change: an
// update after a commit or an Undo; vets-field-value) is what the box then
// holds; a date box's own calendar or binding is neither. Enter leaves a
// title's box (the leaving commits it) or runs the change where focus stays;
// in a multi-line box it is text. Esc (the ladder's box rung) in a box being
// edited shows R's value again and leaves the box, sending nothing; in a box
// that holds R's value it goes on down the ladder. A date picked from a box's
// calendar commits when the calendar hides after the pick; the dropdown rung
// closing it commits nothing. Before a commit the box's calendar closes: the
// commit re-renders it.
//
// THE SWITCH: a click on a switch the client flips (button[role=switch] that
// R declares data-switch-input, a Shiny input, or data-dialog-field, a staged
// form's field) flips aria-checked and reports it as vets:switch, which the
// switch binding below and the form's field listener read. A choice's knob
// (data-choice-value) is the choice binding's; a switch R draws (the Layout
// drawer's) commits its own event and R re-renders it; the Save drawer's
// hidden-series switch is a native checkbox its form reads.
//
// The card drawer's switches are Shiny inputs through two bindings (ADR 0132),
// so a switch is a native input the edit registry reads as it read a checkbox
// (ui_events.R VETS_EDIT_INPUTS, ADR 0126): no workspace value lives here. A
// switch (button[role=switch][data-switch-input]) reports TRUE/FALSE under its
// id. A choice (the Forecast shade, [data-vets-choice]) reports its
// data-value; a click on any [data-choice-value] inside it (the switch, a
// source chip entry) takes that value, and the switch shows on or off by it.
// R re-renders both. R's echo of a stored value (updateCheckboxInput after an
// Undo, or after the card drawer's eye or the ⋯ menu wrote `visible`) sets the
// switch and reports it, as a checkbox's change does: Shiny drops a value
// equal to the last one it sent, so an unreported echo would swallow the next
// click (#562). The reported echo is the stored value, which the edit
// registry treats as none.
(function () {
  'use strict';
  function up(el, sel) { return el && el.closest ? el.closest(sel) : null; }
  function isBox(el) { return !!el && !!el.hasAttribute && el.hasAttribute('data-box'); }
  function attr(el, name) {
    var v = el.getAttribute(name);
    if (v === null || v === '') return null;
    if (name === 'step' && v.toLowerCase() === 'any') return 'any';
    var n = Number(v);
    return isFinite(n) ? n : null;
  }
  // The box as R declared it: data-box, data-committed and its constraint attributes.
  function boxState(el) {
    var d = {};
    try { d = JSON.parse(el.getAttribute('data-box') || '{}') || {}; } catch (x) { d = {}; }
    return {committed: el.getAttribute('data-committed') || '', value: d.value, blank: d.blank,
      invalid: d.invalid, enter: d.enter, min: attr(el, 'min'), max: attr(el, 'max'), step: attr(el, 'step'),
      pattern: el.getAttribute('pattern')};
  }
  function dateBox(el) { return !!up(el, '.shiny-date-input, .shiny-date-range-input'); }
  // Transport receipts belong to the submitted element, never to a later
  // drawer's element with the same id. Keep R's accepted revert value apart
  // from the value optimistically submitted by commitBox.
  var boxReceipts = new WeakMap(), boxRequests = new Map(), boxSequence = 0, sendingBox = null;
  function receipt(el) {
    if (!boxReceipts.has(el)) boxReceipts.set(el, {
      confirmed: el.getAttribute('data-committed') || '', latest: null, settled: 0
    });
    return boxReceipts.get(el);
  }
  window.vetsBoxPayload = function (payload) {
    if (!sendingBox || !payload || typeof payload !== 'object') return payload;
    var request = sendingBox;
    sendingBox = null;
    boxRequests.set(request.id, request);
    return Object.assign({}, payload, {box_request: request.id});
  };
  window.vetsBoxResult = function (message) {
    var request = message && boxRequests.get(message.request);
    if (!request) return;
    boxRequests.delete(message.request);
    var el = request.el, r = receipt(el);
    if (!el.isConnected || request.sequence <= r.settled) return;
    r.settled = request.sequence;
    if (message.accepted) r.confirmed = request.value;
    if (r.latest !== request.id) return;
    r.latest = null;
    observe(el, {type: 'result', accepted: message.accepted, previous: r.confirmed,
      submitted: request.value, text: el.value});
  };
  function calendarOpen(el) {
    var picker = window.jQuery && jQuery(el).data('datepicker');
    return !!(picker && picker.picker && picker.picker.is(':visible'));
  }
  // The verdict's effects, one handler each in its checked table (ADR 0149);
  // the context is the box's element. A commit handler returns true: the
  // box's own commit runs.
  var boxTable = window.vetsAdapter('commitBox', {
    commit: function (e, el) {
      if (el.value !== e.value) el.value = e.value;
      if (calendarOpen(el)) jQuery(el).bsDatepicker('hide');
      var sequence = ++boxSequence;
      var request = {id: 'box-' + sequence, sequence: sequence, el: el, value: e.value};
      receipt(el).latest = request.id;
      sendingBox = request;
      // The declared onchange sends synchronously after this gate returns.
      // A control whose handler sends nothing must not tag a later gesture.
      Promise.resolve().then(function () { if (sendingBox === request) sendingBox = null; });
      return true;
    },
    show: function (e, el) { el.value = e.value; },
    invalid: function (e, el) { el.setAttribute('aria-invalid', e.on ? 'true' : 'false'); },
    leave: function (e, el) { el.blur(); },
    change: function (e, el) { el.dispatchEvent(new Event('change', {bubbles: true})); }
  });
  // One observation through the verdict: keeps data-committed, performs the
  // effects and says whether the box's commit runs.
  function observe(el, o) {
    var ack = receipt(el);
    var r = boxTable.observe(boxState(el), o), commit = false;
    if (o.type === 'echo') {
      ack.confirmed = r.state.committed;
      ack.latest = null;
      ack.settled = ++boxSequence;
    }
    if (el.getAttribute('data-committed') !== r.state.committed) el.setAttribute('data-committed', r.state.committed);
    r.effects.forEach(function (effect) { if (boxTable.perform(effect, el) === true) commit = true; });
    return {commit: commit, acted: r.effects.length > 0};
  }
  // The gate on every box's onchange: true lets R's commit run.
  window.vetsBox = function (el, event) {
    if (!isBox(el)) return false;
    if (event && event.isTrigger) return observe(el, {type: dateBox(el) ? 'widget' : 'echo', text: el.value}).commit;
    return observe(el, {type: 'change', text: el.value, bad: !!(el.validity && el.validity.badInput)}).commit;
  };
  // R put a value in a box without a triggered change (vets-field-value).
  window.vetsBoxEcho = function (el) {
    if (isBox(el)) observe(el, {type: 'echo', text: el.value});
  };
  // Whether Esc is this box's: an edit in progress (the verdict's escape acts).
  function editing(el) {
    return isBox(el) && boxTable.observe(boxState(el), {type: 'escape', text: el.value}).effects.length > 0;
  }
  window.vetsBoxEditing = editing;
  // A card's period (ws_display_range, ADR 0132): both bounds as committed,
  // the changed one just now.
  window.vetsDisplayRange = function (el) {
    var field = up(el, '[data-range-card]');
    var boxes = field ? field.querySelectorAll('input[data-box]') : [];
    if (boxes.length !== 2) return;
    window.vetsEvent('ws_display_range', {id: field.getAttribute('data-range-card'),
      start: boxes[0].getAttribute('data-committed'), end: boxes[1].getAttribute('data-committed')});
  };
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.isComposing || !isBox(e.target)) return;
    if (observe(e.target, {type: 'enter', text: e.target.value}).acted) e.preventDefault();
  });
  // Escape ladder, 'box': Esc in a box being edited shows R's value again and
  // leaves it; in a box that holds R's value the key goes on (the drawer closes).
  window.vetsEscapeRung('box', function (e) {
    return !e.defaultPrevented && editing(e.target) && !document.getElementById('shiny-modal');
  }, function (e) {
    observe(e.target, {type: 'escape', text: e.target.value});
  });
  if (window.jQuery) {
    jQuery(document).on('changeDate', 'input[data-box]', function () {
      if (calendarOpen(this)) this.vetsPicked = true;
    });
    jQuery(document).on('hide', 'input[data-box]', function () {
      if (!this.vetsPicked) return;
      this.vetsPicked = false;
      this.dispatchEvent(new Event('change', {bubbles: true}));
    });
  }

  document.addEventListener('click', function (e) {
    var sw = up(e.target, 'button[role="switch"]');
    if (!sw || sw.disabled || !(sw.hasAttribute('data-switch-input') || sw.hasAttribute('data-dialog-field'))) return;
    sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
    if (window.jQuery) jQuery(sw).trigger('vets:switch');
  });

  if (!window.Shiny || !Shiny.InputBinding || !window.jQuery) return;
  var $ = window.jQuery;
  var switchBinding = new Shiny.InputBinding();
  $.extend(switchBinding, {
    find: function (scope) { return $(scope).find('button[role="switch"][data-switch-input]'); },
    getValue: function (el) { return el.getAttribute('aria-checked') === 'true'; },
    subscribe: function (el, callback) {
      $(el).on('vets:switch.vetsSwitch vets:echo.vetsSwitch', function () { callback(false); });
    },
    unsubscribe: function (el) { $(el).off('.vetsSwitch'); },
    receiveMessage: function (el, data) {
      if (!data || !('value' in data)) return;
      el.setAttribute('aria-checked', data.value ? 'true' : 'false');
      $(el).trigger('vets:echo');
    }
  });
  Shiny.inputBindings.register(switchBinding, 'vets.switch');
  var choiceBinding = new Shiny.InputBinding();
  $.extend(choiceBinding, {
    find: function (scope) { return $(scope).find('[data-vets-choice]'); },
    getValue: function (el) { return el.getAttribute('data-value'); },
    subscribe: function (el, callback) {
      $(el).on('click.vetsChoice', '[data-choice-value]', function () {
        var value = this.getAttribute('data-choice-value');
        el.setAttribute('data-value', value);
        var sw = el.querySelector('[role="switch"]');
        if (sw) {
          sw.setAttribute('aria-checked', value === 'none' ? 'false' : 'true');
          sw.setAttribute('data-choice-value', value === 'none' ? 'auto' : 'none');
        }
        var menu = this.closest('details.vets-menu');
        if (menu) menu.removeAttribute('open');
        callback(false);
      });
    },
    unsubscribe: function (el) { $(el).off('.vetsChoice'); }
  });
  Shiny.inputBindings.register(choiceBinding, 'vets.choice');
})();

/* ---- the card drawer's Series rows: reorder (ADR 0132 d3, #516) ----------- */
// A row's handle drags it within its list, or moves it one place with Alt+Up
// or Alt+Down while focused. R owns the order: the drag paints a preview only
// (the other rows slide aside), and the drop or key sends ws_move_series
// {cid, iid, position} once; R's move_instance applies it and re-renders the
// list. The position rules are vets-canvas-rules.js's listDropPosition and
// listStepPosition. Chip dragging between cards (ADR 0058) is untouched: it is
// HTML5 drag and drop on .ws-chip, this is pointer capture on the handle. A
// keyboard move keeps focus on the handle, which carries its row's focus key
// (row:<iid>), so the drawer gate gives it focus back where R's render put the
// row (ADR 0147); a drag keeps no focus.
(function () {
  'use strict';
  var rules = window.vetsCanvasRules;
  function up(el, sel) { return el && el.closest ? el.closest(sel) : null; }
  function rowsOf(list) {
    return Array.prototype.filter.call(list.children, function (c) { return c.classList.contains('vets-series-row'); });
  }
  function send(row, position) {
    var drawer = up(row, '[data-card-drawer]');
    var iid = row.getAttribute('data-instance-id');
    if (!drawer || !iid || !position) return;
    window.vetsEvent('ws_move_series', {cid: drawer.getAttribute('data-card-drawer'), iid: iid, position: position});
  }

  var drag = null;
  function paint(position) {
    drag.rows.forEach(function (r, k) {
      var i = k + 1, shift = 0;
      if (r === drag.row) return;
      if (drag.from < position && i > drag.from && i <= position) shift = -drag.height;
      if (drag.from > position && i >= position && i < drag.from) shift = drag.height;
      r.style.transform = shift ? 'translateY(' + shift + 'px)' : '';
    });
  }
  function release() {
    if (!drag) return;
    var d = drag;
    drag = null;
    d.list.classList.remove('is-reordering');
    d.row.classList.remove('is-dragging');
    d.rows.forEach(function (r) { r.style.transform = ''; });
  }
  document.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || drag) return;
    var handle = up(e.target, '#vets_drawer .vets-series-handle');
    var row = up(handle, '.vets-series-row');
    var list = row && row.parentElement;
    if (!list) return;
    e.preventDefault();                        // no text selection; the drag keeps no focus
    var rows = rowsOf(list);
    var mids = rows.map(function (r) { var b = r.getBoundingClientRect(); return b.top + b.height / 2; });
    var box = row.getBoundingClientRect(), first = rows[0].getBoundingClientRect(),
      last = rows[rows.length - 1].getBoundingClientRect();
    drag = {row: row, list: list, rows: rows, mids: mids, from: rows.indexOf(row) + 1, position: rows.indexOf(row) + 1,
      startY: e.clientY, height: box.height, min: first.top - box.top, max: last.bottom - box.bottom,
      moved: false, pointerId: e.pointerId, handle: handle};
    try { handle.setPointerCapture(e.pointerId); } catch (x) { /* a detached handle: the drag ends on up */ }
  });
  document.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    var dy = e.clientY - drag.startY;
    if (!drag.moved && Math.abs(dy) < 3) return;
    if (!drag.moved) {
      drag.moved = true;
      drag.list.classList.add('is-reordering');
      drag.row.classList.add('is-dragging');
    }
    drag.row.style.transform = 'translateY(' + Math.max(drag.min, Math.min(drag.max, dy)) + 'px)';
    drag.position = rules.listDropPosition(drag.mids, drag.from, e.clientY);
    paint(drag.position);
  });
  document.addEventListener('pointerup', function (e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    var d = drag;
    release();
    if (d.moved && d.position !== d.from && document.contains(d.row)) send(d.row, d.position);
  });
  document.addEventListener('pointercancel', function (e) { if (drag && e.pointerId === drag.pointerId) release(); });
  document.addEventListener('lostpointercapture', function (e) {
    if (drag && e.pointerId === drag.pointerId && !document.contains(drag.row)) release();
  });

  // Keyboard parity: Alt+Up / Alt+Down on the focused handle.
  document.addEventListener('keydown', function (e) {
    if (!e.altKey || e.ctrlKey || e.metaKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    var handle = up(e.target, '#vets_drawer .vets-series-handle');
    var row = up(handle, '.vets-series-row');
    if (!row || !row.parentElement) return;
    e.preventDefault();
    var rows = rowsOf(row.parentElement);
    var position = rules.listStepPosition(rows.indexOf(row) + 1, rows.length, e.key === 'ArrowUp' ? -1 : 1);
    if (position) send(row, position);
  });
})();

/* ---- the card drawer's row hover (ADR 0132 d9) --------------------------- */
// Hovering a Series row ([data-instance-id]) or an annotation row
// ([data-mark-index]) of a card drawer highlights that element on the card:
// the other series dim, the mark thickens, the table marks the series' column
// (its row when transposed). vetsCanvasRules.inspectorHover names the ids from
// the ids the card's chart draws; this block paints raw SVG attributes and a
// class, remembers each prior value and puts it back when the pointer leaves
// the row. No Highcharts option, workspace value or history entry changes and
// nothing is sent to R, so a capture or export never sees the effect.
(function () {
  'use strict';
  if (window.__vetsRowHoverBound || !window.vetsCanvasRules) return;
  window.__vetsRowHoverBound = true;
  var rules = window.vetsCanvasRules, HOVER = rules.INSPECTOR_HOVER;
  var ROW = '[data-card-drawer] .vets-series-row[data-instance-id], [data-card-drawer] [data-mark-index]';
  var active = null; // {row, undo: [function]}: the hovered row and how to restore

  function rowOf(node) { return node && node.closest ? node.closest(ROW) : null; }
  function rowRecord(row) {
    if (row.hasAttribute('data-mark-index')) return {kind: 'mark', index: Number(row.getAttribute('data-mark-index'))};
    return {kind: 'series', id: row.getAttribute('data-instance-id')};
  }
  function setAttr(undo, el, name, value) {
    if (!el) return;
    var prior = el.getAttribute(name);
    undo.push(function () { if (prior === null) el.removeAttribute(name); else el.setAttribute(name, prior); });
    el.setAttribute(name, value);
  }
  function addClass(undo, el, name) {
    if (!el || el.classList.contains(name)) return;
    el.classList.add(name);
    undo.push(function () { el.classList.remove(name); });
  }
  function cardOf(cid, node) {
    var card = node.closest('.ws-card');
    return card && card.getAttribute('data-collection-id') === cid && !node.closest('#vets-export-stage');
  }
  // The ids the chart draws, as the rule reads them.
  function chartIds(chart) {
    var out = {series: [], lines: [], bands: []};
    chart.series.forEach(function (s) { if (typeof s.options.id === 'string') out.series.push(s.options.id); });
    chart.axes.forEach(function (axis) {
      (axis.plotLinesAndBands || []).forEach(function (pb) {
        var o = pb.options || {};
        if (typeof o.id === 'string') (o.from != null || o.to != null ? out.bands : out.lines).push(o.id);
      });
    });
    return out;
  }
  function plotItem(chart, id) {
    var hit = null;
    chart.axes.forEach(function (axis) {
      (axis.plotLinesAndBands || []).forEach(function (pb) { if (pb.options && pb.options.id === id) hit = pb; });
    });
    return hit;
  }
  function paintChart(chart, row, undo) {
    var plan = rules.inspectorHover(row, chartIds(chart));
    plan.dim.forEach(function (id) {
      var s = chart.get(id);
      if (!s) return;
      [s.group, s.markerGroup, s.dataLabelsGroup].forEach(function (g, i, all) {
        if (g && all.indexOf(g) === i) setAttr(undo, g.element, 'opacity', String(HOVER.dim_opacity));
      });
    });
    plan.lines.forEach(function (id) {
      var pb = plotItem(chart, id), el = pb && pb.svgElem && pb.svgElem.element;
      if (!el) return;
      var width = parseFloat(el.getAttribute('stroke-width')) || pb.options.width || 1;
      setAttr(undo, el, 'stroke-width', String(width * HOVER.line_factor));
    });
    plan.bands.forEach(function (id) {
      var pb = plotItem(chart, id), el = pb && pb.svgElem && pb.svgElem.element;
      if (!el) return;
      var colour = Highcharts.color(el.getAttribute('fill')), alpha = colour.rgba && colour.rgba[3];
      if (isFinite(alpha)) setAttr(undo, el, 'fill', colour.setOpacity(Math.min(1, alpha * HOVER.band_factor)).get('rgba'));
    });
    plan.notes.forEach(function (id) {
      var s = chart.get(id), label = s && s.points && s.points[0] && s.points[0].dataLabel;
      var box = label && label.box && label.box.element;
      if (box) setAttr(undo, box, 'stroke-width', String(HOVER.note_border));
    });
    return plan;
  }
  // The table's column (untransposed, the heading's data-column-key) or row
  // (transposed, the hidden key column) of the series, on the drawn page.
  function paintTable(table, key, undo) {
    var $ = window.jQuery;
    if (!$ || !$.fn.dataTable || !$.fn.dataTable.isDataTable(table)) return;
    var api = $(table).DataTable(), nodes = [];
    api.columns().header().toArray().forEach(function (th, j) {
      if (th.getAttribute('data-column-key') === key) nodes = nodes.concat([th], api.column(j).nodes().toArray());
    });
    if (!nodes.length && table.classList.contains('ws-table--transposed')) {
      api.rows().every(function () { if (this.data()[1] === key && this.node()) nodes.push(this.node()); });
    }
    nodes.forEach(function (n) { addClass(undo, n, 'ws-hover-key'); });
  }
  function apply(row) {
    var drawer = row.closest('[data-card-drawer]'), cid = drawer && drawer.getAttribute('data-card-drawer');
    var undo = [], record = rowRecord(row);
    active = {row: row, undo: undo};
    if (!cid) return;
    if (window.Highcharts && Highcharts.charts) Highcharts.charts.forEach(function (chart) {
      if (chart && chart.renderTo && chart.renderTo.isConnected && cardOf(cid, chart.renderTo)) paintChart(chart, record, undo);
    });
    var key = rules.inspectorHover(record, null).column;
    if (key !== null) document.querySelectorAll('.ws-card table.dataTable').forEach(function (table) {
      if (cardOf(cid, table)) paintTable(table, key, undo);
    });
  }
  function clear() {
    if (!active) return;
    var undo = active.undo;
    active = null;
    for (var i = undo.length - 1; i >= 0; i--) { try { undo[i](); } catch (x) { /* element gone */ } }
  }
  document.addEventListener('mouseover', function (e) {
    var row = rowOf(e.target);
    if (active && row === active.row && row.isConnected) return;
    clear();
    if (row) apply(row);
  });
  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) clear(); });
})();

(function () {
  'use strict';

  /* ---- helpers --------------------------------------------------------- */

  function app() { return document.getElementById('vets_app'); }
  function up(node, sel) { return node && node.closest ? node.closest(sel) : null; }
  function each(list, fn) { for (var i = 0; i < list.length; i++) fn(list[i], i); }
  function isEditable(el) {
    if (!el) return false;
    var tag = (el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable === true;
  }
  function clickButton(id) {
    var b = document.getElementById(id);
    if (b) b.click();
    else if (id === 'ws_search_focus') window.vetsEvent('ws_search_focus', Date.now());
    else if (id === 'ws_undo') window.vetsEvent('ws_undo', Date.now());
    else if (id === 'ws_redo') window.vetsEvent('ws_redo', Date.now());
  }
  function mod(e) { return e.ctrlKey || e.metaKey; }

  /* ---- events ---------------------------------------------------------- */

  // Layout commands, page-text requests among them, go through the canvas
  // gate's transport, one at a time; it sends each through `send` in turn. An
  // event R marks navigates (ui_events.R, #vets_app[data-navigates]) sends the
  // open drawer's snapshot first (ADR 0123).
  var navigatesDeclared = null;
  function navigatesDeclaration() {
    if (navigatesDeclared) return navigatesDeclared;
    var a = document.getElementById('vets_app');
    try { navigatesDeclared = a ? JSON.parse(a.getAttribute('data-navigates') || 'null') : null; }
    catch (x) { navigatesDeclared = null; }
    return navigatesDeclared;
  }
  window.vetsEvent = function (name, payload) {
    if (window.Shiny && Shiny.shinyapp) {  // set with the input door, in one synchronous step
      payload = window.vetsBoxPayload(payload);
      if (window.vetsRoundtripRules.drawerReport.navigates(navigatesDeclaration(), name)) snapshotDrawer();
      function send(name, payload) { Shiny.setInputValue(name, payload, { priority: 'event' }); }
      if (name === 'ws_layout' && window.vetsQueueLayout) window.vetsQueueLayout(name, payload, send);
      else send(name, payload);
    }
  };

  // A card drawer sheet (ADR 0132) opens (sheet) or closes (null). R keeps
  // which sheet is open; the drawer gate is told (sheet), and it owes focus to
  // the closed sheet's opener, keyed by the sheet's kind, once R has
  // re-rendered the page without it (ADR 0147).
  // kind: the mark popover's kind, from its Add menu entry (R keeps it).
  window.vetsCardSheet = function (cid, sheet, kind) {
    closeMenus();
    var open = document.querySelector('#vets_drawer [data-card-sheet]');
    drawerObserve({type: 'sheet', to: sheet || null, from: open ? open.getAttribute('data-card-sheet') : null});
    vetsEvent('ws_card_sheet', {cid: cid, sheet: sheet || null, kind: kind || null});
  };
  // A popover (ADR 0132) sits under its section's label (data-popover-anchor),
  // moved up as far as it must to keep its bottom edge above the footer (Copy
  // PNG, Export…, #531); where the page has no room for that, as far as it must
  // to stay inside the drawer's visible height. Presentation only: R decides
  // whether it is open.
  function anchorPopover(sheet) {
    var panel = up(sheet, '[data-card-drawer]');
    var section = panel && panel.querySelector('.vets-inspector-section--' +
      sheet.getAttribute('data-popover-anchor'));
    var drawer = document.getElementById('vets_drawer');
    if (!section || !drawer) return;
    var origin = panel.getBoundingClientRect().top;
    var label = section.querySelector('.vets-inspector-label') || section;
    var top = label.getBoundingClientRect().bottom - origin;
    var bottom = drawer.getBoundingClientRect().bottom - origin - 8;
    var foot = panel.querySelector('.vets-inspector-foot');
    var above = foot ? foot.getBoundingClientRect().top - origin - 8 : bottom;
    if (above - sheet.offsetHeight >= 8) bottom = Math.min(bottom, above);
    top = Math.max(8, Math.min(top, bottom - sheet.offsetHeight));
    sheet.style.top = Math.round(top) + 'px';
  }
  // Enter in a popover's box is its Add (the page's Enter never reaches it).
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.defaultPrevented || e.isComposing) return;
    var sheet = up(e.target, '#vets_drawer .vets-sheet--popover');
    if (!sheet || e.target.tagName !== 'INPUT' || e.target.type === 'radio') return;
    var add = sheet.querySelector('[data-popover-submit]');
    if (!add) return;
    e.preventDefault();
    e.target.dispatchEvent(new Event('change', {bubbles: true}));   // the box's value before the Add
    add.click();
  });
  // The Provenance sheet's Copy record: the named record's text to the clipboard.
  document.addEventListener('click', function (e) {
    var button = up(e.target, '#vets_drawer [data-copy-from]');
    if (button) vetsCopyFrom(button.getAttribute('data-copy-from'));
  });
  // The Provenance sheet's tabs: presentation of a read-only sheet.
  window.vetsSheetTab = function (tab) {
    var sheet = up(tab, '[data-card-sheet]');
    if (!sheet) return;
    var k = tab.getAttribute('data-prov-tab');
    each(sheet.querySelectorAll('[data-prov-tab]'), function (t) {
      t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
    });
    each(sheet.querySelectorAll('[data-prov-panel]'), function (p) {
      p.hidden = p.getAttribute('data-prov-panel') !== k;
    });
    openProvenanceText(sheet);
  };
  // A series tab's record box opens at the series' own block (#531): scrolled
  // so its recipe lines (data-prov-mark="recipe") end at the box's bottom, but
  // never above the block's heading (data-prov-mark="series"), which a short
  // block shows at the top. Once per box, when its panel first shows; the
  // Record tab's box has no marks and stays at its top.
  function openProvenanceText(sheet) {
    each(sheet.querySelectorAll('.vets-prov-panel:not([hidden]) .vets-prov-text:not([data-prov-opened])'), function (box) {
      var series = box.querySelector('[data-prov-mark="series"]');
      if (!series || !box.clientHeight) return;
      var recipe = box.querySelector('[data-prov-mark="recipe"]');
      var style = getComputedStyle(box);
      var origin = box.getBoundingClientRect().top + box.clientTop - box.scrollTop;
      var top = series.getBoundingClientRect().top - origin - parseFloat(style.paddingTop);
      var end = recipe ? recipe.getBoundingClientRect().bottom - origin + parseFloat(style.paddingBottom) : top;
      box.scrollTop = Math.max(0, Math.round(Math.max(top, end - box.clientHeight)));
      box.setAttribute('data-prov-opened', 'true');
    });
  }

  /* ---- the Series drawer's Transform tab (ADR 0135 d1-d5, #563) --------- */
  // The show-as form is live: a control reports one gesture, ws_show_as
  // {cid, iid, generation, field, value, index, op}, and R commits it as one
  // edit and redraws the tab. The client keeps no model: the pending
  // Arithmetic row is presentation until its number is typed.
  function showAsPanel() { return document.getElementById('vets_inspector'); }
  function showAsTarget(extra) {
    var panel = showAsPanel();
    if (!panel) return null;
    var out = {cid: panel.getAttribute('data-collection-id'), iid: panel.getAttribute('data-instance-id'),
      generation: Number(panel.getAttribute('data-dialog-generation'))};
    Object.keys(extra || {}).forEach(function (k) { out[k] = extra[k]; });
    return out;
  }
  window.vetsShowAs = function (field, value, index, op) {
    var payload = showAsTarget({field: field, value: value === undefined ? null : value,
      index: index === undefined ? null : index, op: op === undefined ? null : op});
    each(document.querySelectorAll('#vets_drawer details.vets-show-as-select[open]'), function (d) { d.open = false; });
    if (payload) vetsEvent('ws_show_as', payload);
  };
  window.vetsShowAsRead = function () {
    var payload = showAsTarget();
    if (payload) vetsEvent('ws_show_as_read', payload);
  };
  // A box's commit (a box, ADR 0148: the verdict has read its value already;
  // R checks everything else and says why it refuses): the tab's target, and
  // the pending row's pressed operator.
  window.vetsShowAsBox = function (el) {
    var field = el.getAttribute('data-show-as-field');
    if (field === 'arith_add') {
      var row = up(el, '[data-show-as-pending]');
      var op = row && row.querySelector('.vets-show-as-segment[aria-pressed="true"]');
      window.vetsShowAs('arith_add', el.value, null, op ? op.getAttribute('data-show-as-value') : null);
      return;
    }
    var index = el.getAttribute('data-show-as-index');
    window.vetsShowAs(field, el.value, index === null ? null : Number(index));
  };
  // The pending row: "＋ Add an operation" shows it (open) and its × hides it.
  window.vetsShowAsPending = function (button, open) {
    var row = up(button, '[data-show-as-row="arithmetic"]');
    var pending = row && row.querySelector('[data-show-as-pending]');
    if (!pending) return;
    pending.hidden = !open;
    var box = pending.querySelector('input');
    if (open && box) box.focus();
    if (!open && box) box.value = '';
  };
  window.vetsShowAsPendingOp = function (button) {
    each(button.parentNode.querySelectorAll('.vets-show-as-segment'), function (b) {
      b.setAttribute('aria-pressed', b === button ? 'true' : 'false');
    });
    var box = up(button, '[data-show-as-pending]').querySelector('input');
    if (box) box.focus();
  };
  // The tab re-renders after each commit: the control that held focus (by its
  // focus key) gets it back, so Tab through the form keeps its place (the
  // drawer gate's one focus decision, ADR 0147).

  /* ---- pages / rail ---------------------------------------------------- */

  window.vetsGo = function (page) {
    each(document.querySelectorAll('.vets-rail [data-page]'), function (b) {
      if (b.getAttribute('data-page') === page) {
        b.classList.add('is-active');
        var menu = up(b, 'details.vets-menu');
        if (menu) menu.removeAttribute('open');
      } else b.classList.remove('is-active');
    });
    vetsEvent('vets_go', page);
  };

  /* ---- drawer ---------------------------------------------------------- */

  var dialogOpener = null;
  var dialogOpenerId = null;
  var dialogOpenerChip = null;
  function dialogControls() {
    // The single Vintage selector accepts either a date or a named choice.
    // A stale render's copy stays held (hold_slot).
    var date = document.getElementById('sd_vintage');
    if (date && date.selectize && !up(date, '[data-stale-render]')) date.selectize.enable();
  }
  // Where an opening puts focus: the form's first field, else the first
  // control of the open tab (a derived series' first input row, ADR 0134),
  // else the first control; never the Series drawer's label box, which a
  // focus would open for editing.
  function dialogTarget() {
    var form = document.getElementById('vets_series_form');
    return (form && form.querySelector('[data-dialog-field]')) ||
      document.querySelector('#vets_drawer .vets-insp-body :is(input, button)') ||
      document.querySelector('#vets_drawer input:not(#insp_title), #vets_drawer button');
  }
  function dialogFocus() {
    dialogControls();
    var first = dialogTarget();
    if (first) { if (first.selectize) first.selectize.focus(); else first.focus(); }
  }
  // The drawer gate (ADR 0094): www/vets-roundtrip-rules.js's drawerGate holds
  // the rules (focus owed to a new form, #257; the Name reload and Add/Apply,
  // #303; stale slot renders, #375; a rebuilt picker's focus, #368; a date
  // box's own widget, #554; the one focus decision after the drawer renders,
  // #609), and this is its adapter. It turns DOM facts into observations:
  // open, close, panel_render and formula_render (the drawer render
  // sequence's rendering gate step), form_drawn and slot_drawn (scanDrawer,
  // its rendered gate step), drawn (its focus step), sheet (vetsCardSheet),
  // picker_reload / picker_loaded / picker_rebuilt (bindCatalogPicker),
  // submit and field_change. It performs the effects: focus, focus_key,
  // focus_sheet, focus_formula, focus_opener, focus_picker, hold_slot,
  // release_apply, send_submit, report and recheck, one handler each in the
  // gate's checked table (ADR 0149). No gate rule is decided here.
  var drawerState = window.vetsRoundtripRules.drawerGate.initial();
  // Read-only, for drivers.
  window.vetsDrawerGateState = function () { return drawerState; };
  // context: what an effect acts on (the picker; the submit's or the field's
  // own send, report and recheck).
  var drawerTable = window.vetsAdapter('drawerGate', {
    focus: function () { dialogFocus(); },
    focus_key: function (e) { focusKeyed(e.key); },
    focus_sheet: function () { focusSheetEntry(); },
    focus_formula: function () { if (window.vetsFormulaSheetFocus) window.vetsFormulaSheetFocus(); },
    focus_opener: function () { restoreDialogFocus(); },
    focus_picker: function (e, context) { if (context.select) context.select.focus(); },
    hold_slot: function (e) { holdSlot(e.slot); },
    release_apply: function () {
      var apply = document.querySelector('#sd_apply[data-awaits-name]');
      if (apply) { apply.removeAttribute('data-awaits-name'); apply.disabled = false; }
    },
    send_submit: function (e, context) { if (context.send) context.send(); },
    report: function (e, context) { if (context.report) context.report(); },
    recheck: function (e, context) { if (context.recheck) Promise.resolve().then(context.recheck); }
  });
  function drawerObserve(o, context) {
    var r = drawerTable.observe(drawerState, o);
    drawerState = r.state;
    each(r.effects, function (effect) { drawerTable.perform(effect, context || {}); });
  }
  // A stale render (ADR 0094): shown, but disabled and busy, and read by no
  // snapshot until its own render replaces it.
  function holdSlot(slot) {
    var output = document.getElementById(slot);
    if (!output) return;
    each(output.children, function (node) {
      if (!node.hasAttribute('data-dialog-generation')) return;
      node.setAttribute('aria-busy', 'true');
      node.setAttribute('data-stale-render', '');
      each(node.querySelectorAll('#sd_apply[data-awaits-name]'), function (b) { b.removeAttribute('data-awaits-name'); });
      var controls = node.matches('input,select,textarea,button') ? [node] : [];
      each(node.querySelectorAll('input,select,textarea,button'), function (el) { controls.push(el); });
      each(controls, function (el) {
        el.disabled = true;
        if (el.selectize) el.selectize.disable();
      });
    });
  }
  // The generation the panel on screen carries, or null (a panel with no opening).
  function panelGeneration() {
    var panel = document.querySelector('#vets_drawer .vets-panel[data-dialog-generation]');
    return panel ? Number(panel.getAttribute('data-dialog-generation')) : null;
  }
  // The slot output a node is drawn in (null: the panel itself or outside).
  function slotOf(el) {
    var output = up(el, '#vets_drawer .shiny-html-output');
    return output && output.id !== 'drawer_panel' ? output.id : null;
  }
  // DOM -> form_drawn and slot_drawn. The reducer is idempotent, so reporting
  // a slot again is safe; with mutation records only the touched slots are.
  function scanDrawer(records) {
    var drawer = document.getElementById('vets_drawer');
    if (!drawer) return;
    drawerObserve({type: 'form_drawn', generation: panelGeneration(),
      name_restore: !!document.querySelector('#vets_series_form[data-name-restore]')});
    var outputs = [];
    if (records && records.length && !records.some(function (r) { return r.target.id === 'drawer_panel'; })) {
      each(records, function (r) {
        var node = r.target.nodeType === 1 ? r.target : r.target.parentElement;
        for (var o = up(node, '.shiny-html-output'); o && drawer.contains(o); o = up(o.parentElement, '.shiny-html-output'))
          if (outputs.indexOf(o) < 0) outputs.push(o);
      });
    } else each(drawer.querySelectorAll('.shiny-html-output'), function (o) { outputs.push(o); });
    each(outputs, function (output) {
      if (!output.id || output.id === 'drawer_panel') return;
      var stamp = null;
      each(output.children, function (node) {
        if (stamp === null && node.hasAttribute('data-dialog-generation'))
          stamp = Number(node.getAttribute('data-dialog-generation'));
      });
      drawerObserve({type: 'slot_drawn', slot: output.id, stamp: stamp,
        awaits_name: !!output.querySelector('#sd_apply[data-awaits-name]')});
    });
  }
  // The focus keys R stamps (data-focus-key, ADR 0147). A control can take
  // focus when it is shown, or sits in a closed menu whose summary is shown
  // (the summary takes it). The open sheet's copy of a key comes first.
  function focusable(el) {
    if (el.disabled) return false;
    if (el.getClientRects().length) return true;
    var menu = up(el, 'details.vets-menu');
    var summary = menu && !menu.open && menu.querySelector('summary');
    return !!summary && summary.getClientRects().length > 0;
  }
  function focusKeysIn(root) {
    var keys = [];
    if (root) each(root.querySelectorAll('[data-focus-key]'), function (el) {
      var key = el.getAttribute('data-focus-key');
      if (key && keys.indexOf(key) < 0 && focusable(el)) keys.push(key);
    });
    return keys;
  }
  function keyedControl(key) {
    var sel = '[data-focus-key="' + CSS.escape(key) + '"]', found = null;
    each(['#vets_drawer [data-card-sheet] ', '#vets_drawer '], function (scope) {
      if (!found) each(document.querySelectorAll(scope + sel), function (el) { if (!found && focusable(el)) found = el; });
    });
    return found;
  }
  // focus_key: the keyed control, or the summary of the closed menu it sits
  // in; a text box takes the caret at its end.
  function focusKeyed(key) {
    var el = keyedControl(key);
    if (!el) return;
    var menu = up(el, 'details.vets-menu');
    if (menu && !menu.open) el = menu.querySelector('summary') || el;
    el.focus({preventScroll: true});
    if (el.tagName === 'INPUT' && el.type === 'text' && typeof el.setSelectionRange === 'function')
      el.setSelectionRange(el.value.length, el.value.length);
  }
  // focus_sheet: the open card sheet's entry, a popover's first shown box,
  // else the sheet.
  function focusSheetEntry() {
    var sheet = document.querySelector('#vets_drawer [data-card-sheet]');
    if (!sheet) return;
    var first = sheet.classList.contains('vets-sheet--popover') &&
      Array.from(sheet.querySelectorAll('input.form-control, select')).find(function (el) { return el.offsetParent !== null; });
    (first || sheet).focus({preventScroll: true});
  }
  // The date boxes under `root` whose calendar (bootstrap-datepicker, Shiny's
  // bsDatepicker) is open, and closing them. With data-date-force-parse
  // false (R's Period fields) a close leaves the box's text as typed (#554).
  function openCalendarInputs(root) {
    var out = [];
    if (!root || !window.jQuery || !jQuery.fn.bsDatepicker) return out;
    each(root.querySelectorAll('.shiny-date-input input, .shiny-date-range-input input'), function (input) {
      var picker = jQuery(input).data('datepicker');
      if (picker && picker.picker && picker.picker.is(':visible')) out.push(input);
    });
    return out;
  }
  function closeCalendars(root) {
    each(openCalendarInputs(root), function (input) { jQuery(input).bsDatepicker('hide'); });
  }
  // Where focus is, as the drawer gate reads it.
  function focusPlace() {
    var active = document.activeElement;
    if (up(active, '#vets_drawer [data-formula-sheet]')) return 'formula';
    if (up(active, '#vets_drawer [data-card-sheet]')) return 'sheet';
    if (up(active, '#vets_drawer')) return 'inside';
    if (active && active !== document.body && (active === dialogOpener || active === drawerOpenFocus ||
        (dialogOpenerId && active.id === dialogOpenerId))) return 'opener';
    return !active || active === document.body ? 'body' : 'other';
  }
  // DOM -> drawn, the render pass's focus step: where focus is, whether the
  // form's target can take it, the open card sheet, the keys that can take
  // focus, the formula sheet, and the outputs the pass saw replaced.
  function observeDrawn(pass) {
    var target = dialogTarget(), sheet = document.querySelector('#vets_drawer [data-card-sheet]');
    drawerObserve({type: 'drawn', focus: focusPlace(),
      target: !target ? 'none' :
        (up(target, '.shiny-input-container') && !target.classList.contains('shiny-bound-input') ? 'unbound' : 'ready'),
      sheet: sheet ? sheet.getAttribute('data-card-sheet') : null,
      keys: focusKeysIn(document.getElementById('vets_drawer')), sheet_keys: focusKeysIn(sheet),
      formula: !!document.querySelector('#vets_drawer [data-formula-sheet]'), outputs: pass.outputs});
  }
  // The focus key of the control in `output` that holds focus, or null.
  function focusedKey(output) {
    var active = document.activeElement;
    return active && output && output.contains(active) ? active.getAttribute('data-focus-key') || null : null;
  }
  // What had focus when the drawer was last asked to open, a swap included:
  // the gesture's own control, never focus the analyst moved afterwards.
  var drawerOpenFocus = null;
  // ADR 0078: the column and the canvas padding change in one frame, then the
  // main column is drawn from where it was and slides by the column's width.
  // A transform never changes layout. The slide holds whole-pixel offsets on
  // an ease-out curve: Shiny compares each output's bounding rectangle exactly,
  // and a fractional offset inside a zoomed page shifts that rectangle enough
  // for highcharter to resize a chart to its own size.
  function slideMain(dx) {
    var main = document.querySelector('.vets-main'), drawer = document.getElementById('vets_drawer');
    if (!main || !main.animate || !drawer || getComputedStyle(drawer).display === 'none') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var n = 12, frames = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n, x = Math.round(dx * Math.pow(1 - t, 3));
      frames.push({offset: t, transform: x ? 'translateX(' + x + 'px)' : 'none', easing: 'steps(1, end)'});
    }
    main.animate(frames, {duration: 180});
  }
  function drawerWidth() {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vets-drawer-w')) || 320;
  }
  window.vetsOpenDrawer = function (focus) {
    var a = app();
    drawerOpenFocus = document.activeElement;
    drawerObserve({type: 'open', focus: focus !== false});
    if (!a || a.classList.contains('drawer-open')) return;
    dialogOpener = document.activeElement;
    dialogOpenerId = dialogOpener && dialogOpener.id;
    var chip = up(dialogOpener, '.ws-chip');
    dialogOpenerChip = chip && {cid: chip.dataset.collectionId, iid: chip.dataset.instanceId,
      part: dialogOpener.classList.contains('ws-vintage-pill') ? '.ws-vintage-pill' : '.ws-chip-body'};
    a.classList.add('drawer-open');
    slideMain(-drawerWidth());
    window.vetsDrawerRender();   // a whole pass: a panel already rendered and bound owes focus now
  };

  // `reason` is the closing gesture R decides keep or discard on (ADR 0075):
  // 'escape', 'cancel', 'close_button' (the header ×,
  // the default); false when the server already knows (page switch) and nothing
  // is reported. The report carries the opening's generation and the native
  // fields of the export roots, read before the drawer hides, including a
  // final Series keystroke in the same envelope.
  window.vetsCloseDrawer = function (reason) {
    var a = app();
    if (!a || !a.classList.contains('drawer-open')) return;
    var report = reason === false ? null : drawerReport(typeof reason === 'string' ? reason : 'close_button');
    a.classList.remove('drawer-open');
    slideMain(drawerWidth());
    drawerObserve({type: 'close'});   // after the report, which reads through the gate
    restoreDialogFocus();             // and again after the closed panel's pass (the gate's focus_opener)
    if (report) vetsEvent('ws_close_drawer', report);
  };
  // The drawer report (#482, ADR 0123): www/vets-roundtrip-rules.js's
  // drawerReport assembles what an opening reports, with the one coercion and
  // the one gate read; this adapter only observes. It reads every kept root:
  // the export roots (data-kept-dialog, by the field table R renders on each as
  // data-kept-fields) and the Series form (data-dialog-field).
  var drawerReportRule = window.vetsRoundtripRules.drawerReport;
  // An element's render stamp, or null for no element.
  function stampOf(el) { return el ? Number(el.dataset.dialogGeneration) : null; }
  // DOM -> one observation of a control (the rule's header lists the fields).
  function observeControl(el) {
    var kind = el.tagName === 'DETAILS' ? 'details' :
      el.classList.contains('shiny-date-input') ? 'date' :
      el.type === 'checkbox' ? 'checkbox' :
      el.getAttribute('role') === 'switch' ? 'switch' :
      el.type === 'number' ? 'number' :
      el.type === 'radio' ? 'radio' :
      el.type === 'button' || el.type === 'submit' ? 'button' : 'text';
    var date = kind === 'date' ? el.querySelector('input') : null;
    return {id: el.id || '', name: el.getAttribute('name') || '', kind: kind,
      value: kind === 'details' ? el.open : kind === 'date' ? (date ? date.value : null) :
        kind === 'switch' ? el.getAttribute('aria-checked') : el.value,
      checked: !!el.checked, disabled: !!el.disabled, slot: slotOf(el)};
  }
  function observeAll(nodes, extra) {
    var out = [];
    each(nodes, function (el) { var o = observeControl(el); if (extra) extra(o, el); out.push(o); });
    return out;
  }
  function exportRoot(root) {
    var fields = null;
    try { fields = JSON.parse(root.getAttribute('data-kept-fields') || 'null'); } catch (x) { fields = null; }
    return {dialog: root.dataset.keptDialog, card: root.getAttribute('data-dialog-card'),
      generation: stampOf(root), slot: slotOf(root), fields: fields,
      observations: observeAll(root.querySelectorAll('input, select, textarea'))};
  }
  // The Series form's observations, or null when no form is open.
  function seriesObservation() {
    var form = document.getElementById('vets_series_form') || document.getElementById('vets_add_panel');
    if (!form || !app().classList.contains('drawer-open')) return null;
    return {generation: stampOf(form), observations: observeAll(
      document.querySelectorAll('#vets_drawer [data-dialog-field]'),
      function (o, el) { o.field = el.dataset.dialogField; })};
  }
  function drawerReport(reason) {
    var exports = [];
    each(document.querySelectorAll('#vets_drawer [data-kept-dialog]'), function (root) { exports.push(exportRoot(root)); });
    return drawerReportRule({at: Date.now(), reason: reason, gate: drawerState,
      generation: stampOf(document.querySelector('#vets_drawer [data-dialog-generation]')),
      exports: exports, series: seriesObservation()});
  }
  // Snapshot only: R decides whether a route changes the kind/target and keeps
  // the outgoing draft before rendering the next form. No client workspace
  // state. vetsEvent calls it before any event R marks navigates, and the
  // capture listeners before a navigating native control (ui_events.R).
  function snapshotDrawer() {
    if (app() && app().classList.contains('drawer-open'))
      vetsEvent('ws_drawer_snapshot', drawerReport('swap'));
  }
  // ws_dialog_close for one export root (the listener below the main module).
  window.vetsDialogReport = function (root, reason) {
    return drawerReportRule.dialogClose(exportRoot(root), reason, drawerState);
  };

  function restoreDialogFocus() {
    var opener = dialogOpener && dialogOpener.isConnected ? dialogOpener :
      (dialogOpenerId && document.getElementById(dialogOpenerId));
    if (!opener && dialogOpenerChip) {
      opener = Array.from(document.querySelectorAll('.ws-chip')).find(function (el) {
        return el.dataset.collectionId === dialogOpenerChip.cid && el.dataset.instanceId === dialogOpenerChip.iid;
      });
      if (opener) opener = opener.querySelector(dialogOpenerChip.part);
    }
    if (!opener || opener === document.body) opener = document.getElementById('ws_add_dialog');
    if (opener) opener.focus({preventScroll: true});
  }

  // Only form values cross this boundary. R owns the draft and its target;
  // the generation rejects delayed changes from a previous dialog. The fields
  // every snapshot (sd_change, sd_submit, ws_close_drawer,
  // ws_drawer_snapshot) reads are the drawer report's: a disabled field, a
  // picker reloading its server-side list (#303: that blank is the widget's)
  // and a stale slot render's controls are left out, so R keeps the draft's value.
  function dialogValues() {
    var series = seriesObservation();
    return series && drawerReportRule.series(series, drawerState);
  }
  // Add/Apply and Enter in Name: the gate holds them while the Name an opening
  // restores is unsettled (#303, owner decision A).
  window.vetsSubmitSeries = function (batch) {
    drawerObserve({type: 'submit'}, {send: function () {
      var invalidDate = Array.from(document.querySelectorAll('#vets_series_form input[type="date"]'))
        .find(function (el) { return !el.checkValidity(); });
      if (invalidDate) { invalidDate.reportValidity(); return; }
      var value = dialogValues();
      if (!value) return;
      var target = document.getElementById('sd_target');
      value.target = target ? target.value : null;
      value.batch = !!batch;
      var text = document.getElementById('sd_batch_text');
      value.batch_text = text ? text.value : '';
      vetsEvent('sd_submit', value);
    }});
  };

  window.vetsOpenMenu = function (id) {
    var d = document.getElementById(id);
    while (d) {
      if (d.matches('details.vets-menu')) d.setAttribute('open', '');
      d = d.parentElement;
    }
  };

  function closeMenus(except) {
    each(document.querySelectorAll('details.vets-menu[open]'), function (d) {
      if (d !== except && !(except && d.contains(except))) d.removeAttribute('open');
    });
  }

  /* ---- add series ------------------------------------------------------ */

  // ⌘K is an explicit no-target route into Add series, including from an
  // already-open Add drawer. R keeps any staged settings before reopening.
  window.vetsFocusSearch = function () {
    vetsEvent('ws_search_focus', Date.now());
    return true;
  };

  /* ---- cards ----------------------------------------------------------- */

  // A click on a card selects nothing and marks nothing; hover reveals its
  // controls (ADR 0083). Activation only names the card an action targets.
  window.vetsActivate = function (el, id) {
    vetsEvent('ws_activate', id);
  };

  /* ---- card containers (WF06a #32) ------------------------------------- */

  function grid() { return document.getElementById('ws_grid'); }
  function cardNode(id) {
    return document.querySelector('#ws_grid > .ws-card[data-collection-id="' + id + '"]');
  }
  // Destroy the Highcharts instances inside a node that is about to leave the
  // DOM (removeUI, or a body slot re-render): Highcharts keeps every chart in
  // Highcharts.charts until destroy(), so a detached container would leak.
  function releaseCharts(node) {
    if (node) each(node.querySelectorAll('.datatables'), function (el) {
      if (el.__vetsTableResize) el.__vetsTableResize.disconnect();
    });
    if (!node || !window.Highcharts || !Highcharts.charts) return;
    each(node.querySelectorAll('[data-highcharts-chart]'), function (el) {
      var idx = parseInt(el.getAttribute('data-highcharts-chart'), 10);
      var chart = Highcharts.charts[idx];
      if (chart && chart.renderTo === el) {
        try { chart.destroy(); } catch (x) { /* already gone */ }
      }
    });
  }
  // Size heading inputs to their text; the title no longer grows past it.
  // These measurements are presentation only; R continues to own the caption value.
  window.vetsFitCardHeadings = function (root) {
    var context = document.createElement('canvas').getContext('2d');
    if (!context) return;
    (root || document).querySelectorAll('.ws-card-title, .ws-card-axis-title').forEach(function (input) {
      var style = getComputedStyle(input);
      context.font = style.fontWeight + ' ' + style.fontSize + ' ' + style.fontFamily;
      input.style.width = Math.ceil(context.measureText(input.value || input.placeholder || '').width + 4) + 'px';
      if (input.matches('.ws-card-axis-title')) input.style.flex = '0 1 auto';
    });
  };
  document.addEventListener('input', function (event) {
    if (event.target.matches('.ws-card-title, .ws-card-axis-title')) window.vetsFitCardHeadings(event.target.parentElement);
  });
  // Let the widgets inside moved / resized cards reflow (htmlwidgets and
  // Shiny both listen to the window resize event).
  function reflow() {
    setTimeout(function () {
      window.vetsFitCardHeadings();
      var ev = document.createEvent('Event');
      ev.initEvent('resize', true, true);
      window.dispatchEvent(ev);
      // Chart cards need a capacity too, so Display can offer their future table
      // sizes; a drawn table is measured by its own resize observer below.
      each(document.querySelectorAll('#vets_canvas .ws-card'), function (card) {
        var body = card.querySelector('.ws-card-body');
        if (body && !body.querySelector('.datatables')) measureCapacity(card);
      });
    }, 0);
  }
  // The one table capacity measure (ADR 0121): the data rows that
  // fit a card occurrence's body, reported through vetsEvent under the view's
  // namespaced table_capacity input, which R names on the card
  // (data-capacity-event); R holds one value per view id. With no table drawn
  // the header (26px) and footer (--vets-table-foot-h, 32px) are the
  // stylesheet's declared heights; a drawn table's real header and footer are
  // read instead. The 3px of outer rules are the rules module's.
  function measureCapacity(card) {
    var body = card.querySelector('.ws-card-body');
    var name = card.getAttribute('data-capacity-event');
    if (!body || !name || body.clientHeight <= 0) return;
    var rules = window.vetsCanvasRules, head = rules.TABLE_CAPACITY.head, foot = rules.TABLE_CAPACITY.foot, bar = 0;
    var el = body.querySelector('.datatables');
    if (el) {
      var page = el.querySelector('.ws-table-page');
      var thead = el.querySelector('thead');
      var tfoot = el.querySelector('.ws-table-foot');
      if (!page || !thead || !tfoot) return;
      // A resize may move the table between its two width layouts; the fit
      // never changes the heights read below, so capacity depends on height only.
      var table = jQuery(el).data('datatable');
      if (table) window.vetsFitTableWidth(table);
      // Measure the assigned slot in logical CSS px, not the table's transient
      // size during redraw. clientHeight is unzoomed; rectangles include both
      // sheet and inner-card zoom. Undo that scale for the header/footer too.
      // The stylesheet fixes data rows at 20.5px.
      var scale = body.getBoundingClientRect().width / body.clientWidth;
      if (!(scale > 0)) return;
      head = thead.getBoundingClientRect().height / scale;
      foot = tfoot.getBoundingClientRect().height / scale;
      // A transposed table's period columns scroll sideways in the page
      // (ADR 0133); its scroll bar takes rows' height (0 without one).
      bar = page.offsetHeight - page.clientHeight;
    }
    vetsEvent(name, rules.tableCapacity(body.clientHeight - bar, head, foot));
  }

  // Geometry only: R chooses the effective page size and disabled Display options.
  window.vetsSetTableRows = function (id, value, event) {
    // Shiny's jQuery initialization is not a user edit of the saved preference.
    if (event && event.isTrigger) return;
    vetsEvent('ws_table_rows', {id: id, rows: value === 'auto' ? 'auto' : Number(value)});
  };
  // Hide redundant navigation on every draw, including filtering and page-size
  // changes. Keep its measured space so Auto capacity cannot oscillate as the
  // footer appears/disappears at the one-page boundary (ADR 0044).
  window.vetsUpdateTableFooter = function (table) {
    var footer = table.table().container().querySelector('.ws-table-foot');
    if (!footer) return;
    var single = table.page.info().pages <= 1;
    footer.classList.toggle('is-single-page', single);
    footer.setAttribute('aria-hidden', String(single));
  };
  // Width follows the content (ADR 0069). The widget arrives asking for its
  // natural width (ws-table--content, chart_render.R): columns as wide as their
  // cells, left-aligned in the frame under the card title. When that width
  // exceeds the card body the modifier comes off and the stylesheet's
  // full-width fixed layout with ellipsis applies. The natural width is read
  // with the modifier on, so the outcome depends on the content and the body's
  // width only, never on the previous layout; and neither layout changes the
  // header or footer height, so the capacity below is the same in both.
  // Presentation only: nothing is reported to R.
  window.vetsFitTableWidth = function (table) {
    var node = table.table().node();
    var page = up(node, '.ws-table-page');
    if (!node || !page || page.clientWidth <= 0) return;
    node.classList.add('ws-table--content');
    var fits = node.getBoundingClientRect().width <= page.getBoundingClientRect().width + 0.5;
    node.classList.toggle('ws-table--content', fits);
  };
  // A drawn table re-measures its card whenever the body resizes.
  window.vetsMeasureTable = function (el) {
    if (el.__vetsTableResize) el.__vetsTableResize.disconnect();
    var body = up(el, '.ws-card-body');
    var card = up(el, '.ws-card');
    if (!body || !card) return;
    function measure() {
      if (!el.isConnected) { if (el.__vetsTableResize) el.__vetsTableResize.disconnect(); return; }
      measureCapacity(card);
    }
    el.__vetsTableResize = new ResizeObserver(measure);
    el.__vetsTableResize.observe(body);
    requestAnimationFrame(measure);
  };

  function rememberTable(el) {
    var table = jQuery(el).data('datatable');
    if (!table) return;
    el.__vetsTableViewer = {
      page: table.page(), order: table.order(), search: table.search(),
      periods: table.rows('.selected, .active').data().toArray().map(function (r) { return r[1]; })
    };
  }
  window.vetsRestoreTable = function (el) {
    var viewer = el.__vetsTableViewer, table = jQuery(el).data('datatable');
    if (!viewer || !table) return;
    delete el.__vetsTableViewer;
    // A removed column cannot remain a sort key after an alias/series edit.
    table.order(viewer.order.filter(function (o) { return o[0] < table.columns().count(); }));
    table.search(viewer.search).draw();
    table.page(Math.min(viewer.page, Math.max(0, table.page.info().pages - 1))).draw(false);
    var rows = [];
    table.rows().every(function () {
      if (viewer.periods.indexOf(this.data()[1]) >= 0) rows.push(this.index() + 1);
    });
    if (table.shinyMethods.selectRows) table.shinyMethods.selectRows(rows);
  };
  // Apply R's page guides and annotations. These are disposable markup;
  // the chart/table containers remain direct children of the same grid.
  function pageGuides(g, plan) {
    each(g.querySelectorAll('.ws-page-guide'), function (n) { n.remove(); });
    g.classList.toggle('ws-grid--pages', !!(plan.pages && plan.pages.length));
    function guide(className, text, row, span, col, colSpan) {
      var el = document.createElement('div');
      el.className = 'ws-page-guide ' + className;
      el.textContent = text || '';
      el.style.gridRow = row + ' / span ' + span;
      el.style.gridColumn = (col || 1) + ' / span ' + (colSpan || 2);
      g.appendChild(el);
      return el;
    }
    each(plan.pages || [], function (p) {
      guide('ws-page-backdrop', '', p.header_row, p.footer_row - p.header_row + 1);
      var header = guide('ws-page-header', '', p.header_row, 1);
      var label = document.createElement('span');
      label.className = 'ws-page-label';
      label.textContent = p.size + ' · Page ' + p.number + ' · ' + (p.full_page ? 'Full page' : 'Up to ' + p.capacity + ' cards');
      var title = document.createElement('strong');
      title.textContent = p.title || '';
      header.appendChild(label); header.appendChild(title);
      guide('ws-page-footer', p.footnote, p.footer_row, 1);
      each(p.vacancies || [], function (v) {
        guide('ws-page-vacancy', 'Position ' + v.slot + ' · Automatic fill', v.cell.row, 1, v.cell.col, 1);
      });
    });
    each(plan.cards || [], function (p) {
      var node = cardNode(p.id);
      if (!node) return;
      var title = node.querySelector('.ws-page-card-title');
      if (title) title.textContent = p.title || '';
      var note = node.querySelector('.ws-page-card-note');
      if (note && document.activeElement !== note) note.value = p.footnote || '';
    });
  }
  // Apply R's container delta without rebuilding kept cards.
  function arrangeCards(m) {
    var g = m.grid_id ? document.getElementById(m.grid_id) : grid();
    function viewNode(id) { return g && g.querySelector('.ws-card[data-view-id="' + id + '"]'); }
    if (!g) return;
    if (window.vetsInvalidateLayout) window.vetsInvalidateLayout();
    var touched = false;
    each(m.remove || [], function (id) { releaseCharts(viewNode(id)); });
    each(m.moves || [], function (mv) {
      // A view arriving from another sheet is found canvas-wide (view ids are
      // unique across the canvas) and moved here with its chart (ADR 0109).
      var node = viewNode(mv.id) || document.querySelector('.ws-card[data-view-id="' + mv.id + '"]');
      if (!node) return;
      var ref = mv.before ? viewNode(mv.before) : null;
      if (ref) g.insertBefore(node, ref); else g.appendChild(node);
      touched = true;
    });
    if (m.cells && !Array.isArray(m.cells)) {
      for (var id in m.cells) {
        if (!Object.prototype.hasOwnProperty.call(m.cells, id)) continue;
        var node = viewNode(id);
        if (node && node.getAttribute('style') !== m.cells[id]) {
          node.setAttribute('style', m.cells[id]);
          touched = true;
        }
      }
    }
    if (m.grid) {
      g.setAttribute('style', m.grid.style || '');
      Object.keys(m.grid.attributes || {}).forEach(function (name) { g.setAttribute(name, m.grid.attributes[name]); });
      g.classList.toggle('ws-grid--scroll', !!m.grid.scroll);
      pageGuides(g, m.grid);
      touched = true;
    }
    Object.keys(m.geometry || {}).forEach(function (id) {
      var node = viewNode(id);
      if (node) Object.keys(m.geometry[id]).forEach(function (name) { node.setAttribute(name, m.geometry[id][name]); });
    });
    // The empty state belongs to page one's grid and the empty slot; every
    // other sheet exists only with the workspace's cards and keeps its grid shown.
    if (typeof m.empty === 'boolean' && g.id === 'ws_grid') {
      g.hidden = m.empty;
      var slot = document.querySelector('.vets-empty-slot');
      if (slot) slot.hidden = !m.empty;
    }
    if (touched) { if(window.vetsFitExhibitCards) window.vetsFitExhibitCards(); reflow(); }
  }
  window.vetsRename = function (id, title) { vetsEvent('ws_rename', { id: id, title: title }); };
  window.vetsSetView = function (id, view) { vetsEvent('ws_set_view', { id: id, view: view }); };
  window.vetsCardAction = function (id, action) {
    closeMenus();
    vetsEvent('ws_card_action', { id: id, action: action });
  };
  window.vetsRetry = function (button) {
    var band = button.closest('[data-retry-generation]');
    if (!band) return;
    vetsEvent('ws_retry', {id: band.dataset.collectionId,
      generation: Number(band.dataset.retryGeneration),
      ids: Array.from(band.querySelectorAll('[data-retry-source]:checked')).map(function (el) { return el.dataset.retrySource; })});
  };

  // The chrome R's vets-chrome facts describe, painted through the pure
  // chromeAttributes (#485, ADR 0124). chromeFacts is R's last
  // message, re-painted when R re-renders markup it marks (a card's chip
  // strip, a sheet); no rule reads it back into a payload.
  var chromeFacts = null;
  function paintChrome() {
    if (!chromeFacts) return;
    each(window.vetsRoundtripRules.chromeAttributes(chromeFacts), function (op) {
      each(document.querySelectorAll(op.selector), function (el) {
        if (op.attr.charAt(0) === '.') el.classList.toggle(op.attr.slice(1), op.value === true);
        else if (op.value === null) el.removeAttribute(op.attr);
        else el.setAttribute(op.attr, op.value);
      });
    });
  }
  window.vetsPaintChrome = paintChrome;
  // Read-only, for the Layout target's slide (syncLayoutTarget) and drivers.
  window.vetsChromeFacts = function () { return chromeFacts; };

  window.vetsOpenSeries = function (cid, iid, tab) {
    var payload = { cid: cid, iid: iid };
    if (tab) payload.tab = tab;
    vetsEvent('ws_open_series', payload);
  };
  window.vetsRemoveSeries = function (cid, iid) { vetsEvent('ws_remove_series', { cid: cid, iid: iid }); };
  window.vetsOpenAdd = function (cid) {
    var card = document.querySelector('.ws-card[data-collection-id="' + cid + '"]');
    if (card) vetsActivate(card, cid);
    vetsEvent('ws_open_add', { cid: cid });
  };
  window.vetsCopySeries = function (from, iid, to) {
    closeMenus();
    vetsEvent('ws_copy_series', { from: from, instance_id: iid, to: to });
  };

  /* ---- the Series drawer's header and popovers (ADR 0134) --------------- */
  // A popover over the Series drawer is a <details> menu R renders closed
  // (series_popover_ui): Esc (the ladder's dropdown rung) and an outside click
  // close it as they close every menu. The ⋯ menu opens the Copy popover here,
  // after this click's own outside-click pass has closed the menu; its ×,
  // Cancel and submit close it (data-popover-close). Presentation only: R
  // decides what the forms inside commit.
  window.vetsSeriesPopover = function (name) {
    closeMenus();
    setTimeout(function () {
      var d = document.querySelector('#vets_drawer [data-series-popover="' + name + '"]');
      if (!d) return;
      d.setAttribute('open', '');
      var first = d.querySelector('.vets-popover-body select, .vets-popover-body input, .vets-popover-body button');
      if (first) first.focus({preventScroll: true});
    }, 0);
  };
  document.addEventListener('click', function (e) {
    var close = up(e.target, '#vets_drawer [data-series-popover] [data-popover-close]');
    var d = close && up(close, '[data-series-popover]');
    if (d) d.removeAttribute('open');
  });
  // The ⋯ menu's whole-series tasks: Hide / Show on the card, Reset display,
  // Remove from card (the card ×'s rule, with its dependency plan in R).
  window.vetsSeriesAction = function (cid, iid, action, value) {
    closeMenus();
    if (action === 'visible') vetsEvent('ws_series_visible', {cid: cid, iid: iid, visible: value});
    else if (action === 'reset') vetsEvent('ws_series_reset', {cid: cid, iid: iid});
    else if (action === 'remove') vetsEvent('ws_remove_series', {cid: cid, iid: iid});
  };
  // Revert (the Query tab's Apply bar): R drops the opening's drafts and
  // reopens the form on the series; the generation names this opening.
  window.vetsSeriesRevert = function () {
    var panel = document.getElementById('vets_inspector');
    if (panel) vetsEvent('ws_series_revert', {generation: Number(panel.getAttribute('data-dialog-generation'))});
  };

  /* ---- inspector ------------------------------------------------------- */

  window.vetsSetColor = function (cid, iid, color) {
    vetsEvent('ws_set_color', { cid: cid, iid: iid, color: color });
  };
  // Selection belongs to R: the key names only itself, and R stamps its
  // target from the session's selection (#485).
  function sendKey(key) {
    vetsEvent('ws_key', {key: key});
  }

  /* ---- clipboard: one copy request (#610, ADR 0143) ----------------------
   * Every copy is one request of copyRequest (www/vets-roundtrip-rules.js):
   * Copy PNG, the Series drawer's and the Save drawer Data tab's Copy values,
   * Copy record and a vets-copy no click opened. A click opens it with a mime
   * type (text/plain | image/png), a feedback kind (label | toast) and the key
   * of the button that shows it (png:<cid>, series:<iid>); the rule mints its
   * id and decides its route: the async clipboard (a ClipboardItem whose data
   * is a promise, written inside the click) or the mime's fallback (a selected
   * textarea when the text arrives, within the click's user activation; Save
   * PNG's ordinary download). The clicked control's event carries the id and
   * R's one answer names it: vets-copy {text, request}, or a Copy PNG job's
   * vets-export-ready {clipboard}, which vets-export.js hands to
   * vetsCopyStaged. A newer click or COPY.timeout_ms drops the open request.
   * A refused write is remembered per mime type, so later requests of that
   * type take the fallback, and Copy PNG's button (painted whenever the
   * drawer renders, never decided at click) reads Save PNG. This adapter reads
   * the browser's capability, holds each open request's promise and data, and
   * performs the rule's effects; it keeps no rule. window.__vetsCopy is the
   * last outcome for drivers: {id, mime, key, state (copied | saved |
   * failed), route (clipboard | textarea | download), text (a text's), bytes
   * (a PNG's size), job (a Copy PNG's export job)}. */
  var copyRules = window.vetsRoundtripRules.copyRequest;
  var copyState = copyRules.initial();
  var copyHeld = {}, copiedUntil = {}, copyPermission = null;
  function copyCapability(mime) {
    var Item = window.ClipboardItem;
    return {secure: window.isSecureContext === true,
      clipboard_write: !!(navigator.clipboard && typeof navigator.clipboard.write === 'function'),
      clipboard_item: typeof Item === 'function',
      supported: typeof Item === 'function' && typeof Item.supports === 'function' ? !!Item.supports(mime) : null,
      permission: copyPermission};
  }
  function copyHold(id) { return copyHeld[id] || (copyHeld[id] = {}); }
  function copyForget(id) {
    var h = copyHeld[id];
    if (h) clearTimeout(h.timer);
    delete copyHeld[id];
  }
  // Feeds one observation and performs its effects in order. `data` is the
  // text an open has in hand, held for the request the open made.
  function copyObserve(o, data) {
    var r = copyTable.observe(copyState, o);
    copyState = r.state;
    if (o.type === 'open' && data !== undefined && copyState.pending) copyHold(copyState.pending.id).data = data;
    r.effects.forEach(function (e) { copyTable.perform(e); });
    return r.effects;
  }
  // Opens a request; the id R answers under, or null (Save PNG: none).
  function copyOpen(mime, feedback, key, data) {
    var ask = null;
    copyObserve({type: 'open', mime: mime, feedback: feedback, key: key, capability: copyCapability(mime),
      data: data !== undefined}, data).forEach(function (e) { if (e.type === 'ask') ask = e.id; });
    return ask;
  }
  // The copy request's effects, one handler each in its checked table (ADR 0149).
  var copyTable = window.vetsAdapter('copyRequest', {
    write: function (e) {
      var h = copyHold(e.id), item = {}, written;
      item[e.mime] = new Promise(function (resolve, reject) { h.resolve = resolve; h.reject = reject; });
      try { written = navigator.clipboard.write([new window.ClipboardItem(item)]); }
      catch (err) { written = Promise.reject(err); }
      written.then(function () { copyObserve({type: 'written', id: e.id}); },
        function () { copyObserve({type: 'refused', id: e.id}); });
    },
    // copyOpen hands the id to the control that opened the request.
    ask: function () {},
    arm: function (e) {
      copyHold(e.id).timer = setTimeout(function () { copyObserve({type: 'timeout', id: e.id}); }, e.ms);
    },
    resolve: function (e) {
      var h = copyHeld[e.id];
      if (h && h.resolve) h.resolve(typeof h.data === 'string' ? new Blob([h.data], {type: 'text/plain'}) : h.data);
    },
    fallback: function (e) {
      var h = copyHeld[e.id];
      if (!h) return;
      if (e.route === 'download') { copySave(h.data, h.name); copyObserve({type: 'fell_back', id: e.id, ok: true}); }
      else copyObserve({type: 'fell_back', id: e.id, ok: copyTextarea(String(h.data))});
    },
    drop: function (e) {
      var h = copyHeld[e.id];
      if (h && h.reject) h.reject(new Error('dropped'));
      copyForget(e.id);
    },
    outcome: function (e) {
      var h = copyHeld[e.id];
      window.__vetsCopy = {id: e.id, mime: e.mime, key: e.key, state: e.state, route: e.route,
        text: h && typeof h.data === 'string' ? h.data : null,
        bytes: h && h.data && typeof h.data !== 'string' ? h.data.size : 0, job: h && h.job || null};
      copyForget(e.id);
    },
    label: function (e) {
      var ms = copyRules.COPY.feedback_ms;
      each(document.querySelectorAll('#vets_drawer [data-copied-ms]'), function (button) {
        if (copyKey(button) === e.key) ms = parseInt(button.getAttribute('data-copied-ms'), 10) || ms;
      });
      copiedUntil[e.key] = Date.now() + ms;
      paintCopy();
      setTimeout(paintCopy, ms + 20);
    },
    toast: function (e) { vetsToast(e.text, e.level); },
    paint: function () { paintCopy(); }
  });
  function copyTextarea(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (x) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  function copySave(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name || 'card.png'; a.style.display = 'none';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
  }
  // The key of the request a copy button shows.
  function copyKey(button) {
    if (button.hasAttribute('data-copy-png')) return 'png:' + button.getAttribute('data-copy-png');
    if (button.hasAttribute('data-series-copy')) return 'series:' + button.getAttribute('data-series-copy');
    return null;
  }
  // Copy PNG's mode and label (copyRequest.button), and Copied on a button
  // whose request copied within its feedback time.
  function paintCopy() {
    var png = copyCapability('image/png');
    each(document.querySelectorAll('#vets_drawer [data-copy-png], #vets_drawer [data-series-copy]'), function (button) {
      var copied = Date.now() < (copiedUntil[copyKey(button)] || 0), label;
      if (button.hasAttribute('data-copy-png')) {
        var state = copyRules.button(copyState, png, copied);
        if (button.dataset.copyMode !== state.mode) button.dataset.copyMode = state.mode;
        label = state.label;
      } else label = button.getAttribute(copied ? 'data-copied-label' : 'data-copy-label');
      if (label !== null && button.textContent !== label) button.textContent = label;
    });
  }
  // R's answer for request `id` (vets-copy's text). A text no request names
  // (the card Export sheet's Copy TSV) is copied as a request opened now.
  function copyAnswer(text, id) {
    if (typeof id !== 'string') { copyOpen('text/plain', 'toast', null, text); return; }
    if (!copyRules.awaiting(copyState, id)) return;
    copyHold(id).data = text;
    copyObserve({type: 'arrived', id: id});
  }
  // vets-export.js: a Copy PNG job's staged file is ready at href, for the
  // request m.clipboard names. False only when m names no request, so the
  // caller downloads it as usual; a dropped request's file is left alone.
  window.vetsCopyStaged = function (m, href) {
    var id = m && m.clipboard;
    if (typeof id !== 'string') return false;
    if (!copyRules.awaiting(copyState, id)) return true;
    copyHold(id).job = m.job;
    copyHold(id).name = m.name;
    fetch(href, {credentials: 'same-origin'}).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.blob();
    }).then(function (data) {
      if (!copyRules.awaiting(copyState, id)) return;
      copyHold(id).data = data.type === 'image/png' ? data : new Blob([data], {type: 'image/png'});
      copyObserve({type: 'arrived', id: id});
    }, function () {
      copyObserve({type: 'failed', id: id});
      vetsEvent('vets_export_download_error', {job: m.job});
    });
    return true;
  };
  // The Provenance sheet's Copy record: a text in hand.
  window.vetsCopyFrom = function (id) {
    var el = document.getElementById(id);
    if (el) copyOpen('text/plain', 'toast', null, el.textContent || '');
  };
  // The card drawer footer's Copy PNG (#517, ADR 0132 decision 7): one scoped
  // PNG job, the Export sheet's PNG download at the default resolution; its
  // request id makes it a clipboard job, none (Save PNG) an ordinary download.
  window.vetsCopyPng = function (button) {
    var cid = button && button.getAttribute('data-copy-png');
    if (!cid) return;
    vetsEvent('ws_copy_png', {cid: cid, request: copyOpen('image/png', 'label', 'png:' + cid)});
  };
  // Painted after every render in the drawer (the render sequence's paint_copy
  // step, ADR 0147) and whenever the capability changes.
  window.vetsDrawerStep('rendered', 'paint_copy', paintCopy);
  function bindCopy() {
    try {
      if (navigator.permissions && navigator.permissions.query) navigator.permissions.query({name: 'clipboard-write'})
        .then(function (status) {
          copyPermission = status.state; paintCopy();
          status.onchange = function () { copyPermission = status.state; paintCopy(); };
        }, function () {});
    } catch (err) { /* a browser without the clipboard-write permission name */ }
    paintCopy();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindCopy);
  else bindCopy();

  /* ---- the Series drawer's Export tab (ADR 0134 d9, #541) ---------------
   * Every control is read at the click and sent as one ws_series_export
   * {cid, iid, action (copy | download | code | record), what, format, name,
   * header, request}; R captures the card and runs one export job for it
   * (export_session.R). Copy values opens a copy request (text/plain, label
   * feedback, #610) and sends its id as request; R's vets-copy settles it.
   * After a copy the button reads its data-copied-label for data-copied-ms,
   * as Copy PNG does. The segments are plain radios; the rest of the file's
   * name in the name box follows the chosen format by the File boxes' one
   * mechanism (data-save-follow, below). */
  window.vetsSeriesExport = function (button, action) {
    var root = up(button, '[data-series-export]');
    if (!root) return;
    var checked = function (name) {
      var input = root.querySelector('input[name="' + name + '"]:checked');
      return input ? input.value : null;
    };
    var name = root.querySelector('#series_export_name');
    var header = root.querySelector('#series_export_header');
    var payload = {cid: root.getAttribute('data-collection-id'), iid: root.getAttribute('data-instance-id'),
      action: action, what: checked('series_export_what'), format: checked('series_export_format'),
      name: name ? name.value : '', header: !!header && header.getAttribute('aria-checked') === 'true'};
    if (action === 'copy') payload.request = copyOpen('text/plain', 'label', 'series:' + payload.iid);
    vetsEvent('ws_series_export', payload);
  };
  /* ---- #586 the Save drawer Data tab's Copy values (ADR 0136 d5) ---------
   * One ws_data_copy {job, generation, include_hidden, request}: a copy
   * request (text/plain, toast feedback, #610) opened in the click; R's
   * vets-copy, today's Copy TSV text for the open review, settles it. */
  window.vetsDataCopy = function (button, job, generation) {
    var form = up(button, '#ws_data_form');
    if (!form) return;
    var hidden = form.querySelector('#ws_data_hidden');
    var request = copyOpen('text/plain', 'toast', null);
    vetsEvent('ws_data_copy', {job: job, generation: generation, include_hidden: !!(hidden && hidden.checked),
      request: request});
  };
  /* ---- end #586 ------------------------------------------------------------ */

  // The shell ships the host inside the notice area (#vets_notices, ui_shell.R);
  // one is created only when a page lacks it.
  function toastHost() {
    var host = document.getElementById('vets_toasts');
    if (!host) {
      host = document.createElement('div');
      host.id = 'vets_toasts';
      host.className = 'vets-toasts';
      host.setAttribute('aria-live', 'polite');
      document.body.appendChild(host);
    }
    return host;
  }
  // kind: info (default) | ok | warn | error. opts.undo adds an Undo button
  // that sends the Undo event directly; opts.ms overrides the 4s timeout.
  // opts.sticky (export failures, #275) sets no timer at all and adds a
  // Dismiss control; every other toast keeps its timeout.
  window.vetsToast = function (text, kind, opts) {
    opts = opts || {};
    var host = toastHost();
    var t = document.createElement('div');
    t.className = 'vets-toast vets-toast--' + (kind || 'info') + (opts.sticky ? ' vets-toast--sticky' : '');
    t.setAttribute('role', opts.sticky ? 'alert' : 'status');
    var span = document.createElement('span');
    span.textContent = text;
    t.appendChild(span);
    if (opts.undo) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'vets-toast-action';
      b.textContent = 'Undo';
      b.onclick = function () { vetsEvent('ws_undo', Date.now()); remove(); };
      t.appendChild(b);
    }
    if (opts.sticky) {
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'vets-toast-action vets-toast-dismiss';
      d.setAttribute('aria-label', 'Dismiss notice');
      d.textContent = '\u00d7';
      d.onclick = remove;
      t.appendChild(d);
    }
    host.appendChild(t);
    var timer = opts.sticky ? null : setTimeout(remove, opts.ms || (opts.undo ? 6000 : 4000));
    function remove() {
      if (timer !== null) clearTimeout(timer);
      if (t.parentNode) t.parentNode.removeChild(t);
    }
    t.addEventListener('click', function (e) { if (e.target === t || e.target === span) remove(); });
  };

  window.vetsConfirmImport = function () {
    var form = document.getElementById('ws_import_form');
    if (!form) return;
    var mode = form.querySelector('input[name="ws_import_mode"]:checked');
    vetsEvent('ws_import_confirm', {
      generation: Number(form.getAttribute('data-import-generation')),
      mode: mode ? mode.value : null
    });
  };

  /* ---- autosave / restore ---------------------------------------------- */

  var autosaveKey = null;

  function readAutosave(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || typeof obj.spec !== 'string') return null;
      return obj;
    } catch (x) { return null; }
  }

  function bindMessages() {
    if (!window.Shiny || !Shiny.addCustomMessageHandler) return;

    Shiny.addCustomMessageHandler('vets-reveal-card', function (m) {
      if (window.vetsRevealCard) window.vetsRevealCard(m);
    });
    $(document).on('shiny:disconnected', function () {
      if (window.vetsRevealCard) window.vetsRevealCard(null);
    });

    Shiny.addCustomMessageHandler('vets-init', function (m) {
      autosaveKey = m && m.key ? m.key : null;
      if (autosaveKey) {
        var saved = readAutosave(autosaveKey);
        if (saved) vetsEvent('vets_restore_candidate', { token: m.token, at: saved.at || '', spec: saved.spec });
      }
    });
    Shiny.addCustomMessageHandler('vets-autosave', function (m) {
      if (!m || !m.key) return;
      try {
        localStorage.setItem(m.key, JSON.stringify({ spec: m.spec, title: m.title, at: m.at }));
      } catch (x) { /* quota / private mode: autosave is best effort */ }
    });
    Shiny.addCustomMessageHandler('vets-clear-autosave', function (m) {
      var key = (m && m.key) || autosaveKey;
      if (!key) return;
      try { localStorage.removeItem(key); } catch (x) { /* noop */ }
    });
    // Opens or closes the column and says whether the opening takes focus
    // (the drawer gate's open observation); the chrome is vets-chrome's.
    Shiny.addCustomMessageHandler('vets-drawer', function (m) {
      if (m && m.open) vetsOpenDrawer(m.focus); else vetsCloseDrawer(false);
    });
    // R's chrome facts (#485, ADR 0124): the drawer's kind and card,
    // the selection and the Layout drawer's target, painted through the pure
    // chromeAttributes. The card mark sits on the stable card container, which
    // head re-renders do not replace (ADR 0082).
    Shiny.addCustomMessageHandler('vets-chrome', function (m) {
      chromeFacts = m || null;
      paintChrome();
      if (window.vetsSyncLayoutChrome) window.vetsSyncLayoutChrome();
    });
    Shiny.addCustomMessageHandler('vets-toast', function (m) {
      if (m && m.text) vetsToast(m.text, m.kind || 'info', { undo: !!m.undo, ms: m.ms, sticky: !!m.sticky });
    });
    // R's one answer to a copy request (#610): the text, under the request's id.
    Shiny.addCustomMessageHandler('vets-copy', function (m) {
      if (m && typeof m.text === 'string') copyAnswer(m.text, m.request);
    });
    Shiny.addCustomMessageHandler('vets-dirty', function (m) {
      var dot = document.getElementById('ws_dirty');
      if (dot) dot.hidden = !(m && m.dirty);
      // The Save drawer's "Unsaved edits" (#583) follows while it shows.
      document.querySelectorAll('[data-save-dirty]').forEach(function (el) { el.hidden = !(m && m.dirty); });
    });
    // One native field's text, decided by R (the cleaned file name, #281).
    Shiny.addCustomMessageHandler('vets-field-value', function (m) {
      var el = document.getElementById(m && m.id);
      if (!el || typeof m.value !== 'string') return;
      el.value = m.value;
      window.vetsBoxEcho(el);   // a box (the Series label) holds R's value now (ADR 0148)
    });
    Shiny.addCustomMessageHandler('vets-box-result', function (m) { window.vetsBoxResult(m); });
    Shiny.addCustomMessageHandler('vets-cards-arrange', function (m) { arrangeCards(m || {}); });
    Shiny.addCustomMessageHandler('vets-active', function (m) {
      if (window.vetsRevealSelection) window.vetsRevealSelection(m && m.id);
    });
    // Explicit R-authored display edits supersede viewer zoom. Cosmetic edits
    // never send this message; no workspace or range state is kept in JS.
    Shiny.addCustomMessageHandler('vets-chart-range', function (m) {
      var el = document.getElementById(m.id);
      var chart = el && jQuery(el).highcharts();
      if (!chart || !chart.xAxis[0]) return;
      chart.xAxis[0].setExtremes(m.min, m.max, false, false);
      if (m.min == null && m.max == null && m.selected != null && chart.rangeSelector) {
        chart.rangeSelector.clickButton(m.selected, false);
      }
      chart.redraw(false);
    });

    Shiny.addCustomMessageHandler('vets-chart-mutate', function (m) {
      var el = document.getElementById(m.id);
      var chart = el && jQuery(el).highcharts();
      if (!chart) return;
      var p = m.plan;
      if (p.chart && Object.keys(p.chart).length) chart.update(p.chart, false);
      (p.remove || []).forEach(function (id) { var s = chart.get(id); if (s) s.remove(false); });
      (p.add || []).forEach(function (s) { chart.addSeries(s, false); });
      (p.update || []).forEach(function (u) { chart.get(u.id).update(u.options, false); });
      chart.redraw(false);
    });
    Shiny.addCustomMessageHandler('vets-diag', function (m) {
      var a = app();
      if (!a || !m) return;
      if (window.vetsLayoutVersion) window.vetsLayoutVersion(m.version);
      for (var k in m) {
        if (Object.prototype.hasOwnProperty.call(m, k)) a.setAttribute('data-diag-' + k, String(m[k]));
      }
    });
  }

  /* ---- delegated listeners (bound once) -------------------------------- */

  function bind() {
    if (window.__vetsBound) return;
    window.__vetsBound = true;

    bindMessages();
    // Dismissal (Cancel, close, backdrop or Esc) retires only this confirmation.
    jQuery(document).on('hide.bs.modal', '#shiny-modal', function () {
      var plan = this.querySelector('[data-remove-generation]');
      if (plan) vetsEvent('ws_remove_cancel', {generation: Number(plan.getAttribute('data-remove-generation'))});
    });
    if (window.ResizeObserver && grid()) {
      // Observe layout only; Highcharts owns its chart instances and dimensions.
      var resize = new ResizeObserver(reflow);
      resize.observe(grid());
    }

    // Shiny lifecycle: the overlay on disconnect, and the card slots' renders.
    if (window.jQuery) {
      jQuery(document).on('shiny:disconnected', function () {
        var o = document.getElementById('vets_disconnected');
        if (o) o.hidden = false;
      });
      jQuery(document).on('shiny:value', function (e) {
        if (/-table$/.test(e.name) && up(e.target, '.ws-card')) rememberTable(e.target);
        // A card's body slot is about to be replaced (Chart|Table): release
        // the chart it holds before Shiny swaps the markup.
        if (/-body$/.test(e.name) && up(e.target, '.ws-card')) { releaseCharts(e.target); return; }
        // A card's strip slot re-rendered: paint R's chrome facts on the new
        // chips (the selected one lights again; no client model).
        if (/-strip$/.test(e.name) && up(e.target, '.ws-card')) setTimeout(paintChrome, 0);
      });
    }

    // The drawer render sequence's steps this block owns (ADR 0147). Before
    // an output in the drawer is replaced: its open calendars close (they
    // would stay over a replaced box, #555's kind), and the drawer gate hears
    // that the panel or the formula sheet began to render, with the focus key
    // the focused control carries. The first open of a session renders only
    // after Shiny has loaded the panel's head dependencies, so no timer knows
    // when the form is there (#257): every pass reports what is drawn; a
    // slot's render lands a flush after the form, and a re-bound slot first
    // shows its cached value (#303, #375).
    window.vetsDrawerStep('rendering', 'calendars', function (r) { closeCalendars(r.output); });
    window.vetsDrawerStep('rendering', 'gate', function (r) {
      if (r.name === 'drawer_panel') drawerObserve({type: 'panel_render', focused: focusedKey(r.output)});
      else if (r.name === 'formula_sheet') drawerObserve({type: 'formula_render'});
    });
    window.vetsDrawerStep('rendered', 'gate', function (pass) { scanDrawer(pass.full ? null : pass.records); });
    // Before the frame paints, so a re-rendered popover never jumps.
    window.vetsDrawerStep('rendered', 'place_popover', function () {
      var popover = document.querySelector('#vets_drawer .vets-sheet--popover');
      if (popover) anchorPopover(popover);
    });
    window.vetsDrawerStep('rendered', 'paint_provenance', function () {
      var provenance = document.querySelector('#vets_drawer [data-card-sheet="provenance"]');
      if (provenance) openProvenanceText(provenance);
    });
    window.vetsDrawerStep('rendered', 'paint_dialog', dialogControls);
    window.vetsDrawerStep('rendered', 'focus', observeDrawn);

    // Menus: click outside closes every open <details> menu.
    document.addEventListener('click', function (e) {
      var inMenu = up(e.target, 'details.vets-menu');
      closeMenus(inMenu);
      // Blank canvas/card clicks clear the series highlight through R. Keep
      // selection while working in a dialog or using an editing/action control.
      // Whether a series is selected is read from the markup R's chrome facts
      // painted (#485), only so that a click with nothing selected sends
      // nothing (ADR 0083); R still decides.
      if (app() && !app().classList.contains('drawer-open') &&
          up(e.target, '#vets_canvas') &&
          !up(e.target, '.ws-chip, button, input, textarea, select, a, summary, [role="button"], [contenteditable], .highcharts-range-selector-group') &&
          app().hasAttribute('data-selected-iid') && app().getAttribute('data-selected-iid') !== '') {
        vetsEvent('ws_clear_selection', { at: Date.now() });
      }
    });
    // A field change goes through the gate (field_change): a reloading
    // picker's blank is dropped, and a picker's blank is looked at again a
    // microtask later (recheck), since Shiny's reload clears the value before
    // it clears the options (#303). A blank the user makes is then reported.
    // widget (#554): a date box's value that its own binding set (a jQuery
    // change or changeDate while its calendar is shut: Shiny's binding at
    // render, a cached render's value when a slot is re-bound), not a typed
    // date (a native event) or a pick from its open calendar.
    function dialogFieldChanged(e) {
      var el = e.target;
      if (!el.hasAttribute('data-dialog-field')) return;
      var widget = !!e.isTrigger && !!up(el, '.shiny-date-input, .shiny-date-range-input') &&
        openCalendarInputs(up(el, '.shiny-date-input, .shiny-date-range-input')).indexOf(el) < 0;
      drawerObserve({type: 'field_change', field: el.dataset.dialogField,
        picker: el.selectize ? el.id : null, blank: el.value === '', rechecked: !!e.vetsChecked,
        slot: slotOf(el), widget: widget}, {
        report: function () { reportField(el); },
        recheck: function () { dialogFieldChanged({ target: el, vetsChecked: true }); }
      });
    }
    function reportField(el) {
      dialogControls();
      var value = dialogValues();
      if (!value) return;
      // A change patches only this control; submit still captures the full form.
      // This prevents stale dependent controls from overwriting an R-side reset.
      // The Add to control is outside the source form but uses the same event.
      var key = el.dataset.dialogField, fields = {};
      fields[key] = drawerReportRule.value(observeControl(el));
      value.fields = fields;
      vetsEvent('sd_change', value);
    }
    document.addEventListener('input', dialogFieldChanged);
    jQuery(document).on('change changeDate', '[data-dialog-field]', dialogFieldChanged);
    // A form switch (Append history, ADR 0092) flips as every switch does
    // (vets:switch, ADR 0148) and reports like any other field; R re-renders
    // it with the draft's state.
    jQuery(document).on('vets:switch', '#vets_drawer [data-dialog-field]', function () {
      dialogFieldChanged({ target: this });
    });

    // A native control R lists as navigating (ui_events.R NAVIGATING_CONTROLS)
    // snapshots the open drawer before its own handler runs.
    document.addEventListener('click', function (e) {
      var declared = navigatesDeclaration();
      if (declared && declared.click && up(e.target, declared.click)) snapshotDrawer();
    }, true);
    document.addEventListener('change', function (e) {
      var declared = navigatesDeclaration();
      if (declared && declared.change && up(e.target, declared.change)) snapshotDrawer();
    }, true);

    // A select keeps its own DOM and binding. Fixed positioning lets its menu
    // cross the scroll column, capped to the viewport and opening upward if needed.
    // "name -- description" labels render as the identifier in monospace and
    // the description as secondary text (ADR 0091); the label text itself is
    // unchanged, so search and the underlying select see the same strings.
    function renderNameDesc(kind) {
      return function (data, escape) {
        var label = String(data.label == null ? data.value : data.label), at = label.indexOf(' -- ');
        if (at < 0) return '<div class="' + kind + '">' + escape(label) + '</div>';
        return '<div class="' + kind + '"><span class="vets-opt-name">' + escape(label.slice(0, at)) + '</span>' +
          '<span class="vets-opt-desc">' + escape(label.slice(at + 4)) + '</span></div>';
      };
    }
    function bindDrawerMenus() {
      each(document.querySelectorAll('#vets_drawer select'), function (el) {
        var select = el.selectize;
        if (!select || select.vetsColumnMenu) return;
        select.vetsColumnMenu = true;
        select.settings.render.option = renderNameDesc('option');
        select.settings.render.item = renderNameDesc('item');
        if (el.dataset.newCardPrefix != null) {
          // A typed name names a new card: its value is R's prefix and the
          // name (series_dialog.R's codec); R names the card on Add.
          var prefix = el.dataset.newCardPrefix;
          select.settings.create = function (input) { return { value: prefix + input, label: input }; };
          select.settings.render.option_create = function (data, escape) {
            return '<div class="create">New card <span class="vets-opt-name">' + escape(data.input) + '</span></div>';
          };
        }
        select.clearCache();
        select.items.slice().forEach(function (value) { select.removeItem(value, true); select.addItem(value, true); });
        select.positionDropdown = function () {
          var rect = select.$control[0].getBoundingClientRect();
          // A short select in a row marked data-menu-anchor (the model row's
          // Statistic) opens a menu as wide as that row, not as its control.
          var anchor = el.closest('[data-menu-anchor]');
          var span = anchor ? anchor.getBoundingClientRect() : rect;
          var margin = 8, below = window.innerHeight - rect.bottom - margin;
          var above = rect.top - margin, upward = below < 200 && above > below;
          var height = Math.max(0, Math.min(300, upward ? above : below));
          // The menu is exactly as wide as its control, so it never crosses
          // the drawer's edge; descriptions wrap on their own indented line.
          var width = Math.min(span.width, window.innerWidth - 2 * margin);
          var left = Math.max(margin, Math.min(span.left, window.innerWidth - width - margin));
          select.$dropdown.css({position: 'fixed', width: width, left: left,
            top: upward ? 'auto' : rect.bottom,
            bottom: upward ? window.innerHeight - rect.top : 'auto', maxHeight: height});
          select.$dropdown_content.css({maxHeight: Math.max(0, height - 2)});
        };
        select.on('dropdown_open', select.positionDropdown);
        if (el.id === 'sd_database' || el.id === 'sd_mnemonic') bindCatalogPicker(select, el.id);
      });
    }
    // The Namespace and Name pickers' rows arrive ranked by R (catalog_search.R, ADR 0090).
    // Every reply replaces the loaded options, so a row loaded for an earlier
    // query cannot keep its old place and a backspace asks R again instead of
    // reusing a cached search; the selected option stays so Edit keeps its
    // value. The count line above the field is the reply's own summary.
    function bindCatalogPicker(select, id) {
      // Selectize asks the loader only for a non-empty query by default, so
      // deleting a search back to nothing would keep the last reply's rows.
      // The empty query is a query too: R answers it with the first page.
      select.settings.shouldLoad = function () { return true; };
      // Shiny sets the picker's value once the first page of a reply arrives
      // (its server-side selectize protocol), and selectize's setValue takes
      // the control's nodes, the typing input among them, out of the document
      // and back, so a focused picker drops focus to <body> (#368). The gate
      // (picker_rebuilt) decides whether the picker takes it back.
      var element = select.$input[0], generation = panelGeneration();
      var setValue = select.setValue;
      select.setValue = function () {
        var input = select.$control_input[0], held = document.activeElement === input;
        var result = setValue.apply(select, arguments);
        var active = document.activeElement;
        drawerObserve({type: 'picker_rebuilt', held: held,
          active: active === input ? 'picker' : (!active || active === document.body ? 'body' : 'other')},
          {select: select});
        return result;
      };
      // Closing the menu (a choice, Escape, or leaving the field) wipes the
      // typed text without asking the loader, which would leave the last
      // reply's rows and count behind. With the text gone, ask for the whole
      // catalog again so the next opening starts from the first page.
      select.on('type', function (query) { select.vetsQuery = query; });
      select.on('dropdown_close', function () {
        if (!select.vetsQuery || select.$control_input.val()) return;
        select.vetsQuery = '';
        select.lastValue = '';
        select.onSearchChange('');
      });
      select.on('blur', function () {
        if (!select.vetsQuery) return;
        select.vetsQuery = '';
        select.lastValue = '';
        select.onSearchChange('');
      });
      // Only Shiny's server-side reload clears a picker's options (#303): from
      // here until the reply is in, the picker's blank is not the user's. Both
      // observations carry the generation of the panel the picker was bound
      // in, so a late event from a previous opening's picker changes nothing.
      var clearOptions = select.clearOptions;
      select.clearOptions = function () {
        if (element.isConnected) drawerObserve({type: 'picker_reload', picker: id, generation: generation});
        return clearOptions.apply(select, arguments);
      };
      select.on('load', function (rows) {
        // Shiny sets the reloaded value right after this event, or never when
        // the list failed; either way the picker has settled once it returns.
        var count = rows ? rows.length : null;
        setTimeout(function () {
          if (element.isConnected) drawerObserve({type: 'picker_loaded', picker: id, generation: generation, rows: count});
        }, 0);
        rows = rows || [];
        Object.keys(select.options).forEach(function (key) {
          if (select.items.indexOf(key) === -1) select.removeOption(key, true);
        });
        select.loadedSearches = {};
        select.addOption(rows);
        select.refreshOptions(select.isFocused && !select.isInputHidden);
        var summary = document.getElementById(id + '_summary');
        if (summary) summary.textContent = rows.length ? rows[0].summary : '';
      });
    }
    function placeDrawerMenus() {
      bindDrawerMenus();
      each(document.querySelectorAll('#vets_drawer select'), function (el) {
        if (el.selectize && el.selectize.isOpen) el.selectize.positionDropdown();
      });
    }
    // The drawer render sequence's menus step (ADR 0147): every pass binds
    // the pickers a render drew (bindDrawerMenus skips a bound one).
    window.vetsDrawerStep('rendered', 'menus', bindDrawerMenus);
    window.addEventListener('resize', placeDrawerMenus);
    document.addEventListener('scroll', placeDrawerMenus, true);

    // Escape ladder, 'dropdown': an open dropdown closes alone; the next Esc
    // reaches the rung below (ahead of Selectize and the calendar, which never
    // see it). A dropdown is an open Selectize list, an open calendar (a date
    // box's datepicker: #555, it would stay over the canvas when the drawer
    // closed) or an open <details> menu. The innermost goes first: a menu
    // holding the box being edited (the Colour popover's Custom box) waits
    // until the box rung has reverted and left it (ADR 0148).
    function openSelectize() {
      return Array.from(document.querySelectorAll('select')).find(function (el) {
        return el.selectize && el.selectize.isOpen;
      });
    }
    function openMenus() {
      var a = document.activeElement, box = window.vetsBoxEditing(a) ? a : null;
      return Array.from(document.querySelectorAll('details.vets-menu[open]')).filter(function (menu) {
        return !box || !menu.contains(box);
      });
    }
    window.vetsEscapeRung('dropdown', function () {
      if (!app() || document.getElementById('shiny-modal')) return false;
      return !!openSelectize() || openCalendarInputs(document).length > 0 || openMenus().length > 0;
    }, function () {
      var open = openSelectize(), calendars = openCalendarInputs(document), menus = openMenus();
      if (open) open.selectize.close();
      else if (calendars.length) closeCalendars(document);
      else menus[menus.length - 1].removeAttribute('open');
    });

    // Escape ladder, 'canvas_text' (#316's slot): the active page text edit is
    // cancelled. A card's title, note and axis titles on the canvas are boxes,
    // which the box rung reverts (ADR 0148).
    window.vetsEscapeRung('canvas_text', function (e) {
      var a = app();
      if (e.defaultPrevented || !a || a.classList.contains('ws-dnd-active') ||
          document.getElementById('shiny-modal')) return false;
      return !!(window.vetsPageTextActive && window.vetsPageTextActive());
    }, function () {
      if (window.vetsCancelPageText) window.vetsCancelPageText();
    });

    // Escape ladder, 'drawer': the last rung closes the formula sheet, else an
    // open card drawer sheet (ADR 0132), else the open drawer. A box in the
    // drawer (the Series drawer's label among them, ADR 0134 d3) is the box
    // rung's first (ADR 0148).
    window.vetsEscapeRung('drawer', function (e) {
      var a = app();
      return !e.defaultPrevented && !!a && a.classList.contains('drawer-open') &&
        !document.getElementById('shiny-modal');
    }, function () {
      // The formula sheet over the drawer body closes first (#564).
      if (window.vetsFormulaSheetEscape && window.vetsFormulaSheetEscape()) return;
      var sheet = document.querySelector('#vets_drawer [data-card-sheet]');
      var panel = sheet && up(sheet, '[data-card-drawer]');
      if (panel) vetsCardSheet(panel.getAttribute('data-card-drawer'), null);
      else vetsCloseDrawer('escape');
    });

    // Keyboard map. Escape is not here: it belongs to the ladder above.
    document.addEventListener('keydown', function (e) {
      if (e.defaultPrevented || document.getElementById('shiny-modal')) return;
      var t = e.target;

      if (app().classList.contains('drawer-open') && !document.getElementById('shiny-modal')) {
        if (e.key === 'Enter' && !e.defaultPrevented && (t.id === 'sd_mnemonic' || t.id === 'sd_mnemonic-selectized')) {
          var nameSelect = document.getElementById('sd_mnemonic');
          if (nameSelect && nameSelect.selectize && nameSelect.selectize.isOpen) return;
          // The gate holds it while the Name is unsettled, as Add/Apply (#303).
          e.preventDefault(); vetsSubmitSeries(false); return;
        }

      }

      if (mod(e) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (!vetsFocusSearch()) clickButton('ws_search_focus');
        return;
      }

      if (isEditable(t)) return;                    // typing elsewhere: leave the keys alone

      if (mod(e) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        clickButton(e.shiftKey ? 'ws_redo' : 'ws_undo');
        return;
      }
      if (mod(e) || e.altKey) return;
      if (e.key === '[') { sendKey('vintage_prev'); }
      else if (e.key === ']') { sendKey('vintage_next'); }
      else if (e.key === 'd' || e.key === 'D') { sendKey('duplicate_prev'); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { sendKey('remove'); }
    });

    bindDragDrop();
    bindFileDrop();
  }

  /* ---- drag/drop: copy a chip between cards (ADR 0003) ------------------ */

  function bindDragDrop() {
    var dragging = null;                            // the ephemeral in-flight drag

    function clearHot() { each(document.querySelectorAll('.ws-drop-hover'), function (n) { n.classList.remove('ws-drop-hover'); }); }
    function showNewCardTarget(show) {
      var strip = document.getElementById('ws_dropzone_new');
      if (strip) strip.hidden = !show;
    }
    function endDrag() {
      dragging = null;
      showNewCardTarget(false);
      clearHot();
      var a = app();
      if (a) a.classList.remove('ws-dnd-active');
      each(document.querySelectorAll('.ws-dnd-source'), function (n) { n.classList.remove('ws-dnd-source'); });
    }
    // A zone accepts a COPY unless it is the chip's own card (a self-copy is
    // a dedup no-op); the '__new__' zone always accepts.
    function validTarget(zone) {
      return !!zone && !!dragging && zone.getAttribute('data-drop-target') !== dragging.from;
    }
    function isFileDrag(e) {
      var types = e.dataTransfer && e.dataTransfer.types;
      if (!types) return false;
      for (var i = 0; i < types.length; i++) if (types[i] === 'Files') return true;
      return false;
    }

    document.addEventListener('dragstart', function (e) {
      var chip = up(e.target, '.ws-chip[data-instance-id]');
      if (!chip) return;
      showNewCardTarget(true);
      dragging = { instanceId: chip.getAttribute('data-instance-id'), from: chip.getAttribute('data-collection-id') };
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'copy';
        try { e.dataTransfer.setData('text/plain', dragging.instanceId); } catch (x) { /* noop */ }
      }
      var a = app();
      if (a) a.classList.add('ws-dnd-active');
      var src = up(chip, '.ws-card');
      if (src) src.classList.add('ws-dnd-source');
    });

    document.addEventListener('dragover', function (e) {
      if (!dragging || isFileDrag(e)) return;
      var zone = up(e.target, '[data-drop-target]');
      if (!validTarget(zone)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      clearHot();
      zone.classList.add('ws-drop-hover');
    });

    document.addEventListener('drop', function (e) {
      if (!dragging || isFileDrag(e)) return;
      var zone = up(e.target, '[data-drop-target]');
      if (!validTarget(zone)) { endDrag(); return; }
      e.preventDefault();
      vetsCopySeries(dragging.from, dragging.instanceId, zone.getAttribute('data-drop-target'));
      endDrag();
    });

    document.addEventListener('dragend', endDrag);
    // Escape ladder, 'chip_drag'.
    window.vetsEscapeRung('chip_drag', function () { return !!dragging; }, endDrag);
  }

  /* ---- file drop: a .yaml on the canvas opens it ------------------------ */

  function bindFileDrop() {
    var depth = 0;                                  // dragenter/leave nesting counter

    function isFileDrag(e) {
      var types = e.dataTransfer && e.dataTransfer.types;
      if (!types) return false;
      for (var i = 0; i < types.length; i++) if (types[i] === 'Files') return true;
      return false;
    }
    function setOver(on) {
      var a = app();
      if (a) a.classList.toggle('vets-file-over', on);
    }

    document.addEventListener('dragenter', function (e) {
      if (!isFileDrag(e)) return;
      depth++;
      setOver(true);
    });
    document.addEventListener('dragleave', function (e) {
      if (!isFileDrag(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setOver(false);
    });
    document.addEventListener('dragover', function (e) {
      if (!isFileDrag(e)) return;
      e.preventDefault();                           // allow the drop anywhere on the page
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    });
    document.addEventListener('drop', function (e) {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      depth = 0;
      setOver(false);
      var files = e.dataTransfer.files;
      if (!files || !files.length) return;
      var f = files[0];
      if (!/\.ya?ml$/i.test(f.name)) { vetsToast('Drop a .yaml project file', 'warn'); return; }
      var reader = new FileReader();
      reader.onload = function () { vetsEvent('vets_dropped_spec', { name: f.name, text: String(reader.result || '') }); };
      reader.onerror = function () { vetsToast('Could not read ' + f.name, 'error'); };
      reader.readAsText(f);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
// WF17a: consume an R plan; ephemeral render jobs contain no editable workspace.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var active = null;
  function element(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(e);
    return e;
  }
  // Plan shapes (exhibit_typeset.R) arrive finished: absolute coordinates and
  // resolved colours. Serialise each record's fields; add no rule here.
  function shape(parent, s) {
    if (s.shape === 'line') {
      var attrs = {x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, stroke: s.stroke, 'stroke-width': s.stroke_width};
      if (s.dash_array) attrs['stroke-dasharray'] = s.dash_array;
      element('line', attrs, parent);
    } else if (s.shape === 'rect') element('rect', {x: s.x, y: s.y, width: s.width, height: s.height, fill: s.fill}, parent);
    else if (s.shape === 'circle') element('circle', {cx: s.cx, cy: s.cy, r: s.r, fill: s.fill}, parent);
  }
  function shapes(parent, list) { (list || []).forEach(function (s) {shape(parent, s);}); }
  function textBlock(parent, block) {
    if (!block || !block.lines || !block.lines.length) return;
    var t = element('text', {'font-size': block.size, 'font-style': block.italic ? 'italic' : 'normal', 'font-weight': block.bold ? 'bold' : 'normal',
      fill: block.color, 'text-anchor': block.anchor || 'start', 'xml:space': 'preserve', 'data-text-width': block.width}, parent);
    block.lines.forEach(function (line, i) {
      var span = element('tspan', {x: block.x, y: block.y + block.size + i * block.line_height}, t);
      span.textContent = line.replace(/\n/g, '');
    });
    shapes(parent, block.shapes);
  }
  // The chunk's shapes (header keys, header and row rules) paint under its cells.
  function tableBlock(parent, table) {
    shapes(parent, table.shapes);
    table.header.forEach(function (cell) {textBlock(parent,cell);});
    table.rows.forEach(function (row,i) {
      var g = element('g',{'data-table-row':table.row_ids[i]},parent);
      row.cells.forEach(function (cell) {textBlock(g,cell);});
    });
  }
  // The boot smoke replays PLAN_SHAPE_FIXTURE through these; TABLE_CELL_FIXTURE
  // replays through the module's formatCell in node (ADR 0102).
  window.vetsDrawBlock = textBlock;
  window.vetsDrawTable = tableBlock;
  function nextFrame() { return new Promise(function (resolve) {setTimeout(resolve,0);}); }
  Shiny.addCustomMessageHandler('vets-measure-exhibit', async function (request) {
    await document.fonts.ready;
    var ctx = document.createElement('canvas').getContext('2d');
    var result = {job:request.job};
    (request.font_styles || ['normal','bold']).forEach(function (weight) {
      ctx.font = weight + ' 100px ' + request.font_family;
      result[weight] = request.glyphs.map(function (glyph) {return ctx.measureText(glyph === '\n' ? '' : glyph).width/100;});
    });
    vetsEvent('vets_exhibit_metrics',result);
  });
  // One handler per message: the composer's job and a live capture the canvas gate holds (#451).
  Shiny.addCustomMessageHandler('vets-cancel-composition', function (message) {
    if (active && active.id === message.job) active.cancelled = true;
    if (window.vetsCancelCapture) window.vetsCancelCapture(message.job);
  });
  Shiny.addCustomMessageHandler('vets-compose-exhibit', async function (message) {
    if (active) active.cancelled = true;
    var job = {id:message.job,cancelled:false}; active = job;
    var start = performance.now(), renderMs = 0, pages = [], failures = [];
    var stage = document.createElement('div');
    stage.style.cssText = 'position:absolute;left:-20000px;top:0;';
    stage.setAttribute('aria-hidden','true');stage.className='vets-composition-stage';
    document.body.appendChild(stage);
    try {
      var plan = message.plan;
      for (var page of plan.pages) {
        await nextFrame(); if (job.cancelled) return;
        var size = page.size || plan.page;
        var svg = element('svg',{xmlns:NS,width:size.width,height:size.height,
          viewBox:'0 0 '+size.width+' '+size.height,'data-page':page.number,
          'font-family':plan.font_family},stage);
        element('rect',{width:size.width,height:size.height,fill:plan.theme.page_color},svg);
        textBlock(svg,page.header);textBlock(svg,page.subtitle);textBlock(svg,page.stamp);textBlock(svg,page.footnote);textBlock(svg,page.notice);textBlock(svg,page.page_number);textBlock(svg,page.timestamp);
        for (var slot of page.slots) {
          await nextFrame(); if (job.cancelled) return;
          var group = element('g',{'data-card-id':slot.card_id, transform:'translate('+slot.x+' '+slot.y+') scale('+(slot.scale || 1)+') translate('+(-slot.x)+' '+(-slot.y)+')'},svg);
          textBlock(group,slot.title);textBlock(group,slot.footnote);
          (slot.labels || []).forEach(function (label) {textBlock(group,label);});
          if (slot.view === 'table') { tableBlock(group,slot.table); continue; }
          var t = performance.now();
          var rendered = window.vetsRenderCards({job:job.id,cards:[{card_id:slot.card_id,
            width:slot.chart.width,height:slot.chart.height,options:slot.options}]});
          renderMs += performance.now()-t;
          if (rendered.error) {
            failures.push({card_id:slot.card_id,error:rendered.error});
            var warning = element('text',{x:slot.chart.x+8,y:slot.chart.y+20,'font-size':plan.theme.label_size,fill:plan.theme.error_color,'data-render-error':slot.card_id},group);
            warning.textContent = 'Incomplete result: chart rendering failed ('+slot.card_id+').';
          } else {
            var doc = new DOMParser().parseFromString(rendered.cards[0].svg,'image/svg+xml');
            if (doc.querySelector('parsererror')) throw Error('Invalid chart SVG');
            var chart = document.importNode(doc.documentElement,true);
            chart.setAttribute('x',slot.chart.x);chart.setAttribute('y',slot.chart.y);
            chart.setAttribute('data-chart-svg',slot.card_id);group.appendChild(chart);
          }
        }
        // Verify actual installed-font advances before accepting any page.
        svg.querySelectorAll('text[data-text-width]').forEach(function (text) {
          Array.from(text.children).forEach(function (span) {
            if (span.getComputedTextLength() > Number(text.dataset.textWidth)+0.5) throw Error('Text exceeds its planned width: '+span.textContent);
          });
        });
        pages.push(new XMLSerializer().serializeToString(svg));
        svg.remove();
      }
      if (!job.cancelled) vetsEvent('vets_composed_exhibit',{job:job.id,pages:pages,failures:failures,
        timing:{render_ms:Math.round(renderMs),total_ms:Math.round(performance.now()-start)}});
    } catch (e) {
      if (!job.cancelled) vetsEvent('vets_composed_exhibit',{job:job.id,error:String(e.message || e)});
    } finally {
      stage.remove();if(active===job) active=null;
    }
  });
})();

// The export roots' close; R owns the staged forms, and the drawer report
// (vetsDialogReport, ADR 0123) reads their fields by R's table.
(function () {
  document.addEventListener('click', function (event) {
    var button = event.target.closest('#vets_drawer [data-dialog-close]');
    if (!button) return;
    var section = button.closest('[data-export-section]');
    var root = section && section.querySelector('[data-kept-dialog]');
    if (!root) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (button.dataset.dialogClose !== 'commit') window.vetsCloseDrawer(button.dataset.dialogClose);
    else close(root, 'commit');
  }, true);
  function close(root, reason) {
    vetsEvent('ws_dialog_close', window.vetsDialogReport(root, reason));
  }
  // Every File box in the drawer column (the Save drawer's, #583, ADR 0136; a
  // card Export sheet's; the Series drawer Export tab's; one mechanism, ADR
  // 0141): an element that follows a choice carries data-save-follow (the
  // radio group's name) and data-save-map (R's text for each value: a file
  // ending, the Exhibit tab's note); the checked value's text is copied
  // across, so the client knows no kind or format.
  document.addEventListener('change', function (event) {
    var name = event.target && event.target.name;
    var drawer = name && event.target.closest && event.target.closest('#vets_drawer');
    if (!drawer) return;
    drawer.querySelectorAll('[data-save-follow]').forEach(function (el) {
      if (el.getAttribute('data-save-follow') !== name) return;
      var map;
      try { map = JSON.parse(el.getAttribute('data-save-map') || '{}'); } catch (x) { return; }
      var chosen = drawer.querySelector('input[name="' + name + '"]:checked');
      if (chosen && Object.prototype.hasOwnProperty.call(map, chosen.value)) el.textContent = map[chosen.value];
      else if (chosen) el.textContent = '';
    });
  });
  // Bootstrap ignores hide() while a modal is still fading in, so a removeModal
  // that follows confirmation within the fade would leave the dialog open.
  // Re-issue the hide once it has shown.
  // The flag is the pending effect of one Shiny message, not a model of anything.
  var removePending = false;
  jQuery(document).on('shiny:message', function (event) {
    var modal = event.message && event.message.modal;
    if (modal) removePending = modal.type === 'remove';
  });
  jQuery(document).on('shown.bs.modal', '#shiny-modal', function () {
    if (!removePending) return;
    removePending = false;
    var instance = window.bootstrap && window.bootstrap.Modal.getInstance(this);
    if (instance) instance.hide(); else jQuery(this).modal('hide');
  });
})();

// Fit live cards and sheets to their canvas.
(function () {
  window.vetsFitExhibitCards = function () {
    document.querySelectorAll('.ws-exhibit-sheet').forEach(function(sheet){
      sheet.querySelectorAll('.ws-card').forEach(function(card){
        var inner=card.querySelector('.ws-card-inner'); if(!inner) return;
        // Fill screen already counts as formatted. Retain its inner zoom, using
        // logical card dimensions so a sheet zoom never typesets its text again.
        // Auto stays unformatted, with the same card typography at either width.
        inner.style.zoom=window.vetsCanvasRules.cardZoom(sheet.classList.contains('is-formatted'),card.clientWidth,card.clientHeight);
      });
    });
  };
  // Pages fit the canvas as if the drawer column were open (ADR 0078), so
  // opening or closing a drawer never changes a page's size or zoom. At rest
  // the collapsed column is counted out here, not reserved as padding: the
  // canvas the analyst sees runs to the window's edge, and the view may use it
  // (ADR 0088).
  window.vetsCanvasLayoutWidth=function() {
    var canvas=document.getElementById('vets_canvas'); if(!canvas) return 0;
    var a=document.getElementById('vets_app'),column=0;
    if(a && !a.classList.contains('drawer-open'))
      column=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vets-drawer-w'))||320;
    return canvas.clientWidth-column;
  };
  // The canvas view (ADR 0088): the analyst's zoom and side-by-side choice.
  // A preference of this browser, kept in localStorage under CANVAS_VIEW's key;
  // never workspace state, never sent to R. `rules` is CANVAS_VIEW as the
  // view control carries it. The view is a scale transform on top of the fit's
  // CSS zoom, never more zoom: zoom lays a sheet out again with rescaled text
  // metrics, which moved card bodies by pixels, resized every chart and could
  // change a table's row count. A transform only paints, so the view changes no
  // layout, no chart, no table and no export (the capture lifts it).
  var view={zoom:1,side_by_side:false}, rules=null, footprints=null;
  function viewRules() {
    if(rules) return rules;
    var bar=document.getElementById('vets_canvas_view');
    try { rules=bar?JSON.parse(bar.dataset.canvasView):null; } catch(x) { rules=null; }
    return rules;
  }
  // Negative (or positive) margins make the flow reserve the scaled size, so
  // pages wrap and the canvas scrolls by what is drawn. offset* sizes are the
  // sheet's own, before zoom and transform, as the margins are.
  function footprint(sheet) {
    var s=sheet.__vetsViewScale||1;
    sheet.style.marginRight=s===1?'':(s-1)*sheet.offsetWidth+'px';
    sheet.style.marginBottom=s===1?'':(s-1)*sheet.offsetHeight+'px';
  }
  function scaleSheet(sheet,s) {
    sheet.__vetsViewScale=s;
    sheet.style.transform=s===1?'':'scale('+s+')';
    sheet.style.transformOrigin=s===1?'':'0 0';
    footprint(sheet);
    // Auto's height follows its content, so its footprint follows its size.
    if(!footprints && window.ResizeObserver) footprints=new ResizeObserver(function(entries){
      entries.forEach(function(entry){ footprint(entry.target); });
    });
    if(footprints) footprints.observe(sheet);
  }
  // The capture reads geometry at the fit, as if no view were applied. It is
  // synchronous, so nothing is painted between lifting and restoring.
  window.vetsCanvasViewLift=function() {
    var lifted=Array.from(document.querySelectorAll('.ws-exhibit-sheet')).filter(function(sheet){
      return !!sheet.style.transform;
    }).map(function(sheet){ var t=sheet.style.transform; sheet.style.transform=''; return [sheet,t]; });
    return function(){ lifted.forEach(function(l){ l[0].style.transform=l[1]; }); };
  };
  function fitSheet() {
    var canvas=document.getElementById('vets_canvas'); if(!canvas) return;
    var canvasW=window.vetsCanvasLayoutWidth(), v=viewRules();
    var plain=!v || (view.zoom===1 && !view.side_by_side), seen=null;
    document.querySelectorAll('.ws-exhibit-sheet').forEach(function(sheet){
      var fixed=sheet.__vetsFillScreenFixed; if(!fixed) return;
      // The view draws in the canvas the analyst sees; a pixel of slack, so
      // rounding never wraps a row's last page.
      seen=canvas.clientWidth-fixed.padding_x-1;
      var fit=window.vetsFillScreenFit(canvasW,canvas.clientHeight,fixed),zoom,width;
      if(sheet.dataset.fill==='true') {
        sheet.style.zoom=zoom=fit.zoom; width=fit.width;
        sheet.style.width=fit.width+'px';
        sheet.style.height=fit.height+'px';
      } else if(!sheet.dataset.width) {
        // Auto has no prescribed height. Only its typesetting width and display
        // zoom follow Fill screen, and the width is pinned: the canvas is wider
        // than the layout width while no drawer is open. Under a view it also
        // keeps the canvas-high floor it has at Fit, so its scaled footprint
        // can sit in a row.
        sheet.style.width=fit.width+'px';
        sheet.style.height='';
        sheet.style.minHeight=plain?'':fit.height+'px';
        sheet.style.flex=plain?'':'none';
        sheet.style.zoom=zoom=fit.zoom; width=fit.width;
      } else {
        sheet.style.zoom=zoom=window.vetsCanvasRules.paperFit(canvasW,canvas.clientHeight,Number(sheet.dataset.width),Number(sheet.dataset.height),fixed);
        width=Number(sheet.dataset.width);
      }
      scaleSheet(sheet,plain?1:window.vetsCanvasViewSheetZoom(zoom,width,seen,view,v)/zoom);
    });
    // Side by side is a grid of this many columns: more as the view zooms
    // out, never fewer than at Fit as it zooms in (the row scrolls sideways).
    canvas.style.setProperty('--vets-view-across',v && seen!==null?window.vetsCanvasViewAcross(seen,view.zoom,v):2);
    window.vetsFitExhibitCards();
  }
  // The view control is built with the workspace page and fixed over the
  // rail's foot (ADR 0116), which arrives with the session's rail; it sits
  // just above the foot, and vets.css keeps it hidden until it is seated.
  function placeViewControl() {
    var bar=document.getElementById('vets_canvas_view'),foot=document.querySelector('.vets-rail-foot');
    if(!bar || !foot) return;
    var bottom=Math.round(window.innerHeight-foot.getBoundingClientRect().top)+'px';
    if(bar.style.getPropertyValue('--vets-view-rail-bottom')!==bottom) bar.style.setProperty('--vets-view-rail-bottom',bottom);
  }
  $(document).on('shiny:idle',placeViewControl);
  window.addEventListener('resize',placeViewControl);
  // The sheet nearest a point, and where on it the point falls, so a change of
  // view can put that spot back under the pointer (or the canvas's centre).
  function anchorAt(canvas,x,y) {
    var best=null,distance=Infinity;
    canvas.querySelectorAll('.ws-exhibit-sheet').forEach(function(sheet){
      var r=sheet.getBoundingClientRect(); if(!r.width || !r.height) return;
      var at=window.vetsCanvasRules.viewAnchor(r,x,y);
      if(at.distance<distance) {
        distance=at.distance;
        best={sheet:sheet,x:x,y:y,fx:at.fx,fy:at.fy};
      }
    });
    return best;
  }
  function restoreAnchor(canvas,a) {
    if(!a || !a.sheet.isConnected) return;
    var by=window.vetsCanvasRules.viewScroll(a.sheet.getBoundingClientRect(),a);
    canvas.scrollLeft+=by.left;
    canvas.scrollTop+=by.top;
  }
  function syncViewBar() {
    var bar=document.getElementById('vets_canvas_view'),v=viewRules(); if(!bar || !v) return;
    var text=window.vetsCanvasViewLabel(view.zoom);
    var label=bar.querySelector('[data-canvas-view-label]');
    if(label && document.activeElement!==label) label.value=text;
    // The toggle always reads the zoom, folded or not.
    var badge=bar.querySelector('[data-canvas-view-badge]');
    if(badge) badge.textContent=text;
    bar.querySelectorAll('[data-canvas-view-action]').forEach(function(button){
      var action=button.dataset.canvasViewAction;
      if(action==='out') button.disabled=view.zoom<=v.min;
      else if(action==='in') button.disabled=view.zoom>=v.max;
      else button.setAttribute('aria-pressed',String((action==='side')===view.side_by_side));
    });
  }
  // One change of view: coerce it, keep the anchor still, remember it, and let
  // the canvas's other chrome (text prompts, New page target, page in view)
  // remeasure through the scroll it already listens to. No window resize: the
  // charts' logical sizes did not change, so nothing is asked to redraw.
  // Chrome can keep painting a chart's SVG text where it was drawn before a
  // scale change (axis and plot-line labels, seen headless in about half the
  // runs; the DOM itself is right). Taking each chart's SVG out of layout and
  // back in one task re-lays its text with nothing painted in between. Once per
  // settled change, so a pinch pays it once.
  var relayTimer=0;
  function relayChartText() {
    clearTimeout(relayTimer);
    relayTimer=setTimeout(function(){
      document.querySelectorAll('#vets_canvas svg.highcharts-root').forEach(function(svg){
        svg.style.display='none'; svg.getBoundingClientRect(); svg.style.display='';
      });
    },120);
  }
  function setView(next,anchor) {
    var canvas=document.getElementById('vets_canvas'),v=viewRules(); if(!canvas || !v) return;
    next=window.vetsCanvasViewRead(next.zoom,next.side_by_side,v);
    if(next.zoom===view.zoom && next.side_by_side===view.side_by_side) { syncViewBar(); return; }
    var a=anchor?anchorAt(canvas,anchor.x,anchor.y):null;
    view=next;
    viewClasses(canvas);
    fitSheet(); restoreAnchor(canvas,a); syncViewBar();
    try { localStorage.setItem(v.key,JSON.stringify(view)); } catch(x) { /* private mode: best effort */ }
    canvas.dispatchEvent(new Event('scroll'));
    if(window.vetsSyncLayoutChrome) requestAnimationFrame(window.vetsSyncLayoutChrome);
    relayChartText();
  }
  // Side by side lays the sheets out in a grid.
  function viewClasses(canvas) {
    canvas.classList.toggle('is-side-by-side',view.side_by_side);
  }
  function restoreView() {
    var canvas=document.getElementById('vets_canvas'),v=viewRules(); if(!canvas || !v) return;
    var stored=null;
    try { stored=JSON.parse(localStorage.getItem(v.key)); } catch(x) { stored=null; }
    view=stored && typeof stored==='object' ?
      window.vetsCanvasViewRead(stored.zoom,stored.side_by_side,v) : {zoom:1,side_by_side:false};
    viewClasses(canvas);
    syncViewBar();
  }
  function viewCentre(canvas) {
    var r=canvas.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2};
  }
  document.addEventListener('click',function(e){
    var button=e.target.closest && e.target.closest('#vets_canvas_view [data-canvas-view-action]');
    var canvas=document.getElementById('vets_canvas'),v=viewRules();
    if(!button || !canvas || !v || button.disabled) return;
    var action=button.dataset.canvasViewAction;
    if(action==='in' || action==='out')
      setView({zoom:window.vetsCanvasViewStep(view.zoom,action==='in'?1:-1,v),side_by_side:view.side_by_side},viewCentre(canvas));
    else {
      // Keep the page at the top of the canvas at the top.
      var r=canvas.getBoundingClientRect();
      setView({zoom:view.zoom,side_by_side:action==='side'},{x:r.left+22,y:r.top+8});
    }
  });
  // The control rests folded to its VIEW row; the toggle opens the tools above it
  // and a press anywhere else folds them away.
  function expandViewBar(open) {
    var bar=document.getElementById('vets_canvas_view'); if(!bar) return;
    var tools=bar.querySelector('.vets-canvas-view-tools'),toggle=bar.querySelector('[data-canvas-view-toggle]');
    if(tools) tools.hidden=!open;
    if(toggle) toggle.setAttribute('aria-expanded',String(open));
    bar.classList.toggle('is-expanded',open);
  }
  document.addEventListener('click',function(e){
    var toggle=e.target.closest && e.target.closest('#vets_canvas_view [data-canvas-view-toggle]');
    if(toggle) expandViewBar(toggle.getAttribute('aria-expanded')!=='true');
  });
  document.addEventListener('pointerdown',function(e){
    var bar=document.getElementById('vets_canvas_view');
    if(bar && bar.classList.contains('is-expanded') && !bar.contains(e.target)) expandViewBar(false);
  },true);
  // A typed zoom (canvas_view.R:canvas_view_parse): Enter or leaving the box
  // applies it about the canvas's centre; text that is not a percentage puts
  // the current zoom back. Escape reverts and folds the bar.
  function applyTypedZoom(input) {
    var canvas=document.getElementById('vets_canvas'),v=viewRules(); if(!canvas || !v) return;
    var z=window.vetsCanvasViewParse(input.value,v);
    if(z!==null) setView({zoom:z,side_by_side:view.side_by_side},viewCentre(canvas));
    input.value=window.vetsCanvasViewLabel(view.zoom);
  }
  document.addEventListener('keydown',function(e){
    var bar=document.getElementById('vets_canvas_view');
    if(!bar || !bar.contains(e.target)) return;
    var input=e.target.matches('[data-canvas-view-label]')?e.target:null;
    if(e.key==='Enter' && input) { e.preventDefault(); applyTypedZoom(input); input.select(); }
  },true);
  // Escape ladder, 'view_bar'.
  window.vetsEscapeRung('view_bar',function(e){
    var bar=document.getElementById('vets_canvas_view');
    return !!bar && bar.contains(e.target);
  },function(e){
    var bar=document.getElementById('vets_canvas_view');
    if(e.target.matches('[data-canvas-view-label]')) e.target.value=window.vetsCanvasViewLabel(view.zoom);
    expandViewBar(false);
    var toggle=bar.querySelector('[data-canvas-view-toggle]'); if(toggle) toggle.focus();
  });
  document.addEventListener('focusin',function(e){
    if(e.target.matches && e.target.matches('#vets_canvas_view [data-canvas-view-label]')) e.target.select();
  });
  document.addEventListener('focusout',function(e){
    if(e.target.matches && e.target.matches('#vets_canvas_view [data-canvas-view-label]')) applyTypedZoom(e.target);
  });
  // A trackpad pinch arrives as a wheel event with ctrlKey; Ctrl- or ⌘-scroll
  // over the canvas does the same. One change per frame, anchored under the
  // pointer. Elsewhere the browser keeps its own page zoom.
  var pinch=null;
  function wheelZoom(e) {
    if(!(e.ctrlKey || e.metaKey) || !viewRules()) return;
    e.preventDefault();
    var delta=window.vetsCanvasRules.wheelDelta(e.deltaY,e.deltaMode);
    if(!pinch) {
      pinch={factor:1,x:e.clientX,y:e.clientY};
      requestAnimationFrame(function(){
        var p=pinch; pinch=null;
        setView({zoom:view.zoom*p.factor,side_by_side:view.side_by_side},p);
      });
    }
    pinch.factor=window.vetsCanvasRules.pinchFactor(pinch.factor,delta);
  }
  function configureSheet(sheet,m) {
    if (window.vetsInvalidateLayout) window.vetsInvalidateLayout();
    // Disposable geometry on the rendered sheet, never a workspace model.
    sheet.__vetsFillScreenFixed=m.fill_screen_fixed;
    sheet.classList.toggle('is-formatted',!!m.width);
    sheet.classList.toggle('is-page-format',!!m.frame);
    sheet.style.width=m.width?m.width+'px':''; sheet.style.height=m.height?m.height+'px':'';
    sheet.dataset.width=m.width||''; sheet.dataset.height=m.height||''; sheet.dataset.fill=String(!!m.fill);
    if(!m.width) sheet.style.zoom='';
  }
  $(document).on('shiny:connected',function(){
    // One sheet's attributes, page-number label and geometry (ADR 0105), page
    // one included; the grid style travels by vets-cards-arrange.
    Shiny.addCustomMessageHandler('vets-canvas-sheet',function(m){
      var sheet=document.getElementById(m.container); if(!sheet) return;
      if(m.exhibit_page!=null) sheet.dataset.exhibitPage=String(m.exhibit_page); else delete sheet.dataset.exhibitPage;
      if(m.text_page!=null) sheet.dataset.textPage=String(m.text_page); else delete sheet.dataset.textPage;
      // The page number and its exhibit-wide style (#473): its size, and its
      // position; a number on the right sends the timestamp to the left edge.
      var number=sheet.querySelector('[data-page-field="page_number"]'), style=m.page_number_style || {};
      if(number) {
        number.textContent=m.page_number || '';
        number.style.fontSize=style.size ? style.size+'pt' : '';
        number.dataset.position=style.position || 'left';
      }
      if(m.page_number && style.position) sheet.dataset.pageNumberPosition=style.position;
      else delete sheet.dataset.pageNumberPosition;
      configureSheet(sheet,m.canvas);fitSheet();window.dispatchEvent(new Event('resize'));
    });
    Shiny.addCustomMessageHandler('vets-scroll-page',function(m){
      requestAnimationFrame(function(){
        fitSheet(); var sheet=document.querySelector('[data-exhibit-page="'+m.page+'"]');
        if(sheet) sheet.scrollIntoView({block:'start'});
      });
    });
    var canvas=document.getElementById('vets_canvas');
    if(canvas) {
      restoreView();
      canvas.addEventListener('wheel',wheelZoom,{passive:false});
      new ResizeObserver(fitSheet).observe(canvas);
      var scheduled=false;
      canvas.addEventListener('scroll',function(){
        if(scheduled) return;scheduled=true;
        requestAnimationFrame(function(){
          scheduled=false;var top=canvas.getBoundingClientRect().top,best=null,distance=Infinity;
          canvas.querySelectorAll('[data-exhibit-page]').forEach(function(sheet){
            var d=Math.abs(sheet.getBoundingClientRect().top-top);
            if(d<distance){best=sheet;distance=d;}
          });
          if(best) vetsEvent('ws_page_view',Number(best.dataset.exhibitPage));
        });
      });
    }
  });
  document.addEventListener('click',function(e){
    var sheet=e.target.closest('[data-exhibit-page]');
    // The page's own × removes it (ADR 0128): no view or drawer step first.
    if(sheet && !e.target.closest('[data-page-remove]')) {
      vetsEvent('ws_page_view',Number(sheet.dataset.exhibitPage));
      vetsEvent('ws_drawer_page',Number(sheet.dataset.exhibitPage));
    }
  },true);

})();

// Page text edits use the existing authored elements, including page one's heading.
// The editor's rules are textEditor (www/vets-roundtrip-rules.js; #483, ADR 0122): the open field, its bar's style and the requests awaiting R's
// answer are ONE state record, `editor`, which only textEditor changes. Every
// request is ws_layout {command: 'text', page, fields, request_id}, page 0
// included. This adapter measures, paints and handles contenteditable: it turns
// DOM facts and Shiny messages into observations and performs the effects in
// order. It holds DOM only: the open field's node, bar and ring, and the hover
// outline.
(function () {
  'use strict';
  var editor = window.vetsRoundtripRules.textEditor.initial();
  var open = null, hint = null, frame = 0, observed = null, blurred = null;
  var textFields = ['title', 'subtitle', 'security_stamp', 'footnote'];
  function canvas() { return document.getElementById('vets_canvas'); }
  function fieldNode(sheet, field) { return sheet.querySelector('[data-page-field="' + field + '"]'); }
  function fieldAt(page, field) {
    var sheet = document.querySelector('.ws-exhibit-sheet[data-text-page="' + page + '"]');
    return sheet ? fieldNode(sheet, field) : null;
  }
  function textPage(el) {
    var sheet = el && el.closest('[data-text-page]');
    return sheet ? Number(sheet.dataset.textPage) : null;
  }
  function decorate(el) {
    var empty = !(el.dataset.textValue || '');
    el.dataset.textEmpty = String(empty);
    el.tabIndex = empty ? -1 : 0;
    el.setAttribute('role', el.dataset.pageField === 'timestamp' ? 'button' : 'textbox');
    if (el.dataset.pageField !== 'timestamp') el.setAttribute('aria-multiline', String(el.dataset.pageField === 'footnote'));
  }
  // The open field's text as it would be sent (null: no field is open).
  function openText() {
    if (!open) return null;
    var el = open.node;
    return window.vetsCanvasRules.normaliseText(el.innerText === undefined ? el.textContent : el.innerText,
      el.dataset.pageField);
  }
  // Feed one observation; `el` is the element it is about (begin, hover).
  function observe(o, el) {
    observed = el || null;
    var r = textTable.observe(editor, o), opened = false;
    editor = r.state;
    r.effects.forEach(function (e) { if (textTable.perform(e) === true) opened = true; });
    observed = null;
    if (opened) position();
    if (blurred) { if (document.activeElement === blurred) blurred.blur(); blurred = null; }
    if (r.effects.length) schedule();
    return r.effects;
  }
  // The text editor's effects, one handler each in its checked table (ADR
  // 0149); open returns true when it opened a field.
  var textTable = window.vetsAdapter('textEditor', {
    hide_hover: function () {
      if (hint) { hint.el.remove(); hint = null; }
    },
    show_hover: function () {
      if (!observed) return;
      var outline = document.createElement('div'); outline.className = 'vets-text-hover vets-edit-ui';
      document.body.appendChild(outline); hint = {node: observed, el: outline};
    },
    open: function (e) {
      var c = canvas(), el = observed;
      if (!el) return false;
      var template = document.getElementById('vets_text_bar_template');
      var bar = template.content.firstElementChild.cloneNode(true);
      var ring = document.createElement('div'); ring.className = 'vets-text-ring vets-edit-ui';
      document.body.appendChild(bar); document.body.appendChild(ring);
      open = {node: el, bar: bar, ring: ring};
      el.dataset.textEditing = 'true';
      if (e.field !== 'timestamp') el.setAttribute('contenteditable', 'plaintext-only');
      else bar.querySelector('.vets-text-bar-align').remove();  // the timestamp has no align
      if (c) c.dataset.textEditing = e.page + ':' + e.field;
      el.focus({preventScroll: true});
      return true;
    },
    refresh_bar: function (e) {
      if (!open) return;
      ['bold', 'italic'].forEach(function (key) {
        open.bar.querySelector('[data-text-style="' + key + '"]').setAttribute('aria-pressed', String(e.style[key]));
      });
      open.bar.querySelectorAll('[data-text-style="align"]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.value === e.style.align));
      });
      var size = open.bar.querySelector('[data-text-style="size"]');
      if (document.activeElement !== size) size.value = e.style.size;
    },
    close: function () {
      var c = canvas(), el;
      if (!open) return;
      el = open.node;
      el.setAttribute('contenteditable', 'false'); delete el.dataset.textEditing;
      el.style.cssText = el.dataset.textCss || '';
      open.bar.remove(); open.ring.remove();
      if (c) c.dataset.textEditing = '';
      open = null; blurred = el;
    },
    requested: function (e) {
      var c = canvas();
      if (c) c.dataset.textRequest = e.request;
    },
    send: function (e) { vetsEvent(e.name, e.payload); },
    show_text: function (e) {
      var el = fieldAt(e.page, e.field);
      if (el) { el.textContent = e.text; el.dataset.textEmpty = String(!e.text); }
    },
    restore: function (e) {
      // R's last text; after a refusal R's generic notice says why.
      e.fields.forEach(function (field) {
        var node = fieldAt(e.page, field);
        if (node) { node.textContent = node.dataset.textValue || ''; decorate(node); }
      });
    },
    paint: function (e) { paint(e.text, e.version); },
    size_note: function (e) { sizeNote(e.refused ? window.vetsCanvasRules.TEXT_SIZE.message : ''); },
    committed: function (e) {
      var c = canvas();
      if (c) { c.dataset.textCommitted = e.request; c.dataset.textOutcome = e.outcome; }
    }
  });
  // R's text for one page into the fields' data attributes and inline style.
  function paint(m, version) {
    var sheet = document.querySelector('.ws-exhibit-sheet[data-text-page="' + m.page + '"]');
    if (!sheet) return;
    window.vetsRoundtripRules.textEditor.FIELDS.forEach(function (field) {
      var el = fieldNode(sheet, field); if (!el) return;
      if (m[field] !== undefined) el.dataset.textValue = m[field];
      el.dataset.textStyle = JSON.stringify(m.text_styles[field]);
      el.dataset.textCss = m.styles[field];
      // R's alignment (#473); the stylesheet widens a centred or right title.
      if (m.text_styles[field].align) el.dataset.textAlign = m.text_styles[field].align;
      else delete el.dataset.textAlign;
      el.dataset.textVersion = String(version);
      el.style.cssText = m.styles[field];
    });
  }
  jQuery(document).on('shiny:connected', function () {
    Shiny.addCustomMessageHandler('vets-page-text', function (m) {
      (m.pages || []).forEach(function (p) { observe({type: 'page_text', text: p, version: m.version}); });
      if (open && !open.node.isConnected) observe({type: 'cancel'});
      // Decoration can change the space left for cards after the sheet's earlier
      // geometry message. Fit/reflow once after all retained text nodes update.
      if (window.vetsFitExhibitCards) {
        window.vetsFitExhibitCards(); window.dispatchEvent(new Event('resize'));
      }
      schedule();
    });
    var c = canvas();
    if (c) new ResizeObserver(schedule).observe(c);
  });
  // The canvas gate's transport hands back every result it drained; the
  // editor keeps only its own.
  window.vetsPageTextResult = function (m) { observe({type: 'result', result: m}); };
  function begin(el) {
    observe({type: 'begin', page: textPage(el), field: el.dataset.pageField, value: el.dataset.textValue || '',
      style: el.dataset.textStyle ? JSON.parse(el.dataset.textStyle) : null, text: openText()}, el);
  }
  function finish(commit) {
    if (!editor.active) return false;
    observe(commit ? {type: 'finish', text: openText()} : {type: 'cancel'});
    return true;
  }
  // Open one page's field in the same editor its hover prompt opens, and bring
  // it into view (#473; the Layout drawer's Add / Edit called it until ADR
  // 0127, the drivers still do). Page is the text page coordinate; nothing is
  // sent until the edit commits.
  window.vetsEditPageText = function (page, field) {
    var el = fieldAt(page, field);
    if (!el) return false;
    begin(el);
    if (open && open.node === el) el.scrollIntoView({block: 'nearest'});
    schedule();
    return !!editor.active;
  };
  // The Escape ladder's 'canvas_text' rung (in the main block) asks and cancels.
  window.vetsPageTextActive = function () { return !!editor.active; };
  window.vetsCancelPageText = function () { return finish(false); };
  // A refused size stays in the box, marked, with R's reason beside it
  // (TEXT_SIZE.message); the next accepted size clears both.
  function sizeNote(text) {
    if (!open) return;
    var size = open.bar.querySelector('[data-text-style="size"]');
    open.bar.querySelector('.vets-text-bar-note').textContent = text;
    if (text) size.setAttribute('aria-invalid', 'true'); else size.removeAttribute('aria-invalid');
    position();
  }
  // Whether the style was taken: false with no field open or a refused size.
  function styleChange(key, value) {
    if (!editor.active) return false;
    var effects = observe({type: 'style', key: key, value: value,
      accepted: key !== 'size' || !!window.vetsCanvasRules.textSize(value)});
    return !effects.some(function (e) { return e.type === 'size_note' && e.refused; });
  }
  document.addEventListener('click', function (e) {
    var prompt = e.target.closest('[data-text-prompt]');
    var el = prompt ? fieldNode(prompt.closest('.ws-exhibit-sheet'), prompt.dataset.textPrompt) : e.target.closest('[data-page-field]');
    if (el && el.dataset.pageField !== 'page_number') { begin(el); return; }
    var control = e.target.closest('[data-text-style]');
    if (editor.active && control && control.dataset.textStyle !== 'size') {
      // Bold and italic toggle; an alignment button sends its own value.
      var key = control.dataset.textStyle;
      styleChange(key, key === 'align' ? control.value : !editor.active.style[key]);
    }
  });
  // Preserve the browser's text selection when clicking a toggle.
  document.addEventListener('pointerdown', function (e) {
    if (!open) return;
    if (open.bar.contains(e.target)) {
      if (e.target.closest('button')) e.preventDefault();
    } else if (!open.node.contains(e.target)) {
      var focused = document.activeElement;
      if (focused && focused.matches('[data-text-style="size"]')) styleChange('size', Number(focused.value));
      finish(true);
    }
  }, true);
  document.addEventListener('focusin', function (e) {
    var el = e.target.closest('[data-page-field]');
    if (el && el.dataset.pageField !== 'page_number') begin(el);
  });
  document.addEventListener('focusout', function () {
    // Field + toolbar are one focus scope. R never replaces these nodes, so a
    // deferred test handles Tab without mistaking a button/size focus for blur.
    setTimeout(function () {
      if (open && !open.node.contains(document.activeElement) && !open.bar.contains(document.activeElement)) finish(true);
    }, 0);
  });
  document.addEventListener('change', function (e) {
    if (open && e.target.matches('[data-text-style="size"]')) styleChange('size', Number(e.target.value));
  });
  document.addEventListener('input', function (e) {
    if (open && open.node.contains(e.target)) schedule();
  });
  document.addEventListener('keydown', function (e) {
    if (!open || e.defaultPrevented || (!open.node.contains(e.target) && !open.bar.contains(e.target))) return;
    var size = e.target.matches('[data-text-style="size"]');
    if (open.bar.contains(e.target) && !size) return; // native button activation
    var action = window.vetsPageTextKey(size ? 'size' : editor.active.field, e.key, e.metaKey || e.ctrlKey, e.isComposing);
    // Escape never reaches here: the ladder's 'canvas_text' rung takes it.
    if (action === 'commit') { e.preventDefault(); e.stopImmediatePropagation(); finish(true); }
    else if (action === 'style') {
      e.preventDefault(); e.stopImmediatePropagation();
      if (styleChange('size', Number(e.target.value))) open.node.focus({preventScroll: true});
      else e.target.select();
    }
  }, true);
  function band(sheet, name) {
    var row = sheet.querySelector('[data-text-band="' + name + '"]');
    if (row) return row;
    row = document.createElement('div'); row.className = 'vets-text-prompts vets-edit-ui'; row.dataset.textBand = name;
    (name === 'head' ? textFields.slice(0, 3) : ['footnote']).forEach(function (field) {
      var button = document.createElement('button'); button.type = 'button'; button.dataset.textPrompt = field;
      button.textContent = '+ ' + field.replace('_', ' '); row.appendChild(button);
    });
    sheet.appendChild(row); return row;
  }
  function placeBand(row, box, origin, scale) {
    row.style.left = (box.left - origin.left) / scale + 'px';
    row.style.top = (box.top - origin.top) / scale + 'px';
    row.style.width = Math.max(0, box.right - box.left) / scale + 'px';
    row.style.height = Math.max(0, box.bottom - box.top) / scale + 'px';
  }
  function measurePrompts(sheet) {
    var title = fieldNode(sheet, 'title'), grid = sheet.querySelector('.ws-grid');
    if (!title || !grid || !sheet.clientWidth) return;
    var b = sheet.getBoundingClientRect(), g = grid.getBoundingClientRect();
    // All measurements are physical pixels; convert once at the containing sheet.
    var scale = b.width / (sheet.clientWidth + sheet.clientLeft * 2);
    var origin = {left: b.left + sheet.clientLeft * scale, top: b.top + sheet.clientTop * scale};
    var head = band(sheet, 'head'), foot = band(sheet, 'foot');
    [head, foot].forEach(function (row) {
      row.querySelectorAll('[data-text-prompt]').forEach(function (button) {
        var el = fieldNode(sheet, button.dataset.textPrompt);
        button.textContent = sheet.dataset.textPage === '0' && button.dataset.textPrompt === 'title' ?
          'Add title' : '+ ' + button.dataset.textPrompt.replace('_', ' ');
        button.hidden = !el || el.dataset.textEmpty !== 'true' || el.dataset.textEditing === 'true';
      });
    });
    var top = origin.top, left = g.left, right = g.right, bottom;
    // Auto borrows its empty-title strip from canvas padding, as main did.
    // The measured gap (already zoomed) stays outside the grid and sheet capture.
    if (sheet.dataset.textPage === '0' && title.dataset.textEmpty === 'true')
      top = Math.max(canvas().getBoundingClientRect().top, origin.top - 20 * scale);
    if (title.dataset.textEmpty !== 'true') {
      var range = document.createRange(); range.selectNodeContents(title);
      var lines = range.getClientRects(), t = lines.length ? lines[0] : title.getBoundingClientRect();
      top = t.top; left = Math.min(g.right, t.right + 8 * scale);
    }
    bottom = Math.min(g.top, top + 18 * scale);
    var stamp = fieldNode(sheet, 'security_stamp');
    if (stamp && stamp.dataset.textEmpty !== 'true') right = Math.min(right, stamp.getBoundingClientRect().left - 8 * scale);
    placeBand(head, {left: left, right: right, top: top, bottom: bottom}, origin, scale);
    var footTop = g.bottom + 4 * scale, footRight = g.right, footLeft = g.left;
    sheet.querySelectorAll('.ws-page-number, .ws-page-timestamp').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (el.textContent && r.bottom > footTop && r.top < footTop + 18 * scale) {
        if (el.classList.contains('ws-page-number')) footLeft = Math.max(footLeft, r.right + 8 * scale);
        else footRight = Math.min(footRight, r.left - 8 * scale);
      }
    });
    placeBand(foot, {left: footLeft, right: footRight, top: footTop,
      bottom: Math.min(b.bottom - sheet.clientTop * scale, footTop + 18 * scale)}, origin, scale);
  }
  function position() {
    if (!canvas()) return;
    canvas().querySelectorAll('.ws-exhibit-sheet[data-text-page]').forEach(measurePrompts);
    if (hint) {
      // Hug the text, not the field: a page subtitle spans the whole sheet.
      var hb = hint.node.getBoundingClientRect(), range = document.createRange();
      range.selectNodeContents(hint.node);
      var tb = range.getBoundingClientRect();
      if (tb.width && tb.height) hb = {left: tb.left - 2, top: tb.top - 1, width: tb.width + 4, height: tb.height + 2};
      hint.el.style.cssText = 'left:' + hb.left + 'px;top:' + hb.top + 'px;width:' + hb.width + 'px;height:' + hb.height + 'px;';
    }
    if (!open || !open.node.isConnected) return;
    var active = editor.active;
    if (open.node.dataset.textEmpty === 'true' && active.page !== 0) {
      var sheet = open.node.closest('.ws-exhibit-sheet'), grid = sheet.querySelector('.ws-grid');
      var sb = sheet.getBoundingClientRect(), gb = grid.getBoundingClientRect();
      var scale = sb.width / (sheet.clientWidth + sheet.clientLeft * 2);
      var left = gb.left, top = gb.top, width = gb.width;
      var head = sheet.querySelector('.vets-topbar').getBoundingClientRect();
      if (active.field === 'footnote') top = gb.bottom + 4 * scale;
      else if (active.field === 'subtitle') top = head.bottom + 4 * scale;
      else top = head.top;
      if (active.field === 'security_stamp') { width *= .35; left = gb.right - width; }
      var style = open.node.style;
      style.left = (left - sb.left - sheet.clientLeft * scale) / scale + 'px';
      style.top = (top - sb.top - sheet.clientTop * scale) / scale + 'px';
      style.width = width / scale + 'px'; style.bottom = 'auto'; style.right = 'auto';
    }
    var b = open.node.getBoundingClientRect(), clip = canvas().getBoundingClientRect();
    var bar = open.bar, ring = open.ring;
    ring.style.cssText = 'left:' + b.left + 'px;top:' + b.top + 'px;width:' + b.width + 'px;height:' + b.height + 'px;';
    bar.style.maxWidth = Math.max(0, clip.width - 16) + 'px';
    var r = bar.getBoundingClientRect(), top = b.top - r.height - 6;
    if (top < clip.top + 4) top = b.bottom + 6;
    // When neither side fits, reveal the field; never lay the bar over it.
    if (top + r.height > clip.bottom - 4 && b.height + r.height + 14 < clip.height) {
      canvas().scrollTop += top + r.height - clip.bottom + 4; schedule();
    }
    bar.style.left = Math.max(clip.left + 8, Math.min(b.left, clip.right - r.width - 8)) + 'px';
    bar.style.top = Math.max(clip.top + 4, Math.min(top, clip.bottom - r.height - 4)) + 'px';
    bar.dataset.textPage = String(active.page); bar.dataset.textField = active.field;
  }
  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(function () { frame = 0; position(); });
  }
  // The hover outline: the field under the pointer (null: none).
  function hoverOver(el) {
    observe({type: 'hover', page: textPage(el), field: el ? el.dataset.pageField : null,
      empty: !el || el.dataset.textEmpty !== 'false'}, el);
  }
  document.addEventListener('pointerover', function (e) {
    var sheet = e.target.closest('.ws-exhibit-sheet[data-text-page]'); if (sheet) measurePrompts(sheet);
    hoverOver(e.target.closest('[data-page-field]'));
  });
  document.addEventListener('pointerout', function (e) {
    var to = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('[data-page-field]') : null;
    if (hint && !hint.node.contains(e.relatedTarget)) hoverOver(to);
  });
  window.addEventListener('resize', schedule);
  document.addEventListener('scroll', schedule, true);
})();

// Canvas layout gestures (ADR 0076). Only pointer context lives here. Each
// preview rereads R's retained-node attributes; only the release asks R to edit.
(function () {
  'use strict';
  var gesture = null, feedback = null, swallow = null;
  function canvas() { return document.getElementById('vets_canvas'); }

  /* ---- the canvas round-trip gate's adapter (ADR 0094, #384) ----------- */
  // The gate itself is canvasGate in www/vets-roundtrip-rules.js: the version
  // seal, the held drawer route, the pending request, the card and page
  // reveal and the layout transport are ONE state record, `gate`, which only
  // canvasGate changes. This adapter turns DOM facts and Shiny messages into
  // observations and performs the effects in order. It holds DOM only: the
  // released gesture's layer (`inflight`, keyed to its request), when the
  // request started, and the Shiny sender vetsEvent hands the transport.
  var gate = null, inflight = null, started = null, sendInput = null;
  // The gate starts from the stamp R's markup drew on the canvas.
  function gateState() {
    if (!gate) { var c = canvas(); gate = window.vetsRoundtripRules.canvasGate.initial(c ? c.dataset.wsVersion : null); }
    return gate;
  }
  // An effect may feed the gate again (an `event` queues through vetsEvent);
  // the state is stored before any effect runs.
  function feed(observation) {
    var out = canvasTable.observe(gateState(), observation), c = canvas();
    gate = out.state;
    // Two DOM facts for drivers (ADR 0003): a held capture's job, else ''; and
    // the one verdict, the version the canvas is ready at, else '' (ADR 0113).
    var captureJob = gate.capture ? gate.capture.job : '';
    if (c && (c.dataset.captureHeld || '') !== captureJob) c.dataset.captureHeld = captureJob;
    var ready = window.vetsRoundtripRules.canvasGate.ready(gate);
    ready = ready === null ? '' : ready;
    if (c && c.dataset.canvasReady !== ready) c.dataset.canvasReady = ready;
    out.effects.forEach(function (e) { canvasTable.perform(e); });
  }
  // What a route or a held route's reseal needs to know about the page.
  function facts(observation) {
    observation.canvas = !!canvas(); observation.gesture = !!gesture;
    observation.modal = !!document.getElementById('shiny-modal');
    return observation;
  }
  // The version a gesture may start at: vets-diag's, once the canvas is drawn at it.
  function sealed() { return window.vetsRoundtripRules.canvasGate.sealed(gateState()); }
  // A new card is ready to reveal once it and its head have height and it has
  // width; a new page once its grid has size and a visible card (insertUI may
  // arrive after the acknowledgement; never reveal the old or empty shell).
  function revealTarget(id) {
    var c = canvas(); if (!c) return null;
    return Array.from(c.querySelectorAll('.ws-card')).find(function (el) {
      return el.dataset.collectionId === id && el.getBoundingClientRect().height > 0;
    }) || null;
  }
  function cardReady(id) {
    var card = revealTarget(id), head = card && card.querySelector('.ws-card-head');
    return !!(card && head && head.getBoundingClientRect().height && card.clientWidth);
  }
  function revealGrid(page) {
    var c = canvas();
    return c ? c.querySelector('.ws-grid[data-page="' + Number(page) + '"]') : null;
  }
  function pageReady(page) {
    var grid = revealGrid(page);
    return !!(grid && grid.clientWidth && grid.clientHeight && cards(gridBox(grid)).length);
  }
  // The canvas gate's effects, one handler each in its checked table (ADR 0149).
  var canvasTable = window.vetsAdapter('canvasGate', {
    cancel_gesture: function (e) { cancel(e.reason); },
    clear_feedback: function () { clearFeedback(); },
    schedule_seal: function (e) {
      // vets-diag is emitted after every R flush, including noops/refusals. Two
      // frames allow insertUI and sheet fitting in that flush to finish first.
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        feed(facts({type: 'seal', token: e.token}));
      }); });
    },
    draw_version: function (e) { var c = canvas(); if (c) c.dataset.wsVersion = e.version; },
    sync_chrome: function () { syncLayoutChrome(); },
    send: function (e) { sendInput(e.name, e.payload); },
    event: function (e) { vetsEvent(e.name, e.payload); },
    pending_started: function (e) {
      var c = canvas();
      started = {request: e.request, at: performance.now()};
      if (e.keyboard) inflight = null; else if (inflight) inflight.request = e.request;
      if (c) {
        c.dataset.layoutPending = e.request;
        if (!e.keyboard) c.dataset.layoutGesture = 'pending';
      }
    },
    await: function (e) {
      // Creation shares the layout follow-scroll's version/DOM settle loop:
      // measure on the next frame and tell the gate.
      requestAnimationFrame(function () {
        if (e.card !== undefined) feed({type: 'measured', card: e.card, ready: cardReady(e.card)});
        else feed({type: 'measured', page: e.page, ready: pageReady(e.page)});
      });
    },
    scroll_to_card: function (e) {
      // Only the canvas moves; no scrollIntoView and no focus on the new card.
      var c = canvas(), target = revealTarget(e.id);
      if (c && target) c.scrollTop += target.getBoundingClientRect().top - c.getBoundingClientRect().top - 12;
    },
    revealed_card: function (e) { var c = canvas(); if (c) c.dataset.revealedCard = e.id; },
    remove_targets: function (e) { if (inflight && inflight.request === e.request) removeTargets(inflight); },
    scroll_to_page: function (e) {
      var c = canvas(), target = revealGrid(e.page);
      target = target && target.closest('.ws-exhibit-sheet');
      if (c && target) c.scrollTop += target.getBoundingClientRect().top - c.getBoundingClientRect().top - 12;
    },
    // Bounded by a shortened canvas after page removal.
    scroll_restore: function (e) { var c = canvas(); if (c) c.scrollTop = e.top; },
    settled: function (e) {
      var c = canvas();
      if (!c) return;
      c.dataset.layoutPending = '';
      c.dataset.layoutSettled = e.request;
      c.dataset.layoutSettledMs = String(performance.now() - started.at);
      c.dataset.layoutGesture = '';
    },
    show_refusal: function (e) {
      if (!inflight || inflight.request !== e.request) return;
      var target = inflight; inflight = null;
      target.ghost.classList.add('is-refused'); target.ghost.dataset.refused = 'true';
      target.label.textContent = target.labelText + ' refused: ' + e.reason;
      // Keep the answer at the release point briefly so a round-trip refusal
      // can be read; it vanishes on the next press, edit, Esc, blur or timeout.
      feedback = {layer: target.layer, timer: setTimeout(function () { feed({type: 'feedback_expired'}); }, e.ttl)};
    },
    remove_layer: function (e) {
      if (inflight && inflight.request === e.request) { inflight.layer.remove(); inflight = null; }
    },
    page_text_result: function (e) { if (window.vetsPageTextResult) window.vetsPageTextResult(e.result); },
    capture: function (e) { window.vetsCaptureExhibit(e.job, e.plan); },
    capture_dropped: function (e) {
      vetsEvent('vets_composed_exhibit', {job: e.job, error: 'superseded by a later capture'});
    }
  });
  // vets-diag's version, after every R flush.
  window.vetsLayoutVersion = function (version) { feed({type: 'version', version: version}); };
  // A sheet or grid reconfiguration clears the geometry seal until the next version.
  window.vetsInvalidateLayout = function () { feed({type: 'invalidate'}); };
  // vetsEvent hands over ws_layout and acknowledged page-text requests.
  window.vetsQueueLayout = function (name, payload, send) {
    sendInput = send;
    feed({type: 'queue', name: name, payload: payload});
  };
  window.vetsRevealCard = function (m) {
    feed({type: 'reveal_card', id: m && m.id ? m.id : null, version: m && m.id ? m.version : null});
  };
  window.vetsRevealSelection = function (id) { feed({type: 'select', id: id === undefined ? null : id}); };
  // A live capture is an observation (#441, ADR 0110): the gate runs it once
  // every chart's resize has ended and the canvas is sealed. vets.js's window
  // resize after each sheet refit reaches highcharter's resize binding, whose
  // chart.setSize animates the box; a copy taken inside that animation is a
  // mid-animation SVG. Highcharts' own resize state is the fact: one class-level
  // hook per event, installed once Highcharts has loaded (its dependencies
  // mount with the first chart), feeds each chart's phase.
  window.vetsCaptureRequested = function (m) {
    feed({type: 'capture', job: m.job, plan: m.plan, version: m.version});
  };
  // A card chart widget rendered R's chart and is sending chart_ready; R's
  // vets-chart-synced answers it once any mutation has been sent (ADR 0113).
  window.vetsChartRendered = function (id, generation) {
    feed({type: 'chart_rendered', id: id, generation: generation});
  };
  // vets-cancel-composition: R cancelled the job; its held capture goes unanswered (#451).
  window.vetsCancelCapture = function (job) { feed({type: 'cancel_capture', job: job}); };
  function ensureChartHooks() {
    if (!window.Highcharts || !Highcharts.Chart || !Highcharts.addEvent || Highcharts.Chart.__vetsGateHooked) return;
    Highcharts.Chart.__vetsGateHooked = true;
    ['resize', 'endResize', 'destroy'].forEach(function (phase) {
      Highcharts.addEvent(Highcharts.Chart, phase, function () {
        feed({type: 'chart', index: this.index, id: this.renderTo ? this.renderTo.id : null, phase: phase});
      });
    });
  }
  // Capture phase: this runs before the widget's own resize listener calls setSize.
  window.addEventListener('resize', ensureChartHooks, {capture: true});
  jQuery(document).on('shiny:value', ensureChartHooks);
  jQuery(document).on('shiny:connected', function () {
    Shiny.addCustomMessageHandler('vets-chart-synced', function (m) {
      feed({type: 'chart_synced', id: m.id, generation: m.generation});
    });
    Shiny.addCustomMessageHandler('vets-layout-result', function (m) {
      var c = canvas(); if (!c) return;
      c.dataset.layoutResult = JSON.stringify(m);
      feed({type: 'ack', result: m});
    });
  });
  // Keyboard placement is gone (ADR 0083) and the card drawer's placement
  // routes with it (#474); vetsSubmitLayout stays the one door for an ids-only
  // command (browser drivers use it): no pointer geometry, no ghost, and R's
  // notice is its only refusal feedback. A sheet reconfiguration clears the geometry
  // seal between R's flush and the next vets-diag version; a pointer gesture
  // needs that seal because it carries measured geometry, while a route carries
  // ids only, so the gate holds one until the reseal instead of dropping it (a
  // silent refusal of an asked-for edit). R still decides the edit.
  window.vetsSubmitLayout = function (payload) { feed(facts({type: 'route', payload: payload})); };

  // The rules are pure (www/vets-canvas-rules.js); this adapter measures the
  // DOM, hands them plain placements and paints what they answer.
  var canvasRules = window.vetsCanvasRules, clamp = canvasRules.clamp, rect = canvasRules.rect, contains = canvasRules.contains;
  function placement(card) {
    return rect(Number(card.dataset.col), Number(card.dataset.row),
      Number(card.dataset.colSpan), Number(card.dataset.rowSpan));
  }
  function gridBox(grid) {
    var box = grid.getBoundingClientRect(), style = getComputedStyle(grid);
    var scale = box.width / grid.clientWidth;
    var gx = (parseFloat(style.columnGap) || 0) * scale, gy = (parseFloat(style.rowGap) || 0) * scale;
    var columns = Number(grid.dataset.columns), rows = Number(grid.dataset.rows);
    return {node: grid, box: box, page: Number(grid.dataset.page), columns: columns, rows: rows,
      scale: scale, gx: gx, gy: gy, px: (box.width + gx) / columns, py: (box.height + gy) / rows};
  }
  function screenRect(g, r) {
    return {left: g.box.left + (r.col - 1) * g.px, top: g.box.top + (r.row - 1) * g.py,
      width: r.col_span * g.px - g.gx, height: r.row_span * g.py - g.gy};
  }
  // A grid's cards in DOM order. Hidden cards are not occupants: a DOM-only
  // filter the rules never see. An arranged page renders only its placements,
  // none hidden, and they never overlap, so this matches R's placements (#357).
  function cards(g) {
    return Array.from(g.node.children).filter(function (n) {
      return n.matches('.ws-card') && getComputedStyle(n).display !== 'none';
    });
  }
  // The same cards as the plain occupants {id, col, row, col_span, row_span}.
  function occupants(grid) {
    return cards({node: grid}).map(function (n) {
      var r = placement(n); r.id = n.dataset.collectionId; return r;
    });
  }
  function element(className, parent) {
    var el = document.createElement('div');
    el.className = className + ' vets-edit-ui'; parent.appendChild(el); return el;
  }
  function position(el, box, clip) {
    el.style.left = (box.left - clip.left) + 'px'; el.style.top = (box.top - clip.top) + 'px';
    el.style.width = Math.max(0, box.width) + 'px'; el.style.height = Math.max(0, box.height) + 'px';
  }
  function clearFeedback() {
    if (!feedback) return;
    clearTimeout(feedback.timer); feedback.layer.remove(); feedback = null;
  }
  function armClick(g) {
    swallow = {pointer: g.pointer, x: g.x, y: g.y, until: performance.now() + 700};
  }
  // Capture on window precedes page-click, card activation and drawer listeners.
  window.addEventListener('click', function (e) {
    if (!swallow || performance.now() > swallow.until) { swallow = null; return; }
    if (e.detail !== 0 && (e.pointerId === swallow.pointer || Math.hypot(e.clientX - swallow.x, e.clientY - swallow.y) < 4)) {
      swallow = null; e.preventDefault(); e.stopImmediatePropagation();
    }
  }, true);
  // A fresh press cannot be the previous gesture's synthetic click.
  window.addEventListener('pointerdown', function () { swallow = null; clearFeedback(); }, true);
  function release(g) {
    cancelAnimationFrame(g.frame);
    if (g.grip.hasPointerCapture(g.pointer)) g.grip.releasePointerCapture(g.pointer);
  }
  function removeTargets(g) {
    if (g.tail) g.tail.remove();
    if (g.addTarget) g.addTarget.remove();
  }
  function cancel(reason) {
    if (!gesture) return false;
    var g = gesture; gesture = null;
    if (g.active) armClick(g);
    release(g); removeTargets(g); if (g.layer) g.layer.remove();
    g.canvas.dataset.layoutGesture = ''; g.canvas.dataset.layoutCancel = reason;
    return true;
  }

  // Grips live outside .ws-card-inner (which can have its own zoom). Their
  // physical hit areas come from rendered geometry, never offsetLeft/Top.
  function sizeGrips(card) {
    var grid = card.closest('.ws-grid'); if (!grid || !grid.clientWidth) return;
    var g = gridBox(grid), b = card.getBoundingClientRect(), s = g.scale;
    if (!(s > 0)) return;
    var corner = Math.min(20, b.width / 3, b.height / 3) / s;
    var edge = Math.min(10, b.width / 4, b.height / 4) / s;
    var top = Math.min(36, b.height / 2) / s;
    card.querySelectorAll('[data-layout-grip]').forEach(function (grip) {
      grip.style.setProperty('--vets-grip-corner', corner + 'px');
      grip.style.setProperty('--vets-grip-edge', edge + 'px');
      grip.style.setProperty('--vets-grip-top', top + 'px');
      if (grip.dataset.layoutGrip === 'move') {
        grip.style.width = Math.max(0, Math.min(40, b.width - 72)) / s + 'px';
        grip.style.height = Math.min(16, b.height / 3) / s + 'px';
      }
    });
  }
  document.addEventListener('pointerover', function (e) {
    var card = e.target.closest('.ws-card'); if (card) sizeGrips(card);
  });
  document.addEventListener('focusin', function (e) {
    var card = e.target.closest('.ws-card'); if (card) sizeGrips(card);
  });
  // The New page target below the last sheet exists only while a card is
  // dragged (makeLayer); the drawer's switch that pinned it is gone (ADR 0128).
  // Presentation only: a page still needs its first placement.
  function makeNewPageTarget(c) {
    var existing = c.querySelector('.ws-layout-tail');
    if (existing) return existing;
    var tail = element('ws-layout-tail', c), target = element('ws-layout-target', tail);
    target.dataset.layoutTarget = 'new_page'; target.textContent = 'New page';
    return tail;
  }
  function positionNewPageTarget(tail, sheet, c) {
    var last = sheet.getBoundingClientRect(), clip = c.getBoundingClientRect();
    // Absolute overflow extends only the scroll range. Rects stay in physical
    // pixels under CSS zoom; no flex item steals chart height.
    tail.style.left = (last.left - clip.left + c.scrollLeft) + 'px';
    tail.style.top = (last.bottom - clip.top + c.scrollTop + 24) + 'px';
    tail.style.width = last.width + 'px';
  }
  function syncLayoutChrome() {
    var c = canvas(); if (!c) return;
    var tail = c.querySelector('.ws-layout-tail');
    if (tail && !(gesture && gesture.tail === tail) && !(inflight && inflight.tail === tail)) tail.remove();
    syncLayoutTarget();
  }
  // The Layout drawer edits one page; its arrows and a click on the canvas both
  // choose which (ADR 0087). The sheet carries a quiet outline while that drawer
  // is open — no mark beside it, which the owner refused on 2026-09-22 — and the
  // canvas slides to a newly chosen page, since the drawer's edits are live.
  // Stepping with the arrows always slides, so the movement itself says which
  // way you went; a click on a page only scrolls one that is out of view, so
  // clicking a card never pulls the canvas out from under the pointer.
  // Presentation only: the choice itself is R's.
  var layoutTarget = null, layoutStepped = false, layoutSlide = null;
  window.vetsLayoutPage = function (page) {
    layoutStepped = true;
    vetsEvent('ws_drawer_page', page);
  };
  // A short ease-out: long enough to read the direction, short enough not to
  // wait for it. Reduced motion jumps, as every other canvas scroll does.
  function slideCanvas(c, top) {
    if (layoutSlide) cancelAnimationFrame(layoutSlide);
    var start = c.scrollTop, delta = Math.round(top) - start;
    if (!delta) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      c.scrollTop = start + delta; return;
    }
    var duration = Math.max(140, Math.min(280, Math.abs(delta) * 0.18)), began = null;
    var step = function (now) {
      if (began === null) began = now;
      var t = Math.min(1, (now - began) / duration);
      c.scrollTop = start + delta * (1 - Math.pow(1 - t, 3));
      layoutSlide = t < 1 ? requestAnimationFrame(step) : null;
    };
    layoutSlide = requestAnimationFrame(step);
  }
  // The target sheets' outline is R's chrome (vets-chrome's layout_page and
  // all_pages through chromeAttributes, #485); re-painted here because sheets
  // are re-drawn. The slide is this file's presentation.
  function syncLayoutTarget() {
    var c = canvas(); if (!c) return;
    var facts = window.vetsChromeFacts ? window.vetsChromeFacts() : null;
    if (window.vetsPaintChrome) window.vetsPaintChrome();
    var page = facts && facts.layout_page !== null && facts.layout_page !== undefined ? String(facts.layout_page) : '';
    if (!page) { layoutTarget = null; layoutStepped = false; return; }
    // All pages (ADR 0089): every arranged page is the target, and the canvas
    // stays where it is.
    if (facts.all_pages) return;
    var target = c.querySelector('[data-exhibit-page="' + page + '"]');
    if (!target) return;
    if (layoutTarget === page) return;      // only a change moves the canvas
    layoutTarget = page;
    var stepped = layoutStepped;
    layoutStepped = false;
    var box = target.getBoundingClientRect(), clip = c.getBoundingClientRect();
    if (stepped || box.top < clip.top || box.top > clip.bottom - 80)
      slideCanvas(c, c.scrollTop + box.top - clip.top - 12);
  }
  window.vetsSyncLayoutChrome = syncLayoutChrome;
  // The one drawer trigger (ADR 0125), the drawer render sequence's
  // place_layout step (ADR 0147): a pass that saw the panel's markup replaced
  // (every drawer open, close, page step and All pages switch renders the
  // panel) syncs the Layout target; the other callers repaint with the canvas
  // (resize, the view, vets-chrome, the canvas gate's sync_chrome).
  window.vetsDrawerStep('rendered', 'place_layout', function (pass) {
    if (pass.outputs.indexOf('drawer_panel') >= 0) syncLayoutChrome();
  });
  window.addEventListener('resize', function () { requestAnimationFrame(syncLayoutChrome); });
  function makeLayer(g) {
    g.layer = element('ws-layout-layer', document.body);
    g.layer.setAttribute('aria-hidden', 'true');
    g.guides = element('ws-layout-grids', g.layer);
    g.outline = element('ws-layout-outline', g.layer);
    g.ghost = element('ws-layout-ghost', g.layer);
    g.label = element('ws-layout-label', g.layer);
    if (g.kind === 'move') {
      g.tail = makeNewPageTarget(g.canvas);
      g.newTarget = g.tail.querySelector('[data-layout-target="new_page"]');
      // The fixed target at the top adds the card to a new page that copies
      // its page's layout, first slot; it never unplaces it (owner, 2026-09-22).
      g.addTarget = element('ws-layout-target', g.layer);
      g.addTarget.dataset.layoutTarget = 'add_new_page';
      g.addTarget.textContent = canvasRules.RELEASE_LABELS.add_new_page;
    }
    g.canvas.dataset.layoutGesture = g.kind;
  }
  function movePreview(g, target) {
    var drop = canvasRules.dropPreview({page: target.page, columns: target.columns, rows: target.rows},
      occupants(target.node), {id: g.id, from: g.page, copy: g.shift, original: g.original, fx: g.fx, fy: g.fy,
        over_col: Math.floor((g.x - target.box.left) / target.px) + 1,
        over_row: Math.floor((g.y - target.box.top) / target.py) + 1}, occupants(g.grid));
    // What the release sends and says is the module's (ADR 0102).
    var intent = canvasRules.releaseIntent({kind: 'grid', page: target.page, drop: drop},
      {id: g.id, from: g.page, shift: g.shift});
    return {payload: intent.payload, grid: target, rect: drop.rect, label: intent.label, refused: intent.refused};
  }
  function resizePreview(g, target) {
    // Original edges are remeasured from the grid each frame so stationary
    // pointers still track correctly while the canvas autoscrolls.
    var box = screenRect(target, g.original);
    var dx = g.x - box.left - g.grabX, dy = g.y - box.top - g.grabY;
    var r = canvasRules.resizeGrowth({columns: target.columns, rows: target.rows}, occupants(target.node),
      {id: g.id, original: g.original, edge: g.edge, dx: dx, dy: dy, px: target.px, py: target.py});
    return {payload: {command: 'resize', id: g.id, page: g.page, col: r.col, row: r.row,
      col_span: r.col_span, row_span: r.row_span}, grid: target, rect: r,
      label: 'Resize · ' + r.col_span + ' × ' + r.row_span, refused: false,
      raw: canvasRules.resizeOutline(box, g.edge, dx, dy)};
  }
  function paint(g) {
    var clip = g.canvas.getBoundingClientRect();
    g.layer.style.left = clip.left + 'px'; g.layer.style.top = clip.top + 'px';
    g.layer.style.width = clip.width + 'px'; g.layer.style.height = clip.height + 'px';
    if (g.tail) positionNewPageTarget(g.tail, g.lastSheet, g.canvas);
    var grids = Array.from(g.canvas.querySelectorAll('.ws-grid')).filter(function (n) {
      return !n.hidden && n.clientWidth && n.clientHeight;
    }).map(gridBox);
    // Only the guides are disposable. Never clone or move a card for preview.
    g.guides.textContent = '';
    grids.filter(function (grid) { return grid.page > 0; }).forEach(function (grid) {
      var guide = element('ws-layout-grid', g.guides);
      guide.dataset.page = String(grid.page); position(guide, grid.box, clip);
      guide.style.backgroundSize = grid.px + 'px ' + grid.py + 'px';
    });
    var target = contains(clip, g.x, g.y) ? grids.find(function (grid) { return contains(grid.box, g.x, g.y); }) : null;
    var preview = null, intent = function (kind) {
      return canvasRules.releaseIntent({kind: kind}, {id: g.id, from: g.page, shift: g.shift});
    };
    // A target's preview is its release intent (ADR 0102) and its box.
    var at = function (kind, box) {
      var r = intent(kind);
      return r.payload ? {payload: r.payload, box: box, label: r.label, refused: r.refused} : null;
    };
    // Targets win over the grid underneath. Always remeasure at pointer-up:
    // autoscroll may have moved New page since the last painted frame.
    // Add to new page is fixed at the top of the layer, where on a zoomed page it
    // lies over the first cards' handles: it arms only once the pointer has been
    // outside it, so a short drag that starts under it cannot move the card.
    if (g.addTarget && !g.addArmed && !contains(g.addTarget.getBoundingClientRect(), g.x, g.y)) g.addArmed = true;
    if (g.kind === 'resize') preview = resizePreview(g, gridBox(g.grid));
    else if (contains(clip, g.x, g.y) && g.addTarget && g.addArmed && contains(g.addTarget.getBoundingClientRect(), g.x, g.y))
      preview = at('add_new_page', g.addTarget.getBoundingClientRect());
    else if (contains(clip, g.x, g.y) && g.newTarget && contains(g.newTarget.getBoundingClientRect(), g.x, g.y))
      preview = at('new_page', g.newTarget.getBoundingClientRect());
    else if (target && target.page > 0) preview = movePreview(g, target);
    else if (g.page && contains(clip, g.x, g.y)) {
      // Removal targets the entire unplaced sheet, including its padding.
      var unplaced = grids.find(function (grid) {
        return grid.page === 0 && contains(grid.node.closest('.ws-exhibit-sheet').getBoundingClientRect(), g.x, g.y);
      });
      if (unplaced) preview = at('unplaced', unplaced.node.closest('.ws-exhibit-sheet').getBoundingClientRect());
    }
    g.preview = preview;
    var raw = preview && preview.raw ? preview.raw : {left: g.x - g.grabX, top: g.y - g.grabY,
      width: g.width, height: g.height};
    position(g.outline, raw, clip);
    g.ghost.hidden = !preview;
    g.label.textContent = preview ? preview.label : intent('none').label;
    g.label.dataset.command = preview ? preview.payload.command : '';
    if (preview) {
      position(g.ghost, preview.box || screenRect(preview.grid, preview.rect), clip);
      g.ghost.classList.toggle('is-refused', preview.refused);
      g.ghost.dataset.refused = String(preview.refused);
      ['page', 'col', 'row', 'col_span', 'row_span'].forEach(function (key) {
        var value = key === 'page' ? (preview.grid && preview.grid.page) : (preview.rect && preview.rect[key]);
        var attr = 'data-' + key.replace(/_/g, '-');
        if (value === undefined || value === null) g.ghost.removeAttribute(attr); else g.ghost.setAttribute(attr, String(value));
      });
    }
    g.label.style.left = clamp(g.x - clip.left + 16, 4, Math.max(4, clip.width - g.label.clientWidth - 4)) + 'px';
    g.label.style.top = clamp(g.y - clip.top + 18, 4, Math.max(4, clip.height - g.label.clientHeight - 4)) + 'px';
  }
  function animate(time) {
    var g = gesture; if (!g || !g.active) return;
    if (sealed() !== g.version || !g.card.isConnected) { cancel('canvas version changed'); return; }
    var elapsed = g.time ? Math.min(0.05, (time - g.time) / 1000) : 0; g.time = time;
    var box = g.canvas.getBoundingClientRect(), speed = 0;
    if (g.x >= box.left && g.x <= box.right) {
      if (g.y < box.top + 64) speed = -800 * clamp((box.top + 64 - g.y) / 64, 0, 1);
      else if (g.y > box.bottom - 64) speed = 800 * clamp((g.y - box.bottom + 64) / 64, 0, 1);
    }
    if (speed) g.canvas.scrollTop += speed * elapsed;
    paint(g); g.frame = requestAnimationFrame(animate);
  }
  document.addEventListener('pointerdown', function (e) {
    var grip = e.target.closest('[data-layout-grip]'), c = canvas();
    if (!grip || !c || !c.contains(grip) || e.button !== 0 || !e.isPrimary || gateState().pending ||
        document.getElementById('shiny-modal') || sealed() === null) return;
    var card = grip.closest('.ws-card'), grid = card.closest('.ws-grid'), page = Number(card.dataset.page);
    if (grip.dataset.layoutGrip === 'resize' && page === 0) return;
    cancel('new gesture');
    var b = card.getBoundingClientRect();
    var grids = Array.from(c.querySelectorAll('.ws-grid')).filter(function (n) {
      return !n.hidden && n.clientWidth && n.clientHeight;
    });
    var arranged = grids.filter(function (n) { return Number(n.dataset.page) > 0; });
    var lastGrid = arranged.length ? arranged[arranged.length - 1] : grids[grids.length - 1];
    gesture = {canvas: c, grip: grip, card: card, grid: grid, id: card.dataset.collectionId, page: page,
      kind: grip.dataset.layoutGrip, edge: grip.dataset.layoutEdge, pointer: e.pointerId, version: sealed(),
      original: placement(card), startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY,
      grabX: e.clientX - b.left, grabY: e.clientY - b.top, fx: (e.clientX - b.left) / b.width,
      fy: (e.clientY - b.top) / b.height, width: b.width, height: b.height, active: false,
      shift: e.shiftKey, lastSheet: lastGrid.closest('.ws-exhibit-sheet')};
    // Use the original grid edge for travel, including the card border offset.
    var cellBox = screenRect(gridBox(grid), gesture.original);
    if (gesture.kind === 'resize') {
      gesture.grabX = e.clientX - cellBox.left; gesture.grabY = e.clientY - cellBox.top;
    }
    grip.setPointerCapture(e.pointerId); e.preventDefault(); e.stopPropagation();
  });
  document.addEventListener('pointermove', function (e) {
    var g = gesture; if (!g || e.pointerId !== g.pointer) return;
    g.x = e.clientX; g.y = e.clientY; g.shift = e.shiftKey;
    if (!g.active && Math.hypot(g.x - g.startX, g.y - g.startY) >= 6) {
      g.active = true; makeLayer(g); g.frame = requestAnimationFrame(animate);
    }
    if (g.active) { e.preventDefault(); paint(g); }
  });
  document.addEventListener('pointerup', function (e) {
    var g = gesture; if (!g || e.pointerId !== g.pointer) return;
    g.x = e.clientX; g.y = e.clientY; g.shift = e.shiftKey;
    if (sealed() !== g.version) { cancel('canvas version changed'); return; }
    if (!g.active) {
      cancel('below threshold');
      if (g.card.isConnected && Math.hypot(g.x - g.startX, g.y - g.startY) < 6) {
        // A click on a grip is not a drag and selects nothing (ADR 0083).
        armClick(g);
        g.canvas.dataset.layoutCancel = '';
      }
      return;
    }
    paint(g); armClick(g); gesture = null; release(g);
    e.preventDefault(); e.stopPropagation();
    if (!g.preview) { removeTargets(g); g.layer.remove(); g.canvas.dataset.layoutGesture = ''; g.canvas.dataset.layoutCancel = 'outside grid'; return; }
    var payload = g.preview.payload;
    // The gate names the request and sends it; the layer stays here, keyed to it.
    inflight = {request: null, layer: g.layer, ghost: g.ghost, label: g.label, labelText: g.preview.label,
      tail: g.tail, addTarget: g.addTarget};
    feed({type: 'release', payload: payload, scroll: g.canvas.scrollTop});
  });
  ['pointercancel', 'lostpointercapture'].forEach(function (type) {
    document.addEventListener(type, function (e) { if (gesture && e.pointerId === gesture.pointer) cancel(type); });
  });
  window.addEventListener('blur', function () {
    cancel('window blur'); clearFeedback();
  });
  ['keydown', 'keyup'].forEach(function (type) {
    window.addEventListener(type, function (e) {
      if (!gesture) return;
      gesture.shift = e.shiftKey;
      if (gesture.active) paint(gesture);
    }, true);
  });
  // Escape ladder, 'gesture': below 'dropdown' (#316), above every text and
  // drawer rung.
  window.vetsEscapeRung('gesture', function () { return !!(gesture || feedback); }, function () {
    cancel('escape'); clearFeedback();
  });
})();

// Live exhibit capture (ADR 0043). Read-only DOM geometry and existing Highcharts
// SVGs become a disposable vector page. No chart is rerendered or resized and no
// captured geometry becomes authoritative workspace state. The viewBox and text
// retain measured display geometry; the physical output size removes sheet zoom.
(function () {
  'use strict';
  var NS='http://www.w3.org/2000/svg';
  var omit='.vets-edit-ui,.vets-screen-only,#ws_loading,.ws-card-status,.ws-card-delete,.ws-card-tools,.ws-chip-remove-icon,.ws-chip-add,.ws-chip-actions,.ws-chip-detail,.vets-menu,.shiny-busy-indicator-container,.shiny-busy-indicator,.vets-session,.highcharts-tooltip,.highcharts-crosshair,.highcharts-button,.highcharts-range-selector-group,.highcharts-navigator,.highcharts-scrollbar';
  function svgNode(tag,attrs,parent) {
    var n=document.createElementNS(NS,tag);
    Object.keys(attrs || {}).forEach(function(k){n.setAttribute(k,attrs[k]);});
    if(parent) parent.appendChild(n); return n;
  }
  function color(value) {
    if(!value || value==='none') return 'none';
    var c=document.createElement('canvas');c.width=c.height=1;
    var x=c.getContext('2d');x.fillStyle=value;x.fillRect(0,0,1,1);
    var p=x.getImageData(0,0,1,1).data;
    return p[3] ? 'rgba('+p[0]+','+p[1]+','+p[2]+','+(p[3]/255)+')' : 'none';
  }
  function capture(sheet,page) {
    var bounds=sheet.getBoundingClientRect(), w=bounds.width,h=bounds.height;
    if(!(w>0 && h>0)) throw Error('Exhibit page is not laid out');
    // Fixed paper already has page.size. Canvas-sized sheets (including Auto)
    // export their logical size at 96 CSS px/in, independent of display zoom.
    // These sheets have no border: client dimensions are their logical box.
    // Keep it exact (undoing rounded zoomed rectangles can introduce fractions
    // that fail the R/SVG size check). The measured viewBox below maps the whole
    // display back to that box, as page.size already does for fixed paper.
    // Card-scoped capture keeps its existing measured-size behavior.
    var dimensions=!page.size && sheet.matches('.ws-exhibit-sheet') ?
      {width:sheet.clientWidth,height:sheet.clientHeight} : {width:w,height:h};
    var size=page.size || {width:dimensions.width*.75,height:dimensions.height*.75};
    var root=svgNode('svg',{xmlns:NS,width:size.width,height:size.height,
      viewBox:'0 0 '+w+' '+h,'data-page':page.number});
    var content=svgNode('g',{},root),clipIndex=0;
    svgNode('rect',{width:w,height:h,fill:'#ffffff'},content);
    function box(el) {var r=el.getBoundingClientRect();return {x:r.left-bounds.left,y:r.top-bounds.top,width:r.width,height:r.height};}
    function paintText(text,r,style,parent,scale) {
      if(!text || !text.trim() || !r.width || !r.height) return;
      var fontSize=parseFloat(style.fontSize)*scale;
      var canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
      ctx.font=style.fontStyle+' '+style.fontWeight+' '+fontSize+'px '+style.fontFamily;
      var m=ctx.measureText(text),ascent=m.fontBoundingBoxAscent || fontSize*.8,descent=m.fontBoundingBoxDescent || fontSize*.2;
      var n=svgNode('text',{x:r.x,y:r.y+(r.height-ascent-descent)/2+ascent,
        fill:color(style.color),'font-family':style.fontFamily,'font-size':fontSize,
        'font-weight':style.fontWeight,'font-style':style.fontStyle,'xml:space':'preserve'},parent);
      n.textContent=text;
    }
    function textNode(node,parent,style,scale) {
      var range=document.createRange(),line=null;
      for(var i=0;i<node.length;i++) {
        range.setStart(node,i);range.setEnd(node,i+1);
        var r=range.getBoundingClientRect();
        if(!r.width || !r.height) continue;
        if(line && Math.abs(line.top-r.top)>.5) {flush();}
        if(!line) line={text:'',left:r.left,top:r.top,right:r.right,height:r.height};
        line.text+=node.textContent[i];line.right=r.right;
      }
      flush();
      function flush(){if(line){paintText(line.text,{x:line.left-bounds.left,y:line.top-bounds.top,width:line.right-line.left,height:line.height},style,parent,scale);line=null;}}
    }
    function walk(el,parent) {
      if(el.nodeType!==1 || el.matches(omit)) return;
      var style=getComputedStyle(el),r=box(el);
      if(style.display==='none' || style.visibility==='hidden' || Number(style.opacity)===0  ) return;
      if(!r.width || !r.height) {if(style.overflow==='hidden')return;Array.from(el.children).forEach(function(child){walk(child,parent);});return;}
      var scale=1;for(var ancestor=el;ancestor;ancestor=ancestor.parentElement)scale*=Number(getComputedStyle(ancestor).zoom)||1;
      if(el.namespaceURI===NS) {
        var clone=el.cloneNode(true);
        var originals=[el].concat(Array.from(el.querySelectorAll('*'))),copies=[clone].concat(Array.from(clone.querySelectorAll('*')));
        originals.forEach(function(src,i){
          var dst=copies[i],cs=getComputedStyle(src);
          if(cs.visibility==='hidden' || cs.display==='none' || src.matches(omit)) {dst.remove();return;}
          Array.from(dst.attributes).forEach(function(a){if(/^on|href/i.test(a.name))dst.removeAttribute(a.name);});
          ['fill','stroke','stroke-width','stroke-dasharray','fill-opacity','stroke-opacity','opacity','font-family','font-size','font-weight','font-style','text-anchor','overflow'].forEach(function(k){
            var value=cs.getPropertyValue(k);if(value) dst.setAttribute(k,value.replace(/url\(["']?[^)]*#([^)'" ]+)["']?\)/g,'url(#$1)'));
          });
          dst.removeAttribute('style');
        });
        clone.querySelectorAll('title,desc').forEach(function(n){n.remove();});
        clone.setAttribute('x',r.x);clone.setAttribute('y',r.y);clone.setAttribute('width',r.width);clone.setAttribute('height',r.height);
        if(!clone.hasAttribute('viewBox')) clone.setAttribute('viewBox','0 0 '+el.width.baseVal.value+' '+el.height.baseVal.value);
        var card=el.closest('.ws-card');
        if(card && el.classList.contains('highcharts-root')) clone.setAttribute('data-chart-svg',card.dataset.collectionId);
        parent.appendChild(clone);return;
      }
      if(Number(style.opacity)<1)parent=svgNode('g',{opacity:style.opacity},parent);
      if(el.matches('.ws-card')) parent=svgNode('g',{'data-card-id':el.dataset.collectionId},parent);
      var fill=color(style.backgroundColor),border=parseFloat(style.borderTopWidth)*scale;
      if(fill!=='none') svgNode('rect',{x:r.x,y:r.y,width:r.width,height:r.height,rx:parseFloat(style.borderTopLeftRadius)*scale || 0,fill:fill},parent);
      ['Top','Right','Bottom','Left'].forEach(function(edge){
        var bw=parseFloat(style['border'+edge+'Width'])*scale;
        if(!bw || style['border'+edge+'Style']==='none')return;
        var x1=r.x,y1=r.y,x2=r.x+r.width,y2=r.y+r.height;
        if(edge==='Top')y2=y1; if(edge==='Bottom')y1=y2;
        if(edge==='Left')x2=x1; if(edge==='Right')x1=x2;
        // Rounded card borders are drawn once below.
        if(parseFloat(style.borderTopLeftRadius)>0)return;
        svgNode('line',{x1:x1,y1:y1,x2:x2,y2:y2,stroke:color(style['border'+edge+'Color']),'stroke-width':bw},parent);
      });
      if(border && parseFloat(style.borderTopLeftRadius)>0) svgNode('rect',{x:r.x+border/2,y:r.y+border/2,width:r.width-border,height:r.height-border,rx:parseFloat(style.borderTopLeftRadius)*scale,fill:'none',stroke:color(style.borderTopColor),'stroke-width':border},parent);
      if(el.matches('input,textarea')) {
        if(!el.value)return;
        // A temporary text mirror asks the browser for the existing field's
        // wrapping and alignment. It does not mutate the input or trigger Shiny.
        var mirror=document.createElement('div');
        mirror.style.cssText='position:fixed;pointer-events:none;opacity:0;box-sizing:border-box;left:'+ (bounds.left+r.x)+'px;top:'+(bounds.top+r.y)+'px;width:'+r.width+'px;height:'+r.height+'px;';
        ['fontFamily','fontWeight','fontStyle','textAlign','whiteSpace','wordBreak','overflowWrap'].forEach(function(k){mirror.style[k]=style[k];});
        ['fontSize','lineHeight','paddingTop','paddingRight','paddingBottom','paddingLeft'].forEach(function(k){mirror.style[k]=isNaN(parseFloat(style[k]))?style[k]:parseFloat(style[k])*scale+'px';});
        ['Top','Right','Bottom','Left'].forEach(function(side){mirror.style['border'+side]=parseFloat(style['border'+side+'Width'])*scale+'px solid transparent';});
        mirror.style.whiteSpace=el.tagName==='INPUT'?'pre':'pre-wrap';mirror.textContent=el.value;
        document.body.appendChild(mirror);
        var clipId='capture-'+page.number+'-field-'+(++clipIndex);
        var clip=svgNode('clipPath',{id:clipId},svgNode('defs',{},root));svgNode('rect',r,clip);
        textNode(mirror.firstChild,svgNode('g',{'clip-path':'url(#'+clipId+')'},parent),getComputedStyle(mirror),1);mirror.remove();return;
      }
      Array.from(el.childNodes).forEach(function(child){
        if(child.nodeType===3) textNode(child,parent,style,scale); else walk(child,parent);
      });
    }
    walk(sheet,content);
    // DOM order is stable R collection order; verify it before returning any SVG.
    var ids=Array.from(root.querySelectorAll('[data-card-id]')).map(function(n){return n.dataset.cardId;});
    if(JSON.stringify(ids)!==JSON.stringify(page.slots.map(function(s){return s.card_id;}))) throw {captureCode: "cards_changed"};
    page.slots.forEach(function(slot){
      if(slot.view==='chart' && !Array.from(root.querySelectorAll('[data-chart-svg]')).some(function(n){return n.dataset.chartSvg===slot.card_id;})) throw {captureCode: "chart_loading"};
    });
    return {svg:new XMLSerializer().serializeToString(root),dimensions:dimensions};
  }
  // The canvas gate decides when a capture runs (#441, ADR 0110): the message
  // is its observation, and its `capture` effect calls vetsCaptureExhibit.
  Shiny.addCustomMessageHandler('vets-capture-exhibit',function(message){ window.vetsCaptureRequested(message); });
  window.vetsCaptureExhibit=async function(job,plan){
    var message={job:job,plan:plan};
    try {
      await document.fonts.ready;
      // Capture every sheet in screen order; editing page ids remain arranged-only.
      var sheets=Array.from(document.querySelectorAll('.ws-exhibit-sheet[data-exhibit-capture-page]'));
      if(!message.plan.pages[0].card_id && sheets.length!==message.plan.pages.length) throw {captureCode: "pages_changed"};
      // Synchronous capture: user interaction cannot interleave between pages.
      // The canvas view is lifted for it, so the view never reaches an export.
      var restoreView=window.vetsCanvasViewLift?window.vetsCanvasViewLift():function(){};
      try { var results=message.plan.pages.map(function(page,i){var target=page.card_id?Array.from(document.querySelectorAll('#vets_canvas .ws-card')).find(function(card){return card.dataset.collectionId===page.card_id && card.getBoundingClientRect().width>0;}):sheets[i];
        if(!target)throw {captureCode: "not_displayed"};
        return capture(target,page);}); } finally { restoreView(); }
      vetsEvent('vets_composed_exhibit',{job:message.job,pages:results.map(function(r){return r.svg;}),dimensions:results.map(function(r){return r.dimensions;}),timing:{}});
    } catch(e) {
      if (e.captureCode) vetsEvent('vets_composed_exhibit',{job:message.job,code:e.captureCode});
      else vetsEvent('vets_composed_exhibit',{job:message.job,error:String(e.message || e)});
    }
  };
})();
