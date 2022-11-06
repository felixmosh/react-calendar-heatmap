import React from 'react';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import {
  CSS_PSEDUO_NAMESPACE,
  DAY_LABELS,
  DAYS_IN_WEEK,
  HORIZONTAL_MONTH_LABELS_SIZE,
  HORIZONTAL_WEEKDAY_LABELS_SIZE,
  LABEL_GUTTER_SIZE,
  MILLISECONDS_IN_ONE_DAY,
  MONTH_LABELS,
  SQUARE_SIZE,
} from './constants';
import {
  convertToDate,
  cssSelector,
  dateNDaysAgo,
  endOfDay,
  getDateDifferenceInDays,
  getRange,
  shiftDate,
  startOfDay,
} from './helpers';

class CalendarHeatmap extends React.Component {
  getSquareSizeWithGutter() {
    return SQUARE_SIZE + this.props.gutterSize;
  }

  getMonthLabelSize() {
    if (!this.props.showMonthLabels) {
      return 0;
    }
    if (this.props.horizontal) {
      return SQUARE_SIZE + LABEL_GUTTER_SIZE;
    }
    return HORIZONTAL_MONTH_LABELS_SIZE;
  }

  getWeekdayLabelSize() {
    if (!this.props.showWeekdayLabels) {
      return 0;
    }
    if (this.props.horizontal) {
      return HORIZONTAL_WEEKDAY_LABELS_SIZE;
    }
    return SQUARE_SIZE * 1.5;
  }

  getStartDate() {
    return startOfDay(convertToDate(this.props.startDate));
  }

  getEndDate() {
    return endOfDay(convertToDate(this.props.endDate));
  }

  getStartDateWithEmptyDays() {
    return shiftDate(this.getStartDate(), -this.getNumEmptyDaysAtStart());
  }

  getNumEmptyDaysAtStart() {
    return this.getStartDate().getDay();
  }

  getNumEmptyDaysAtEnd() {
    return DAYS_IN_WEEK - 1 - this.getEndDate().getDay();
  }

  getWeekCount() {
    const numDaysRoundedToWeek =
      getDateDifferenceInDays(this.props.startDate, this.props.endDate) +
      this.getNumEmptyDaysAtStart() +
      this.getNumEmptyDaysAtEnd();

    return Math.ceil(numDaysRoundedToWeek / DAYS_IN_WEEK);
  }

  getWeekHeight() {
    return DAYS_IN_WEEK * this.getSquareSizeWithGutter();
  }

  getWidth() {
    return (
      this.getWeekCount() * this.getSquareSizeWithGutter() +
      this.getWeekdayLabelSize() +
      LABEL_GUTTER_SIZE * 2
    );
  }

  getHeight() {
    if (this.props.horizontal) {
      return this.getWeekHeight() + this.getMonthLabelSize() + LABEL_GUTTER_SIZE;
    }
    return this.getWeekHeight() + this.getMonthLabelSize() + LABEL_GUTTER_SIZE * 2;
  }

  getValueCache = memoizeOne((props) =>
    props.values.reduce((memo, value) => {
      const date = convertToDate(value.date);
      const index = Math.floor((date - this.getStartDateWithEmptyDays()) / MILLISECONDS_IN_ONE_DAY);
      // eslint-disable-next-line no-param-reassign
      memo[index] = {
        value,
        className: this.props.classForValue(value),
        title: this.props.titleForValue ? this.props.titleForValue(value) : null,
        tooltipDataAttrs: this.getTooltipDataAttrsForValue(value),
      };
      return memo;
    }, {}),
  );

  getValueForIndex(index) {
    if (this.valueCache[index]) {
      return this.valueCache[index].value;
    }
    return null;
  }

  getClassNameForIndex(index) {
    if (this.valueCache[index]) {
      return this.valueCache[index].className;
    }
    return this.props.classForValue(null);
  }

  getTitleForIndex(index) {
    if (this.valueCache[index]) {
      return this.valueCache[index].title;
    }
    return this.props.titleForValue ? this.props.titleForValue(null) : null;
  }

  getTooltipDataAttrsForIndex(index) {
    if (this.valueCache[index]) {
      return this.valueCache[index].tooltipDataAttrs;
    }
    return this.getTooltipDataAttrsForValue({ date: null, count: null });
  }

  getTooltipDataAttrsForValue(value) {
    const { tooltipDataAttrs } = this.props;

    if (typeof tooltipDataAttrs === 'function') {
      return tooltipDataAttrs(value);
    }
    return tooltipDataAttrs;
  }

  getTransformForWeek(weekIndex, totalWeeks) {
    let x;
    let y;

    if (this.props.horizontal) {
      const finalWeekIndex = this.props.dir === 'rtl' ? totalWeeks - weekIndex - 1 : weekIndex;

      x = finalWeekIndex * this.getSquareSizeWithGutter();
      y = 0;
    } else {
      x = 0;
      y = weekIndex * this.getSquareSizeWithGutter();
    }
    return [x, y];
  }

  getTransformForWeekdayLabels() {
    let x;
    let y;

    const [allWeeksX] = this.getTransformForAllWeeks();
    if (this.props.horizontal) {
      if (this.props.dir === 'rtl') {
        x = allWeeksX + this.getWeekCount() * this.getSquareSizeWithGutter() + LABEL_GUTTER_SIZE;
      } else {
        x = HORIZONTAL_WEEKDAY_LABELS_SIZE;
      }

      y = this.getMonthLabelSize();
    } else {
      x = allWeeksX;
      y = 0;
    }

    return [x, y];
  }

  getTransformForMonthLabels() {
    let x;
    let y;
    const [allWeeksX, allWeeksY] = this.getTransformForAllWeeks();
    if (this.props.horizontal) {
      x = allWeeksX;
      y = 0;
    } else {
      x =
        this.props.dir === 'rtl'
          ? allWeeksX - LABEL_GUTTER_SIZE
          : this.getWeekHeight() + allWeeksX + LABEL_GUTTER_SIZE;
      y = allWeeksY;
    }
    return [x, y];
  }

  getTransformForAllWeeks() {
    let x;
    let y;

    const weekdayLabelSize = this.getWeekdayLabelSize();
    const monthLabelSize = this.getMonthLabelSize();
    if (this.props.horizontal) {
      x = (this.props.dir === 'rtl' ? 0 : weekdayLabelSize) + LABEL_GUTTER_SIZE;
      y = monthLabelSize;
    } else {
      x = (this.props.dir === 'rtl' ? monthLabelSize : 0) + LABEL_GUTTER_SIZE;
      y = weekdayLabelSize || LABEL_GUTTER_SIZE;
    }

    return [x, y];
  }

  getViewBox() {
    if (this.props.horizontal) {
      return `0 0 ${this.getWidth()} ${this.getHeight()}`;
    }
    return `0 0 ${this.getHeight()} ${this.getWidth()}`;
  }

  getSquareCoordinates(dayIndex) {
    if (this.props.horizontal) {
      return [0, dayIndex * this.getSquareSizeWithGutter()];
    }
    return [
      (this.props.dir === 'rtl' ? DAYS_IN_WEEK - dayIndex - 1 : dayIndex) *
        this.getSquareSizeWithGutter(),
      0,
    ];
  }

  getWeekdayLabelCoordinates(dayIndex) {
    if (this.props.horizontal) {
      return [0, (dayIndex + 1) * SQUARE_SIZE + dayIndex * this.props.gutterSize];
    }

    const x =
      (this.props.dir === 'rtl' ? DAYS_IN_WEEK - dayIndex : dayIndex) *
      this.getSquareSizeWithGutter();

    return [x - (this.props.dir === 'rtl' ? this.props.gutterSize : 0), SQUARE_SIZE];
  }

  getMonthLabelCoordinates(weekIndex, totalWeeks) {
    if (this.props.horizontal) {
      const x =
        this.props.dir === 'rtl'
          ? (totalWeeks - weekIndex + 1) * this.getSquareSizeWithGutter() - this.props.gutterSize
          : weekIndex * this.getSquareSizeWithGutter();
      return [x, this.getMonthLabelSize() - LABEL_GUTTER_SIZE];
    }
    const verticalOffset = -2;
    return [0, (weekIndex + 1) * this.getSquareSizeWithGutter() + verticalOffset];
  }

  handleClick(e, value) {
    if (this.props.onClick) {
      this.props.onClick(e, value);
    }
  }

  handleMouseOver(e, value) {
    if (this.props.onMouseOver) {
      this.props.onMouseOver(e, value);
    }
  }

  handleMouseLeave(e, value) {
    if (this.props.onMouseLeave) {
      this.props.onMouseLeave(e, value);
    }
  }

  renderSquare(dayIndex, index) {
    const indexOutOfRange =
      index < this.getNumEmptyDaysAtStart() ||
      index >=
        this.getNumEmptyDaysAtStart() +
          getDateDifferenceInDays(this.props.startDate, this.props.endDate);
    if (indexOutOfRange && !this.props.showOutOfRangeDays) {
      return null;
    }
    const [x, y] = this.getSquareCoordinates(dayIndex);
    const value = this.getValueForIndex(index);
    const title = this.getTitleForIndex(index);
    const rect = (
      // eslint-disable-next-line jsx-a11y/mouse-events-have-key-events
      <rect
        key={index}
        width={SQUARE_SIZE}
        height={SQUARE_SIZE}
        x={x}
        y={y}
        className={this.getClassNameForIndex(index)}
        onClick={(e) => this.handleClick(e, value)}
        onMouseOver={(e) => this.handleMouseOver(e, value)}
        onMouseLeave={(e) => this.handleMouseLeave(e, value)}
        {...this.getTooltipDataAttrsForIndex(index)}
      >
        {!!title && <title>{title}</title>}
      </rect>
    );
    const { transformDayElement } = this.props;
    return transformDayElement ? transformDayElement(rect, value, index) : rect;
  }

  renderWeek(weekIndex, totalWeeks) {
    return (
      <g
        key={weekIndex}
        transform={`translate(${this.getTransformForWeek(weekIndex, totalWeeks).join(', ')})`}
        className={cssSelector(`week`)}
      >
        {getRange(DAYS_IN_WEEK).map((dayIndex) =>
          this.renderSquare(dayIndex, weekIndex * DAYS_IN_WEEK + dayIndex),
        )}
      </g>
    );
  }

  renderAllWeeks() {
    const totalWeeks = this.getWeekCount();
    return getRange(totalWeeks).map((weekIndex) => this.renderWeek(weekIndex, totalWeeks));
  }

  renderMonthLabels() {
    if (!this.props.showMonthLabels) {
      return null;
    }

    const totalWeeks = this.getWeekCount() - 1; // don't render for last week, because label will be cut off
    return getRange(totalWeeks).map((weekIndex) => {
      const endOfWeek = shiftDate(this.getStartDateWithEmptyDays(), (weekIndex + 1) * DAYS_IN_WEEK);
      const [x, y] = this.getMonthLabelCoordinates(weekIndex, totalWeeks);
      return endOfWeek.getDate() >= 1 && endOfWeek.getDate() <= DAYS_IN_WEEK ? (
        <text key={weekIndex} x={x} y={y} className={cssSelector('month-label')}>
          {this.props.monthLabels[endOfWeek.getMonth()]}
        </text>
      ) : null;
    });
  }

  renderWeekdayLabels() {
    if (!this.props.showWeekdayLabels) {
      return null;
    }
    return this.props.weekdayLabels.map((weekdayLabel, dayIndex) => {
      const [x, y] = this.getWeekdayLabelCoordinates(dayIndex);
      const cssClasses = `${this.props.horizontal ? '' : cssSelector('small-text')} ${cssSelector(
        'weekday-label',
      )}`;

      return dayIndex % 2 === 0 ? (
        <text key={`${x}${y}`} x={x} y={y} className={cssClasses}>
          {weekdayLabel}
        </text>
      ) : null;
    });
  }

  render() {
    this.valueCache = this.getValueCache(this.props);

    return (
      <svg
        className={`${CSS_PSEDUO_NAMESPACE}`}
        viewBox={this.getViewBox()}
        direction={this.props.dir}
      >
        <g
          transform={`translate(${this.getTransformForMonthLabels().join(', ')})`}
          className={cssSelector('month-labels')}
        >
          {this.renderMonthLabels()}
        </g>
        <g
          transform={`translate(${this.getTransformForAllWeeks().join(', ')})`}
          className={cssSelector('all-weeks')}
        >
          {this.renderAllWeeks()}
        </g>
        <g
          transform={`translate(${this.getTransformForWeekdayLabels().join(', ')})`}
          className={cssSelector('weekday-labels')}
          textAnchor={this.props.horizontal ? 'end' : 'start'}
        >
          {this.renderWeekdayLabels()}
        </g>
      </svg>
    );
  }
}

CalendarHeatmap.propTypes = {
  values: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)])
        .isRequired,
    }).isRequired,
  ).isRequired, // array of objects with date and arbitrary metadata
  startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]), // start of date range
  endDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]), // end of date range
  gutterSize: PropTypes.number, // size of space between squares
  horizontal: PropTypes.bool, // whether to orient horizontally or vertically
  showMonthLabels: PropTypes.bool, // whether to show month labels
  showWeekdayLabels: PropTypes.bool, // whether to show weekday labels
  showOutOfRangeDays: PropTypes.bool, // whether to render squares for extra days in week after endDate, and before start date
  tooltipDataAttrs: PropTypes.oneOfType([PropTypes.object, PropTypes.func]), // data attributes to add to square for setting 3rd party tooltips, e.g. { 'data-toggle': 'tooltip' } for bootstrap tooltips
  titleForValue: PropTypes.func, // function which returns title text for value
  classForValue: PropTypes.func, // function which returns html class for value
  monthLabels: PropTypes.arrayOf(PropTypes.string), // An array with 12 strings representing the text from janurary to december
  weekdayLabels: PropTypes.arrayOf(PropTypes.string), // An array with 7 strings representing the text from Sun to Sat
  onClick: PropTypes.func, // callback function when a square is clicked
  onMouseOver: PropTypes.func, // callback function when mouse pointer is over a square
  onMouseLeave: PropTypes.func, // callback function when mouse pointer is left a square
  transformDayElement: PropTypes.func, // function to further transform the svg element for a single day
  dir: PropTypes.oneOf(['ltr', 'rtl']),
};

CalendarHeatmap.defaultProps = {
  startDate: dateNDaysAgo(200),
  endDate: new Date(),
  gutterSize: 1,
  horizontal: true,
  showMonthLabels: true,
  showWeekdayLabels: false,
  showOutOfRangeDays: false,
  tooltipDataAttrs: null,
  titleForValue: null,
  classForValue: (value) => (value ? 'color-filled' : 'color-empty'),
  monthLabels: MONTH_LABELS,
  weekdayLabels: DAY_LABELS,
  onClick: null,
  onMouseOver: null,
  onMouseLeave: null,
  transformDayElement: null,
  dir: 'ltr',
};

export default CalendarHeatmap;
