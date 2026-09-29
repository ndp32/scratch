/* VETS Explorer — the period axis and label geometry of every collection chart.
 * One implementation, three consumers: the screen widget (chart_render.R names
 * these functions in its Highcharts options), the off-screen export stage
 * (vets-export.js binds them, evaluating no serialized text) and the standalone
 * exhibit (r_exhibit.R inlines this file into the page head). ADRs 0021 (period-
 * centered labels), 0033/0034 (headings, live cards only), 0035 (decimal-aligned
 * y ticks), 0046/0047 (the year interval ladder). Pure functions of one chart:
 * no workspace state, no Shiny. Node loads it as a CommonJS module for tests.
 * The year step depends on the axis length. periodTicks records the length it
 * used (axis.vetsTickLen); render re-runs the positioner once, through a forced
 * redraw, when the settled length differs, so screen and export choose the
 * step from the same settled length (#342).
 * On a period axis (periodTicks built axis.vetsPeriods) periodLabel returns a
 * period label or ''; only axes under 45 days fall back to Highcharts' default
 * formatter (#366).
 * Minor ticks (#470): the axis option vetsFrequencies lists the known output
 * frequencies of the chart's series (chart_render.R). minorTickMonths maps the
 * finest of them to one unlabelled minor tick per period (monthly 1 month,
 * quarterly 3, semiannual 6; annual and unknown/daily none), kept only when it
 * is finer than the major step and at least MINOR_MIN_PX apart. periodTicks
 * stores the positions (axis.vetsMinorTicks: period boundaries, never a major
 * position) and hands them to Highcharts through the axis's
 * getMinorTickPositions. Display only: no data point moves. An empty list is
 * how a card with its minor_ticks display option off asks for none (ADR 0129).
 */
(function (root) {
  'use strict';

  // Calendar boundaries and period labels are separate: labels sit between
  // ticks. Tick density changes with zoom and width through the year ladder
  // (or wider when needed); labels remain centered in the named year.
  // Monthly/quarterly slots use equal year fractions. A label needs 58 px.
  var YEAR_STEPS = [1, 2, 4, 5, 10, 15, 20];
  var LABEL_MIN_PX = 58;
  // Highcharts positions ticks before the y-axis label reserve settles the plot
  // width, and re-runs the positioner only when the plot then changes by more
  // than 10 %. Smaller differences are settled in render; sub-pixel ones ignored.
  var TICK_LEN_EPSILON = 0.5;
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  // One minor tick per output period, in months; frequencies not listed get none.
  var MINOR_MONTHS = {12: 1, 4: 3, 2: 6};
  var MINOR_MIN_PX = 4;

  // The minor tick step in months for an axis whose major ticks are
  // majorMonths apart and which draws pxPerYear pixels per year, or null.
  function minorTickMonths(frequencies, majorMonths, pxPerYear) {
    var months = [].concat(frequencies == null ? [] : frequencies)
      .map(function (f) { return MINOR_MONTHS[Number(f)]; })
      .filter(function (m) { return typeof m === 'number'; });
    if (!months.length) return null;
    var step = Math.min.apply(null, months);
    if (step >= majorMonths || !(pxPerYear * step / 12 >= MINOR_MIN_PX)) return null;
    return step;
  }

  // Highcharts asks the axis for its minor positions when minorTickInterval is
  // set; a period axis answers with the ones periodTicks stored.
  function minorTickPositions() {
    return (this.vetsMinorTicks || []).slice();
  }

  function periodTicks() {
    var span = this.max - this.min, yearMs = 365.25 * 86400000;
    this.vetsPeriods = null;
    this.vetsTickLen = null;
    this.vetsMinorTicks = null;
    if (this.getMinorTickPositions === minorTickPositions) delete this.getMinorTickPositions;
    if (!isFinite(span) || span < 45 * 86400000) return;
    this.vetsTickLen = this.len;
    var step = span > 2 * yearMs ? 12 : span > 0.75 * yearMs ? 3 : 1;
    var first = new Date(this.min).getUTCFullYear(), last = new Date(this.max - 1).getUTCFullYear();
    var positions = [], periods = {};
    var skip = Math.max(1, Math.ceil((span / yearMs) * (12 / step) * LABEL_MIN_PX / Math.max(1, this.len)));
    var yearStep = 1;
    if (step === 12) {
      yearStep = YEAR_STEPS.filter(function (n) { return n >= skip; })[0] || Math.ceil(skip / 20) * 20;
    }
    for (var year = first; year <= last; year++) {
      if (step === 12 && year % yearStep !== 0 && year !== first) continue;
      var start = Date.UTC(year, 0, 1), end = Date.UTC(year + 1, 0, 1);
      for (var month = 0; month < 12; month += step) {
        var x = start + (end - start) * month / 12;
        var next = start + (end - start) * (month + step) / 12;
        var text = step === 12 ? String(year) : step === 3 ? year + 'Q' + (month / 3 + 1) : MONTHS[month] + ' ' + year;
        var index = year * (12 / step) + month / step;
        periods[x] = {end: next, text: (step === 12 ? year % yearStep === 0 : index % skip === 0) ? text : ''};
        positions.push(x);
      }
    }
    positions.push(Date.UTC(last + 1, 0, 1));
    var lower = 0, upper = positions.length - 1;
    for (var i = 0; i < positions.length; i++) {
      if (positions[i] <= this.min) lower = i;
      if (positions[i] >= this.max) { upper = i; break; }
    }
    this.vetsPeriods = periods;
    positions = positions.slice(lower, upper + 1).filter(function (x) { return x <= this.max; }, this);
    if (!positions.length || positions[positions.length - 1] < this.max) positions.push(this.max);
    var frequencies = this.options ? this.options.vetsFrequencies : null;
    var minor = minorTickMonths(frequencies, step === 12 ? 12 * yearStep : step, this.len * yearMs / span);
    this.minorTickInterval = minor ? minor * yearMs / 12 : null;
    if (minor) {
      var major = {}, minors = [];
      positions.forEach(function (x) { major[x] = true; });
      for (var y = first; y <= last; y++) {
        var from = Date.UTC(y, 0, 1), to = Date.UTC(y + 1, 0, 1);
        for (var m = 0; m < 12; m += minor) {
          var at = from + (to - from) * m / 12;
          if (at >= positions[0] && at <= this.max && !major[at]) minors.push(at);
        }
      }
      this.vetsMinorTicks = minors;
      this.getMinorTickPositions = minorTickPositions;
    }
    return positions;
  }

  // On a period axis every label is a period label or empty. A position with no
  // period (the closing boundary, which the equal-year-fraction max can put
  // partway through a day) keeps its tick mark but gets no label, whatever the
  // series type or padding (#366). Axes too short for period ticks keep
  // Highcharts' default labels.
  function periodLabel() {
    var periods = this.axis.vetsPeriods;
    if (!periods) return this.axis.defaultLabelFormatter.call(this);
    var period = periods[this.value];
    return period ? period.text : '';
  }

  // When a period axis chose its ticks at a length other than its settled one,
  // force that axis dirty and redraw once; the nested render sees the settled
  // length. The guard keeps one render cycle to one redraw. Returns whether it
  // redrew (the nested render has then done the rest of the work).
  function settleTickLength(chart) {
    if (chart.vetsSettlingTicks) return false;
    var stale = chart.xAxis.filter(function (axis) {
      return typeof axis.vetsTickLen === 'number' && typeof axis.len === 'number' &&
        Math.abs(axis.vetsTickLen - axis.len) > TICK_LEN_EPSILON;
    });
    if (!stale.length) return false;
    stale.forEach(function (axis) { axis.forceRedraw = true; });
    chart.vetsSettlingTicks = true;
    try { chart.redraw(false); } finally { chart.vetsSettlingTicks = false; }
    return true;
  }

  // Runs after every chart render, on screen and on the export stage. The chart's
  // own SVG geometry (period labels, tick marks, decimal-aligned y labels, axis
  // titles) is shared; the two DOM jobs (heading padding on the workspace card,
  // range buttons inside the plot) only apply to a live card.
  function render() {
    if (settleTickLength(this)) return;
    var card = this.renderTo.closest('.ws-card');
    var live = card && !this.renderer.forExport;
    if (live) {
      var head = card.querySelector('.ws-card-head');
      if (head) {
        if (root.vetsFitCardHeadings) root.vetsFitCardHeadings(head);
        var chartBox = this.renderTo.getBoundingClientRect(), headBox = head.getBoundingClientRect();
        // DOM rectangles include exhibit/card zoom; padding uses local CSS pixels.
        var headScale = head.offsetWidth ? headBox.width / head.offsetWidth : 1;
        var chartScale = this.renderTo.offsetWidth ? chartBox.width / this.renderTo.offsetWidth : 1;
        var plotLeft = chartBox.left + this.plotLeft * chartScale;
        var plotRight = chartBox.left + (this.plotLeft + this.plotWidth) * chartScale;
        head.style.paddingLeft = Math.max(0, (plotLeft - headBox.left) / headScale) + 'px';
        head.style.paddingRight = Math.max(0, (headBox.right - plotRight) / headScale) + 'px';
      }
    }
    var ranges = this.rangeSelector;
    var rangePrototype = ranges && Object.getPrototypeOf(ranges);
    if (rangePrototype && !rangePrototype.vetsPositionInsidePlot) {
      rangePrototype.vetsPositionInsidePlot = function () {
        if (!this.group || !this.buttonGroup) return;
        var bounds = this.buttonGroup.getBBox(true), chart = this.chart;
        this.group.attr({translateX: 0, translateY: 0});
        this.buttonGroup.attr({
          translateX: chart.plotLeft + chart.plotWidth - bounds.x - bounds.width - 8,
          translateY: chart.plotTop + chart.plotHeight - bounds.y - bounds.height - 8
        });
      };
      root.Highcharts.wrap(rangePrototype, 'render', function (proceed) {
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));
        this.vetsPositionInsidePlot();
      });
    }
    if (ranges) ranges.vetsPositionInsidePlot();
    var chart = this;
    this.xAxis.forEach(function (axis) {
      if (axis.options.isInternal) return;
      Object.keys(axis.ticks).forEach(function (key) {
        var tick = axis.ticks[key];
        var atRightBorder = axis.toPixels(Number(key)) >= chart.plotLeft + chart.plotWidth - 1;
        if (tick.mark) tick.mark.attr({visibility: 'inherit'});
        var period = axis.vetsPeriods && axis.vetsPeriods[key];
        if (tick.label && period) {
          var center = axis.toPixels((Number(key) + period.end) / 2);
          var visible = center >= chart.plotLeft && center <= chart.plotLeft + chart.plotWidth;
          tick.label.attr({x: center, align: 'center', visibility: visible ? 'inherit' : 'hidden'});
        } else if (tick.label) tick.label.attr({visibility: atRightBorder ? 'hidden' : 'inherit'});
      });
    });
    var decimal = (this.options.lang && this.options.lang.decimalPoint) || root.Highcharts.getOptions().lang.decimalPoint || '.';
    this.yAxis.forEach(function (axis) {
      // Align the implicit/printed decimal without changing label precision.
      var labels = (axis.tickPositions || []).map(function (position) {
        var tick = axis.ticks[position], label = tick && tick.label;
        if (!label || !label.element.getSubStringLength) return null;
        var text = label.element.textContent, point = text.indexOf(decimal);
        var prefix = label.element.getSubStringLength(0, point < 0 ? text.length : point);
        return {label: label, prefix: prefix, suffix: label.getBBox().width - prefix};
      }).filter(Boolean);
      var before = Math.max.apply(null, [0].concat(labels.map(function (item) { return item.prefix; })));
      var after = Math.max.apply(null, [0].concat(labels.map(function (item) { return item.suffix; })));
      var gap = axis.options.labels.x;
      var anchor = axis.opposite ? axis.left + axis.width + gap + before : axis.left + gap - after;
      labels.forEach(function (item) { item.label.attr({align: 'left', x: anchor - item.prefix}); });
      if (axis.axisTitle && live) { axis.axisTitle.hide(); }
      else if (axis.axisTitle && axis.visible) {
        axis.axisTitle.show();
        axis.axisTitle.attr({
          x: axis.opposite ? axis.left + axis.width : axis.left,
          y: axis.top - 10,
          align: axis.opposite ? 'right' : 'left'
        });
      }
    });
  }

  var api = { YEAR_STEPS: YEAR_STEPS, LABEL_MIN_PX: LABEL_MIN_PX, MINOR_MONTHS: MINOR_MONTHS, MINOR_MIN_PX: MINOR_MIN_PX,
    minorTickMonths: minorTickMonths, periodTicks: periodTicks, periodLabel: periodLabel, render: render };
  root.vetsChartAxis = api;
  if (typeof module === 'object' && module && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
