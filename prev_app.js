/**
 * The Blue Pig - Volunteer Rota
 * JavaScript Application
 */

// State
let currentDate = new Date();
let currentView = 'month';
let shifts = [];
let events = [];
let listDateRange = { start: null, end: null };
const VALID_VIEWS = { list: true, week: true, month: true };

// Shift time labels
const SHIFT_LABELS = {
    '12-3': '12-3pm',
    '3-6': '3-6pm',
    '6-9': '6-9pm',
    '9-11': '9-11pm'
};

// Regular opening hours for The Blue Pig
// Day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
const REGULAR_HOURS = {
    0: [  // Sunday: 12-6pm
        { shiftType: '12-3', label: '12-3pm' },
        { shiftType: '3-6', label: '3-6pm' },
    ],
    3: [  // Wednesday: 3-6pm
        { shiftType: '3-6', label: '3-6pm' },
    ],
    5: [  // Friday: 3-6pm
        { shiftType: '3-6', label: '3-6pm' },
    ],
    6: [  // Saturday: 3-6pm
        { shiftType: '3-6', label: '3-6pm' },
    ],
};

// Regular days for The Blue Pig
const REGULAR_DAYS = [0, 3, 5, 6]; // Sunday, Wednesday, Friday, Saturday

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    const savedView = (() => {
        try {
            return localStorage.getItem('bp_view');
        } catch { return null; }
    })();
    if (savedView && VALID_VIEWS[savedView]) {
        currentView = savedView;
    }
    // Set initial active state based on currentView
    document.querySelectorAll('.view-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.view === currentView);
    });
    const pdfBtn = document.getElementById('pdfBtn');
    if (pdfBtn) {
        pdfBtn.style.display = currentView === 'month' ? 'inline-flex' : 'none';
    }
    updateNavControls();
    loadData();
});

function setupEventListeners() {
    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            try {
                localStorage.setItem('bp_view', currentView);
            } catch {}
            document.getElementById('pdfBtn').style.display = currentView === 'month' ? 'inline-flex' : 'none';
            updateNavControls();
            renderView();
        });
    });
    
    // Navigation
    document.getElementById('prevBtn').addEventListener('click', () => navigate(-1));
    document.getElementById('nextBtn').addEventListener('click', () => navigate(1));
    document.getElementById('todayBtn').addEventListener('click', goToToday);
    document.getElementById('pdfBtn').addEventListener('click', generatePDF);
    
    // Forms
    document.getElementById('shiftForm').addEventListener('submit', handleShiftSubmit);
    document.getElementById('eventForm').addEventListener('submit', handleEventSubmit);
    
    // Form toggles
    document.getElementById('isUnfilled').addEventListener('change', (e) => {
        const volunteerFields = document.getElementById('volunteerFields');
        if (volunteerFields) {
            volunteerFields.style.display = e.target.checked ? 'none' : 'block';
        }
        
        const nameInput = document.getElementById('volunteerName');
        if (nameInput) {
            nameInput.required = !e.target.checked;
        }
    });
    
    document.getElementById('roleType').addEventListener('change', (e) => {
        document.getElementById('customRoleGroup').style.display = e.target.value === 'custom' ? 'block' : 'none';
    });
    
    // List View Date Range
    document.getElementById('applyDateRangeBtn').addEventListener('click', () => {
        const start = document.getElementById('listStartDate').value;
        const end = document.getElementById('listEndDate').value;
        if (start && end) {
            listDateRange.start = start;
            listDateRange.end = end;
            loadData();
        }
    });

    // Update UI on view change
    updateNavControls();
    
    document.getElementById('shiftType').addEventListener('change', (e) => {
        document.getElementById('customTimeFields').style.display = e.target.value === 'custom' ? 'block' : 'none';
    });
    
    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });
}

function navigate(direction) {
    if (currentView === 'month') {
        currentDate.setMonth(currentDate.getMonth() + direction);
    } else {
        currentDate.setDate(currentDate.getDate() + (direction * 7));
    }
    loadData();
}

function goToToday() {
    currentDate = new Date();
    loadData();
}

let lastLoadDataTime = 0;

async function loadData() {
    const { startDate, endDate } = getDateRange();
    const requestTime = Date.now();
    lastLoadDataTime = requestTime;
    
    try {
        const timestamp = new Date().getTime();
        const [shiftsRes, eventsRes] = await Promise.all([
            fetch(`api.php?action=get_shifts&start_date=${startDate}&end_date=${endDate}&t=${timestamp}`),
            fetch(`api.php?action=get_events&start_date=${startDate}&end_date=${endDate}&t=${timestamp}`)
        ]);
        
        // If a newer request has started, ignore this result
        if (lastLoadDataTime > requestTime) return;
        
        shifts = await shiftsRes.json();
        events = await eventsRes.json();
        
        renderView();
    } catch (error) {
        console.error('Failed to load data:', error);
    }
}

function getDateRange() {
    if (currentView === 'list' && listDateRange.start && listDateRange.end) {
        return {
            startDate: listDateRange.start,
            endDate: listDateRange.end
        };
    } else if (currentView === 'month') {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        return {
            startDate: formatDateISO(start),
            endDate: formatDateISO(end)
        };
    } else {
        return getWeekRange(currentDate);
    }
}

function getWeekRange(date) {
    const day = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
        startDate: formatDateISO(monday),
        endDate: formatDateISO(sunday)
    };
}

function formatDateISO(date) {
    return date.toISOString().split('T')[0];
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(time24) {
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
}

function formatTimeRangeCompact(start24, end24) {
    if (!start24 || !end24) return '';
    const parse = (t) => {
        const [hStr, mStr] = t.split(':');
        const h = parseInt(hStr);
        return {
            h,
            m: mStr,
            ampm: h >= 12 ? 'pm' : 'am',
            h12: h % 12 || 12
        };
    };
    const s = parse(start24);
    const e = parse(end24);
    const startStr = `${s.h12}${s.m !== '00' ? ':' + s.m : ''}`;
    const endStr = `${e.h12}${e.m !== '00' ? ':' + e.m : ''}`;
    
    if (s.ampm === e.ampm) {
        return `${startStr}-${endStr}${e.ampm}`;
    }
    return `${startStr}${s.ampm}-${endStr}${e.ampm}`;
}

function isToday(dateStr) {
    return formatDateISO(new Date()) === dateStr;
}

function isPast(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
}

function isRegularDay(dateStr) {
    const day = new Date(dateStr).getDay();
    return day in REGULAR_HOURS;
}

function getExpectedShifts(dateStr) {
    const day = new Date(dateStr).getDay();
    return REGULAR_HOURS[day] || [];
}

function getShiftsForDate(dateStr) {
    return shifts.filter(s => s.date === dateStr);
}

function getEventsForDate(dateStr) {
    return events.filter(e => e.date === dateStr);
}

function getUnfilledShifts(dateStr) {
    const dayShifts = getShiftsForDate(dateStr);
    const existingTypes = dayShifts.map(s => s.shift_type);
    const expected = getExpectedShifts(dateStr);
    return expected.filter(e => !existingTypes.includes(e.shiftType)).map(e => ({ type: e.shiftType, label: e.label }));
}

function getShiftTimeSignature(shift) {
    if (shift.shift_type && SHIFT_LABELS[shift.shift_type]) {
        // Convert label to standard signature if possible, or just use type
        // Actually, we can just use the type for exact matches, but we want to catch custom vs type overlaps.
        // Let's stick to strict matching for now unless requested otherwise.
        // If I have a custom 12-3 and a type 12-3, they are different entries.
        // But the user said "if a custom alert shift is filled".
        // Usually "custom alert" implies a custom shift marked as unfilled.
        // If I fill it with a Type shift, it's a different record.
        // Let's normalize to time values.
        const parts = shift.shift_type.split('-');
        let startH = parseInt(parts[0]);
        let endH = parseInt(parts[1]);
        if (startH < 12) startH += 12; // 12, 3, 6, 9 pm logic
        if (endH < 12 && endH !== 12) endH += 12; // 3, 6, 9, 11 pm
        // Handle 12am/pm edge cases if needed, but 12-3 is 12pm-3pm.
        
        return `${startH}:00-${endH}:00`;
    }
    if (shift.custom_start_time && shift.custom_end_time) {
        return `${shift.custom_start_time}-${shift.custom_end_time}`;
    }
    return shift.shift_type; // Fallback
}

function filterRedundantUnfilled(shifts) {
    const filled = shifts.filter(s => s.volunteer_name);
    const unfilled = shifts.filter(s => !s.volunteer_name);
    
    const filledSignatures = new Set(filled.map(s => getShiftTimeSignature(s)));
    
    // Filter out unfilled shifts that have a matching filled shift (same time)
    return unfilled.filter(u => !filledSignatures.has(getShiftTimeSignature(u)));
}

function getShiftSortValue(shift) {
    // Helper to get a comparable value for sorting
    // 1. Taken status (0 = Taken, 1 = Unfilled)
    const statusScore = shift.volunteer_name ? 0 : 1;
    
    // 2. Time
    let timeVal = 0;
    if (shift.custom_start_time) {
        const [h, m] = shift.custom_start_time.split(':');
        timeVal = parseInt(h) * 60 + parseInt(m);
    } else if (shift.shift_type) {
        const parts = shift.shift_type.split('-');
        if (parts.length > 0) {
            let h = parseInt(parts[0]);
            if (h < 12) h += 12; 
            timeVal = h * 60;
        }
    }
    
    return statusScore * 10000 + timeVal;
}

function sortShifts(shifts) {
    return shifts.sort((a, b) => getShiftSortValue(a) - getShiftSortValue(b));
}

function updateDateDisplay() {
    const display = document.getElementById('dateDisplay');
    if (currentView === 'month') {
        display.textContent = currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    } else {
        const { startDate, endDate } = getDateRange();
        const start = new Date(startDate);
        const end = new Date(endDate);
        display.textContent = `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
}

function renderView() {
    updateDateDisplay();
    const container = document.getElementById('calendarView');
    
    switch (currentView) {
        case 'list':
            container.innerHTML = renderListView();
            break;
        case 'week':
            container.innerHTML = renderWeekView();
            break;
        case 'month':
            container.innerHTML = renderMonthView();
            break;
    }
}

function updateNavControls() {
    const standard = document.getElementById('standardNav');
    const dateCtl = document.getElementById('dateRangeControls');
    const pdfBtn = document.getElementById('pdfBtn');
    if (currentView === 'list') {
        if (standard) standard.style.display = 'none';
        if (dateCtl) {
            dateCtl.style.display = 'flex';
            // initialize inputs if not set
            if (!listDateRange.start || !listDateRange.end) {
                const { startDate, endDate } = getWeekRange(currentDate);
                listDateRange.start = startDate;
                listDateRange.end = endDate;
            }
            const startInput = document.getElementById('listStartDate');
            const endInput = document.getElementById('listEndDate');
            if (startInput && endInput) {
                startInput.value = listDateRange.start;
                endInput.value = listDateRange.end;
            }
        }
        if (pdfBtn) pdfBtn.style.display = 'none';
    } else {
        if (standard) standard.style.display = 'flex';
        if (dateCtl) dateCtl.style.display = 'none';
        if (pdfBtn) pdfBtn.style.display = currentView === 'month' ? 'inline-flex' : 'none';
    }
}

function renderListView() {
    const { startDate, endDate } = getDateRange();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
    }
    
    return `<div class="list-view">${dates.map(date => {
        const dateStr = formatDateISO(date);
        const allShifts = getShiftsForDate(dateStr);
        const filled = allShifts.filter(s => s.volunteer_name);
        const uniqueUnfilled = filterRedundantUnfilled(allShifts); // Gets unfilled that don't match filled
        const dayShifts = sortShifts([...filled, ...uniqueUnfilled]);
        
        const dayEvents = getEventsForDate(dateStr);
        const past = isPast(dateStr);
        const regular = isRegularDay(dateStr);
        const today = isToday(dateStr);
        const unfilled = getUnfilledShifts(dateStr);
        
        return `
            <div class="list-card ${regular ? 'regular-day' : ''} ${today ? 'today' : ''} ${past ? 'past' : ''}">
                <div class="list-card-header">
                    <div>
                        <div class="day-number">${date.getDate()}</div>
                        <div class="day-name">${date.toLocaleDateString('en-GB', { weekday: 'long', month: 'short' })}</div>
                    </div>
                    ${today ? '<span class="today-badge">Today</span>' : ''}
                </div>
                <div class="list-card-content">
                    ${dayEvents.length ? `<div class="shifts-grid">${dayEvents.map(e => renderEventCard(e, past)).join('')}</div>` : ''}
                    ${dayShifts.length ? `<div class="shifts-grid">${dayShifts.map(s => renderShiftCard(s, past)).join('')}</div>` : ''}
                    ${unfilled.length ? `<div class="shifts-grid">${unfilled.map(u => {
                        const mockShift = {
                            id: 'virtual_' + u.type + '_' + dateStr,
                            shift_type: u.type,
                            custom_start_time: null, 
                            custom_end_time: null,
                            volunteer_name: null,
                            isVirtual: true
                        };
                        return renderShiftCard(mockShift, true);
                    }).join('')}</div>` : ''}
                    ${!dayShifts.length && !dayEvents.length && !unfilled.length ? '<div class="empty-state">No shifts or events</div>' : ''}
                    ${!past ? `
                        <div style="display:flex;gap:8px;margin-top:12px;">
                            <button class="btn btn-secondary btn-sm" onclick="openShiftModal('${dateStr}')">+ Add Shift</button>
                            <button class="btn btn-secondary btn-sm" onclick="openEventModal('${dateStr}')">+ Add Event</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('')}</div>`;
}

function renderWeekView() {
    const dates = getWeekDates();
    
    return `
        <div class="week-grid">
            ${dates.map(date => {
                const dateStr = formatDateISO(date);
                const allShifts = getShiftsForDate(dateStr);
                const filled = allShifts.filter(s => s.volunteer_name);
                const uniqueUnfilled = filterRedundantUnfilled(allShifts);
                const dayShifts = sortShifts([...filled, ...uniqueUnfilled]);
                
                const dayEvents = getEventsForDate(dateStr);
                const past = isPast(dateStr);
                const regular = isRegularDay(dateStr);
                const today = isToday(dateStr);
                const unfilled = getUnfilledShifts(dateStr);
                
                return `
                    <div class="day-card ${regular ? 'regular-day' : ''} ${today ? 'today' : ''} ${past ? 'past' : ''}">
                        <div class="day-card-header">
                            <div>
                                <div class="day-name">${date.toLocaleDateString('en-GB', { weekday: 'short' })}</div>
                                <div class="day-number">${date.getDate()}</div>
                            </div>
                            ${today ? '<span class="today-badge">Today</span>' : ''}
                        </div>
                        <div class="day-card-content">
                            ${dayEvents.map(e => renderEventCard(e, past)).join('')}
                            ${dayShifts.map(s => renderShiftCard(s, past)).join('')}
                            ${unfilled.map(u => {
                                // Render virtual unfilled shifts as cards too, for consistent style
                                // Mock a shift object for renderShiftCard
                                const mockShift = {
                                    id: 'virtual_' + u.type + '_' + dateStr,
                                    shift_type: u.type,
                                    custom_start_time: null, 
                                    custom_end_time: null,
                                    volunteer_name: null,
                                    isVirtual: true // Flag to hide delete button
                                };
                                return renderShiftCard(mockShift, true); // Locked=true hides delete button
                            }).join('')}
                        </div>
                        ${!past ? `
                            <div class="day-card-actions">
                                <button class="btn btn-secondary btn-sm btn-block" onclick="openShiftModal('${dateStr}')">+ Shift</button>
                                <button class="btn btn-secondary btn-sm btn-block" onclick="openEventModal('${dateStr}')">+ Event</button>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderMonthView() {
    const grid = getMonthGrid();
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    return `
        <div class="month-grid">
            ${days.map(d => `<div class="day-header">${d}</div>`).join('')}
            ${grid.map(({ date, isCurrentMonth }) => {
                const dateStr = formatDateISO(date);
                const dayShifts = getShiftsForDate(dateStr);
                const dayEvents = getEventsForDate(dateStr);
                const past = isPast(dateStr);
                const regular = isRegularDay(dateStr);
                const today = isToday(dateStr);
                
                const taken = sortShifts(dayShifts.filter(s => s.volunteer_name));
                const unfilledDB = dayShifts.filter(s => !s.volunteer_name);
                const missing = getUnfilledShifts(dateStr);
                
                const allUnfilled = [
                    ...unfilledDB.map(s => ({ 
                        label: SHIFT_LABELS[s.shift_type] || formatTimeRangeCompact(s.custom_start_time, s.custom_end_time),
                        val: getShiftSortValue(s)
                    })),
                    ...missing.map(m => ({ 
                        label: m.label, 
                        val: getShiftSortValue({ shift_type: m.type })
                    }))
                ].sort((a, b) => a.val - b.val);
                
                return `
                    <div class="month-day-card ${!isCurrentMonth ? 'outside-month' : ''} ${regular && isCurrentMonth ? 'regular-day' : ''} ${today ? 'today' : ''} ${past && isCurrentMonth ? 'past' : ''}">
                        <div class="day-number" style="${today ? 'color:var(--primary);font-weight:600;' : ''}">
                            ${date.getDate()}${today ? ' <span class="today-badge">Today</span>' : ''}
                        </div>
                        <div class="month-day-content">
                            ${dayEvents.slice(0,1).map(e => `<div class="shift-compact" style="background:rgba(201,162,39,0.15);color:var(--accent);"><span class="name">${e.title}</span></div>`).join('')}
                            ${taken.map(s => {
                                const timeLabel = SHIFT_LABELS[s.shift_type] || formatTimeRangeCompact(s.custom_start_time, s.custom_end_time);
                                const roleClass = s.subtitle === 'Bar Staff' ? 'bar-staff' : s.subtitle === 'Line Cleaning' ? 'line-cleaning' : '';
                                return `<div class="shift-compact ${roleClass}"><span class="name">${s.volunteer_name}</span><span class="time">${timeLabel}</span></div>`;
                            }).join('')}
                            ${allUnfilled.length ? `<div style="font-size:8px;color:var(--destructive);">&#9888; ${allUnfilled.map(u => u.label).join(', ')}</div>` : ''}
                        </div>
                        ${isCurrentMonth && !past ? `
                            <div class="month-day-actions">
                                <button class="btn btn-ghost btn-xs" onclick="openShiftModal('${dateStr}')">+Shift</button>
                                <button class="btn btn-ghost btn-xs" onclick="openEventModal('${dateStr}')">+Event</button>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderShiftCard(shift, locked) {
    const roleClass = shift.subtitle === 'Bar Staff' ? 'bar-staff' : shift.subtitle === 'Line Cleaning' ? 'line-cleaning' : '';
    const isUnfilled = !shift.volunteer_name;
    
    if (isUnfilled) {
        return `
            <div class="shift-card unfilled" ${shift.isVirtual ? `onclick="openShiftModal('${shift.id.split('_')[2]}')"` : ''} style="${shift.isVirtual ? 'cursor:pointer;' : ''}">
                <div class="shift-info">
                    <div class="shift-name unfilled">&#9888; Volunteer Needed</div>
                    <div class="shift-time">&#128337; ${SHIFT_LABELS[shift.shift_type] || formatTimeRangeCompact(shift.custom_start_time, shift.custom_end_time)}</div>
                </div>
                ${!locked && !shift.isVirtual ? `<button class="delete-btn" onclick="deleteShift(${shift.id})">&#10005;</button>` : ''}
            </div>
        `;
    }
    
    return `
        <div class="shift-card ${roleClass}">
            <div class="shift-info">
                <div class="shift-name ${roleClass}">&#128100; ${shift.volunteer_name}</div>
                ${shift.subtitle ? `<div class="shift-subtitle">${shift.subtitle}</div>` : ''}
                <div class="shift-time">&#128337; ${SHIFT_LABELS[shift.shift_type] || formatTimeRangeCompact(shift.custom_start_time, shift.custom_end_time)}</div>
            </div>
            ${!locked ? `<button class="delete-btn" onclick="deleteShift(${shift.id})">&#10005;</button>` : ''}
        </div>
    `;
}

function renderEventCard(event, locked) {
    return `
        <div class="event-card">
            <div class="event-info">
                <div class="event-title">&#127775; ${event.title}</div>
                <div class="event-time">${formatTimeRangeCompact(event.start_time, event.end_time)}</div>
            </div>
            ${!locked ? `<button class="delete-btn" onclick="deleteEvent(${event.id})">&#10005;</button>` : ''}
        </div>
    `;
}

function renderUnfilledAlert(unfilled) {
    return `
        <div class="unfilled-alert">
            <div class="unfilled-header">&#9888; Volunteers Needed</div>
            <div class="unfilled-times">
                ${unfilled.map(u => `<span class="unfilled-time">${u.label}</span>`).join('')}
            </div>
        </div>
    `;
}

function getWeekDates() {
    const day = currentDate.getDay();
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() - (day === 0 ? 6 : day - 1));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(d);
    }
    return dates;
}

function getMonthGrid() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Adjust to start on Monday
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;
    
    const grid = [];
    
    // Previous month days
    for (let i = startDay - 1; i >= 0; i--) {
        const d = new Date(year, month, -i);
        grid.push({ date: d, isCurrentMonth: false });
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
        grid.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Next month days
    const remaining = 42 - grid.length;
    for (let i = 1; i <= remaining; i++) {
        grid.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return grid;
}

// Modal functions
function openShiftModal(dateStr) {
    document.getElementById('shiftDate').value = dateStr;
    
    // Store current values before reset
    const savedRoleType = document.getElementById('roleType').value;
    const savedCustomRole = document.getElementById('customRole').value;
    const savedShiftType = document.getElementById('shiftType').value;
    const savedCustomStartTime = document.getElementById('customStartTime').value;
    const savedCustomEndTime = document.getElementById('customEndTime').value;
    
    document.getElementById('shiftForm').reset();
    document.getElementById('shiftDate').value = dateStr; // Restore date
    
    // Restore saved values
    if (savedRoleType) {
        document.getElementById('roleType').value = savedRoleType;
        if (savedRoleType === 'custom') {
            document.getElementById('customRoleGroup').style.display = 'block';
            document.getElementById('customRole').value = savedCustomRole;
        } else {
            document.getElementById('customRoleGroup').style.display = 'none';
        }
    }
    
    if (savedShiftType) {
        document.getElementById('shiftType').value = savedShiftType;
        if (savedShiftType === 'custom') {
            document.getElementById('customTimeFields').style.display = 'flex';
            document.getElementById('customStartTime').value = savedCustomStartTime;
            document.getElementById('customEndTime').value = savedCustomEndTime;
        } else {
            document.getElementById('customTimeFields').style.display = 'none';
        }
    }
    
    const nameInput = document.getElementById('volunteerName');
    if (nameInput) {
        nameInput.required = true;
        const volunteerFields = document.getElementById('volunteerFields');
        if (volunteerFields) volunteerFields.style.display = 'block';
    }
    document.getElementById('shiftModal').classList.add('active');
}

function closeShiftModal() {
    document.getElementById('shiftModal').classList.remove('active');
}

function openEventModal(dateStr) {
    document.getElementById('eventDate').value = dateStr;
    document.getElementById('eventForm').reset();
    document.getElementById('eventModal').classList.add('active');
}

function closeEventModal() {
    document.getElementById('eventModal').classList.remove('active');
}

// Form handlers
async function handleShiftSubmit(e) {
    e.preventDefault();
    
    const isUnfilled = document.getElementById('isUnfilled').checked;
    const roleType = document.getElementById('roleType').value;
    let subtitle = null;
    
    // Always process the role/subtitle, even if unfilled
    if (roleType === 'bar-staff') subtitle = 'Bar Staff';
    else if (roleType === 'line-cleaning') subtitle = 'Line Cleaning';
    else if (roleType === 'custom') subtitle = document.getElementById('customRole').value;
    
    const shiftType = document.getElementById('shiftType').value;
    
    const data = {
        date: document.getElementById('shiftDate').value,
        volunteer_name: isUnfilled ? null : document.getElementById('volunteerName').value,
        subtitle: subtitle,
        shift_type: shiftType,
        custom_start_time: shiftType === 'custom' ? document.getElementById('customStartTime').value : null,
        custom_end_time: shiftType === 'custom' ? document.getElementById('customEndTime').value : null
    };
    
    try {
        const response = await fetch('api.php?action=add_shift', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to add shift');
        }
        
        closeShiftModal();
        loadData();
    } catch (error) {
        console.error('Failed to add shift:', error);
        alert('Error adding shift: ' + error.message);
    }
}

async function handleEventSubmit(e) {
    e.preventDefault();
    
    const data = {
        date: document.getElementById('eventDate').value,
        title: document.getElementById('eventTitle').value,
        start_time: document.getElementById('eventStartTime').value,
        end_time: document.getElementById('eventEndTime').value
    };
    
    try {
        const response = await fetch('api.php?action=add_event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to add event');
        }
        
        closeEventModal();
        loadData();
    } catch (error) {
        console.error('Failed to add event:', error);
        alert('Error adding event: ' + error.message);
    }
}

async function deleteShift(id) {
    if (!confirm('Remove this shift?')) return;
    
    try {
        const response = await fetch(`api.php?action=delete_shift&id=${id}`);
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to delete shift');
        }
        
        loadData();
    } catch (error) {
        console.error('Failed to delete shift:', error);
        alert('Error deleting shift: ' + error.message);
    }
}

async function deleteEvent(id) {
    if (!confirm('Remove this event?')) return;
    
    try {
        const response = await fetch(`api.php?action=delete_event&id=${id}`);
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to delete event');
        }
        
        loadData();
    } catch (error) {
        console.error('Failed to delete event:', error);
        alert('Error deleting event: ' + error.message);
    }
}

// PDF Generation
function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    const monthName = currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const grid = getMonthGrid();
    
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`The Blue Pig - ${monthName}`, 148.5, 15, { align: 'center' });
    
    // Grid settings
    const startX = 10;
    const startY = 25;
    const cellWidth = 40;
    const cellHeight = 35;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Day headers
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    days.forEach((day, i) => {
        doc.text(day, startX + i * cellWidth + cellWidth / 2, startY, { align: 'center' });
    });
    
    // Calendar cells
    grid.forEach((cell, i) => {
        const col = i % 7;
        const row = Math.floor(i / 7);
        const x = startX + col * cellWidth;
        const y = startY + 5 + row * cellHeight;
        
        // Cell border
        doc.setDrawColor(200);
        doc.rect(x, y, cellWidth, cellHeight);
        
        if (!cell.isCurrentMonth) {
            doc.setFillColor(245, 245, 245);
            doc.rect(x, y, cellWidth, cellHeight, 'F');
        }
        
        // Date number
        doc.setFontSize(9);
        doc.setFont('helvetica', cell.isCurrentMonth ? 'bold' : 'normal');
        doc.setTextColor(cell.isCurrentMonth ? 60 : 150);
        doc.text(cell.date.getDate().toString(), x + 2, y + 5);
        
        // Shifts and events
        const dateStr = formatDateISO(cell.date);
        const dayShifts = getShiftsForDate(dateStr);
        const dayEvents = getEventsForDate(dateStr);
        
        let contentY = y + 10;
        doc.setFontSize(7);
        
        dayEvents.forEach(event => {
            if (contentY < y + cellHeight - 2) {
                doc.setTextColor(180, 130, 40);
                doc.setFont('helvetica', 'bold');
                doc.text(event.title.substring(0, 15), x + 2, contentY);
                contentY += 4;
            }
        });
        
        dayShifts.forEach(shift => {
            if (contentY < y + cellHeight - 2) {
                if (shift.subtitle === 'Bar Staff') {
                    doc.setTextColor(59, 89, 152);
                } else if (shift.subtitle === 'Line Cleaning') {
                    doc.setTextColor(40, 167, 69);
                } else {
                    doc.setTextColor(60, 60, 60);
                }
                doc.setFont('helvetica', shift.volunteer_name ? 'normal' : 'bold');
                const name = shift.volunteer_name || 'NEEDED';
                doc.text(`${name} (${SHIFT_LABELS[shift.shift_type] || shift.shift_type})`.substring(0, 20), x + 2, contentY);
                contentY += 4;
            }
        });
    });
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 10, 200);
    
    // Open PDF
    const blob = doc.output('blob');
    window.open(URL.createObjectURL(blob), '_blank');
}
