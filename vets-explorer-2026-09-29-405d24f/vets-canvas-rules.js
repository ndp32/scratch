/* VETS Explorer — the canvas rules (ADR 0093).
 *
 * The client's canvas geometry as pure functions of plain data: no DOM, no
 * Shiny, no workspace state. vets.js is the adapter: it measures the DOM, calls
 * these, and paints the answer. Node loads this file as a CommonJS module, and
 * tests/test_canvas_rules.R replays the R fixtures through it. R owns the
 * fixtures and the constants (ADRs 0077, 0088); the literals below mirror them.
 *
 * Interface (window.vetsCanvasRules / module.exports):
 *   TABLE_CAPACITY {row, head, foot, rules} -> page_geometry.R's TABLE_CAPACITY:
 *     the stylesheet's 20.5 px data rows, 26 px header, 32 px footer
 *     (--vets-table-foot-h) and 3 px of outer rules.
 *   TEXT_SIZE {min, max, step, message} -> exhibit_text.R's TEXT_SIZE: typed
 *     sizes in points, and what the text bar says when it refuses one.
 *   CARD_ZOOM {width, height} -> page_geometry.R's CARD_ZOOM: the logical card
 *     a formatted sheet typesets at.
 *   clamp(x, lo, hi); rect(col, row, col_span, row_span) -> placement record.
 *   contains(box, x, y) -> is the point in the half-open box {left, top, width, height}.
 *   overlaps(a, b) -> do two placement records share a cell.
 *   fits(grid, occupants, r, ignored) -> r lies inside grid {columns, rows} and
 *     overlaps no occupant {id, col, row, col_span, row_span} but the one with
 *     id `ignored` (null ignores none). Occupants are one grid's, in DOM order.
 *   snapEdge(d, cell) / snapAnchor(over, grab_fraction, span) -> layout_snap.R.
 *   dropPreview(grid, occupants, gesture, source) -> the drop outcome a move or
 *     place shows while the pointer is over an arranged grid. grid {page,
 *     columns, rows} is the target; gesture {id, from (0 = unplaced), copy
 *     (Shift held; only a placed card copies), original {col, row, col_span,
 *     row_span}, fx, fy (grab fractions), over_col, over_row (pointer cell)};
 *     absent spans in original are one cell;
 *     source the occupants of the card's own grid. Returns {command, over,
 *     anchor, rect, swap, refused, reason}; reason is '' or the first of
 *     'outside' (the pointer cell is off the grid), 'on_page', 'occupied',
 *     'duplicate'.
 *   RELEASE_LABELS {place, move, swap, move_or_copy, copy, add_new_page,
 *     remove} -> every label a move or place preview reads (ADR 0102).
 *   releaseIntent(target, gesture) -> {payload, label, refused}: what a drag
 *     release sends and what its preview says (LAYOUT_RELEASE_FIXTURE).
 *     target {kind, page, drop}: kind 'add_new_page', 'new_page', 'grid' (page
 *     and drop, the record dropPreview returned), 'unplaced' or 'none'; gesture
 *     {id, from (0 = unplaced), shift}. payload is the ws_layout payload, or
 *     null when the release sends nothing (no target; an unplaced card over
 *     the unplaced sheet). Shift over the unplaced sheet is shown refused.
 *   resizeGrowth(grid, occupants, gesture) -> the rectangle a resize reaches:
 *     gesture {id, original, edge (compass letters), dx, dy, px, py}; shrink
 *     first, then grow cell by cell while the card fits, horizontal first.
 *   resizeOutline(box, edge, dx, dy) -> the raw outline under the pointer.
 *   tableCapacity(body, head, foot) -> data rows a card body of that CSS height
 *     holds under that header and footer, at least one.
 *   cardZoom(formatted, width, height) -> inner zoom of a card on a sheet.
 *   fillScreenFit(canvasW, canvasH, fixed) -> page_geometry.R:fill_screen_fit.
 *   paperFit(canvasW, canvasH, width, height, fixed) -> display zoom of a
 *     fixed-paper sheet of logical width x height.
 *   canvasViewRead / canvasViewStep / canvasViewSheetZoom / canvasViewAcross /
 *     canvasViewLabel / canvasViewParse -> canvas_view.R,
 *     `v` being CANVAS_VIEW.
 *   viewAnchor(box, x, y) -> {distance, fx, fy}: how far a point is from a
 *     sheet's box and where on it it falls, clamped to the box.
 *   viewScroll(box, anchor) -> {left, top}: scroll that puts anchor back under
 *     its point after the box moved.
 *   wheelDelta(deltaY, deltaMode) / pinchFactor(factor, delta) -> a wheel
 *     step clamped to ±30 px (lines are 33 px) and its effect on a pinch.
 *   formatCell(data, decimals, sep, dec, minus, missing) -> a table cell's
 *     display HTML (TABLE_CELL_FIXTURE, ADR 0102): punctuation is the caller's
 *     (CHART_THEME's, written into chart_render.R's column render); a missing
 *     value is the missing mark in ws-cell-missing.
 *   formatDifferenceCell(...) -> the same, a non-zero value wrapped in
 *     vets-difference is-up (with a leading +) or is-down.
 *   listDropPosition(mids, from, y) -> the 1-based position a dragged list row
 *     ends at (ws_move_series, ADR 0132 d3): one more than the rows other than
 *     `from` (1-based) whose vertical midpoint (mids, in list order) lies above
 *     the pointer's y. listStepPosition(from, n, step) -> from + step (Alt+Up is
 *     -1, Alt+Down +1), or 0 when that leaves 1..n. drawer_panel.R's
 *     SERIES_ROW_MOVE_FIXTURE holds both; R's move_instance takes the result.
 *   pageTextKey(field, key, mod, composing) -> 'native', 'cancel', 'commit' or
 *     'style': what a key does in a page text field or the size box.
 *   textSize(value) -> whether a typed point size is accepted: a whole or half
 *     point from 6 to 72 (TEXT_SIZE_FIXTURE).
 *   normaliseText(value, field) -> page text as sent to R: blank by
 *     exhibit_text_value's class (TEXT_BLANK_FIXTURE), line breaks collapsed
 *     to spaces except in the footnote.
 *   INSPECTOR_HOVER {dim_opacity, line_factor, band_factor, note_border} ->
 *     chart_render.R's INSPECTOR_HOVER: what the row hover paints.
 *   inspectorHover(row, chart) -> {keep, dim, lines, bands, notes, column}:
 *     which of the card's chart ids a hovered card-drawer row highlights
 *     (ADR 0132 d9, INSPECTOR_HOVER_FIXTURE). row {kind: 'series', id} keeps
 *     its series and dims every other series id but notes ('vets-note::');
 *     row {kind: 'mark', index: k} thickens the line 'vets-reference-<k>', the
 *     band 'vets-period::<k>' or the note 'vets-note::<k>' the chart draws.
 *     chart {series, lines, bands} lists the ids the chart draws; column is
 *     the table key a Series row highlights (its id), else null.
 *   MARK_ID_PREFIX {lines, bands, notes} -> the id prefix of a mark drawn as
 *     a plot line, a band or a note: R's mark kind table
 *     (chart_mark_id_prefixes, workspace_schema.R, ADR 0145), replayed by
 *     tests/test_canvas_rules.R.
 *
 * vets.js keeps its window names as one-line aliases into this module:
 * vetsFillScreenFit, vetsCanvasViewRead, vetsCanvasViewStep,
 * vetsCanvasViewSheetZoom, vetsCanvasViewAcross, vetsCanvasViewLabel,
 * vetsCanvasViewParse, vetsSnapEdge, vetsSnapAnchor, vetsPageTextKey,
 * vetsFormatCell and vetsFormatDifferenceCell.
 * ES5, like vets.js; loaded before it by ui_shell.R.
 */
(function (root) {
  'use strict';

  var TABLE_CAPACITY = {row: 20.5, head: 26, foot: 32, rules: 3};
  var TEXT_SIZE = {min: 6, max: 72, step: 0.5,
    message: 'Text size must be a whole or half point from 6 to 72.'};
  var CARD_ZOOM = {width: 350, height: 260}; // page_geometry.R's CARD_ZOOM
  // exhibit_text_value's blank class, (*UCP) \s and \p{Z}: not JavaScript's \s,
  // which counts U+FEFF and not U+180E. TEXT_BLANK_FIXTURE pins it.
  var BLANK = /^[\t\n\v\f\r \u0085\u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]*$/;

  /* ---- placement geometry --------------------------------------------- */

  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  function rect(col, row, w, h) { return {col: col, row: row, col_span: w, row_span: h}; }
  function contains(box, x, y) {
    return x >= box.left && x < box.left + box.width && y >= box.top && y < box.top + box.height;
  }
  function overlaps(a, b) {
    return a.col < b.col + b.col_span && b.col < a.col + a.col_span &&
      a.row < b.row + b.row_span && b.row < a.row + a.row_span;
  }
  function fits(grid, occupants, r, ignored) {
    return r.col >= 1 && r.row >= 1 && r.col + r.col_span - 1 <= grid.columns &&
      r.row + r.row_span - 1 <= grid.rows && !occupants.some(function (o) {
        return o.id !== ignored && overlaps(r, o);
      });
  }

  function snapEdge(d, cell) {
    var threshold = Math.min(16, 0.15 * cell);
    return Math.abs(d) > threshold ? (d < 0 ? -1 : 1) * Math.ceil((Math.abs(d) - threshold) / cell) : 0;
  }
  function snapAnchor(over, grab_fraction, span) {
    return over - Math.max(0, Math.min(span - 1, Math.floor(grab_fraction * span)));
  }

  // A card's own placement is the occupant with its id on the page it came
  // from: a grid holds each card at most once.
  function dropPreview(grid, occupants, g, source) {
    // Absent spans are one cell, as exhibit_layout_command's place reads them.
    var o = rect(g.original.col, g.original.row, g.original.col_span || 1, g.original.row_span || 1);
    var over = rect(g.over_col, g.over_row, 1, 1);
    var anchor = rect(snapAnchor(over.col, g.fx, o.col_span),
      snapAnchor(over.row, g.fy, o.row_span), o.col_span, o.row_span);
    var copy = g.from > 0 && g.copy;
    var command = copy ? 'also_place' : (g.from ? 'move' : 'place');
    var hit = occupants.find(function (n) { return overlaps(over, n); });
    var refused = false, reason = '', swap = false, shown = anchor;
    function refuse(why) { if (!refused) reason = why; refused = true; }
    // R refuses a pointer cell off the grid before anything else.
    if (!fits(grid, [], over, null)) {
      refuse('outside');
      return {command: command, over: over, anchor: anchor, rect: over, swap: false, refused: true, reason: reason};
    }
    if ((copy || g.from !== grid.page) && occupants.some(function (n) { return n.id === g.id; })) refuse('on_page');
    if (hit) {
      shown = rect(hit.col, hit.row, hit.col_span, hit.row_span);
      if (hit.id === g.id && g.from === grid.page) shown = rect(o.col, o.row, o.col_span, o.row_span);
      // A swap exchanges rectangles, spans included (ADR 0080).
      else if (copy || !g.from) refuse('occupied');
      else {
        var duplicate = source.some(function (n) { return n.id !== g.id && n.id === hit.id; });
        if (g.from !== grid.page && duplicate) refuse('duplicate');
        if (!refused) swap = true;
      }
    } else {
      var ignored = !copy && g.from === grid.page ? g.id : null;
      var candidates = [anchor, rect(over.col, over.row, anchor.col_span, anchor.row_span), over];
      // The pointer cell is inside the grid and empty, so the last always fits.
      shown = candidates.find(function (r) { return fits(grid, occupants, r, ignored); });
    }
    return {command: command, over: over, anchor: anchor, rect: shown, swap: swap, refused: refused, reason: reason};
  }

  var RELEASE_LABELS = {place: 'Place', move: 'Move', swap: 'Swap',
    move_or_copy: 'Move · hold ⇧ to also place here', copy: '⇧ also place here',
    add_new_page: 'Add to new page', remove: 'Remove from page'};

  // A placed card copies only to the New page tail or with Shift over a grid;
  // an unplaced card is placed wherever it goes (ADR 0102 decision 6).
  function releaseIntent(target, g) {
    var L = RELEASE_LABELS, placed = g.from > 0, payload;
    if (target.kind === 'add_new_page' || target.kind === 'new_page') {
      var copy = target.kind === 'new_page' && placed && g.shift;
      payload = {command: 'new_page', id: g.id, copy: copy, col: 1, row: 1};
      if (placed) payload.from = g.from;
      return {payload: payload, label: target.kind === 'add_new_page' ? L.add_new_page :
        (!placed ? L.place : copy ? L.copy : L.move_or_copy), refused: false};
    }
    if (target.kind === 'grid') {
      var drop = target.drop;
      payload = {command: drop.command, id: g.id, page: target.page, col: drop.anchor.col, row: drop.anchor.row,
        over_col: drop.over.col, over_row: drop.over.row};
      if (placed) payload.from = g.from;
      else { payload.col_span = drop.anchor.col_span; payload.row_span = drop.anchor.row_span; }
      return {payload: payload, label: drop.swap ? L.swap : drop.command === 'also_place' ? L.copy :
        (placed ? (g.from !== target.page ? L.move_or_copy : L.move) : L.place), refused: drop.refused};
    }
    if (target.kind === 'unplaced' && placed) return {payload: g.shift ?
      {command: 'also_place', id: g.id, from: g.from, page: 0, col: 1, row: 1} :
      {command: 'remove', id: g.id, page: g.from}, label: g.shift ? L.copy : L.remove, refused: g.shift};
    return {payload: null, label: placed ? L.move : L.place, refused: false};
  }

  function resizeGrowth(grid, occupants, g) {
    var o = g.original, edge = g.edge;
    var x = snapEdge(g.dx, g.px), y = snapEdge(g.dy, g.py);
    var left = o.col, top = o.row, right = o.col + o.col_span, bottom = o.row + o.row_span;
    var wantLeft = /w/.test(edge) ? clamp(left + x, 1, right - 1) : left;
    var wantRight = /e/.test(edge) ? clamp(right + x, left + 1, grid.columns + 1) : right;
    var wantTop = /n/.test(edge) ? clamp(top + y, 1, bottom - 1) : top;
    var wantBottom = /s/.test(edge) ? clamp(bottom + y, top + 1, grid.rows + 1) : bottom;
    // Shrink both axes first, then grow cell by cell. Horizontal wins diagonal
    // ties; a fast pointer cannot skip across an intervening neighbour.
    left = Math.max(left, wantLeft); right = Math.min(right, wantRight);
    top = Math.max(top, wantTop); bottom = Math.min(bottom, wantBottom);
    while (left > wantLeft && fits(grid, occupants, rect(left - 1, top, right - left + 1, bottom - top), g.id)) left--;
    while (right < wantRight && fits(grid, occupants, rect(left, top, right - left + 1, bottom - top), g.id)) right++;
    while (top > wantTop && fits(grid, occupants, rect(left, top - 1, right - left, bottom - top + 1), g.id)) top--;
    while (bottom < wantBottom && fits(grid, occupants, rect(left, top, right - left, bottom - top + 1), g.id)) bottom++;
    return rect(left, top, right - left, bottom - top);
  }

  function resizeOutline(box, edge, dx, dy) {
    var rawLeft = /w/.test(edge) ? Math.min(box.left + dx, box.left + box.width - 1) : box.left;
    var rawTop = /n/.test(edge) ? Math.min(box.top + dy, box.top + box.height - 1) : box.top;
    var rawRight = /e/.test(edge) ? Math.max(box.left + 1, box.left + box.width + dx) : box.left + box.width;
    var rawBottom = /s/.test(edge) ? Math.max(box.top + 1, box.top + box.height + dy) : box.top + box.height;
    return {left: rawLeft, top: rawTop, width: rawRight - rawLeft, height: rawBottom - rawTop};
  }

  /* ---- cards and tables ------------------------------------------------ */

  function tableCapacity(body, head, foot) {
    return Math.max(1, Math.floor((body - head - foot - TABLE_CAPACITY.rules) / TABLE_CAPACITY.row));
  }
  function cardZoom(formatted, width, height) {
    var scale = formatted ? Math.min(1, width / CARD_ZOOM.width, height / CARD_ZOOM.height) : 1;
    return scale > 0 ? scale : 1;
  }

  // Display-only number formatting for the table view (ADR 0018): the raw
  // value's sign, rounded to `decimals`, grouped with `sep`.
  function formatCell(data, decimals, sep, dec, minus, missing) {
    var d = (data === null || data === undefined || data === '') ? NaN : Number(data);
    if (isNaN(d)) return '<span class="ws-cell-missing">' + missing + '</span>';
    var parts = Math.abs(d).toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, sep);
    return (d < 0 ? minus : '') + parts.join(dec);
  }
  function formatDifferenceCell(data, decimals, sep, dec, minus, missing) {
    var text = formatCell(data, decimals, sep, dec, minus, missing);
    var value = (data === null || data === undefined || data === '') ? NaN : Number(data);
    if (isNaN(value) || value === 0) return text;
    return '<span class="vets-difference ' + (value > 0 ? 'is-up' : 'is-down') + '">' +
      (value > 0 ? '+' : '') + text + '</span>';
  }

  /* ---- sheet fit and the canvas view ----------------------------------- */

  function fillScreenFit(canvasW, canvasH, fixed) {
    var w = canvasW - fixed.padding_x, h = canvasH - fixed.padding_y;
    if (canvasW >= fixed.canvas) return {width: w, height: h, zoom: 1};
    return {width: fixed.width, height: fixed.height,
      zoom: Math.max(fixed.min_zoom, Math.min(w / fixed.width, h / fixed.height))};
  }
  function paperFit(canvasW, canvasH, width, height, fixed) {
    return Math.max(fixed.min_zoom, Math.min((canvasW - fixed.padding_x) / width, (canvasH - fixed.padding_y) / height));
  }

  function canvasViewRead(zoom, side, v) {
    var z = typeof zoom === 'number' && isFinite(zoom) ? Math.max(v.min, Math.min(v.max, zoom)) : 1;
    return {zoom: z, side_by_side: side === true};
  }
  function canvasViewStep(zoom, direction, v) {
    var z = canvasViewRead(zoom, false, v).zoom, i;
    if (direction > 0) {
      for (i = 0; i < v.steps.length; i++) if (v.steps[i] > z + 1e-9) return v.steps[i];
      return v.max;
    }
    for (i = v.steps.length - 1; i >= 0; i--) if (v.steps[i] < z - 1e-9) return v.steps[i];
    return v.min;
  }
  function canvasViewSheetZoom(fitZoom, width, availableWidth, view, v) {
    var base = fitZoom;
    if (view.side_by_side === true && width > 0 && fitZoom > 0) {
      var share = (availableWidth - v.gap * (v.across - 1)) / v.across;
      base = fitZoom * Math.min(1, Math.max(0, share) / (width * fitZoom));
    }
    return Math.max(v.floor, base * view.zoom);
  }
  function canvasViewAcross(availableWidth, zoom, v) {
    var share = (availableWidth - v.gap * (v.across - 1)) / v.across;
    if (!(share > 0)) return v.across;
    return Math.max(v.across, Math.floor((availableWidth + v.gap) / (share * Math.min(1, zoom) + v.gap) + 1e-9));
  }
  function canvasViewLabel(zoom) { return Math.floor(zoom * 100 + 0.5) + '%'; }
  function canvasViewParse(text, v) {
    if (typeof text !== 'string') return null;
    var t = text.trim().replace(/%\s*$/, '').trim();
    if (!/^([0-9]+\.?[0-9]*|\.[0-9]+)$/.test(t)) return null;
    return canvasViewRead(Number(t) / 100, false, v).zoom;
  }

  // Zoom under the pointer: where on the nearest sheet the point falls, and
  // the scroll that puts that spot back under it once the sheet has moved.
  function viewAnchor(r, x, y) {
    var dx = Math.max(r.left - x, 0, x - r.right), dy = Math.max(r.top - y, 0, y - r.bottom);
    return {distance: dx * dx + dy * dy,
      fx: Math.max(0, Math.min(1, (x - r.left) / r.width)), fy: Math.max(0, Math.min(1, (y - r.top) / r.height))};
  }
  function viewScroll(r, a) {
    return {left: r.left + a.fx * r.width - a.x, top: r.top + a.fy * r.height - a.y};
  }
  function wheelDelta(deltaY, deltaMode) { return Math.max(-30, Math.min(30, deltaY * (deltaMode === 1 ? 33 : 1))); }
  function pinchFactor(factor, delta) { return factor * Math.exp(-delta * 0.01); }

  /* ---- list rows (the card drawer's Series, ADR 0132 d3) --------------- */

  function listDropPosition(mids, from, y) {
    var above = 0;
    for (var i = 0; i < mids.length; i++) if (i !== from - 1 && mids[i] < y) above++;
    return above + 1;
  }
  function listStepPosition(from, n, step) {
    var to = from + step;
    return to >= 1 && to <= n ? to : 0;
  }

  /* ---- page text ------------------------------------------------------- */

  function pageTextKey(field, key, mod, composing) {
    if (composing) return 'native';
    if (key === 'Escape') return 'cancel';
    if (key === 'Enter') return field === 'size' ? 'style' :
      (field !== 'footnote' || mod ? 'commit' : 'native');
    return 'native'; // notably Cmd/Ctrl+Z belongs to the browser's text undo
  }
  function textSize(value) {
    var steps = value / TEXT_SIZE.step;
    return isFinite(value) && value >= TEXT_SIZE.min && value <= TEXT_SIZE.max && steps === Math.round(steps);
  }
  function normaliseText(value, field) {
    if (BLANK.test(value)) return '';
    return field === 'footnote' ? value : value.replace(/\r\n|[\r\n\u0085\u2028\u2029]/g, ' ');
  }

  /* ---- card drawer row hover (ADR 0132 d9) ---------------------------- */

  var INSPECTOR_HOVER = {dim_opacity: 0.2, line_factor: 2, band_factor: 3, note_border: 2};
  var MARK_ID_PREFIX = {lines: 'vets-reference-', bands: 'vets-period::', notes: 'vets-note::'};
  function inspectorHover(row, chart) {
    var out = {keep: [], dim: [], lines: [], bands: [], notes: [], column: null};
    var c = chart || {};
    var series = c.series || [], lines = c.lines || [], bands = c.bands || [];
    var has = function (list, id) { return list.indexOf(id) >= 0; };
    if (row && row.kind === 'series' && typeof row.id === 'string') {
      out.column = row.id;
      if (!has(series, row.id)) return out;
      out.keep = [row.id];
      out.dim = series.filter(function (id) { return id !== row.id && id.indexOf(MARK_ID_PREFIX.notes) !== 0; });
      return out;
    }
    if (row && row.kind === 'mark' && isFinite(row.index)) {
      var k = String(row.index), P = MARK_ID_PREFIX;
      if (has(lines, P.lines + k)) out.lines = [P.lines + k];
      if (has(bands, P.bands + k)) out.bands = [P.bands + k];
      if (has(series, P.notes + k)) out.notes = [P.notes + k];
    }
    return out;
  }

  var api = {
    TABLE_CAPACITY: TABLE_CAPACITY, TEXT_SIZE: TEXT_SIZE, CARD_ZOOM: CARD_ZOOM,
    clamp: clamp, rect: rect, contains: contains, overlaps: overlaps, fits: fits,
    snapEdge: snapEdge, snapAnchor: snapAnchor, dropPreview: dropPreview,
    RELEASE_LABELS: RELEASE_LABELS, releaseIntent: releaseIntent,
    resizeGrowth: resizeGrowth, resizeOutline: resizeOutline,
    tableCapacity: tableCapacity, cardZoom: cardZoom,
    formatCell: formatCell, formatDifferenceCell: formatDifferenceCell,
    fillScreenFit: fillScreenFit, paperFit: paperFit,
    canvasViewRead: canvasViewRead, canvasViewStep: canvasViewStep,
    canvasViewSheetZoom: canvasViewSheetZoom, canvasViewAcross: canvasViewAcross,
    canvasViewLabel: canvasViewLabel, canvasViewParse: canvasViewParse,
    viewAnchor: viewAnchor, viewScroll: viewScroll, wheelDelta: wheelDelta, pinchFactor: pinchFactor,
    pageTextKey: pageTextKey, textSize: textSize, normaliseText: normaliseText,
    listDropPosition: listDropPosition, listStepPosition: listStepPosition,
    INSPECTOR_HOVER: INSPECTOR_HOVER, MARK_ID_PREFIX: MARK_ID_PREFIX, inspectorHover: inspectorHover
  };
  root.vetsCanvasRules = api;
  if (typeof module === 'object' && module && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
