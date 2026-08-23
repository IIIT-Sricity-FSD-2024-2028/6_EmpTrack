// /js/components/calendar.js
// Reusable month-view calendar widget, embedded in every dashboard.
// Deliberately role-agnostic: it never imports auth.js/store.js. Callers
// (each role's dashboard.js) supply a fetchEvents(year, month) closure that
// returns already role/tenant-scoped events - see js/store.js's
// getMyCalendar/getTeamCalendar/getCompanyCalendar for what backs that call.
//
// Event shape expected from fetchEvents():
//   { id, type: 'LEAVE'|'HOLIDAY'|'TASK_DEADLINE'|'COMPANY_EVENT'|'ATTENDANCE',
//     title, date: 'YYYY-MM-DD', endDate?: 'YYYY-MM-DD', meta?: object }

const TYPE_LABEL = {
    LEAVE: 'Leave',
    HOLIDAY: 'Holiday',
    TASK_DEADLINE: 'Task Deadline',
    COMPANY_EVENT: 'Company Event',
    MEETING: 'Meeting',
    ATTENDANCE: 'Attendance'
};

const TYPE_CLASS = {
    LEAVE: 'cal-event-leave',
    HOLIDAY: 'cal-event-holiday',
    TASK_DEADLINE: 'cal-event-task',
    COMPANY_EVENT: 'cal-event-company',
    MEETING: 'cal-event-company',
    ATTENDANCE: 'cal-event-attendance'
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

export function renderCalendar(containerEl, { fetchEvents, onEventClick } = {}) {
    if (!containerEl) return { refresh: () => {}, destroy: () => {} };

    let current = new Date();
    current.setDate(1);
    let events = [];
    let loading = false;
    let selectedKey = null;

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
                <span class="cal-legend-item"><i class="cal-dot cal-event-attendance"></i> Attendance</span>
            </div>
            <div class="cal-grid-wrap">
                <div class="cal-grid" id="cal-grid"></div>
            </div>
        </div>
        <div class="modal-overlay" id="cal-event-modal">
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title" id="cal-modal-title">Events</h3>
                    <button type="button" class="modal-close" id="cal-modal-close">&times;</button>
                </div>
                <div class="modal-body" id="cal-modal-body"></div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" id="cal-modal-close-btn">Close</button>
                </div>
            </div>
        </div>
    `;

    const monthLabelEl = containerEl.querySelector('#cal-month-label');
    const gridEl = containerEl.querySelector('#cal-grid');
    const modalEl = containerEl.querySelector('#cal-event-modal');
    const modalTitleEl = containerEl.querySelector('#cal-modal-title');
    const modalBodyEl = containerEl.querySelector('#cal-modal-body');

    function openModal(dateKey, dayEvents) {
        const d = new Date(dateKey + 'T00:00:00');
        modalTitleEl.textContent = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        modalBodyEl.innerHTML = dayEvents.length
            ? dayEvents.map(ev => `
                <div class="cal-modal-event" data-event-id="${ev.id}">
                    <span class="cal-dot ${TYPE_CLASS[ev.type] || 'cal-event-company'}"></span>
                    <div>
                        <div class="cal-modal-event-title">${ev.title}</div>
                        <div class="cal-modal-event-type">${TYPE_LABEL[ev.type] || ev.type}</div>
                    </div>
                </div>`).join('')
            : '<p style="color:var(--text-muted); margin:0;">No events on this day.</p>';

        modalBodyEl.querySelectorAll('.cal-modal-event').forEach(row => {
            row.addEventListener('click', () => {
                const ev = dayEvents.find(e => String(e.id) === row.dataset.eventId);
                if (ev && typeof onEventClick === 'function') onEventClick(ev);
            });
        });

        modalEl.classList.add('active');
    }

    function closeModal() {
        modalEl.classList.remove('active');
    }

    containerEl.querySelector('#cal-modal-close').addEventListener('click', closeModal);
    containerEl.querySelector('#cal-modal-close-btn').addEventListener('click', closeModal);
    modalEl.addEventListener('click', (e) => { if (e.target === modalEl) closeModal(); });

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
                const dateKey = btn.dataset.date;
                selectedKey = dateKey;
                gridEl.querySelectorAll('.cal-day.is-selected').forEach(el => el.classList.remove('is-selected'));
                btn.classList.add('is-selected');
                openModal(dateKey, events.filter(ev => eventFallsOn(ev, dateKey)));
            });
        });
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
        load();
    });

    load();

    return {
        refresh: load,
        destroy: () => { containerEl.innerHTML = ''; }
    };
}
