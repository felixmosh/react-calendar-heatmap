import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import ReactTooltip from 'react-tooltip';

function shiftDate(date, numDays) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + numDays);
  return newDate;
}

function getRange(count) {
  const arr = [];
  for (let idx = 0; idx < count; idx += 1) {
    arr.push(idx);
  }
  return arr;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomValues(count, date = new Date()) {
  return getRange(count).map((index) => {
    return {
      date: shiftDate(date, -index),
      count: getRandomInt(1, 3),
    };
  });
}
const hebMonthLabels = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat('he', { month: 'short' }).format(new Date(2022, i, 15)),
);
const hebWeekdayLabels = Array.from({ length: 7 }, (_, i) =>
  new Intl.DateTimeFormat('he', { weekday: 'short' }).format(new Date(2022, 11, 4 + i)),
);

const engWeekdayLabels = Array.from({ length: 7 }, (_, i) =>
  new Intl.DateTimeFormat('en', { weekday: 'short' }).format(new Date(2022, 11, 4 + i)),
);
class Demo extends React.Component {
  state = {
    values: generateRandomValues(200),
  };

  generateValues = () => {
    this.setState({
      values: generateRandomValues(200),
    });
  };

  getTooltipDataAttrs = (value) => {
    // Temporary hack around null value.date issue
    if (!value || !value.date) {
      return null;
    }
    // Configuration for react-tooltip
    return {
      'data-tip': `${value.date.toISOString().slice(0, 10)} has count: ${value.count}`,
    };
  };

  handleClick = (value) => {
    alert(`You clicked on ${value.date.toISOString().slice(0, 10)} with count: ${value.count}`);
  };

  render() {
    return (
      <div>
        <div className="row">
          <div className="col-12 col-sm-6">
            <CalendarHeatmap
              startDate="2022-06-01"
              values={this.state.values}
              dir="rtl"
              classForValue={(value) => {
                if (!value) {
                  return 'color-empty';
                }
                return `color-github-${value.count}`;
              }}
              showWeekdayLabels={true}
              monthLabels={hebMonthLabels}
              weekdayLabels={hebWeekdayLabels}
              tooltipDataAttrs={this.getTooltipDataAttrs}
              onClick={this.handleClick}
            />
          </div>
          <div className="col-12 col-sm-3">
            <CalendarHeatmap
              values={this.state.values}
              startDate="2022-06-01"
              dir="rtl"
              horizontal={false}
              classForValue={(value) => {
                if (!value) {
                  return 'color-empty';
                }
                return `color-gitlab-${value.count}`;
              }}
              showWeekdayLabels={true}
              showMonthLabels={true}
              monthLabels={hebMonthLabels}
              weekdayLabels={hebWeekdayLabels}
              tooltipDataAttrs={this.getTooltipDataAttrs}
              onClick={this.handleClick}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-12 col-sm-6">
            <CalendarHeatmap
              startDate="2022-06-01"
              values={this.state.values}
              showWeekdayLabels={true}
              weekdayLabels={engWeekdayLabels}
              classForValue={(value) => {
                if (!value) {
                  return 'color-empty';
                }
                return `color-github-${value.count}`;
              }}
              tooltipDataAttrs={this.getTooltipDataAttrs}
              onClick={this.handleClick}
            />
          </div>
          <div className="col-12 col-sm-3">
            <CalendarHeatmap
              values={this.state.values}
              startDate="2022-06-01"
              horizontal={false}
              showWeekdayLabels={true}
              showMonthLabels={true}
              weekdayLabels={engWeekdayLabels}
              classForValue={(value) => {
                if (!value) {
                  return 'color-empty';
                }
                return `color-gitlab-${value.count}`;
              }}
              tooltipDataAttrs={this.getTooltipDataAttrs}
              onClick={this.handleClick}
            />
          </div>
        </div>
        <div className="text-sm-center mt-4">
          <button className="btn btn-link btn-sm text-secondary" onClick={this.generateValues}>
            Regenerate values
          </button>
        </div>
        <ReactTooltip />
      </div>
    );
  }
}

export default Demo;
