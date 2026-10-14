// Reusable month-view calendar widget (converted from the original
// js/components/calendar.js; styled by styles/calendar.css).
// Role-agnostic: callers pass fetchEvents(year, month) returning already
// role-scoped events, and optionally onAddEvent(dto) to save a personal event.
//
// Event shape: { id, type: 'LEAVE'|'HOLIDAY'|'TASK_DEADLINE'|'COMPANY_EVENT'|'MEETING'|'ATTENDANCE'|'PERSONAL',
//                title, date: 'YYYY-MM-DD', endDate?: 'YYYY-MM-DD', meta?: { time? } }
import { useCallback, useEffect, useState } from 'react';
import { toDateKey } from '../../utils/helpers';

const TYPE_LABEL = {
  LEAVE: 'Leave',
  HOLIDAY: 'Holiday',
  TASK_DEADLINE: 'Task Deadline',
  COMPANY_EVENT: 'Company Event',
  MEETING: 'Meeting',
  ATTENDANCE: 'Attendance',
  PERSONAL: 'Personal',
};

const TYPE_CLASS = {
  LEAVE: 'cal-event-leave',
  HOLIDAY: 'cal-event-holiday',
  TASK_DEADLINE: 'cal-event-task',
  COMPANY_EVENT: 'cal-event-company',
  MEETING: 'cal-event-company',
  ATTENDANCE: 'cal-event-attendance',
  PERSONAL: 'cal-event-personal',
};

const LEGEND = [
  ['cal-event-leave', 'Leave'],
  ['cal-event-holiday', 'Holiday'],
  ['cal-event-task', 'Task Deadline'],
  ['cal-event-company', 'Company Event'],
  ['cal-event-personal', 'Personal'],
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EMPTY_FORM = { title: '', time: '', type: 'PERSONAL', description: '' };

function eventFallsOn(event, dateKey) {
  if (!event.endDate || event.endDate === event.date) return event.date === dateKey;
  // Multi-day event (e.g. a leave range) - mark every day in [date, endDate].
  return event.date <= dateKey && dateKey <= event.endDate;
}

function firstOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// 6 rows x 7 days, including trailing/leading days of the adjacent months.
function buildCells(month) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const start = new Date(year, m, 1 - month.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { date, otherMonth: date.getMonth() !== m };
  });
}

export default function Calendar({ fetchEvents, onAddEvent }) {
  const [month, setMonth] = useState(() => firstOfMonth(new Date()));
  const [events, setEvents] = useState([]);
  const [selectedKey, setSelectedKey] = useState(() => toDateKey(new Date()));
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    if (typeof fetchEvents !== 'function') return;
    try {
      setEvents((await fetchEvents(month.getFullYear(), month.getMonth() + 1)) || []);
    } catch {
      setEvents([]);
    }
  }, [fetchEvents, month]);

  useEffect(() => {
    load();
  }, [load]);

  const closeForm = () => {
    setFormOpen(false);
    setFormError('');
    setForm(EMPTY_FORM);
  };

  const selectDay = (dateKey) => {
    setSelectedKey(dateKey);
    closeForm();
  };

  const goToToday = () => {
    setMonth(firstOfMonth(new Date()));
    selectDay(toDateKey(new Date()));
  };

  const saveEvent = async () => {
    const title = form.title.trim();
    if (!title) {
      setFormError('Please enter an event title.');
      return;
    }
    if (typeof onAddEvent !== 'function') return;
    try {
      await onAddEvent({
        title,
        date: selectedKey,
        time: form.time || undefined,
        type: form.type,
        description: form.description.trim() || undefined,
      });
      closeForm();
      await load();
    } catch (e) {
      setFormError(e.message || 'Could not save event.');
    }
  };

  const updateForm = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const todayKey = toDateKey(new Date());
  const dayEvents = events.filter((ev) => eventFallsOn(ev, selectedKey));
  const panelDate = new Date(`${selectedKey}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="cal-widget">
      <div className="cal-header">
        <div className="cal-month-label">
          {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </div>
        <div className="cal-nav">
          <button
            type="button"
            className="btn btn-outline cal-nav-btn"
            aria-label="Previous month"
            onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          >
            <i className="ph ph-caret-left"></i>
          </button>
          <button type="button" className="btn btn-outline cal-today-btn" onClick={goToToday}>
            Today
          </button>
          <button
            type="button"
            className="btn btn-outline cal-nav-btn"
            aria-label="Next month"
            onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          >
            <i className="ph ph-caret-right"></i>
          </button>
        </div>
      </div>

      <div className="cal-legend">
        {LEGEND.map(([cls, label]) => (
          <span key={cls} className="cal-legend-item">
            <i className={`cal-dot ${cls}`}></i> {label}
          </span>
        ))}
      </div>

      <div className="cal-grid-wrap">
        <div className="cal-grid">
          {WEEKDAYS.map((w) => (
            <div key={w} className="cal-weekday">{w}</div>
          ))}
          {buildCells(month).map(({ date, otherMonth }) => {
            const dateKey = toDateKey(date);
            const cellEvents = events.filter((ev) => eventFallsOn(ev, dateKey));
            const classes = [
              'cal-day',
              dateKey === todayKey && 'is-today',
              dateKey === selectedKey && 'is-selected',
              otherMonth && 'is-other-month',
              cellEvents.length && 'has-events',
            ].filter(Boolean).join(' ');

            return (
              <button key={dateKey} type="button" className={classes} onClick={() => selectDay(dateKey)}>
                <span className="cal-day-num">{date.getDate()}</span>
                <span className="cal-day-dots">
                  {cellEvents.slice(0, 4).map((ev) => (
                    <span
                      key={ev.id ?? ev.title}
                      className={`cal-dot ${TYPE_CLASS[ev.type] || 'cal-event-company'}`}
                      title={ev.title}
                    ></span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="cal-day-panel">
        <div className="cal-day-panel-date">{panelDate}</div>

        {formOpen ? (
          <div className="cal-add-form">
            <input
              type="text"
              className="form-control"
              placeholder="Event title"
              maxLength={80}
              autoFocus
              value={form.title}
              onChange={updateForm('title')}
            />
            <div className="cal-add-form-row">
              <input type="time" className="form-control" value={form.time} onChange={updateForm('time')} />
              <select className="form-control" value={form.type} onChange={updateForm('type')}>
                <option value="PERSONAL">Personal</option>
                <option value="MEETING">Meeting</option>
              </select>
            </div>
            <textarea
              className="form-control"
              placeholder="Description (optional)"
              rows={2}
              value={form.description}
              onChange={updateForm('description')}
            ></textarea>
            {formError && <div className="cal-add-form-error">{formError}</div>}
            <div className="cal-add-form-actions">
              <button type="button" className="btn btn-outline" onClick={closeForm}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={saveEvent}>Add Event</button>
            </div>
          </div>
        ) : (
          <>
            <div className="cal-day-events">
              {dayEvents.length ? (
                dayEvents.map((ev) => (
                  <div key={ev.id ?? ev.title} className="cal-modal-event">
                    <span className={`cal-dot ${TYPE_CLASS[ev.type] || 'cal-event-company'}`}></span>
                    <div>
                      <div className="cal-modal-event-title">{ev.title}</div>
                      <div className="cal-modal-event-type">
                        {TYPE_LABEL[ev.type] || ev.type}
                        {ev.meta?.time ? ` · ${ev.meta.time}` : ''}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="cal-no-events">No events for this date.</p>
              )}
            </div>
            <button type="button" className="btn btn-outline cal-add-btn" onClick={() => setFormOpen(true)}>
              <i className="ph ph-plus"></i> Add Event
            </button>
          </>
        )}
      </div>
    </div>
  );
}
