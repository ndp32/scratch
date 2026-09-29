/* VETS Explorer — the formula field's lexical rules (ADR 0139).
 *
 * The browser half of the formula grammar (ADR 0135 d6): how the formula
 * sheet's field reads text as it is typed, as pure functions of plain data. No
 * DOM, no Shiny, no workspace state: vets.js is the adapter that reads the
 * field, calls these and writes the painted layer. R owns the vocabulary:
 * formula.R's grammar table renders it (formula_client_grammar) on the sheet's
 * field as data-formula-grammar, and every function here takes it as `grammar`
 * ({letters, functions, operators, typed, quotes, spaces, classes}), so this
 * file names no function, letter, operator or class of the grammar.
 * tests/test_formula_rules.R replays tokens in node against formula.R's
 * formula_tokens over R's test texts, and checks that paint gives each token
 * the class R's painter (ui_drawer.R's series_formula_header_ui) gives it.
 *
 * Validity is R's: this lexer never refuses. Where formula_tokens accepts a
 * text, tokens gives exactly its tokens (type, text, 1-based start and end,
 * and the value of a letter, function or operator) plus the runs of space
 * between them; where R refuses, it still covers every character, a name it
 * does not know as a `word` and a character it does not know as `other`.
 *
 * Interface (window.vetsFormulaRules / module.exports):
 *
 * tokens(text, grammar) -> [{type, text, start, end, value?}] in order, their
 *   texts together exactly `text`. type is number | letter | function |
 *   operator | open | close | comma | date | word | other | space; start and
 *   end are 1-based character positions, end inclusive, as R's marks are.
 *   value: a letter's capital, a function's lower-case name, the operator a
 *   typed symbol reads as (- reads as −, * as ×, ÷ as /). As R's tokenizer
 *   does (#577), directly inside a function's own parentheses a comma
 *   separates, so a number there stops at it; elsewhere thousands commas stay
 *   in the number, and a trailing comma is not the number's. A quote opens a
 *   date up to the next quote (to the end while it is unclosed).
 * tokenClass(type, grammar) -> the class R's table gives the type (other's
 *   for a type it lacks).
 * typedAs(ch, grammar) -> what a typed symbol is shown as (* → ×, - and – →
 *   −, ÷ → /), or null when it is shown as typed.
 * inQuote(text, at, grammar) -> whether offset `at` sits inside a quoted date
 *   (an odd number of quotes before it), where typing is left alone.
 * display(text, grammar) -> the text with every typed symbol shown, outside
 *   quoted dates (a paste).
 * paint(text, grammar, colors, marks) -> the painted layer's HTML: each token
 *   a span of its class (a letter's carries --vets-letter from colors, letter
 *   -> colour), each marked character wrapped in .vets-formula-err (marks:
 *   R's [{start, end}] for this very text; an insertion point, end < start,
 *   marks start), a caret-wide gap (a thin space) when a mark starts past the
 *   end, then a zero-width space, so the layer keeps a line's height and its
 *   trailing spaces wrap as the textarea's do.
 * keyInsert(key, before, grammar) -> {text, back}: what a key-row key inserts
 *   given the text before the caret: an operator spaced (no space before at
 *   the start or after a space), a function's key as is with the caret
 *   `back` characters from its end, just after its "(".
 */
(function (root) {
  'use strict';

  var ZERO_WIDTH_SPACE = String.fromCharCode(0x200b);
  // The caret-wide gap an insertion point past the end is marked with: a thin space.
  var GAP = String.fromCharCode(0x2009);
  var UNKNOWN_LETTER = '#667085';

  function has(list, x) { return !!list && list.indexOf(x) >= 0; }
  function own(map, key) { return !!map && Object.prototype.hasOwnProperty.call(map, key); }
  function isDigit(ch) { return ch >= '0' && ch <= '9'; }
  function isWordStart(ch) { return /^[A-Za-z_]$/.test(ch); }
  function isWordChar(ch) { return /^[A-Za-z0-9_]$/.test(ch); }
  function esc(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function tokens(text, grammar) {
    var g = grammar || {};
    var chars = Array.from(text == null ? '' : String(text));
    var n = chars.length, out = [], opened = [], i = 0, j;
    function slice(a, b) { return chars.slice(a, b + 1).join(''); }
    function add(type, a, b, value) {
      var t = {type: type, text: slice(a, b), start: a + 1, end: b + 1};
      if (value !== undefined) t.value = value;
      out.push(t);
    }
    // One entry per open parenthesis: true when it is a function's own.
    function inCall() { return opened.length > 0 && opened[opened.length - 1]; }
    function previous() {
      for (var k = out.length - 1; k >= 0; k--) if (out[k].type !== 'space') return out[k];
      return null;
    }
    while (i < n) {
      var ch = chars[i];
      if (has(g.spaces, ch)) {
        j = i;
        while (j + 1 < n && has(g.spaces, chars[j + 1])) j++;
        add('space', i, j);
        i = j + 1;
        continue;
      }
      if (isDigit(ch) || ch === '.') {
        j = i;
        while (j + 1 < n && (isDigit(chars[j + 1]) || chars[j + 1] === '.' || (chars[j + 1] === ',' && !inCall()))) j++;
        while (j > i && chars[j] === ',') j--;
        add('number', i, j);
        i = j + 1;
        continue;
      }
      if (has(g.quotes, ch)) {
        j = i + 1;
        while (j < n && !has(g.quotes, chars[j])) j++;
        add('date', i, Math.min(j, n - 1));
        i = j + 1;
        continue;
      }
      if (isWordStart(ch)) {
        j = i;
        while (j + 1 < n && isWordChar(chars[j + 1])) j++;
        var word = slice(i, j);
        if (has(g.functions, word.toLowerCase())) add('function', i, j, word.toLowerCase());
        else if (j === i && has(g.letters, word.toUpperCase())) add('letter', i, j, word.toUpperCase());
        else add('word', i, j);
        i = j + 1;
        continue;
      }
      if (own(g.typed, ch)) {
        add('operator', i, i, g.typed[ch]);
      } else if (ch === '(') {
        var last = previous();
        opened.push(!!last && last.type === 'function');
        add('open', i, i);
      } else if (ch === ')') {
        opened.pop();
        add('close', i, i);
      } else if (ch === ',') {
        add('comma', i, i);
      } else {
        add('other', i, i);
      }
      i++;
    }
    return out;
  }

  function tokenClass(type, grammar) {
    var classes = (grammar && grammar.classes) || {};
    return own(classes, type) ? classes[type] : classes.other;
  }

  function typedAs(ch, grammar) {
    var typed = grammar && grammar.typed;
    return own(typed, ch) && typed[ch] !== ch ? typed[ch] : null;
  }

  function inQuote(text, at, grammar) {
    var quotes = (grammar && grammar.quotes) || [], n = 0, s = String(text == null ? '' : text);
    for (var i = 0; i < at && i < s.length; i++) if (has(quotes, s[i])) n++;
    return n % 2 === 1;
  }

  function display(text, grammar) {
    var quotes = (grammar && grammar.quotes) || [], out = '', quoted = false;
    Array.from(String(text == null ? '' : text)).forEach(function (c) {
      if (has(quotes, c)) quoted = !quoted;
      var shown = quoted ? null : typedAs(c, grammar);
      out += shown === null ? c : shown;
    });
    return out;
  }

  function paint(text, grammar, colors, marks) {
    var chars = Array.from(String(text == null ? '' : text)), marked = [], gap = false;
    (marks || []).forEach(function (mk) {
      for (var k = mk.start; k <= Math.max(mk.end, mk.start) && k <= chars.length; k++) if (k >= 1) marked[k] = true;
      if (mk.start > chars.length) gap = true;
    });
    var html = tokens(text, grammar).map(function (t) {
      var inner = '', at = t.start;
      Array.from(t.text).forEach(function (c) {
        inner += marked[at] ? '<span class="vets-formula-err">' + esc(c) + '</span>' : esc(c);
        at++;
      });
      var cls = tokenClass(t.type, grammar);
      if (t.type === 'letter') {
        var color = (colors && colors[t.value]) || UNKNOWN_LETTER;
        return '<span class="' + cls + '" style="--vets-letter:' + color + '">' + inner + '</span>';
      }
      return '<span class="' + cls + '">' + inner + '</span>';
    }).join('');
    return html + (gap ? '<span class="vets-formula-err vets-formula-err--end">' + GAP + '</span>' : '') + ZERO_WIDTH_SPACE;
  }

  function keyInsert(key, before, grammar) {
    var g = grammar || {}, k = String(key), b = String(before == null ? '' : before);
    var call = /^([A-Za-z]+)\(/.exec(k);
    var open = call && has(g.functions, call[1].toLowerCase()) ? k.indexOf('(') + 1 : -1;
    var text = k;
    if (has(g.operators, k)) text = (!b || has(g.spaces, b[b.length - 1]) ? '' : ' ') + k + ' ';
    return {text: text, back: open > 0 ? k.length - open : 0};
  }

  var api = {
    tokens: tokens,
    tokenClass: tokenClass,
    typedAs: typedAs,
    inQuote: inQuote,
    display: display,
    paint: paint,
    keyInsert: keyInsert
  };
  root.vetsFormulaRules = api;
  if (typeof module === 'object' && module && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
