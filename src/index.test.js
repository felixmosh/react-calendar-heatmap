import React from 'react';
import { prettyDOM, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarHeatmap from './index';
import { cssSelector, dateNDaysAgo, getISODate, shiftDate, startOfDay } from './helpers';
import {
  DAYS_IN_WEEK,
  HORIZONTAL_MONTH_LABELS_SIZE,
  HORIZONTAL_WEEKDAY_LABELS_SIZE,
  LABEL_GUTTER_SIZE,
  SQUARE_SIZE,
} from './constants';
import { getNumOfWeeks, getTransformOf } from '../tests/helpers';

describe('CalendarHeatmap', () => {
  const values = [
    { date: new Date('2017-06-01') },
    { date: new Date('2017-06-02') },
    { date: new Date('2018-06-01') },
    { date: new Date('2018-06-02') },
    { date: new Date('2018-06-03') },
  ];

  it('should render as an svg', () => {
    const { container } = render(<CalendarHeatmap values={[]} />);

    expect(container.querySelectorAll('svg')).toHaveLength(1);
  });

  it('should not throw exceptions in base case', () => {
    expect(() => <CalendarHeatmap values={[]} />).not.toThrow();
  });

  it('shows values within its original date range', () => {
    const { container } = render(
      <CalendarHeatmap
        endDate={new Date('2017-12-31')}
        startDate={new Date('2017-01-01')}
        values={values}
      />,
    );

    expect(container.querySelectorAll('.color-filled').length).toBe(2);
  });

  it('should handle string formatted date range', () => {
    const { container } = render(
      <CalendarHeatmap endDate="2017-12-31" startDate="2017-01-01" values={values} />,
    );

    expect(container.querySelectorAll('.color-filled').length).toBe(2);
  });

  it('shows values within an updated date range', () => {
    const { container, rerender } = render(
      <CalendarHeatmap
        endDate={new Date('2017-12-31')}
        startDate={new Date('2017-01-01')}
        values={values}
      />,
    );

    rerender(
      <CalendarHeatmap
        endDate={new Date('2018-12-31')}
        startDate={new Date('2018-01-01')}
        values={values}
      />,
    );

    expect(container.querySelectorAll('.color-filled').length).toBe(3);
  });
});

describe('CalendarHeatmap props', () => {
  it('values', () => {
    const values = [
      { date: '2016-01-01' },
      { date: new Date('2016-01-02').getTime() },
      { date: new Date('2016-01-03') },
    ];
    const { container } = render(
      <CalendarHeatmap
        endDate={new Date('2016-02-01')}
        startDate={new Date('2015-12-20')}
        values={values}
      />,
    );

    // 'values should handle Date/string/number formats'
    expect(container.querySelectorAll('.color-filled')).toHaveLength(values.length);
  });

  it('horizontal', () => {
    const { rerender, container } = render(
      <CalendarHeatmap startDate={dateNDaysAgo(100)} values={[]} horizontal />,
    );
    let viewBox = container.querySelector('svg').getAttribute('viewBox');

    const [, , horWidth, horHeight] = viewBox.split(' ');
    // 'horizontal orientation width should be greater than height'
    expect(Number(horWidth)).toBeGreaterThan(Number(horHeight));

    rerender(<CalendarHeatmap startDate={dateNDaysAgo(100)} values={[]} horizontal={false} />);

    viewBox = container.querySelector('svg').getAttribute('viewBox');
    const [, , vertWidth, vertHeight] = viewBox.split(' ');
    // 'vertical orientation width should be less than height'
    expect(Number(vertWidth)).toBeLessThan(Number(vertHeight));
  });

  it('titleForValue', () => {
    const startDate = new Date('2022-10-15');
    const endDate = shiftDate(startDate, 1);

    const { container } = render(
      <CalendarHeatmap
        values={[
          { date: startDate, count: 0 },
          { date: endDate, count: 99 },
        ]}
        startDate={startDate}
        endDate={endDate}
        titleForValue={(value) => (value ? `${getISODate(value.date)}` : undefined)}
      />,
    );

    const rects = container.querySelectorAll('rect');
    expect(rects).toHaveLength(2);
    expect(rects[0].textContent).toBe(getISODate(startDate));
    expect(rects[1].textContent).toBe(getISODate(endDate));
  });

  it('classForValue', () => {
    const today = new Date();
    const numDays = 10;
    const expectedStartDate = shiftDate(today, -numDays + 1);
    const { container } = render(
      <CalendarHeatmap
        values={[
          { date: expectedStartDate, count: 0 },
          { date: today, count: 1 },
        ]}
        endDate={today}
        startDate={dateNDaysAgo(numDays)}
        titleForValue={(value) => (value ? value.count : null)}
        classForValue={(value) => {
          if (!value) {
            return null;
          }
          return value.count > 0 ? 'red' : 'white';
        }}
      />,
    );

    expect(container.querySelectorAll('.white')).toHaveLength(1);
    expect(container.querySelectorAll('.red')).toHaveLength(1);
  });

  it('showMonthLabels', () => {
    const { container, rerender } = render(
      <CalendarHeatmap startDate={dateNDaysAgo(100)} values={[]} showMonthLabels />,
    );

    expect(container.querySelectorAll('text').length).toBeGreaterThan(0);

    rerender(<CalendarHeatmap values={[]} showMonthLabels={false} />);

    expect(container.querySelectorAll('text')).toHaveLength(0);
  });

  it('showWeekdayLabels', () => {
    const { container, rerender } = render(
      <CalendarHeatmap startDate={dateNDaysAgo(7)} values={[]} showWeekdayLabels />,
    );

    expect(container.querySelectorAll('text').length).toBeGreaterThan(2);

    rerender(<CalendarHeatmap values={[]} showMonthLabels={false} showWeekdayLabels={false} />);

    expect(container.querySelectorAll('text')).toHaveLength(0);

    // should display text with .small-text class
    // in case if horizontal prop value is false
    rerender(<CalendarHeatmap values={[]} horizontal={false} showWeekdayLabels />);

    expect(container.querySelectorAll('text.react-calendar-heatmap-small-text')).toHaveLength(4);
  });

  it('transformDayElement', () => {
    const transform = (rect) => React.cloneElement(rect, { 'data-test': 'ok' });
    const startDate = new Date();
    const endDate = shiftDate(startDate, 1);
    const { container } = render(
      <CalendarHeatmap
        values={[]}
        startDate={startDate}
        endDate={endDate}
        transformDayElement={transform}
      />,
    );

    expect(container.querySelectorAll('[data-test="ok"]')).toHaveLength(2);
  });

  it('should start at startDate and end at endDate', () => {
    const startDate = startOfDay(new Date('2022-11-01'));
    const endDate = new Date('2022-11-30');

    const { container } = render(
      <CalendarHeatmap
        values={[{ date: startDate }, { date: endDate }]}
        endDate={endDate}
        startDate={startDate}
        titleForValue={(value) => (value ? getISODate(value.date) : undefined)}
      />,
    );
    const rects = container.querySelectorAll('rect');

    expect(rects).toHaveLength(30);
    expect(rects[0].textContent).toBe(getISODate(startDate));
    expect(rects[rects.length - 1].textContent).toBe(getISODate(endDate));
  });

  it('should start at startDate and end at endDate', () => {
    const startDate = startOfDay(new Date('2022-10-01'));
    const endDate = new Date('2022-10-31');

    const { container } = render(
      <CalendarHeatmap
        values={[{ date: startDate }, { date: endDate }]}
        endDate={endDate}
        startDate={startDate}
        titleForValue={(value) => (value ? getISODate(value.date) : undefined)}
      />,
    );
    const rects = container.querySelectorAll('rect');

    expect(rects).toHaveLength(31);
    expect(rects[0].textContent).toBe(getISODate(startDate));
    expect(rects[rects.length - 1].textContent).toBe(getISODate(endDate));
  });

  describe('tooltipDataAttrs', () => {
    it('allows a function to be passed', () => {
      const today = new Date();
      const numDays = 10;
      const expectedStartDate = shiftDate(today, -numDays + 1);
      const { container } = render(
        <CalendarHeatmap
          values={[
            { date: today, count: 1 },
            { date: expectedStartDate, count: 0 },
          ]}
          endDate={today}
          startDate={expectedStartDate}
          tooltipDataAttrs={({ count }) => ({
            'data-tooltip': `Count: ${count}`,
          })}
        />,
      );

      expect(container.querySelectorAll('[data-tooltip="Count: 1"]')).toHaveLength(1);
    });
  });

  describe('event handlers', () => {
    const count = 999;
    const startDate = '2018-06-01';
    const endDate = '2018-06-03';
    const values = [{ date: '2018-06-01', count }];
    const props = {
      values,
      startDate,
      endDate,
    };
    const expectedValue = values[0];

    it('calls props.onClick with the correct value', async () => {
      const user = userEvent.setup();

      const onClick = jest.fn();
      const { container } = render(<CalendarHeatmap {...props} onClick={onClick} />);
      const rect = container.querySelector('rect');
      await user.click(rect);

      expect(onClick).toHaveBeenCalledWith(expect.any(Object), expectedValue);
    });

    it('calls props.onMouseOver with the correct value', async () => {
      const user = userEvent.setup();

      const onMouseOver = jest.fn();
      // eslint-disable-next-line jsx-a11y/mouse-events-have-key-events
      const { container } = render(<CalendarHeatmap {...props} onMouseOver={onMouseOver} />);

      const rect = container.querySelector('rect');
      await user.hover(rect);

      expect(onMouseOver).toHaveBeenCalledWith(expect.any(Object), expectedValue);
    });

    it('calls props.onMouseLeave with the correct value', async () => {
      const user = userEvent.setup();

      const onMouseLeave = jest.fn();
      // eslint-disable-next-line jsx-a11y/mouse-events-have-key-events
      const { container } = render(<CalendarHeatmap {...props} onMouseLeave={onMouseLeave} />);

      const rect = container.querySelector('rect');
      await user.hover(rect);
      await user.unhover(rect);

      expect(onMouseLeave).toHaveBeenCalledWith(expect.any(Object), expectedValue);
    });
  });
});

describe('layout', () => {
  it('should add ltr as a default direction', () => {
    const { container } = render(
      <CalendarHeatmap
        startDate={dateNDaysAgo(15)}
        values={[]}
        showWeekdayLabels={false}
        showMonthLabels={false}
      />,
    );
    const direction = container.querySelector('svg').getAttribute('direction');

    expect(direction).toBe('ltr');
  });

  it('should add rtl direction', () => {
    const { container } = render(
      <CalendarHeatmap
        startDate={dateNDaysAgo(15)}
        values={[]}
        dir="rtl"
        showWeekdayLabels={false}
        showMonthLabels={false}
      />,
    );
    const direction = container.querySelector('svg').getAttribute('direction');

    expect(direction).toBe('rtl');
  });

  describe('horizontal', () => {
    it('should render viewBox with padding of LABEL_GUTTER_SIZE', () => {
      const gutterSize = 2;
      const squareWithGutter = SQUARE_SIZE + gutterSize;

      const { container } = render(
        <CalendarHeatmap
          startDate={dateNDaysAgo(15)}
          values={[]}
          gutterSize={gutterSize}
          horizontal
          showWeekdayLabels={false}
          showMonthLabels={false}
        />,
      );
      const viewBox = container.querySelector('svg').getAttribute('viewBox');
      const [, , width, height] = viewBox.split(' ');

      const numOfWeeks = container.querySelectorAll(`.${cssSelector('week')}`).length;

      expect(+width).toBe(squareWithGutter * numOfWeeks + LABEL_GUTTER_SIZE * 2);
      expect(+height).toBe(squareWithGutter * DAYS_IN_WEEK + LABEL_GUTTER_SIZE);
    });

    it('should anchor the weekday labels to end', () => {
      const { container } = render(
        <CalendarHeatmap startDate={dateNDaysAgo(15)} values={[]} horizontal showWeekdayLabels />,
      );

      const weekdayLabels = container.querySelector(`.${cssSelector('weekday-labels')}`);
      expect(weekdayLabels.getAttribute('text-anchor')).toBe('end');
    });

    describe('LTR', () => {
      it('should start all-weeks at LABEL_GUTTER_SIZE', () => {
        const gutterSize = 2;
        const { container } = render(
          <CalendarHeatmap
            startDate={dateNDaysAgo(15)}
            values={[]}
            gutterSize={gutterSize}
            horizontal
            showWeekdayLabels={false}
            showMonthLabels={false}
          />,
        );
        const [x] = getTransformOf('all-weeks', container);

        expect(x).toBe(LABEL_GUTTER_SIZE);
      });

      it('should start months at the same place as all-weeks', () => {
        const gutterSize = 2;
        const { container } = render(
          <CalendarHeatmap
            startDate={dateNDaysAgo(15)}
            values={[]}
            gutterSize={gutterSize}
            horizontal
            showWeekdayLabels={false}
            showMonthLabels={false}
          />,
        );
        const [x] = getTransformOf('month-labels', container);

        expect(x).toBe(LABEL_GUTTER_SIZE);
      });

      it('should space the weekday labels with a LABEL_GUTTER_SIZE from all-weeks', () => {
        const gutterSize = 2;

        const { container } = render(
          <CalendarHeatmap
            startDate={dateNDaysAgo(15)}
            values={[]}
            horizontal
            showWeekdayLabels
            gutterSize={gutterSize}
          />,
        );

        const [weekdaysX] = getTransformOf('weekday-labels', container);
        const [allWeekdayX] = getTransformOf('all-weeks', container);

        expect(allWeekdayX - weekdaysX).toBe(LABEL_GUTTER_SIZE);
      });
    });

    describe('RTL', () => {
      it('should place all-weeks first with gutter', () => {
        const gutterSize = 2;
        const { container } = render(
          <CalendarHeatmap
            startDate={dateNDaysAgo(15)}
            values={[]}
            dir="rtl"
            horizontal
            showWeekdayLabels
            gutterSize={gutterSize}
          />,
        );

        const [x] = getTransformOf('all-weeks', container);

        expect(x).toBe(LABEL_GUTTER_SIZE);
      });

      it('should place the weekday labels at the right with a LABEL_GUTTER_SIZE from all-weeks', () => {
        const gutterSize = 2;

        const { container } = render(
          <CalendarHeatmap
            startDate={dateNDaysAgo(15)}
            values={[]}
            horizontal
            dir="rtl"
            showWeekdayLabels
            gutterSize={gutterSize}
          />,
        );

        const [weekdaysX] = getTransformOf('weekday-labels', container);
        const [allWeekdayX] = getTransformOf('all-weeks', container);

        const numOfWeeks = getNumOfWeeks(container);
        const allWeekdayWidth = numOfWeeks * (gutterSize + SQUARE_SIZE);

        expect(weekdaysX - (allWeekdayX + allWeekdayWidth)).toBe(LABEL_GUTTER_SIZE);
      });

      it('should render weeks backwards first week at the right', () => {
        const startDate = dateNDaysAgo(15);
        const { container } = render(
          <CalendarHeatmap
            startDate={startDate}
            values={[{ date: startDate, count: 1 }]}
            titleForValue={(value) => value && getISODate(value.date)}
            dir="rtl"
            horizontal
            showWeekdayLabels
          />,
        );

        const [x] = getTransformOf('week:first-child', container);

        expect(x).toBeGreaterThan(0);
      });

      it('should render month labels backwards first month at the right', () => {
        const startDate = '2022-10-01';
        const { container } = render(
          <CalendarHeatmap
            startDate={startDate}
            endDate="2022-11-30"
            values={[{ date: startDate, count: 1 }]}
            dir="rtl"
            monthLabels={['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']}
            horizontal
            showMonthLabels
          />,
        );

        const firstMonthLabel = container.querySelector(
          `.${cssSelector('month-label')}:first-child`,
        );
        const x = firstMonthLabel.getAttribute('x');

        expect(+x).toBeGreaterThan(0);
        expect(firstMonthLabel.textContent).toBe('10');
      });
    });
  });

  describe('vertical', () => {
    it('should render viewBox with padding of LABEL_GUTTER_SIZE', () => {
      const gutterSize = 2;
      const squareWithGutter = SQUARE_SIZE + gutterSize;

      const { container } = render(
        <CalendarHeatmap
          startDate={dateNDaysAgo(15)}
          values={[]}
          gutterSize={gutterSize}
          horizontal={false}
          showWeekdayLabels={false}
          showMonthLabels={false}
        />,
      );
      const viewBox = container.querySelector('svg').getAttribute('viewBox');
      const [, , width, height] = viewBox.split(' ');

      const numOfWeeks = getNumOfWeeks(container);

      expect(+height).toBe(squareWithGutter * numOfWeeks + LABEL_GUTTER_SIZE * 2);
      expect(+width).toBe(squareWithGutter * DAYS_IN_WEEK + LABEL_GUTTER_SIZE * 2);
    });

    it('should anchor the weekday labels to start', () => {
      const { container } = render(
        <CalendarHeatmap
          startDate={dateNDaysAgo(15)}
          values={[]}
          horizontal={false}
          showWeekdayLabels
        />,
      );

      const weekdayLabels = container.querySelector(`.${cssSelector('weekday-labels')}`);
      expect(weekdayLabels.getAttribute('text-anchor')).toBe('start');
    });

    describe('LTR', () => {
      it('should ignore month labels width if disabled', () => {
        const gutterSize = 2;

        const { container } = render(
          <CalendarHeatmap
            startDate={dateNDaysAgo(15)}
            values={[]}
            horizontal={false}
            showWeekdayLabels
            showMonthLabels={false}
            gutterSize={gutterSize}
          />,
        );

        const [, , x] = container
          .querySelector('svg')
          .getAttribute('viewBox')
          .split(' ')
          .map((c) => +c.trim());

        expect(x).toBe(2 * LABEL_GUTTER_SIZE + DAYS_IN_WEEK * (SQUARE_SIZE + gutterSize));
      });

      it('should transform weekday labels by gutter size', () => {
        const gutterSize = 2;

        const { container } = render(
          <CalendarHeatmap
            startDate={dateNDaysAgo(15)}
            values={[]}
            horizontal={false}
            showWeekdayLabels
            gutterSize={gutterSize}
          />,
        );

        const [x] = getTransformOf('weekday-labels', container);

        expect(x).toBe(LABEL_GUTTER_SIZE);
      });

      it('should transform weekday rects with padding of LABEL_GUTTER_SIZE', () => {
        const gutterSize = 2;

        const { container } = render(
          <CalendarHeatmap
            startDate={dateNDaysAgo(15)}
            values={[]}
            horizontal={false}
            showWeekdayLabels={false}
            showMonthLabels={false}
            gutterSize={gutterSize}
          />,
        );

        const [x, y] = getTransformOf('all-weeks', container);

        expect(x).toBe(LABEL_GUTTER_SIZE);
        expect(y).toBe(LABEL_GUTTER_SIZE);
      });

      it('should transform weekday rects with padding of LABEL_GUTTER_SIZE when weekdays enabled', () => {
        const gutterSize = 2;

        const { container } = render(
          <CalendarHeatmap
            startDate={dateNDaysAgo(15)}
            values={[]}
            horizontal={false}
            showWeekdayLabels
            showMonthLabels={false}
            gutterSize={gutterSize}
          />,
        );

        const [x, y] = getTransformOf('all-weeks', container);

        expect(x).toBe(LABEL_GUTTER_SIZE);
        expect(y).toBe(SQUARE_SIZE * 1.5);
      });

      it('should start months with the same height of the all-weeks', () => {
        const gutterSize = 2;

        const { container, rerender } = render(
          <CalendarHeatmap
            startDate={dateNDaysAgo(15)}
            values={[]}
            horizontal={false}
            showWeekdayLabels
            showMonthLabels
            gutterSize={gutterSize}
          />,
        );

        const [, monthsY] = getTransformOf('month-labels', container);
        const [, allWeeksY] = getTransformOf('all-weeks', container);

        expect(monthsY).toBe(allWeeksY);

        rerender(
          <CalendarHeatmap
            startDate={dateNDaysAgo(15)}
            values={[]}
            horizontal={false}
            showWeekdayLabels={false}
            showMonthLabels
            gutterSize={gutterSize}
          />,
        );

        const [, months2Y] = getTransformOf('month-labels', container);
        const [, allWeeks2Y] = getTransformOf('all-weeks', container);

        expect(months2Y).toBe(allWeeks2Y);
      });

      it('should space months with padding of LABEL_GUTTER_SIZE from all-weeks', () => {
        const gutterSize = 2;

        const { container } = render(
          <CalendarHeatmap
            startDate={dateNDaysAgo(15)}
            values={[]}
            horizontal={false}
            showWeekdayLabels
            showMonthLabels={false}
            gutterSize={gutterSize}
          />,
        );

        const [monthsX] = getTransformOf('month-labels', container);
        const [allWeeksX] = getTransformOf('all-weeks', container);

        expect(monthsX - (allWeeksX + (gutterSize + SQUARE_SIZE) * DAYS_IN_WEEK)).toBe(
          LABEL_GUTTER_SIZE,
        );
      });
    });

    describe('RTL', () => {
      it('should render days backwards, sunday at the right', () => {
        const startDate = '2022-10-02';
        const { container } = render(
          <CalendarHeatmap
            startDate={startDate}
            values={[{ date: startDate, count: 1 }]}
            dir="rtl"
            horizontal={false}
            showWeekdayLabels={false}
            showMonthLabels={false}
          />,
        );

        const firstDay = container.querySelector(
          `.${cssSelector('week')}:first-child > rect:first-child`,
        );

        const lastDay = container.querySelector(
          `.${cssSelector('week')}:first-child > rect:last-child`,
        );

        expect(+firstDay.getAttribute('x')).toBeGreaterThan(0);
        expect(+lastDay.getAttribute('x')).toBe(0);
      });

      it('should render all-weeks at the right', () => {
        const gutterSize = 2;
        const startDate = '2022-10-02';
        const { container } = render(
          <CalendarHeatmap
            startDate={startDate}
            values={[{ date: startDate, count: 1 }]}
            dir="rtl"
            horizontal={false}
            gutterSize={gutterSize}
            showWeekdayLabels
            showMonthLabels
          />,
        );

        const [x] = getTransformOf('all-weeks', container);

        expect(x).toBe(LABEL_GUTTER_SIZE + HORIZONTAL_MONTH_LABELS_SIZE);
      });

      it('should render week days backwards, sunday at the right', () => {
        const gutterSize = 2;
        const startDate = '2022-10-02';
        const weekdayLabels = ['1', '2', '3', '4', '5', '6', '7'];
        const { container } = render(
          <CalendarHeatmap
            startDate={startDate}
            values={[{ date: startDate, count: 1 }]}
            dir="rtl"
            horizontal={false}
            gutterSize={gutterSize}
            showWeekdayLabels
            weekdayLabels={weekdayLabels}
            showMonthLabels={false}
          />,
        );

        const firstDay = container.querySelector(
          `.${cssSelector('weekday-labels')} text:first-child`,
        );

        expect(+firstDay.getAttribute('x')).toBe(
          DAYS_IN_WEEK * (SQUARE_SIZE + gutterSize) - gutterSize,
        );
        expect(firstDay.textContent).toBe(weekdayLabels[0]);
      });

      it('should render months at the left', () => {
        const gutterSize = 2;
        const startDate = '2022-10-02';
        const { container } = render(
          <CalendarHeatmap
            startDate={startDate}
            values={[{ date: startDate, count: 1 }]}
            dir="rtl"
            horizontal={false}
            gutterSize={gutterSize}
            showMonthLabels
          />,
        );

        const [allWeeksX] = getTransformOf('all-weeks', container);
        const [monthLabelX] = getTransformOf('month-labels', container);

        expect(monthLabelX).toBe(allWeeksX - LABEL_GUTTER_SIZE);
      });
    });
  });
});
