// /js/components/calendar.js
// Reusable month-view calendar widget, mounted in the header popover (see
// js/components/layout.js). Deliberately role-agnostic: it never imports
// auth.js/store.js. Callers supply a fetchEvents(year, month) closure that
// returns already role/tenant-scoped events (see js/store.js's
// getMyCalendar/getTeamCalendar/getCompanyCalendar), and an onAddEvent(dto)
// closure that persists a new personal event (see store.js's createEvent).
//
// Event shape expected from fetchEvents():
//   { id, type: 'LEAVE'|'HOLIDAY'|'TASK_DEADLINE'|'COMPANY_EVENT'|'ATTENDANCE'|'PERSONAL',
//     title, date: 'YYYY-MM-DD', endDate?: 'YYYY-MM-DD', meta?: object }

const TYPE_LABEL = {
    LEAVE: 'Leave',
    HOLIDAY: 'Holiday',
    TASK_DEADLINE: 'Task Deadline',
    COMPANY_EVENT: 'Company Event',
    MEETING: 'Meeting',
    ATTENDANCE: 'Attendance',
    PERSONAL: 'Personal'
};

const TYPE_CLASS = {
    LEAVE: 'cal-event-leave',
    HOLIDAY: 'cal-event-holiday',
    TASK_DEADLINE: 'cal-event-task',
    COMPANY_EVENT: 'cal-event-company',
    MEETING: 'cal-event-company',
    ATTENDANCE: 'cal-event-attendance',
    PERSONAL: 'cal-event-personal'
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function eventFallsOn(event, dateKey) {
    if (!event.endDate || event.endDate === event.date) return event.date === dateKey;
    // Multi-day event (e.g. a leave range) - mark every day in [date, endDate].
    return event.date <= dateKey && dateKey <= event.endDate;
}

export function renderCalendar(containerEl, { fetchEvents, onAddEvent } = {}) {
    if (!containerEl) return { refresh: () => {}, destroy: () => {} };

    let current = new Date();
    current.setDate(1);
    let events = [];
    let loading = false;
    let selectedKey = toDateKey(new Date());
    let formOpen = false;

    containerEl.innerHTML = `
        <div class="cal-widget">
            <div class="cal-header">
                <div class="cal-month-label" id="cal-month-label"></div>
                <div class="cal-nav">
                    <button type="button" class="btn btn-outline cal-nav-btn" id="cal-prev-btn" aria-label="Previous month"><i class="ph ph-caret-left"></i></button>
                    <button type="button" class="btn btn-outline cal-today-btn" id="cal-today-btn">Today</button>
                    <button type="button" class="btn btn-outline cal-nav-btn" id="cal-next-btn" aria-label="Next month"><i class="ph ph-caret-right"></i></button>
                </div>
            </div>
            <div class="cal-legend">
                <span class="cal-legend-item"><i class="cal-dot cal-event-leave"></i> Leave</span>
                <span class="cal-legend-item"><i class="cal-dot cal-event-holiday"></i> Holiday</span>
                <span class="cal-legend-item"><i class="cal-dot cal-event-task"></i> Task Deadline</span>
                <span class="cal-legend-item"><i class="cal-dot cal-event-company"></i> Company Event</span>
                <span class="cal-legend-item"><i class="cal-dot cal-event-personal"></i> Personal</span>
            </div>
            <div class="cal-grid-wrap">
                <div class="cal-grid" id="cal-grid"></div>
            </div>
            <div class="cal-day-panel">
                <div class="cal-day-panel-date" id="cal-panel-date"></div>
                <div class="cal-day-events" id="cal-day-events"></div>
                <div class="cal-add-form" id="cal-add-form" hidden>
                    <input type="text" class="form-control" id="cal-ev-title" placeholder="Event title" maxlength="80">
                    <div class="cal-add-form-row">
                        <input type="time" class="form-control" id="cal-ev-time">
                        <select class="form-control" id="cal-ev-type">
                            <option value="PERSONAL">Personal</option>
                            <option value="MEETING">Meeting</option>
                        </select>
                    </div>
                    <textarea class="form-control" id="cal-ev-desc" placeholder="Description (optional)" rows="2"></textarea>
                    <div class="cal-add-form-error" id="cal-add-error" hidden></div>
                    <div class="cal-add-form-actions">
                        <button type="button" class="btn btn-outline" id="cal-add-cancel">Cancel</button>
                        <button type="button" class="btn btn-primary" id="cal-add-save">Add Event</button>
                    </div>
                </div>
                <button type="button" class="btn btn-outline cal-add-btn" id="cal-add-btn"><i class="ph ph-plus"></i> Add Event</button>
            </div>
        </div>
    `;

    const monthLabelEl = containerEl.querySelector('#cal-month-label');
    const gridEl = containerEl.querySelector('#cal-grid');
    const panelDateEl = containerEl.querySelector('#cal-panel-date');
    const dayEventsEl = containerEl.querySelector('#cal-day-events');
    const addFormEl = containerEl.querySelector('#cal-add-form');
    const addBtnEl = containerEl.querySelector('#cal-add-btn');
    const addErrorEl = containerEl.querySelector('#cal-add-error');

    function renderPanel() {
        const d = new Date(selectedKey + 'T00:00:00');
        panelDateEl.textContent = d.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' });

        const dayEvents = events.filter(ev => eventFallsOn(ev, selectedKey));
        dayEventsEl.innerHTML = dayEvents.length
            ? dayEvents.map(ev => `
                <div class="cal-modal-event">
                    <span class="cal-dot ${TYPE_CLASS[ev.type] || 'cal-event-company'}"></span>
                    <div>
                        <div class="cal-modal-event-title">${ev.title}</div>
                        <div class="cal-modal-event-type">${TYPE_LABEL[ev.type] || ev.type}${ev.meta?.time ? ' · ' + ev.meta.time : ''}</div>
                    </div>
                </div>`).join('')
            : '<p class="cal-no-events">No events for this date.</p>';

        formOpen = false;
        addFormEl.hidden = true;
        addErrorEl.hidden = true;
        dayEventsEl.hidden = false;
        addBtnEl.hidden = false;
    }

    addBtnEl.addEventListener('click', () => {
        formOpen = true;
        dayEventsEl.hidden = true;
        addBtnEl.hidden = true;
        addFormEl.hidden = false;
        containerEl.querySelector('#cal-ev-title').focus();
    });

    containerEl.querySelector('#cal-add-cancel').addEventListener('click', renderPanel);

    containerEl.querySelector('#cal-add-save').addEventListener('click', async () => {
        const title = containerEl.querySelector('#cal-ev-title').value.trim();
        if (!title) {
            addErrorEl.textContent = 'Please enter an event title.';
            addErrorEl.hidden = false;
            return;
        }
        const dto = {
            title,
            date: selectedKey,
            time: containerEl.querySelector('#cal-ev-time').value || undefined,
            type: containerEl.querySelector('#cal-ev-type').value,
            description: containerEl.querySelector('#cal-ev-desc').value.trim() || undefined
        };
        if (typeof onAddEvent !== 'function') return;
        try {
            await onAddEvent(dto);
            await load();
        } catch (e) {
            addErrorEl.textContent = e.message || 'Could not save event.';
            addErrorEl.hidden = false;
        }
    });

    function renderGrid() {
        const year = current.getFullYear();
        const month = current.getMonth(); // 0-indexed
        const today = new Date();
        const todayKey = toDateKey(today);

        monthLabelEl.textContent = current.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

        const firstOfMonth = new Date(year, month, 1);
        const startOffset = firstOfMonth.getDay(); // 0=Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const cells = [];
        for (let i = startOffset - 1; i >= 0; i--) {
            cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), otherMonth: true });
        }
        for (let day = 1; day <= daysInMonth; day++) {
            cells.push({ date: new Date(year, month, day), otherMonth: false });
        }
        while (cells.length % 7 !== 0 || cells.length < 42) {
            const last = cells[cells.length - 1].date;
            const next = new Date(last);
            next.setDate(next.getDate() + 1);
            cells.push({ date: next, otherMonth: true });
            if (cells.length >= 42) break;
        }

        const weekdayRow = WEEKDAYS.map(w => `<div class="cal-weekday">${w}</div>`).join('');

        const dayCells = cells.map(({ date, otherMonth }) => {
            const dateKey = toDateKey(date);
            const dayEvents = events.filter(ev => eventFallsOn(ev, dateKey));
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedKey;
            const dots = dayEvents.slice(0, 4).map(ev => `<span class="cal-dot ${TYPE_CLASS[ev.type] || 'cal-event-company'}" title="${ev.title}"></span>`).join('');

            return `
                <button type="button" class="cal-day ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${otherMonth ? 'is-other-month' : ''} ${dayEvents.length ? 'has-events' : ''}" data-date="${dateKey}">
                    <span class="cal-day-num">${date.getDate()}</span>
                    <span class="cal-day-dots">${dots}</span>
                </button>`;
        }).join('');

        gridEl.innerHTML = weekdayRow + dayCells;

        gridEl.querySelectorAll('.cal-day').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedKey = btn.dataset.date;
                gridEl.querySelectorAll('.cal-day.is-selected').forEach(el => el.classList.remove('is-selected'));
                btn.classList.add('is-selected');
                renderPanel();
            });
        });

        renderPanel();
    }

    async function load() {
        if (typeof fetchEvents !== 'function' || loading) return;
        loading = true;
        try {
            events = await fetchEvents(current.getFullYear(), current.getMonth() + 1) || [];
        } catch (e) {
            events = [];
        }
        loading = false;
        renderGrid();
    }

    containerEl.querySelector('#cal-prev-btn').addEventListener('click', () => {
        current.setMonth(current.getMonth() - 1);
        load();
    });
    containerEl.querySelector('#cal-next-btn').addEventListener('click', () => {
        current.setMonth(current.getMonth() + 1);
        load();
    });
    containerEl.querySelector('#cal-today-btn').addEventListener('click', () => {
        current = new Date();
        current.setDate(1);
        selectedKey = toDateKey(new Date());
        load();
    });

    load();

    return {
        refresh: load,
        destroy: () => { containerEl.innerHTML = ''; }
    };
}
