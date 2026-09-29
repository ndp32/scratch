/* VETS Explorer — the client's round-trip gates (ADR 0094).
 *
 * The rules that hold an intent or an obligation until the matching render
 * stamp is drawn or a widget has settled, as reducers over plain data: no DOM,
 * no Shiny, no workspace state. vets.js is the adapter: it turns DOM facts
 * (a stamp drawn, a picker reloading or loaded, an input bound, where focus
 * is) into observations, holds each gate's state, and performs the effects the
 * reducer returns. R owns the traces: tests/test_roundtrip_rules.R replays
 * DRAWER_GATE_FIXTURE, CANVAS_GATE_FIXTURE and TEXT_EDITOR_FIXTURE through
 * this file in node, tests/test_copy_request.R COPY_REQUEST_FIXTURE and
 * COPY_ROUTE_FIXTURE (copyRequest), and tests/test_control_kinds.R
 * BOX_VERDICT_FIXTURE (commitBox, a box's verdict). Each reducer is pure and never
 * mutates its input: reducer(state, observation) -> {state, effects}, a new
 * state object and an array of effects. Observations and effects are plain
 * objects with a `type`. Beside the gates sit two pure functions of what
 * crosses the bridge around them: drawerReport (what an opening reports, over
 * the drawer gate's reads; DRAWER_REPORT_FIXTURE) and chromeAttributes (R's
 * chrome facts as an attribute list; CHROME_ATTRIBUTES_FIXTURE).
 *
 * Interface (window.vetsRoundtripRules / module.exports):
 *
 * drawerGate(state, observation) -> {state, effects}: the staged drawer's gate
 *   (#257 focus owed, #303 the Name reload and Apply, #375 stale renders, #368
 *   the picker's focus, #554 a date box's own widget) and the drawer's one
 *   focus decision after it renders (#609, ADR 0147: a new card sheet, a
 *   closed sheet's opener, the control that held focus, by the focus key R
 *   stamps as data-focus-key; a keyboard-moved row's handle is that control;
 *   the formula sheet; the drawer's opener once it has closed).
 *   drawerGate.initial() -> a fresh state;
 *   drawerGate.reads(state, {id, disabled, slot}) -> whether a snapshot
 *   (sd_change, sd_submit, ws_close_drawer, ws_drawer_snapshot) reads that
 *   field: it is not disabled, not a picker whose list is reloading, and not
 *   inside a slot drawn stale (slot: the id of the slot output it sits in, or
 *   null).
 *
 *   State:
 *     open           the drawer column is open
 *     focus_allowed  the open asked for focus (the vets-drawer message's focus)
 *     focus_owed     an opening owes focus to the form's target
 *     generation     the current opening's stamp: the panel's
 *                    data-dialog-generation, null when the panel carries none
 *     name_restore   the form restores a Name (data-name-restore): Apply and
 *                    Enter in Name wait for the Name picker
 *     name_settled   the Name picker's reload has settled (its load event, a
 *                    failed or empty list included)
 *     apply_awaits   this opening's footer is drawn marked data-awaits-name
 *                    and not yet released
 *     reloading      ids of pickers whose server-side list is reloading (sorted)
 *     stale          slot ids drawn with a stamp that is not `generation` (sorted)
 *     placing        a panel render has begun and its focus decision waits
 *                    for its markup (a drawn pass naming drawer_panel)
 *     refocus        the focus key the focused control carried when the panel
 *                    began to render, or null
 *     opener         the focus key a closed card sheet owes focus back to (its
 *                    opener is keyed by the sheet's kind), or null
 *     formula_owed   the formula sheet began to render and owes focus once drawn
 *     returning      the drawer has closed: its opener takes focus back after
 *                    the closed drawer's next pass
 *
 *   Observations:
 *     {type:'open', focus}          the drawer opens (or is re-opened on a new
 *                                   target); focus false: owe nothing
 *     {type:'close'}                the drawer closes; also cancels focus owed
 *                                   (Esc before the form arrives)
 *     {type:'panel_render', focused}
 *                                   R is re-rendering #drawer_panel (shiny:value,
 *                                   the markup not yet in the DOM); focused: the
 *                                   data-focus-key of the control in it that
 *                                   holds focus (null or absent: none)
 *     {type:'formula_render'}       R is re-rendering the formula sheet
 *     {type:'form_drawn', generation, name_restore}
 *                                   the panel on screen carries this stamp
 *                                   (null: a panel with no opening)
 *     {type:'slot_drawn', slot, stamp, awaits_name}
 *                                   a slot output's content is on screen; stamp
 *                                   is the data-dialog-generation it carries
 *                                   (null: empty or unstamped); awaits_name:
 *                                   it holds #sd_apply[data-awaits-name]
 *     {type:'picker_reload', picker, generation}
 *                                   Shiny cleared a picker's options to reload
 *                                   its server-side list
 *     {type:'picker_loaded', picker, generation, rows}
 *                                   the picker's load event (rows null: failed)
 *     {type:'submit'}               Add/Apply clicked, or Enter in Name
 *     {type:'field_change', field, picker, blank, rechecked, slot, widget}
 *                                   a form field changed; picker is its id when
 *                                   it is a selectize, else null; slot the slot
 *                                   output it sits in, or null; widget true:
 *                                   the field's own widget set it (a date box's
 *                                   binding, not a typed date or a pick from its
 *                                   open calendar; #554)
 *     {type:'sheet', to, from}      a card sheet was asked for (to: its kind,
 *                                   null closes the open one) while `from` (a
 *                                   kind, or null) is open
 *     {type:'drawn', focus, target, sheet, keys, sheet_keys, formula, outputs}
 *                                   one pass of the drawer render sequence
 *                                   (vets.js, ADR 0147), the moment focus is
 *                                   decided: focus 'opener' | 'body' | 'inside'
 *                                   | 'sheet' | 'formula' | 'other' (where it is
 *                                   now: the drawer's opener, nowhere, the
 *                                   drawer, its open card sheet, the formula
 *                                   sheet, elsewhere), target 'ready' |
 *                                   'unbound' | 'none' (the form's first
 *                                   field), sheet the open card sheet's kind or
 *                                   null, keys / sheet_keys the focus keys
 *                                   that can take focus in the drawer / in that
 *                                   sheet, formula whether a formula sheet is
 *                                   drawn, outputs the ids of the outputs whose
 *                                   markup this pass saw replaced
 *     {type:'picker_rebuilt', held, active}
 *                                   a catalog picker's setValue returned; held:
 *                                   its input had focus before; active 'picker'
 *                                   | 'body' | 'other' has it after
 *
 *   Effects:
 *     {type:'focus'}                focus the form's target
 *     {type:'focus_key', key}       focus the control carrying that focus key
 *                                   (the open sheet's copy first; a control in
 *                                   a closed menu: the menu's summary)
 *     {type:'focus_sheet'}          focus the open card sheet's entry: a
 *                                   popover's first shown box, else the sheet
 *     {type:'focus_formula'}        focus the formula sheet's first empty
 *                                   input picker, else its field
 *     {type:'focus_opener'}         focus the control that opened the drawer
 *     {type:'focus_picker'}         focus the rebuilt picker again (#368)
 *     {type:'hold_slot', slot}      draw the slot's stamped nodes disabled and
 *                                   aria-busy, visible, marked data-stale-render
 *     {type:'release_apply'}        enable the #sd_apply marked data-awaits-name
 *     {type:'send_submit'}          validate the dates and send sd_submit
 *     {type:'report'}               send sd_change for the field
 *     {type:'recheck'}              observe the field again a microtask later
 *                                   with rechecked true (Shiny's reload blanks
 *                                   the value before it clears the options)
 *
 * canvasGate(state, observation) -> {state, effects}: the canvas's gate (#384):
 *   the version seal, the held drawer route, the pending request, the card and
 *   page reveal, the layout transport and the held live capture (#441).
 *   canvasGate.initial(drawn) -> a fresh state, `drawn` being the canvas's
 *   data-ws-version as R's markup rendered it (omitted: no canvas);
 *   canvasGate.sealed(state) -> the version a canvas
 *   gesture may start at (the last vets-diag version, once the canvas is drawn
 *   at it), else null; canvasGate.ready(state) -> the sealed version once no
 *   chart is resizing or syncing and no capture, route, request or transport command is
 *   held or in flight, else null: the adapter publishes it as
 *   data-canvas-ready, the one verdict drivers wait on (ADR 0113);
 *   canvasGate.REFUSAL_TTL -> how long a round-trip refusal
 *   stays readable, in ms. R's traces: canvas_sheets.R's CANVAS_GATE_FIXTURE.
 *
 *   State:
 *     lastVersion    the last vets-diag version (null before the first)
 *     drawn          the version the canvas is drawn at: '' while a sheet
 *                    reconfiguration has cleared the seal, null with no
 *                    canvas; the canvas's data-ws-version mirrors it
 *     frame          the seal token of the latest version
 *     sequence       the 'layout-N' request counter
 *     held           one drawer-route payload waiting for the reseal, or null
 *     pending        the request waiting for its acknowledgement and for the
 *                    drawn version to reach it, or null: {request, keyboard,
 *                    scroll, result, awaiting_page}
 *     reveal         the card to reveal once drawn, or null: {id, version,
 *                    awaiting}
 *     transport      the layout transport, one request in flight at a time:
 *                    {queue: [{name, payload}], current: {name, payload,
 *                    result} or null, sequence (the 'command-N' counter)}
 *     resizing       indexes of the charts between Highcharts' resize and
 *                    endResize, one entry per setSize (duplicates allowed)
 *     capture        the live capture waiting for settled charts and the
 *                    seal at its version, or null: {job, plan, version}
 *     syncing        card charts R created whose chart_ready R has not
 *                    answered yet: [{id, generation}] (the widget's output id
 *                    and render generation; ADR 0113)
 *
 *   Observations:
 *     {type:'version', version}     vets-diag arrived after an R flush
 *     {type:'seal', token, canvas, gesture, modal}
 *                                   two frames after `version`: whether the
 *                                   canvas exists, a gesture is live, a modal
 *                                   is open
 *     {type:'invalidate'}           a sheet or grid was reconfigured
 *     {type:'route', payload, canvas, gesture, modal}
 *                                   an ids-only command (vetsSubmitLayout)
 *     {type:'release', payload, scroll}
 *                                   a drag released over a target; scroll:
 *                                   the canvas's scrollTop
 *     {type:'queue', name, payload} vetsEvent handed over ws_layout (a layout
 *                                   command or a page-text request)
 *     {type:'ack', result}          vets-layout-result arrived
 *     {type:'reveal_card', id, version}
 *                                   vets-reveal-card (id null clears)
 *     {type:'select', id}           vets-active: another card's reveal is dropped
 *     {type:'measured', card, ready} or {type:'measured', page, ready}
 *                                   the adapter's answer to an await
 *     {type:'feedback_expired'}     the refusal's lifetime ended
 *     {type:'chart', index, id, phase}
 *                                   Highcharts fired phase 'resize' |
 *                                   'endResize' | 'destroy' on chart `index`,
 *                                   drawn in the element `id` (a destroy also
 *                                   ends that chart's syncing)
 *     {type:'chart_rendered', id, generation}
 *                                   a card chart widget rendered R's chart and
 *                                   sent chart_ready: syncing until answered
 *     {type:'chart_synced', id, generation}
 *                                   vets-chart-synced: R has handled that
 *                                   chart_ready and sent any mutation before
 *     {type:'capture', job, plan, version}
 *                                   vets-capture-exhibit arrived (#441): it
 *                                   runs once no chart is resizing or syncing and the
 *                                   canvas is sealed (or no version has come)
 *                                   at `version`, the one R captured the
 *                                   export at, or later (#450)
 *     {type:'cancel_capture', job}  vets-cancel-composition arrived (#451):
 *                                   a held capture of that job is dropped,
 *                                   unanswered
 *
 *   Effects, performed in order:
 *     {type:'cancel_gesture', reason}   cancel the live gesture, if any
 *     {type:'clear_feedback'}       remove the refusal feedback, if any
 *     {type:'schedule_seal', token} observe `seal` two animation frames later
 *     {type:'draw_version', version}    set the canvas's data-ws-version
 *     {type:'sync_chrome'}          redraw the New page tail and Layout target
 *     {type:'send', name, payload}  Shiny.setInputValue, priority event
 *     {type:'event', name, payload} hand a command to vetsEvent, which queues
 *                                   it back here
 *     {type:'pending_started', request, keyboard}
 *                                   mark data-layout-pending (a gesture's
 *                                   data-layout-gesture too)
 *     {type:'await', card} or {type:'await', page}
 *                                   measure on the next animation frame
 *     {type:'scroll_to_card', id}   scroll the canvas to the revealed card
 *     {type:'revealed_card', id}    mark data-revealed-card
 *     {type:'remove_targets', request}  remove the gesture's page targets
 *     {type:'scroll_to_page', page} scroll the canvas to the revealed page
 *     {type:'scroll_restore', top}  restore the canvas's scrollTop
 *     {type:'settled', request}     mark data-layout-settled; nothing pending
 *     {type:'show_refusal', request, reason, ttl}
 *                                   show R's reason on the ghost; observe
 *                                   feedback_expired after ttl ms
 *     {type:'remove_layer', request}    remove the gesture's layer
 *     {type:'page_text_result', result} hand the result to the text editor
 *     {type:'capture', job, plan, version}
 *                                   take the live capture now (after the
 *                                   seal's other effects)
 *     {type:'capture_dropped', job} a later capture replaced this held one:
 *                                   answer its job with an error
 *
 * drawerReport(input) -> payload (#482, ADR 0123): what an
 *   opening reports on close (ws_close_drawer) or before a navigation
 *   (ws_drawer_snapshot), from plain observations of the drawer's controls,
 *   with one coercion and one gate read (drawerGate.reads). Not a reducer: a
 *   pure function of its input. R's cases: drawer_form.R's
 *   DRAWER_REPORT_FIXTURE; the export roots' field tables are ui_cards.R's
 *   EXPORT_ROOT_FIELDS, which R renders on each root as data-kept-fields.
 *
 *   An observation of one control is {id, name, kind, value, checked,
 *   disabled, slot[, field]}: id and name its own ('' when none), kind one of
 *   'details' | 'date' | 'checkbox' | 'radio' | 'switch' | 'number' |
 *   'button' | 'text' (a select or textarea is 'text'), value its raw value
 *   (a disclosure's open state, a date wrapper's input text or null, a
 *   switch's aria-checked), checked a box's or radio's state, slot the slot
 *   output it is drawn in or null, field its data-dialog-field key.
 *
 *   input = {at, reason, generation, gate, exports, series}:
 *     gate          the drawer gate's state (its reloading and stale lists)
 *     exports       [{dialog, card, generation, slot, fields, observations}]:
 *                   each data-kept-dialog root; card null when it names none;
 *                   fields R's table [{key, id, kind}]
 *     series        null, or {generation, observations} for the Series form
 *   payload = {at, generation, reason, fields, series}: fields holds
 *   card_export ({[card,] generation, fields: {dialog: {key: value}}} from the
 *   live export roots, or null); series {generation, fields: {key: value}} or
 *   null.
 *   drawerReport.value(observation) -> the one coercion.
 *   drawerReport.series(series, gate) -> {generation, fields} (sd_change,
 *     sd_submit read the Series form through it).
 *   drawerReport.dialogClose(root, reason, gate) -> ws_dialog_close's payload
 *     {dialog, card (null when none), reason, generation, fields}.
 *   drawerReport.navigates(declared, name) -> whether vetsEvent snapshots the
 *     open drawer before sending `name`: declared is #vets_app's
 *     data-navigates ({events, click, change}, ui_events.R).
 *
 * chromeAttributes(facts) -> [{selector, attr, value}] (#485, ADR 0124
 *   provisional): the shell's chrome from R's vets-chrome facts
 *   {drawer_kind, drawer_cid, selected: {cid, iid, page}, layout_page,
 *   all_pages, save_tab} (chrome_facts.R): the drawer column's data-drawer-kind, the
 *   rail's pressed rows (SAVE project on any Save tab, ADR 0136), the card whose drawer is open, #vets_app's
 *   data-selected-*, the selected chip on the canvas (the card drawer's
 *   legend is not marked) and the Layout drawer's target sheets.
 *   The adapter applies the list in order to every element each selector
 *   matches: an attr starting with '.' toggles that class (value true or
 *   false), any other sets the attribute's text, or removes it for null.
 *   Resets come before the marks they clear. R's cases: chrome_facts.R's
 *   CHROME_ATTRIBUTES_FIXTURE.
 * textEditor(state, observation) -> {state, effects}: the page text editor
 *   (#483, ADR 0122): one open field, its style bar, and the
 *   text and style requests it has sent and R has not yet acknowledged. Every
 *   request is ws_layout {command:'text', page, fields, request_id}, page 0
 *   included (R maps page 0's title and footnote to the workspace's); the
 *   canvas gate's transport sends them one at a time and hands each result
 *   back (its page_text_result effect). textEditor.initial() -> a fresh state;
 *   textEditor.FIELDS -> the fields a page's text payload paints, in order.
 *   R's traces: exhibit_text.R's TEXT_EDITOR_FIXTURE. vets.js measures,
 *   paints and handles contenteditable; it keeps no request, flag or style.
 *
 *   State:
 *     active         the open field, or null: {edit (its number), page,
 *                    field, original (R's text when it opened), style (the
 *                    bar's), drawn (R's latest style for it), style_pending
 *                    (its style requests not yet acknowledged)}
 *     edits          the edit counter
 *     sequence       the 'text-N' request counter
 *     requests       the requests awaiting their result, in the order sent:
 *                    [{request, edit, page, field, style}] (style: a style
 *                    request, else a text one)
 *     hover          the field showing the hover outline, or null: {page, field}
 *
 *   Observations:
 *     {type:'begin', page, field, value, style, text}
 *                                   open a field (a click, focus, its prompt,
 *                                   or vetsEditPageText): page its text page
 *                                   (null outside one), value and style its
 *                                   data-text-value and data-text-style (style
 *                                   null: not drawn by R yet), text the open
 *                                   field's normalised text (null: none open);
 *                                   an open field is committed first
 *     {type:'finish', text}         commit the open field (Enter, blur, a click
 *                                   outside) with its normalised text
 *     {type:'cancel'}               close it unsent (Escape through the
 *                                   ladder's canvas_text rung, or R removed it)
 *     {type:'style', key, value, accepted}
 *                                   a bar control: bold, italic, align (value
 *                                   left / center / right) or size; accepted:
 *                                   the size passes textSize. A key the open
 *                                   field's style lacks (the timestamp's
 *                                   align) sends nothing
 *     {type:'page_text', text, version}
 *                                   vets-page-text's payload for one page
 *     {type:'result', result}       a vets-layout-result the transport handed
 *                                   back (any command's; others are ignored)
 *     {type:'hover', page, field, empty}
 *                                   the pointer is over this field (field
 *                                   null: over none); empty: data-text-empty
 *
 *   Effects, performed in order:
 *     {type:'hide_hover'}           remove the hover outline
 *     {type:'show_hover', page, field}  outline the hovered field
 *     {type:'open', page, field}    make the field editable, draw its bar and
 *                                   ring, mark data-text-editing, focus it
 *     {type:'refresh_bar', style}   press the bar's toggles and alignment,
 *                                   fill its size
 *     {type:'close', page, field}   end editing: no bar, ring or editing mark
 *     {type:'requested', request}   mark the canvas's data-text-request
 *     {type:'send', name, payload}  hand the request to vetsEvent
 *     {type:'show_text', page, field, text}
 *                                   show the sent text until R answers
 *     {type:'restore', page, fields}    show R's text in those fields
 *     {type:'paint', text, version} write R's page text into the fields'
 *                                   data attributes and inline style
 *     {type:'size_note', refused}   show or clear the refused size's reason
 *     {type:'committed', request, outcome}
 *                                   mark data-text-committed and -outcome
 *
 * copyRequest(state, observation) -> {state, effects}: one clipboard request
 *   (#610, ADR 0143). Every copy (Copy PNG, the Series drawer's and the Save
 *   drawer Data tab's Copy values, Copy record, a vets-copy no click opened)
 *   is a request opened inside the click with a mime type (text/plain |
 *   image/png) and a feedback kind (label | toast) under an id minted here
 *   ('copy-N'), and settled by R's one answer naming that id (vets-copy
 *   {text, request}; a Copy PNG job's vets-export-ready {clipboard}), or
 *   dropped when a newer request opens or R does not answer within
 *   COPY.timeout_ms. copyRequest.initial() -> a fresh state;
 *   copyRequest.route(state, capability, mime) -> 'clipboard' | 'textarea' |
 *   'download': the one capability check. The async clipboard takes the
 *   request (a promised ClipboardItem) in a secure context with
 *   navigator.clipboard.write and ClipboardItem, where ClipboardItem.supports
 *   does not refuse the mime, the clipboard-write permission is not denied and
 *   no write of the mime was refused on this page; else the mime's fallback
 *   (COPY.fallback). capability {secure, clipboard_write, clipboard_item,
 *   supported, permission} (supported, permission: null where the browser
 *   cannot say). copyRequest.button(state, capability, copied) -> {mode
 *   ('copy' | 'save'), label}: Copy PNG's button, copy mode where an
 *   image/png request takes the clipboard; copied reads Copied in copy mode
 *   only. copyRequest.awaiting(state, id) -> whether the open request is `id`
 *   and still waits for R's answer. copyRequest.COPY -> {fallback, feedback,
 *   timeout_ms, feedback_ms, labels, toasts}, copy_request.R's
 *   COPY_REQUEST_CONSTANTS. R's cases: copy_request.R's COPY_REQUEST_FIXTURE
 *   and COPY_ROUTE_FIXTURE. vets.js reads the capability, holds each open
 *   request's promise and data, and performs the effects; it keeps no rule.
 *
 *   State:
 *     sequence       the 'copy-N' counter
 *     pending        the open request, or null: {id, mime, feedback, key (the
 *                    button whose label shows it, or null), route, data (R's
 *                    answer, or the text in hand, has arrived)}
 *     refused        mime types the browser refused a write of (sorted)
 *
 *   Observations:
 *     {type:'open', mime, feedback, key, capability, data}
 *                                   a click opens a request; capability is
 *                                   the browser's for that mime; data true:
 *                                   the text is in hand (Copy record, a
 *                                   vets-copy no request names), so nothing is
 *                                   asked of R
 *     {type:'arrived', id}          R's answer for id is in hand (vets-copy's
 *                                   text; the Copy PNG job's staged bytes)
 *     {type:'written', id}          the clipboard write resolved
 *     {type:'refused', id}          the clipboard write was rejected
 *     {type:'fell_back', id, ok}    the fallback ran: the textarea's copy
 *                                   command answered ok; a download is ok
 *     {type:'failed', id}           R's answer cannot be had (the staged PNG's
 *                                   fetch failed)
 *     {type:'timeout', id}          the request's timer ran out
 *
 *   Effects, performed in order:
 *     {type:'write', id, mime}      now, inside the click: write one
 *                                   ClipboardItem whose `mime` data is a
 *                                   promise for the request's data
 *     {type:'ask', id}              send the clicked control's event with
 *                                   request id; null: no request (Save PNG,
 *                                   an ordinary download)
 *     {type:'arm', id, ms}          start the request's timer
 *     {type:'resolve', id}          settle the write's promise with the data
 *     {type:'fallback', id, route}  copy the data the fallback way: textarea
 *                                   (select it in a textarea, run copy) or
 *                                   download (save the bytes as a file)
 *     {type:'drop', id}             reject the write's promise, forget the data
 *     {type:'outcome', id, mime, key, state, route}
 *                                   the request's end (state copied | saved |
 *                                   failed), for drivers
 *     {type:'label', key}           the key's button reads Copied for a while
 *     {type:'toast', level, text}   show a toast (level ok | warn)
 *     {type:'paint'}                repaint the Copy PNG buttons' mode
 *
 * commitBox(state, observation) -> {state, effects}: a box that commits when
 *   it is left (ADR 0148, #612): a card's title, footnote and axis titles, the
 *   Series drawer's label, Opacity and Custom colour, the Transform tab's
 *   boxes, the card's Periods, a comparison column's name. R declares what
 *   the box commits (its onchange, behind vetsBox), the value it shows again
 *   (data-committed) and how it reads its text (data-box, control_kinds.R's
 *   box_declaration); this is the one verdict of every such box. The state is
 *   the box as R declared it, rebuilt by vets.js from its markup at each
 *   gesture; only `committed` changes. R's cases: control_kinds.R's
 *   BOX_VERDICT_FIXTURE, replayed by tests/test_control_kinds.R.
 *
 *   State:
 *     committed      the value R committed: what the box shows again on Esc
 *                    or a refused text (R's echo and the box's own commits
 *                    keep it current)
 *     value          how the text is read: text (as typed), trimmed (without
 *                    the spaces around it), number (within min, max and step;
 *                    no step is step 1, 'any' none; the step counts from min,
 *                    else 0), date (yyyy-mm-dd, a real calendar day), colour
 *                    (lower-cased)
 *     blank          commit (an empty box commits '') | revert
 *     invalid        revert (R's value again) | mark (the text kept, marked
 *                    invalid)
 *     enter          leave (Enter leaves the box, which commits it) | stay
 *                    (Enter commits, focus stays) | newline (Enter is text)
 *     min            the element's min, a number or null
 *     max            the element's max, a number or null
 *     step           the element's step, a number, 'any' or null
 *     pattern        the element's pattern, or null: it must match the whole
 *                    text, as the browser's own constraint reads it
 *
 *   Observations:
 *     {type:'change', text, bad}    a person changed the box (its change
 *                                   event: leaving it, a spinner, a calendar
 *                                   pick, Enter's own); bad: the browser could
 *                                   not read the typed number
 *     {type:'enter', text}          Enter in the box
 *     {type:'escape', text}         Esc in the box (the ladder's box rung):
 *                                   an edit in progress (text other than
 *                                   committed) is reverted and the box left;
 *                                   none: no effect, the key goes on down the
 *                                   ladder
 *     {type:'echo', text}           R set the box (an update's echo, the
 *                                   label R puts back)
 *     {type:'result', accepted, submitted, previous, text}
 *                                   R answered this element's latest request;
 *                                   previous is the last accepted text. A
 *                                   refusal restores it unless typing changed.
 *     {type:'widget', text}         the box's own widget set it (a date box's
 *                                   calendar or binding): neither R nor a
 *                                   person
 *
 *   Effects, performed in order:
 *     {type:'commit', value}        the box shows value and its declared
 *                                   commit runs, reading it
 *     {type:'show', value}          the box shows value (R's again)
 *     {type:'invalid', on}          mark the box invalid or not (aria-invalid)
 *     {type:'leave'}                focus leaves the box
 *     {type:'change'}               run the box's change now (Enter where
 *                                   focus stays)
 *
 * The adapter tables (#503, ADR 0149). Each reducer above exports its
 *   vocabulary, reducer.OBSERVATIONS and reducer.EFFECTS (frozen lists; R's
 *   traces observe and expect exactly these), and vets.js registers every
 *   table of handlers through one checked helper here, so no test reads
 *   vets.js to see that an effect is handled:
 *
 *   table(name, keys[, entries]) -> a registry over the list `keys`:
 *     {name, keys (a frozen copy), add(key, value) -> the table, get(key) -> value or null,
 *     missing() -> the keys with nothing registered, in list order}. add
 *     throws for a key off the list, a second registration or no value; get
 *     for a key off the list. With `entries` (an object) every entry is added
 *     and a key left without one throws at once.
 *   adapter(name, reducer, handlers) -> table(name, reducer.EFFECTS,
 *     handlers), every handler a function, plus observe(state, observation)
 *     -> reducer(state, observation), throwing for an observation off
 *     reducer.OBSERVATIONS, and perform(effect, context) -> the effect's
 *     handler's value, handler(effect, context).
 *   ESCAPE_LADDER, DRAWER_RENDERING, DRAWER_RENDERED -> the ordered lists of
 *     vets.js's two registries: the Escape ladder's rungs (ADR 0107) and the
 *     drawer render sequence's steps before and after a render (ADR 0147).
 *     The rungs and steps stay in vets.js (DOM dispatch); their order is here,
 *     held in node by tests/test_escape_ladder.R and tests/test_drawer_render.R.
 *   commitBox's table serves every box: vets.js passes the box's element as
 *   the context. The boot smoke asks the page (window.vetsAdapterTables) that every
 *   vocabulary exported here has one complete table (tools/smoke_boot.R);
 *   tests/test_adapter_tables.R holds the helper and the vocabularies.
 *
 * ES5, like vets.js; loaded before it by ui_shell.R.
 */
(function (root) {
  'use strict';

  function has(list, x) { return list.indexOf(x) >= 0; }
  function added(list, x) { return has(list, x) ? list.slice() : list.concat([x]).sort(); }
  function removed(list, x) { return list.filter(function (y) { return y !== x; }); }

  /* ==== drawerGate (#383) ===================================================== */

  var NAME_PICKER = 'sd_mnemonic';
  var SERIES_FOOTER = 'drawer_series_footer';
  var DRAWER_PANEL = 'drawer_panel';
  var FORMULA_SHEET = 'formula_sheet';

  function drawerInitial() {
    return {open: false, focus_allowed: true, focus_owed: false, generation: null,
      name_restore: false, name_settled: false, apply_awaits: false, reloading: [], stale: [],
      placing: false, refocus: null, opener: null, formula_owed: false, returning: false};
  }
  function drawerCopy(s) {
    return {open: s.open, focus_allowed: s.focus_allowed, focus_owed: s.focus_owed,
      generation: s.generation, name_restore: s.name_restore, name_settled: s.name_settled,
      apply_awaits: s.apply_awaits, reloading: s.reloading.slice(), stale: s.stale.slice(),
      placing: s.placing, refocus: s.refocus, opener: s.opener, formula_owed: s.formula_owed,
      returning: s.returning};
  }
  function focusKey(key) { return typeof key === 'string' && key ? key : null; }
  // An opening that restores a Name holds Add/Apply until its picker settles.
  function nameUnsettled(s) { return s.name_restore && !s.name_settled; }
  // A drawn footer that awaits the Name is released once the Name has settled.
  function releaseIfSettled(s, effects) {
    if (s.apply_awaits && !nameUnsettled(s)) {
      s.apply_awaits = false;
      effects.push({type: 'release_apply'});
    }
  }
  function forgetOpening(s) {
    s.name_settled = false; s.apply_awaits = false; s.reloading = []; s.stale = [];
  }
  function currentPicker(s, o) { return s.open && o.generation === s.generation; }

  // One focus effect of a drawn pass: whatever else was owed is settled by it.
  function focusTaken(s, effects, effect) {
    s.focus_owed = false; s.placing = false; s.refocus = null; s.opener = null;
    effects.push(effect);
  }
  // The drawer's one focus decision after it renders (#609, ADR 0147), in
  // order: the closed drawer's opener; the formula sheet its render drew; a
  // panel render's own decision once its markup is drawn (an open card sheet
  // takes focus: the box of it that held focus, else its entry; else a closed
  // sheet's opener; else the control that held focus); last, focus owed to a
  // new form (#257). Focus the analyst put elsewhere is never taken.
  function drawnFocus(s, o, effects) {
    var place = o.focus, keys = o.keys || [], outputs = o.outputs || [];
    if (!s.open) {
      if (s.returning) {
        s.returning = false;
        if (place === 'body') effects.push({type: 'focus_opener'});
      }
      return;
    }
    if (s.formula_owed && has(outputs, FORMULA_SHEET)) {
      s.formula_owed = false;
      if (o.formula && place !== 'formula') { focusTaken(s, effects, {type: 'focus_formula'}); return; }
    }
    if (s.placing) {
      if (!has(outputs, DRAWER_PANEL)) return;             // the render's own markup is not drawn yet
      var refocus = s.refocus, opener = s.opener, effect = null;
      s.placing = false; s.refocus = null; s.opener = null;
      if (place !== 'other' && place !== 'formula') {
        if (o.sheet) {
          if (place !== 'sheet') effect = refocus && has(o.sheet_keys || [], refocus) ?
            {type: 'focus_key', key: refocus} : {type: 'focus_sheet'};
        } else if (opener && has(keys, opener)) effect = {type: 'focus_key', key: opener};
        else if (refocus && has(keys, refocus)) effect = {type: 'focus_key', key: refocus};
      }
      if (effect) { focusTaken(s, effects, effect); return; }
    }
    if (!s.focus_owed) return;
    if (place !== 'body' && place !== 'opener') { s.focus_owed = false; return; }
    if (o.target !== 'ready') return;                      // still owed
    s.focus_owed = false;
    effects.push({type: 'focus'});
  }

  function drawerGate(state, o) {
    var s = drawerCopy(state), effects = [];
    switch (o.type) {
      case 'open':
        s.open = true;
        s.focus_allowed = o.focus !== false;
        s.focus_owed = s.focus_allowed;
        s.returning = false;
        break;
      case 'close':
        var allowed = s.focus_allowed;
        s = drawerInitial();
        s.focus_allowed = allowed;
        s.returning = true;
        break;
      case 'panel_render':
        // A re-render replaces the focused field and the pickers: the new
        // Name picker reloads again and Apply waits again; focus is placed
        // once the new markup is drawn.
        s.focus_owed = s.open && s.focus_allowed;
        forgetOpening(s);
        s.placing = true;
        s.refocus = focusKey(o.focused);
        break;
      case 'formula_render':
        s.formula_owed = true;
        break;
      case 'sheet':
        // Closing the open sheet owes focus to its opener, keyed by its kind.
        s.opener = o.to === null || o.to === undefined ? focusKey(o.from) : null;
        break;
      case 'form_drawn':
        if (o.generation !== s.generation) forgetOpening(s);
        s.generation = o.generation;
        s.name_restore = !!o.name_restore;
        break;
      case 'slot_drawn':
        if (o.stamp !== null && o.stamp !== undefined && s.generation !== null && o.stamp !== s.generation) {
          // A stale render: held every time it is seen, the nodes may be new.
          s.stale = added(s.stale, o.slot);
          effects.push({type: 'hold_slot', slot: o.slot});
          break;
        }
        s.stale = removed(s.stale, o.slot);
        if (o.slot === SERIES_FOOTER) {
          s.apply_awaits = !!o.awaits_name;
          releaseIfSettled(s, effects);
        }
        break;
      case 'picker_reload':
        if (!currentPicker(s, o)) break;
        s.reloading = added(s.reloading, o.picker);
        if (o.picker === NAME_PICKER) s.name_settled = false;
        break;
      case 'picker_loaded':
        // A failed (rows null) or empty list settles too: Apply is never stranded.
        if (!currentPicker(s, o)) break;
        s.reloading = removed(s.reloading, o.picker);
        if (o.picker === NAME_PICKER) {
          s.name_settled = true;
          releaseIfSettled(s, effects);
        }
        break;
      case 'submit':
        if (s.open && !nameUnsettled(s)) effects.push({type: 'send_submit'});
        break;
      case 'field_change':
        if (o.widget === true) break;                        // the widget's own value (#554)
        if (o.picker && has(s.reloading, o.picker)) break;   // the reload's blank, not the analyst's
        if (o.slot && has(s.stale, o.slot)) break;           // a stale render's value
        if (o.picker && o.blank && !o.rechecked) effects.push({type: 'recheck'});
        else effects.push({type: 'report'});
        break;
      case 'drawn':
        drawnFocus(s, o, effects);
        break;
      case 'picker_rebuilt':
        // Only focus the picker held and lost to <body>, and only while open.
        if (o.held && o.active === 'body' && s.open) effects.push({type: 'focus_picker'});
        break;
    }
    return {state: s, effects: effects};
  }
  drawerGate.initial = drawerInitial;
  drawerGate.OBSERVATIONS = Object.freeze(['open', 'close', 'panel_render', 'formula_render', 'form_drawn',
    'slot_drawn', 'picker_reload', 'picker_loaded', 'submit', 'field_change', 'sheet', 'drawn', 'picker_rebuilt']);
  drawerGate.EFFECTS = Object.freeze(['focus', 'focus_key', 'focus_sheet', 'focus_formula', 'focus_opener',
    'focus_picker', 'hold_slot', 'release_apply', 'send_submit', 'report', 'recheck']);
  drawerGate.reads = function (state, field) {
    return !field.disabled && !has(state.reloading, field.id) &&
      !(field.slot && has(state.stale, field.slot));
  };

  /* ==== end drawerGate ======================================================== */

  /* ==== canvasGate (#384) ===================================================== */

  var CANVAS_REFUSAL_TTL = 1800;

  // A shallow copy with `changes` applied: the input state is never mutated.
  function copy(record, changes) {
    var out = {}, k;
    for (k in record) if (Object.prototype.hasOwnProperty.call(record, k)) out[k] = record[k];
    for (k in changes) if (Object.prototype.hasOwnProperty.call(changes, k)) out[k] = changes[k];
    return out;
  }

  function canvasInitial(drawn) {
    return {lastVersion: null, drawn: drawn === undefined ? null : drawn, frame: 0, sequence: 0,
      held: null, pending: null, reveal: null, transport: {queue: [], current: null, sequence: 0},
      resizing: [], capture: null, syncing: []};
  }

  // The canvas is drawn at `version` or later ('' and null are never reached).
  function reached(drawn, version) {
    return drawn !== null && drawn !== undefined && drawn !== '' && Number(drawn) >= Number(version);
  }

  function canvasSealed(state) {
    return state && state.lastVersion !== null && state.drawn === state.lastVersion ? state.lastVersion : null;
  }

  // The one verdict drivers wait on (ADR 0113): the sealed version once no
  // chart is resizing and nothing is held, pending or in the transport.
  function canvasReady(state) {
    var v = canvasSealed(state);
    if (v === null) return null;
    var t = state.transport;
    if (state.resizing.length || state.syncing.length || state.capture || state.held || state.pending || t.current ||
        t.queue.length) return null;
    return v;
  }

  // The layout transport: one request in flight, the rest in order behind it.
  function transport(s, changes) { s.transport = copy(s.transport, changes); }
  function pump(s, effects) {
    var t = s.transport;
    if (t.current || !t.queue.length) return;
    var next = t.queue[0];
    transport(s, {queue: t.queue.slice(1), current: {name: next.name, payload: next.payload, result: null}});
    effects.push({type: 'send', name: next.name, payload: next.payload});
  }
  function enqueue(s, name, payload, effects) {
    var t = s.transport, sequence = t.sequence, p = copy(payload);
    if (!p.request_id) p.request_id = 'command-' + (++sequence);
    transport(s, {queue: t.queue.concat([{name: name, payload: p}]), sequence: sequence});
    pump(s, effects);
  }
  // A request's result is handed on once the canvas is drawn at its version.
  function drain(s, effects) {
    var current = s.transport.current;
    if (!current || !current.result || !reached(s.drawn, current.result.version)) return;
    transport(s, {current: null});
    effects.push({type: 'page_text_result', result: current.result});
    pump(s, effects);
  }

  // A drawer route carries ids only: it waits for the reseal instead of being
  // dropped, but never overtakes a gesture, a modal or a pending request.
  function route(s, payload, facts, effects) {
    if (!facts.canvas || facts.gesture || facts.modal || s.pending || s.lastVersion === null) return;
    if (s.drawn !== s.lastVersion) { s.held = payload; return; }
    var p = copy(payload);
    s.sequence += 1;
    p.request_id = 'layout-' + s.sequence;
    s.pending = {request: p.request_id, keyboard: true, scroll: null, result: null, awaiting_page: false};
    effects.push({type: 'clear_feedback'});
    effects.push({type: 'pending_started', request: p.request_id, keyboard: true});
    effects.push({type: 'event', name: 'ws_layout', payload: p});
  }

  // The reveal and the pending request, against the drawn version. `measure`
  // holds the adapter's answer to an await: {card: bool} or {page: bool}.
  function settle(s, measure, effects) {
    var r = s.reveal;
    if (r && reached(s.drawn, r.version)) {
      if (measure.card === true) {
        s.reveal = null;
        effects.push({type: 'scroll_to_card', id: r.id});
        effects.push({type: 'revealed_card', id: r.id});
      } else if (!r.awaiting) {
        s.reveal = copy(r, {awaiting: true});
        effects.push({type: 'await', card: r.id});
      }
    }
    var p = s.pending;
    if (!p || !p.result || !reached(s.drawn, p.result.version)) return;
    var m = p.result, superseded = s.drawn !== String(m.version), revealed = null;
    if (!superseded && !p.keyboard && m.outcome === 'applied' && m.reveal_page) {
      // A page exists only with its first rendered placement; its grid may
      // arrive after the acknowledgement.
      if (measure.page !== true) {
        if (!p.awaiting_page) {
          s.pending = copy(p, {awaiting_page: true});
          effects.push({type: 'await', page: Number(m.reveal_page)});
        }
        return;
      }
      revealed = Number(m.reveal_page);
    }
    s.pending = null;
    effects.push({type: 'remove_targets', request: p.request});
    // A second edit may share the flush: then no scroll restore and no refusal.
    if (revealed !== null) effects.push({type: 'scroll_to_page', page: revealed});
    else if (!superseded && !p.keyboard) effects.push({type: 'scroll_restore', top: p.scroll});
    effects.push({type: 'settled', request: m.request_id});
    if (p.keyboard) return; // R's notice is a route's only refusal feedback
    if (m.outcome === 'refused' && !superseded)
      effects.push({type: 'show_refusal', request: p.request, reason: m.reason, ttl: CANVAS_REFUSAL_TTL});
    else effects.push({type: 'remove_layer', request: p.request});
  }

  // A live capture copies each chart as it is drawn at rest (#441, ADR 0110):
  // once no chart is between Highcharts' resize and endResize and the canvas
  // is drawn at the last version (or no version has arrived yet), and at the
  // version R captured the export at or later (#450, ADR 0113): R sends the
  // capture before its own flush's vets-diag, while the canvas is still sealed
  // at the previous version.
  function captureReady(s) {
    var v = s.capture ? s.capture.version : null;
    return s.resizing.length === 0 && s.syncing.length === 0 && (s.lastVersion === null ||
      (canvasSealed(s) !== null && (v === null || v === undefined || reached(s.drawn, v))));
  }
  function releaseCapture(s, effects) {
    if (!s.capture || !captureReady(s)) return;
    effects.push({type: 'capture', job: s.capture.job, plan: s.capture.plan, version: s.capture.version});
    s.capture = null;
  }
  // Highcharts counts one resize per setSize and fires one endResize for each.
  // A destroyed chart takes its resizes and its pending chart_ready answer.
  function chartPhase(s, index, phase, id) {
    var at = s.resizing.indexOf(index);
    if (phase === 'resize') s.resizing = s.resizing.concat([index]);
    else if (phase === 'endResize' && at >= 0) s.resizing = s.resizing.slice(0, at).concat(s.resizing.slice(at + 1));
    else if (phase === 'destroy' && at >= 0) s.resizing = removed(s.resizing, index);
    if (phase === 'destroy' && id) s.syncing = unsynced(s.syncing, id);
  }
  // R creates a card chart with its flush's definition and mutates it only
  // once the widget's chart_ready arrives (ADR 0113): until R answers that
  // render (vets-chart-synced), the chart may lag the captured version.
  function unsynced(list, id, generation) {
    return list.filter(function (x) {
      return x.id !== id || (generation !== undefined && Number(x.generation) > Number(generation));
    });
  }

  function canvasGate(state, o) {
    var s = copy(state || canvasInitial()), effects = [];
    switch (o && o.type) {
      case 'version':
        if (o.version === undefined || o.version === null) break;
        if (s.lastVersion !== String(o.version)) {
          effects.push({type: 'cancel_gesture', reason: 'canvas version changed'});
          effects.push({type: 'clear_feedback'});
        }
        s.lastVersion = String(o.version);
        s.frame += 1;
        effects.push({type: 'schedule_seal', token: s.frame});
        break;
      case 'seal':
        if (o.token !== s.frame || !o.canvas) break;
        s.drawn = s.lastVersion;
        effects.push({type: 'draw_version', version: s.drawn});
        settle(s, {}, effects);
        effects.push({type: 'sync_chrome'});
        drain(s, effects);
        if (s.held) {
          var held = s.held;
          s.held = null;
          route(s, held, o, effects);
        }
        releaseCapture(s, effects);
        break;
      case 'invalidate':
        s.drawn = '';
        effects.push({type: 'draw_version', version: ''});
        effects.push({type: 'cancel_gesture', reason: 'canvas changed'});
        break;
      case 'route':
        route(s, o.payload, o, effects);
        break;
      case 'release':
        var payload = copy(o.payload);
        s.sequence += 1;
        payload.request_id = 'layout-' + s.sequence;
        s.pending = {request: payload.request_id, keyboard: false, scroll: o.scroll, result: null,
          awaiting_page: false};
        effects.push({type: 'pending_started', request: payload.request_id, keyboard: false});
        effects.push({type: 'event', name: 'ws_layout', payload: payload});
        break;
      case 'queue':
        enqueue(s, o.name, o.payload, effects);
        break;
      case 'ack':
        var result = o.result || {}, current = s.transport.current;
        if (current && current.payload.request_id === result.request_id) {
          transport(s, {current: copy(current, {result: result})});
          drain(s, effects);
        }
        if (s.pending && s.pending.request === result.request_id) {
          s.pending = copy(s.pending, {result: result});
          settle(s, {}, effects);
        }
        break;
      case 'reveal_card':
        s.reveal = o.id ? {id: o.id, version: o.version, awaiting: false} : null;
        if (s.reveal) settle(s, {}, effects);
        break;
      case 'select':
        if (s.reveal && s.reveal.id !== o.id) s.reveal = null;
        break;
      case 'measured':
        if (o.card !== undefined && o.card !== null) {
          if (!s.reveal || s.reveal.id !== o.card || !s.reveal.awaiting) break;
          s.reveal = copy(s.reveal, {awaiting: false});
          settle(s, {card: o.ready === true}, effects);
        } else {
          var p = s.pending;
          if (!p || !p.awaiting_page || !p.result || Number(p.result.reveal_page) !== Number(o.page)) break;
          s.pending = copy(p, {awaiting_page: false});
          settle(s, {page: o.ready === true}, effects);
        }
        break;
      case 'feedback_expired':
        effects.push({type: 'clear_feedback'});
        break;
      case 'chart':
        chartPhase(s, o.index, o.phase, o.id);
        if (o.phase === 'endResize' || o.phase === 'destroy') releaseCapture(s, effects);
        break;
      case 'capture':
        if (s.capture) effects.push({type: 'capture_dropped', job: s.capture.job});
        s.capture = {job: o.job, plan: o.plan, version: o.version};
        releaseCapture(s, effects);
        break;
      case 'chart_rendered':
        s.syncing = unsynced(s.syncing, o.id).concat([{id: o.id, generation: o.generation}]);
        break;
      case 'chart_synced':
        s.syncing = unsynced(s.syncing, o.id, o.generation);
        releaseCapture(s, effects);
        break;
      case 'cancel_capture':
        // R has cancelled the job (#451): nothing to answer.
        if (s.capture && s.capture.job === o.job) s.capture = null;
        break;
    }
    return {state: s, effects: effects};
  }
  canvasGate.initial = canvasInitial;
  canvasGate.sealed = canvasSealed;
  canvasGate.ready = canvasReady;
  canvasGate.REFUSAL_TTL = CANVAS_REFUSAL_TTL;
  canvasGate.OBSERVATIONS = Object.freeze(['version', 'seal', 'invalidate', 'route', 'release', 'queue', 'ack',
    'reveal_card', 'select', 'measured', 'feedback_expired', 'chart', 'chart_rendered', 'chart_synced', 'capture',
    'cancel_capture']);
  canvasGate.EFFECTS = Object.freeze(['cancel_gesture', 'clear_feedback', 'schedule_seal', 'draw_version',
    'sync_chrome', 'send', 'event', 'pending_started', 'await', 'scroll_to_card', 'revealed_card', 'remove_targets',
    'scroll_to_page', 'scroll_restore', 'settled', 'show_refusal', 'remove_layer', 'page_text_result', 'capture',
    'capture_dropped']);

  /* ==== end canvasGate ======================================================== */


  /* ==== drawerReport (#482) =================================================== */

  // The one coercion of a drawer control's observation (ADR 0108's rule, moved
  // here from vets.js): a disclosure its open state, a checkbox its checked
  // state, a switch its aria-checked, a number a number (blank is null), a date
  // wrapper its input's text (null without one), anything else its value.
  function reportValue(o) {
    switch (o.kind) {
      case 'details': return o.value === true;
      case 'checkbox': return o.checked === true;
      case 'switch': return o.value === 'true';
      case 'number':
        if (o.value === null || o.value === undefined || o.value === '') return null;
        var n = Number(o.value);
        return isNaN(n) ? null : n;
      default: return o.value === undefined ? null : o.value;
    }
  }
  function reportReads(gate, o, disabled) {
    return drawerGate.reads(gate, {id: o.id, disabled: disabled, slot: o.slot || null});
  }
  // The Series form's fields by their data-dialog-field key; a disabled field
  // is left out too (#303: R keeps the draft's value).
  function reportSeries(series, gate) {
    if (!series) return null;
    var fields = {};
    series.observations.forEach(function (o) {
      if (reportReads(gate, o, o.disabled === true)) fields[o.field] = reportValue(o);
    });
    return {generation: series.generation, fields: fields};
  }
  function first(list, test) {
    for (var i = 0; i < list.length; i++) if (test(list[i])) return list[i];
    return null;
  }
  // An export root's fields by R's table (ui_cards.R EXPORT_ROOT_FIELDS):
  // `value` one control by id, `choice` / `number_choice` the checked radio of
  // a name (null when none), `choices` every checked box of a name.
  function reportDialog(root, gate) {
    if (!root.fields) return null;
    var read = root.observations.filter(function (o) { return reportReads(gate, o, false); });
    var out = {};
    root.fields.forEach(function (f) {
      if (f.kind === 'value') {
        var o = first(read, function (x) { return x.id === f.id; });
        out[f.key] = o ? reportValue(o) : null;
      } else if (f.kind === 'choice' || f.kind === 'number_choice') {
        var c = first(read, function (x) { return x.name === f.id && x.kind === 'radio' && x.checked === true; });
        out[f.key] = c ? (f.kind === 'number_choice' ? Number(c.value) : c.value) : null;
      } else if (f.kind === 'choices') {
        out[f.key] = read.filter(function (x) { return x.name === f.id && x.checked === true; })
          .map(function (x) { return x.value; });
      }
    });
    return out;
  }
  function staleRoot(root, gate) { return !!root.slot && has(gate.stale || [], root.slot); }
  // The mounted export roots (the card Export group, or a Save drawer's form):
  // the first live root names the card (omitted when it carries none) and the
  // generation; a root drawn in a stale slot is not read. None: null.
  function reportExports(roots, gate) {
    var live = roots.filter(function (r) { return !staleRoot(r, gate); });
    if (!live.length) return null;
    var out = {};
    if (live[0].card !== null && live[0].card !== undefined) out.card = live[0].card;
    out.generation = live[0].generation;
    out.fields = {};
    live.forEach(function (r) { out.fields[r.dialog] = reportDialog(r, gate); });
    return out;
  }

  function drawerReport(input) {
    var gate = input.gate || drawerInitial();
    return {at: input.at, generation: input.generation, reason: input.reason,
      fields: {card_export: reportExports(input.exports || [], gate)}, series: reportSeries(input.series || null, gate)};
  }
  drawerReport.value = reportValue;
  drawerReport.series = function (series, gate) { return reportSeries(series, gate || drawerInitial()); };
  drawerReport.dialogClose = function (root, reason, gate) {
    return {dialog: root.dialog, card: root.card || null, reason: reason, generation: root.generation,
      fields: reportDialog(root, gate || drawerInitial())};
  };
  // The events that owe the open drawer a snapshot first (ui_events.R's
  // navigates flag, rendered as #vets_app[data-navigates]).
  drawerReport.navigates = function (declared, name) {
    return !!declared && (declared.events || []).indexOf(name) >= 0;
  };

  /* ==== end drawerReport ====================================================== */


  /* ==== chromeAttributes (#485) =============================================== */

  function cssValue(x) { return String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"'); }
  function chromeAttributes(facts) {
    var f = facts || {}, kind = f.drawer_kind || '', sel = f.selected || {}, ops = [];
    function op(selector, attr, value) { ops.push({selector: selector, attr: attr, value: value}); }
    op('#vets_drawer', 'data-drawer-kind', kind);
    op('#ws_add_dialog', 'aria-pressed', String(kind === 'add'));
    op('#ws_upload_button', 'aria-pressed', String(kind === 'import'));
    op('#ws_layout_open', 'aria-pressed', String(kind === 'layout'));
    op('#ws_save_open', 'aria-pressed', String(!!f.save_tab));   // any Save tab (ADR 0136)
    op('.ws-card[data-drawer-target]', 'data-drawer-target', null);
    if (kind === 'collection' && f.drawer_cid)
      op('.ws-card[data-collection-id="' + cssValue(f.drawer_cid) + '"]', 'data-drawer-target', '');
    op('#vets_app', 'data-selected-cid', sel.cid || '');
    op('#vets_app', 'data-selected-iid', sel.iid || '');
    op('#vets_app', 'data-selected-page', sel.page === null || sel.page === undefined ? '' : String(sel.page));
    op('.ws-chip--selected', '.ws-chip--selected', false);
    if (sel.cid && sel.iid)
      op('.vets-main .ws-chip[data-collection-id="' + cssValue(sel.cid) + '"][data-instance-id="' + cssValue(sel.iid) + '"]',
        '.ws-chip--selected', true);
    op('#vets_canvas .ws-exhibit-sheet.is-layout-target', '.is-layout-target', false);
    if (f.layout_page !== null && f.layout_page !== undefined && f.layout_page !== '')
      op(f.all_pages ? '#vets_canvas .ws-exhibit-sheet[data-exhibit-page]' :
        '#vets_canvas [data-exhibit-page="' + cssValue(f.layout_page) + '"]', '.is-layout-target', true);
    return ops;
  }

  /* ==== end chromeAttributes ================================================== */

  /* ==== textEditor (#483) ===================================================== */

  // The fields a page's text payload paints, in the order the adapter repaints them.
  var TEXT_FIELDS = ['title', 'subtitle', 'security_stamp', 'footnote', 'timestamp'];

  function textInitial() {
    return {active: null, edits: 0, sequence: 0, requests: [], hover: null};
  }
  function textCopy(s) {
    return {active: s.active ? copy(s.active) : null, edits: s.edits, sequence: s.sequence,
      requests: s.requests.slice(), hover: s.hover};
  }
  function styleCopy(style) { return style ? copy(style) : style; }
  function same(a, page, field) { return !!a && a.page === page && a.field === field; }
  // A field whose text is on its way to R: its node shows the sent text until
  // the acknowledgement, and it cannot be opened again before then.
  function textPending(s, page, field) {
    return s.requests.some(function (r) { return !r.style && r.page === page && r.field === field; });
  }
  function textRequest(s, edit, fields, style, effects) {
    s.sequence += 1;
    var id = 'text-' + s.sequence;
    s.requests = s.requests.concat([{request: id, edit: edit.edit, page: edit.page, field: edit.field, style: style}]);
    if (style) s.active = copy(s.active, {style_pending: s.active.style_pending + 1});
    effects.push({type: 'requested', request: id});
    effects.push({type: 'send', name: 'ws_layout',
      payload: {command: 'text', page: edit.page, fields: fields, request_id: id}});
  }
  function textFinish(s, commit, text, effects) {
    var edit = s.active;
    s.active = null;
    effects.push({type: 'close', page: edit.page, field: edit.field});
    if (commit && edit.field !== 'timestamp' && text !== null && text !== undefined && text !== edit.original) {
      var fields = {};
      fields[edit.field] = text;
      textRequest(s, edit, fields, false, effects);
      effects.push({type: 'show_text', page: edit.page, field: edit.field, text: text});
    } else effects.push({type: 'restore', page: edit.page, fields: [edit.field]});
  }
  // R's text for one page: paint it, redraw every field that is neither open
  // nor waiting for its own acknowledgement, and hand the open field R's style
  // unless a style of its own is still on its way.
  function textPaint(s, text, version, effects, done) {
    effects.push({type: 'paint', text: text, version: version});
    var page = text.page, fields = TEXT_FIELDS.filter(function (f) {
      return !same(s.active, page, f) && !textPending(s, page, f);
    });
    if (fields.length) effects.push({type: 'restore', page: page, fields: fields});
    fields.forEach(function (f) { done.restored[page + ':' + f] = true; });
    if (s.active && s.active.page === page && text.text_styles && text.text_styles[s.active.field]) {
      s.active = copy(s.active, {drawn: styleCopy(text.text_styles[s.active.field])});
      if (!s.active.style_pending) {
        s.active = copy(s.active, {style: styleCopy(s.active.drawn)});
        effects.push({type: 'refresh_bar', style: styleCopy(s.active.style)});
        done.refreshed = true;
      }
    }
  }

  function textEditor(state, o) {
    var s = textCopy(state || textInitial()), effects = [], done = {restored: {}, refreshed: false};
    switch (o && o.type) {
      case 'begin':
        if (same(s.active, o.page, o.field)) break;
        if (s.hover) { s.hover = null; effects.push({type: 'hide_hover'}); }
        if (s.active) textFinish(s, true, o.text, effects);
        if (o.page === null || o.page === undefined || !o.style || textPending(s, o.page, o.field)) break;
        s.edits += 1;
        s.active = {edit: s.edits, page: o.page, field: o.field, original: o.value || '',
          style: styleCopy(o.style), drawn: styleCopy(o.style), style_pending: 0};
        effects.push({type: 'open', page: o.page, field: o.field});
        effects.push({type: 'refresh_bar', style: styleCopy(o.style)});
        break;
      case 'finish':
        if (s.active) textFinish(s, true, o.text, effects);
        break;
      case 'cancel':
        if (s.active) textFinish(s, false, null, effects);
        break;
      case 'style':
        if (!s.active || !(o.key in s.active.style)) break;
        if (o.key === 'size') {
          effects.push({type: 'size_note', refused: !o.accepted});
          if (!o.accepted) break;
        }
        if (s.active.style[o.key] === o.value) break;
        var style = copy(s.active.style), patch = {}, styles = {};
        style[o.key] = o.value;
        s.active = copy(s.active, {style: style});
        patch[o.key] = o.value;
        styles[s.active.field] = patch;
        textRequest(s, s.active, {text_styles: styles}, true, effects);
        effects.push({type: 'refresh_bar', style: styleCopy(style)});
        break;
      case 'page_text':
        textPaint(s, o.text, o.version, effects, done);
        break;
      case 'result':
        var m = o.result || {}, r = null;
        s.requests = s.requests.filter(function (x) {
          if (x.request !== m.request_id) return true;
          r = x;
          return false;
        });
        if (!r) break;  // another command's result, or one already handled
        var mine = s.active && s.active.edit === r.edit;
        if (r.style && mine) s.active = copy(s.active, {style_pending: s.active.style_pending - 1});
        if (m.text) textPaint(s, m.text, m.version, effects, done);
        // A refusal puts back the last text R supplied; R's notice says why.
        if (!same(s.active, r.page, r.field) && !textPending(s, r.page, r.field) && !done.restored[r.page + ':' + r.field])
          effects.push({type: 'restore', page: r.page, fields: [r.field]});
        if (mine && !s.active.style_pending && !done.refreshed) {
          s.active = copy(s.active, {style: styleCopy(s.active.drawn)});
          effects.push({type: 'refresh_bar', style: styleCopy(s.active.style)});
        }
        effects.push({type: 'committed', request: r.request, outcome: m.outcome});
        break;
      case 'hover':
        var field = o.field || null;
        if (s.hover && !same(s.hover, o.page, field)) { s.hover = null; effects.push({type: 'hide_hover'}); }
        if (!s.active && !s.hover && field && o.empty === false) {
          s.hover = {page: o.page, field: field};
          effects.push({type: 'show_hover', page: o.page, field: field});
        }
        break;
    }
    return {state: s, effects: effects};
  }
  textEditor.initial = textInitial;
  textEditor.FIELDS = TEXT_FIELDS.slice();
  textEditor.OBSERVATIONS = Object.freeze(['begin', 'finish', 'cancel', 'style', 'page_text', 'result', 'hover']);
  textEditor.EFFECTS = Object.freeze(['hide_hover', 'show_hover', 'open', 'refresh_bar', 'close', 'requested', 'send',
    'show_text', 'restore', 'paint', 'size_note', 'committed']);

  /* ==== end textEditor ======================================================== */

  /* ==== copyRequest (#610) ===================================================== */

  // What R shares with the reducer: copy_request.R's COPY_REQUEST_CONSTANTS.
  var COPY = {
    fallback: {'text/plain': 'textarea', 'image/png': 'download'},
    feedback: ['label', 'toast'],
    timeout_ms: 120000,
    feedback_ms: 2000,
    labels: {copy: 'Copy PNG', save: 'Save PNG', copied: 'Copied'},
    toasts: {copied: 'Copied to clipboard', failed: 'Copy failed — select and copy manually'}
  };

  function copyInitial() { return {sequence: 0, pending: null, refused: []}; }
  function copyStateCopy(s) {
    return {sequence: s.sequence, pending: s.pending ? copy(s.pending) : null, refused: s.refused.slice()};
  }
  function copyMime(mime) { return Object.prototype.hasOwnProperty.call(COPY.fallback, mime); }
  // The one capability check.
  function copyRoute(state, c, mime) {
    var refused = (state || copyInitial()).refused;
    var able = !!c && c.secure === true && c.clipboard_write === true && c.clipboard_item === true &&
      c.supported !== false && c.permission !== 'denied' && !has(refused, mime);
    return able ? 'clipboard' : COPY.fallback[mime];
  }
  function copyButton(state, c, copied) {
    var mode = copyRoute(state, c, 'image/png') === 'clipboard' ? 'copy' : 'save';
    return {mode: mode, label: COPY.labels[mode === 'copy' && copied === true ? 'copied' : mode]};
  }
  function copyAwaiting(state, id) {
    var p = state && state.pending;
    return !!p && p.id === id && !p.data;
  }
  // The data is in hand: settle the open write, or copy it the fallback way.
  function copyDeliver(p, effects) {
    effects.push(p.route === 'clipboard' ? {type: 'resolve', id: p.id} : {type: 'fallback', id: p.id, route: p.route});
  }
  // The request's end: its outcome, then what the analyst sees.
  function copyEnd(p, state, effects) {
    effects.push({type: 'outcome', id: p.id, mime: p.mime, key: p.key, state: state, route: p.route});
    if (state === 'failed') effects.push({type: 'toast', level: 'warn', text: COPY.toasts.failed});
    else if (state === 'copied') effects.push(p.feedback === 'label' ? {type: 'label', key: p.key} :
      {type: 'toast', level: 'ok', text: COPY.toasts.copied});
  }

  function copyRequest(state, o) {
    var s = copyStateCopy(state || copyInitial()), effects = [], p = s.pending;
    var mine = !!p && !!o && o.id === p.id;
    switch (o && o.type) {
      case 'open':
        if (!copyMime(o.mime) || !has(COPY.feedback, o.feedback)) break;
        var route = copyRoute(s, o.capability, o.mime), data = o.data === true;
        // A PNG the clipboard cannot take is Save PNG: an ordinary download.
        if (route === 'download' && !data) { effects.push({type: 'ask', id: null}); break; }
        if (p) effects.push({type: 'drop', id: p.id});
        s.sequence += 1;
        p = s.pending = {id: 'copy-' + s.sequence, mime: o.mime, feedback: o.feedback,
          key: o.key === undefined ? null : o.key, route: route, data: data};
        if (route === 'clipboard') effects.push({type: 'write', id: p.id, mime: p.mime});
        if (data) copyDeliver(p, effects);
        else effects.push({type: 'ask', id: p.id}, {type: 'arm', id: p.id, ms: COPY.timeout_ms});
        break;
      case 'arrived':
        if (!mine || p.data) break;
        p = s.pending = copy(p, {data: true});
        copyDeliver(p, effects);
        break;
      case 'written':
        if (!mine) break;
        s.pending = null;
        copyEnd(p, 'copied', effects);
        break;
      case 'refused':
        // A dropped request's rejection is the drop's, not the browser's.
        if (!mine || p.route !== 'clipboard') break;
        s.refused = added(s.refused, p.mime);
        p = s.pending = copy(p, {route: COPY.fallback[p.mime]});
        effects.push({type: 'paint'});
        if (p.data) copyDeliver(p, effects);
        break;
      case 'fell_back':
        if (!mine) break;
        s.pending = null;
        copyEnd(p, p.route === 'download' ? 'saved' : o.ok === true ? 'copied' : 'failed', effects);
        break;
      case 'failed':
        // R reports its own failure; the request ends without a toast.
        if (!mine) break;
        s.pending = null;
        effects.push({type: 'drop', id: p.id},
          {type: 'outcome', id: p.id, mime: p.mime, key: p.key, state: 'failed', route: p.route});
        break;
      case 'timeout':
        if (!mine) break;
        s.pending = null;
        effects.push({type: 'drop', id: p.id});
        break;
    }
    return {state: s, effects: effects};
  }
  copyRequest.initial = copyInitial;
  copyRequest.route = copyRoute;
  copyRequest.button = copyButton;
  copyRequest.awaiting = copyAwaiting;
  copyRequest.COPY = COPY;
  copyRequest.OBSERVATIONS = Object.freeze(['open', 'arrived', 'written', 'refused', 'fell_back', 'failed', 'timeout']);
  copyRequest.EFFECTS = Object.freeze(['write', 'ask', 'arm', 'resolve', 'fallback', 'drop', 'outcome', 'label',
    'toast', 'paint']);

  /* ==== end copyRequest ======================================================= */

  /* ==== commitBox (ADR 0148) ================================================= */

  var BOX_NUMBER = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/;
  var BOX_DATE = /^\d{4}-\d{2}-\d{2}$/;
  function boxCopy(b) {
    return {committed: b.committed == null ? '' : String(b.committed), value: b.value, blank: b.blank,
      invalid: b.invalid, enter: b.enter, min: b.min == null ? null : b.min, max: b.max == null ? null : b.max,
      step: b.step == null ? null : b.step, pattern: b.pattern == null ? null : b.pattern};
  }
  function boxNumber(text, b) {
    if (!BOX_NUMBER.test(text)) return false;
    var v = Number(text);
    if (!isFinite(v)) return false;
    if (typeof b.min === 'number' && v < b.min) return false;
    if (typeof b.max === 'number' && v > b.max) return false;
    if (b.step === 'any') return true;
    var step = typeof b.step === 'number' && b.step > 0 ? b.step : 1;
    var n = (v - (typeof b.min === 'number' ? b.min : 0)) / step;
    return Math.abs(n - Math.round(n)) <= 1e-9 * Math.max(1, Math.abs(n));
  }
  function boxDate(text) {
    if (!BOX_DATE.test(text)) return false;
    var d = new Date(text + 'T00:00:00Z');
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === text;
  }
  // What a box's text is worth: {value} to commit, {blank: true} or {invalid: true}.
  function boxRead(b, text, bad) {
    if (bad) return {invalid: true};
    if (b.pattern && text !== '' && !new RegExp('^(?:' + b.pattern + ')$').test(text)) return {invalid: true};
    var v = b.value === 'text' ? text : text.trim();
    if (v === '') return {blank: true};
    if (b.value === 'number' && !boxNumber(v, b)) return {invalid: true};
    if (b.value === 'date' && !boxDate(v)) return {invalid: true};
    return {value: b.value === 'colour' ? v.toLowerCase() : v};
  }

  function commitBox(state, o) {
    var s = boxCopy(state || {}), effects = [];
    var mark = s.invalid === 'mark', committed = s.committed;
    var text = o && o.text != null ? String(o.text) : '';
    switch (o && o.type) {
      case 'result':
        // The adapter matches the request and supplies the last R-accepted
        // value. A refusal corrects the revert target without erasing typing
        // that happened after the submission.
        s.committed = o.accepted ? o.submitted : o.previous;
        if (!o.accepted && text === o.submitted) effects.push({type: 'show', value: s.committed});
        if (mark && text === o.submitted) effects.push({type: 'invalid', on: false});
        break;
      case 'echo':
        s.committed = text;
        break;
      case 'escape':
        // Only an edit in progress is the box's: Esc in a box that holds R's
        // value goes on down the ladder (the drawer closes).
        if (text === committed) break;
        effects.push({type: 'show', value: committed});
        if (mark) effects.push({type: 'invalid', on: false});
        effects.push({type: 'leave'});
        break;
      case 'enter':
        if (s.enter === 'leave') effects.push({type: 'leave'});
        else if (s.enter === 'stay') effects.push({type: 'change'});
        break;
      case 'change':
        var r = boxRead(s, text, !!o.bad);
        if (r.blank && s.blank === 'commit') r = {value: ''};
        if (r.value === undefined) {
          if (mark && r.invalid) effects.push({type: 'invalid', on: true});
          else if (text !== committed) effects.push({type: 'show', value: committed});
          break;
        }
        if (mark) effects.push({type: 'invalid', on: false});
        if (r.value === (s.value === 'colour' ? committed.toLowerCase() : committed)) {
          if (text !== committed) effects.push({type: 'show', value: committed});
          break;
        }
        s.committed = r.value;
        effects.push({type: 'commit', value: r.value});
        break;
    }
    return {state: s, effects: effects};
  }
  commitBox.OBSERVATIONS = Object.freeze(['change', 'enter', 'escape', 'echo', 'widget', 'result']);
  commitBox.EFFECTS = Object.freeze(['commit', 'show', 'invalid', 'leave', 'change']);

  /* ==== end commitBox ======================================================== */

  /* ==== adapter tables (#503) ================================================= */

  // The lists vets.js's two registries walk, in order: the Escape ladder's
  // rungs (ADR 0107) and the drawer render sequence's steps before and after a
  // render (ADR 0147).
  var ESCAPE_LADDER = Object.freeze(['dropdown', 'gesture', 'view_bar', 'canvas_text', 'box', 'chip_drag', 'drawer']);
  var DRAWER_RENDERING = Object.freeze(['calendars', 'gate']);
  var DRAWER_RENDERED = Object.freeze(['menus', 'gate', 'place_formula', 'place_popover', 'place_layout',
    'paint_copy', 'paint_formula', 'paint_provenance', 'paint_dialog', 'focus']);

  function own(object, key) { return Object.prototype.hasOwnProperty.call(object, key); }
  function table(name, keys, entries) {
    if (!Array.isArray(keys) || !keys.length) throw new Error(name + ': a table needs its list');
    var list = Object.freeze(keys.slice()), held = {};
    function known(key) { if (!has(list, key)) throw new Error(name + ': ' + key + ' is not on its list'); }
    var t = {
      name: name,
      keys: list,
      add: function (key, value) {
        known(key);
        if (own(held, key)) throw new Error(name + ': ' + key + ' is registered twice');
        if (value === undefined || value === null) throw new Error(name + ': ' + key + ' is registered with nothing');
        held[key] = value;
        return t;
      },
      get: function (key) { known(key); return own(held, key) ? held[key] : null; },
      missing: function () { return list.filter(function (key) { return !own(held, key); }); }
    };
    if (entries) {
      Object.keys(entries).forEach(function (key) { t.add(key, entries[key]); });
      var missing = t.missing();
      if (missing.length) throw new Error(name + ': nothing registered for ' + missing.join(', '));
    }
    return t;
  }
  function adapter(name, reducer, handlers) {
    var t = table(name, reducer && reducer.EFFECTS, handlers);
    Object.keys(handlers).forEach(function (key) {
      if (typeof handlers[key] !== 'function') throw new Error(name + ': ' + key + '\'s handler is not a function');
    });
    t.observe = function (state, o) {
      if (!o || !has(reducer.OBSERVATIONS, o.type))
        throw new Error(name + ': ' + (o && o.type) + ' is not one of its observations');
      return reducer(state, o);
    };
    t.perform = function (effect, context) { return t.get(effect.type)(effect, context); };
    return t;
  }

  /* ==== end adapter tables ==================================================== */

  var api = {
    drawerGate: drawerGate,
    canvasGate: canvasGate,
    drawerReport: drawerReport,
    chromeAttributes: chromeAttributes,
    textEditor: textEditor,
    copyRequest: copyRequest,
    commitBox: commitBox,
    table: table,
    adapter: adapter,
    ESCAPE_LADDER: ESCAPE_LADDER,
    DRAWER_RENDERING: DRAWER_RENDERING,
    DRAWER_RENDERED: DRAWER_RENDERED
  };
  root.vetsRoundtripRules = api;
  if (typeof module === 'object' && module && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
