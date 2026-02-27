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

const CANCELLED_SHIFT_NAME = 'SHIFT_CANCELLED';

// Regular opening hours for The Blue Pig
// Day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
// Each shift includes a required role
const REGULAR_HOURS = {
    0: [  // Sunday: 12-6pm
        { shiftType: '12-3', label: '12-3pm', role: 'Bar Staff' },
        { shiftType: '3-6', label: '3-6pm', role: 'Bar Staff' },
    ],
    3: [  // Wednesday: 3-6pm
        { shiftType: '3-6', label: '3-6pm', role: 'Bar Staff' },
    ],
    5: [  // Friday: 3-6pm
        { shiftType: '3-6', label: '3-6pm', role: 'Bar Staff' },
    ],
    6: [  // Saturday: 3-6pm
        { shiftType: '3-6', label: '3-6pm', role: 'Bar Staff' },
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
    const whatsappBtn = document.getElementById('whatsappBtn');
    if (whatsappBtn) whatsappBtn.addEventListener('click', generateWhatsAppLink);
    
    // Forms
    document.getElementById('shiftForm').addEventListener('submit', handleShiftSubmit);
    document.getElementById('eventForm').addEventListener('submit', handleEventSubmit);
    
    // Form toggles
    document.getElementById('isUnfilled').addEventListener('change', (e) => {
        // Only hide the volunteer name field, keep role/shift type visible
        const volunteerNameGroup = document.getElementById('volunteerNameGroup');
        const quantityGroup = document.getElementById('quantityGroup');
        
        if (volunteerNameGroup) {
            volunteerNameGroup.style.display = e.target.checked ? 'none' : 'block';
        }
        
        if (quantityGroup) {
            quantityGroup.style.display = e.target.checked ? 'block' : 'none';
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
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        
        // Adjust to start on Monday (0 = Mon, 6 = Sun)
        let startDayOfWeek = firstDay.getDay();
        startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
        
        // Calculate start date of the grid
        const start = new Date(year, month, 1 - startDayOfWeek);
        
        // Calculate end date of the grid (always 42 days total)
        const end = new Date(start);
        end.setDate(start.getDate() + 41);
        
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

function isAdmin() {
    return new URLSearchParams(window.location.search).get('admin') === 'true';
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
    const expected = getExpectedShifts(dateStr);
    
    // Create a pool of available shifts that can satisfy the requirements
    let availableShifts = [...dayShifts];
    const unfilled = [];
    
    expected.forEach(exp => {
        // Find a matching shift in availableShifts
        // Matches if shift_type and role match
        const matchIndex = availableShifts.findIndex(s => 
            s.shift_type === exp.shiftType && 
            s.subtitle === exp.role
            // Note: We count CANCELLED shifts as "consuming" the slot so it doesn't reappear as needed
        );
        
        if (matchIndex !== -1) {
            // Found a match (filled, unfilled-but-in-DB, or cancelled)
            // Remove from pool so it doesn't satisfy another requirement
            availableShifts.splice(matchIndex, 1);
        } else {
            // No match found - this requirement is unfilled
            unfilled.push({ 
                type: exp.shiftType, 
                label: exp.label, 
                role: exp.role 
            });
        }
    });
    
    return unfilled;
}

function getShiftTimeSignature(shift) {
    if (shift.shift_type && SHIFT_LABELS[shift.shift_type]) {
        const parts = shift.shift_type.split('-');
        let startH = parseInt(parts[0]);
        let endH = parseInt(parts[1]);
        if (startH < 12) startH += 12;
        if (endH < 12 && endH !== 12) endH += 12;
        return `${startH}:00-${endH}:00`;
    }
    if (shift.custom_start_time && shift.custom_end_time) {
        return `${shift.custom_start_time}-${shift.custom_end_time}`;
    }
    return shift.shift_type;
}

/* function filterRedundantUnfilled(shifts) {
    const filled = shifts.filter(s => s.volunteer_name);
    const unfilled = shifts.filter(s => !s.volunteer_name);
    
    const filledSignatures = new Set(filled.map(s => getShiftTimeSignature(s)));
    
    return unfilled.filter(u => !filledSignatures.has(getShiftTimeSignature(u)));
} */

function getShiftSortValue(shift) {
    const statusScore = shift.volunteer_name ? 0 : 1;
    
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

function groupUnfilledShifts(items, dateStr) {
    const groups = {};
    items.forEach(item => {
        // Create a unique key for grouping based on time and role
        const timeLabel = item.label || SHIFT_LABELS[item.shift_type] || formatTimeRangeCompact(item.custom_start_time, item.custom_end_time);
        const role = item.subtitle || item.role || 'Volunteer';
        // Normalize key
        const key = `${timeLabel}|${role}`;
        
        if (!groups[key]) {
            groups[key] = {
                label: timeLabel,
                subtitle: role,
                val: item.val || getShiftSortValue(item),
                count: 0,
                ids: [], // Store IDs of DB shifts
                shift_type: item.shift_type, 
                isVirtual: true, // Default to true
                dateStr: dateStr // Ensure date is available
            };
        }
        
        groups[key].count++;
        
        // Check if it's a DB shift (has numeric ID)
        if (item.id && !item.id.toString().startsWith('virtual_')) {
            groups[key].ids.push(item.id);
            groups[key].isVirtual = false; // It has at least one real DB entry
        }
    });
    
    return Object.values(groups).sort((a, b) => a.val - b.val);
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
            if (!listDateRange.start || !listDateRange.end) {
                const today = new Date();
                const year = today.getFullYear();
                const month = today.getMonth();
                const lastDay = new Date(year, month + 1, 0);
                
                listDateRange.start = formatDateISO(today);
                listDateRange.end = formatDateISO(lastDay);
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
        const filled = allShifts.filter(s => s.volunteer_name && s.volunteer_name !== CANCELLED_SHIFT_NAME);
        const past = isPast(dateStr);
        
        const dayEvents = getEventsForDate(dateStr);
        const regular = isRegularDay(dateStr);
        const today = isToday(dateStr);
        const isAdm = isAdmin();

        // Group unfilled shifts
        const dbUnfilled = (past && !isAdm) ? [] : allShifts.filter(s => !s.volunteer_name);
        const regularUnfilled = (past && !isAdm) ? [] : getUnfilledShifts(dateStr);
        
        const allUnfilledItems = [
            ...dbUnfilled.map(s => ({ ...s, val: getShiftSortValue(s) })),
            ...regularUnfilled.map(u => ({
                label: u.label,
                subtitle: u.role,
                val: getShiftSortValue({ shift_type: u.type }),
                shift_type: u.type,
                isVirtual: true,
                id: 'virtual_' + u.type + '_' + dateStr
            }))
        ];
        
        const groupedUnfilled = groupUnfilledShifts(allUnfilledItems, dateStr);
        const dayShifts = sortShifts([...filled]);
        
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
                    ${!past && groupedUnfilled.length ? `<div class="shifts-grid">${groupedUnfilled.map(u => renderShiftCard(u, false)).join('')}</div>` : ''}
                    ${!dayShifts.length && !dayEvents.length && !groupedUnfilled.length ? '<div class="empty-state">No shifts or events</div>' : ''}
                    <div style="display:flex;gap:8px;margin-top:12px;">
                        ${(!past || isAdm) ? `<button class="btn btn-secondary btn-sm" onclick="openShiftModal('${dateStr}')">+ Add Shift</button>` : ''}
                        ${isAdm ? `<button class="btn btn-secondary btn-sm" onclick="openEventModal('${dateStr}')">+ Add Event</button>` : ''}
                    </div>
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
                const filled = allShifts.filter(s => s.volunteer_name && s.volunteer_name !== CANCELLED_SHIFT_NAME);
                const past = isPast(dateStr);
                
                const dayEvents = getEventsForDate(dateStr);
                const regular = isRegularDay(dateStr);
                const today = isToday(dateStr);
                const isAdm = isAdmin();

                // Group unfilled shifts
                const dbUnfilled = (past && !isAdm) ? [] : allShifts.filter(s => !s.volunteer_name);
                const regularUnfilled = (past && !isAdm) ? [] : getUnfilledShifts(dateStr);
                
                const allUnfilledItems = [
                    ...dbUnfilled.map(s => ({ ...s, val: getShiftSortValue(s) })),
                    ...regularUnfilled.map(u => ({
                        label: u.label,
                        subtitle: u.role,
                        val: getShiftSortValue({ shift_type: u.type }),
                        shift_type: u.type,
                        isVirtual: true,
                        id: 'virtual_' + u.type + '_' + dateStr
                    }))
                ];
                
                const groupedUnfilled = groupUnfilledShifts(allUnfilledItems, dateStr);
                const dayShifts = sortShifts([...filled]);
                
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
                            ${!past ? groupedUnfilled.map(u => renderShiftCard(u, false)).join('') : ''}
                        </div>
                        <div class="day-card-actions">
                            ${(!past || isAdm) ? `<button class="btn btn-secondary btn-sm btn-block" onclick="openShiftModal('${dateStr}')">+ Shift</button>` : ''}
                            ${isAdm ? `<button class="btn btn-secondary btn-sm btn-block" onclick="openEventModal('${dateStr}')">+ Event</button>` : ''}
                        </div>
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
                const isAdm = isAdmin();
                
                const filled = dayShifts.filter(s => s.volunteer_name && s.volunteer_name !== CANCELLED_SHIFT_NAME);
                const dbUnfilled = dayShifts.filter(s => !s.volunteer_name);
                const regularUnfilled = getUnfilledShifts(dateStr);
                
                const allUnfilledItems = [
                    ...dbUnfilled.map(s => ({ ...s, val: getShiftSortValue(s) })),
                    ...regularUnfilled.map(u => ({
                        label: u.label,
                        subtitle: u.role,
                        val: getShiftSortValue({ shift_type: u.type }),
                        shift_type: u.type,
                        isVirtual: true,
                        id: 'virtual_' + u.type + '_' + dateStr
                    }))
                ];
                
                const groupedUnfilled = (past && !isAdm) ? [] : groupUnfilledShifts(allUnfilledItems, dateStr);
                const taken = sortShifts(filled);
                
                return `
                    <div class="month-day-card ${!isCurrentMonth ? 'outside-month' : ''} ${regular && isCurrentMonth ? 'regular-day' : ''} ${today ? 'today' : ''} ${past && isCurrentMonth ? 'past' : ''}">
                        <div class="day-number" style="${today ? 'color:var(--primary);font-weight:600;' : ''}">
                            ${date.getDate()}${today ? ' <span class="today-badge">Today</span>' : ''}
                        </div>
                        <div class="month-day-content">
                            ${dayEvents.slice(0,1).map(e => {
                                const timeLabel = formatTimeRangeCompact(e.start_time, e.end_time);
                                return `<div class="shift-compact" ${isAdm ? `onclick="openEventModal('${dateStr}', ${e.id})"` : ''} style="background:rgba(201,162,39,0.15);color:var(--accent);${isAdm ? 'cursor:pointer;' : ''}"><span class="name">${e.title} - ${timeLabel}</span></div>`;
                            }).join('')}
                            ${taken.map(s => {
                                const timeLabel = SHIFT_LABELS[s.shift_type] || formatTimeRangeCompact(s.custom_start_time, s.custom_end_time);
                                const roleClass = s.subtitle === 'Bar Staff' ? 'bar-staff' : s.subtitle === 'Line Cleaning' ? 'line-cleaning' : '';
                                return `<div class="shift-compact ${roleClass}" onclick="openShiftModal('${dateStr}', ${s.id})" style="cursor:pointer"><span class="name">${s.volunteer_name} - ${s.subtitle} - ${timeLabel}</span></div>`;
                            }).join('')}
                            ${(!past || isAdm) && groupedUnfilled.length ? `<div style="font-size:8px;color:var(--destructive);">${groupedUnfilled.map(u => {
                                const count = u.count || 1;
                                const countText = count > 1 ? `(${count})` : '';
                                let clickAction = '';
                                if (u.ids && u.ids.length > 0) {
                                     clickAction = `onclick="openShiftModal('${dateStr}', ${u.ids[0]})"`;
                                } else {
                                     const safeSubtitle = (u.subtitle || '').replace(/'/g, "\\'");
                                     clickAction = `onclick="openShiftModal('${dateStr}', null, '${u.shift_type}', '${safeSubtitle}')"`;
                                }
                                return `<div style="cursor:pointer;margin-bottom:1px;" ${clickAction}>&#9888; ${countText} ${u.label}${u.subtitle ? ' (' + u.subtitle + ')' : ''}</div>`;
                            }).join('')}</div>` : ''}
                        </div>
                        ${isCurrentMonth ? `
                            <div class="month-day-actions">
                                ${(!past || isAdm) ? `<button class="btn btn-ghost btn-xs" onclick="openShiftModal('${dateStr}')">+Shift</button>` : ''}
                                ${isAdm ? `<button class="btn btn-ghost btn-xs" onclick="openEventModal('${dateStr}')">+Event</button>` : ''}
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
        const count = shift.count || 1;
        const countText = count > 1 ? `${count} Volunteers Needed` : 'Volunteer Needed';
        // If it's virtual OR has DB IDs (meaning it's a placeholder for DB shifts), we can allow clicking to add
        // For DB shifts, clicking usually doesn't do anything in the current code unless it's virtual?
        // Actually, current code for DB unfilled doesn't have onclick unless virtual.
        // Let's allow clicking to open modal for all unfilled cards to easily add a volunteer.
        const dateStr = shift.dateStr || (shift.id && shift.id.toString().startsWith('virtual_') ? shift.id.split('_')[2] : '');
        
        let clickAction = '';
        if (dateStr) {
            if (shift.ids && shift.ids.length > 0) {
                 // Group of DB shifts - edit the first one
                 clickAction = `onclick="openShiftModal('${dateStr}', ${shift.ids[0]})"`;
            } else if (shift.id && !shift.isVirtual && !shift.id.toString().startsWith('virtual_')) {
                 // Single DB shift - edit it
                 clickAction = `onclick="openShiftModal('${dateStr}', ${shift.id})"`;
            } else {
                 // Virtual shift - create new with defaults
                 // Safe-guard subtitle against quotes
                 const safeSubtitle = (shift.subtitle || '').replace(/'/g, "\\'");
                 clickAction = `onclick="openShiftModal('${dateStr}', null, '${shift.shift_type}', '${safeSubtitle}')"`;
            }
        }
        
        const cursorStyle = dateStr ? 'cursor:pointer;' : '';
        
        // For delete: if it has IDs, delete the first one. If it's a single DB shift, delete it.
        let deleteAction = '';
        if (!locked) {
            if (shift.ids && shift.ids.length > 0) {
                deleteAction = `<button class="delete-btn" onclick="event.stopPropagation(); deleteShift(${shift.ids[0]})">&#10005;</button>`;
            } else if (shift.id && !shift.isVirtual && !shift.ids) {
                // Single DB shift (not grouped or group logic not applied yet)
                deleteAction = `<button class="delete-btn" onclick="event.stopPropagation(); deleteShift(${shift.id})">&#10005;</button>`;
            } else if (shift.isVirtual) {
                // It's a regular shift that we want to suppress
                deleteAction = `<button class="delete-btn" onclick="event.stopPropagation(); cancelRegularShift('${shift.dateStr}', '${shift.shift_type}', '${shift.subtitle}')">&#10005;</button>`;
            }
        }

        return `
            <div class="shift-card unfilled ${roleClass}" ${clickAction} style="${cursorStyle}">
                <div class="shift-info">
                    <div class="shift-name unfilled">&#9888; ${countText}${shift.subtitle ? ' (' + shift.subtitle + ')' : ''}</div>
                    <div class="shift-time">&#128337; ${shift.label || SHIFT_LABELS[shift.shift_type] || formatTimeRangeCompact(shift.custom_start_time, shift.custom_end_time)}</div>
                </div>
                ${deleteAction}
            </div>
        `;
    }
    
    return `
        <div class="shift-card ${roleClass}" onclick="openShiftModal('${shift.date}', ${shift.id})" style="cursor:pointer">
            <div class="shift-info">
                <div class="shift-name ${roleClass}">&#128100; ${shift.volunteer_name}</div>
                ${shift.subtitle ? `<div class="shift-subtitle">${shift.subtitle}</div>` : ''}
                <div class="shift-time">&#128337; ${SHIFT_LABELS[shift.shift_type] || formatTimeRangeCompact(shift.custom_start_time, shift.custom_end_time)}</div>
            </div>
            ${!locked ? `<button class="delete-btn" onclick="event.stopPropagation(); deleteShift(${shift.id})">&#10005;</button>` : ''}
        </div>
    `;
}

function renderEventCard(event, locked) {
    const isAdm = isAdmin();
    // Only admins can edit events, regardless of whether it's past or future.
    // So 'locked' (past) is irrelevant for admins here, but relevant for non-admins?
    // Actually, non-admins can't edit events at all.
    // So if (!isAdm), it's locked.
    const canEdit = isAdm;

    return `
        <div class="event-card" ${canEdit ? `onclick="openEventModal('${event.date}', ${event.id})"` : ''} style="${canEdit ? 'cursor:pointer' : ''}">
            <div class="event-info">
                <div class="event-title">&#127775; ${event.title}</div>
                <div class="event-time">${formatTimeRangeCompact(event.start_time, event.end_time)}</div>
            </div>
            ${canEdit ? `<button class="delete-btn" onclick="event.stopPropagation(); deleteEvent(${event.id})">&#10005;</button>` : ''}
        </div>
    `;
}

function renderUnfilledAlert(unfilled) {
    return `
        <div class="unfilled-alert">
            <div class="unfilled-header">&#9888; Volunteers Needed</div>
            <div class="unfilled-times">
                ${unfilled.map(u => `<span class="unfilled-time">${u.label}${u.role ? ' (' + u.role + ')' : ''}</span>`).join('')}
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
function openShiftModal(dateStr, shiftId = null, defaultType = null, defaultRole = null) {
    document.getElementById('shiftDate').value = dateStr;
    document.getElementById('shiftForm').reset();
    document.getElementById('shiftDate').value = dateStr;
    document.getElementById('shiftId').value = shiftId || '';

    // Update button text
    const submitBtn = document.getElementById('shiftSubmitBtn');
    if (submitBtn) {
        submitBtn.textContent = shiftId ? 'Update details' : 'Add Shift';
    }

    // Toggle delete button
    const deleteBtn = document.getElementById('deleteShiftBtn');
    if (deleteBtn) {
        if (shiftId) {
            deleteBtn.style.display = 'inline-flex';
            deleteBtn.onclick = async () => {
                if (confirm('Remove this shift?')) {
                    try {
                        const response = await fetch(`api.php?action=delete_shift&id=${shiftId}`);
                        const result = await response.json();
                        
                        if (!response.ok || !result.success) {
                            throw new Error(result.error || 'Failed to delete shift');
                        }
                        
                        closeShiftModal();
                        loadData();
                    } catch (error) {
                        console.error('Failed to delete shift:', error);
                        alert('Error deleting shift: ' + error.message);
                    }
                }
            };
        } else {
            deleteBtn.style.display = 'none';
        }
    }
    
    // Explicitly reset UI state
    const unfilledGroup = document.getElementById('unfilledGroup');
    if (unfilledGroup) {
        // Hide if editing an existing shift (shiftId present) OR if it's a virtual shift (defaultRole present)
        // The user's request: "When I click on the predefined / default Unfilled Bar Staff roles... This should be hidden"
        // Virtual shifts are clicked with defaultRole/defaultType args but no shiftId.
        const isVirtualFill = !shiftId && defaultRole;
        unfilledGroup.style.display = (shiftId || isVirtualFill) ? 'none' : 'flex';
    }

    document.getElementById('isUnfilled').checked = false;
    const nameGroup = document.getElementById('volunteerNameGroup');
    if (nameGroup) nameGroup.style.display = 'block';
    
    // Default visibility
    document.getElementById('customRoleGroup').style.display = 'none';
    document.getElementById('customTimeFields').style.display = 'none';
    const quantityGroup = document.getElementById('quantityGroup');
    if (quantityGroup) quantityGroup.style.display = 'none';
    
    const roleMap = {
        'Bar Staff': 'bar-staff',
        'Bar Help': 'bar-help',
        'Line Cleaning': 'line-cleaning',
        'Glass Collecting': 'glass-collecting'
    };

    // Set default role if not editing and no default provided
    if (!shiftId && !defaultRole) {
        document.getElementById('roleType').value = 'bar-staff';
    }
    
    // If editing existing shift or virtual shift with defaults
    if (shiftId) {
        // Editing DB shift
        const shift = shifts.find(s => s.id == shiftId);
        if (shift) {
            // Set role
            const mappedRole = roleMap[shift.subtitle];
            if (mappedRole) {
                document.getElementById('roleType').value = mappedRole;
            } else {
                document.getElementById('roleType').value = 'custom';
                document.getElementById('customRoleGroup').style.display = 'block';
                document.getElementById('customRole').value = shift.subtitle || '';
            }
            
            // Set time
            const isStandardTime = ['12-3', '3-6', '6-9', '9-11'].includes(shift.shift_type);
            document.getElementById('shiftType').value = isStandardTime ? shift.shift_type : 'custom';
            if (!isStandardTime) {
                document.getElementById('customTimeFields').style.display = 'flex';
                document.getElementById('customStartTime').value = shift.custom_start_time || '';
                document.getElementById('customEndTime').value = shift.custom_end_time || '';
            }
            
            // If it's an unfilled DB shift, we want the user to fill their name
            // So ensure name field is visible and required
            if (!shift.volunteer_name) {
                document.getElementById('isUnfilled').checked = false;
                if (nameGroup) nameGroup.style.display = 'block';
                document.getElementById('volunteerName').required = true;
            } else {
                // Editing a filled shift
                document.getElementById('volunteerName').value = shift.volunteer_name;
            }
        }
    } else {
        // New shift (or virtual shift being filled)
        
        if (defaultType) {
            document.getElementById('shiftType').value = defaultType;
        }
        
        if (defaultRole) {
            const mappedRole = roleMap[defaultRole] || defaultRole;
            document.getElementById('roleType').value = mappedRole;
        }
    }
    
    document.getElementById('shiftModal').classList.add('active');
}

function closeShiftModal() {
    document.getElementById('shiftModal').classList.remove('active');
}

function openEventModal(dateStr, eventId = null) {
    document.getElementById('eventDate').value = dateStr;
    document.getElementById('eventForm').reset();
    document.getElementById('eventDate').value = dateStr;
    document.getElementById('eventId').value = eventId || '';

    // Update button text
    const submitBtn = document.getElementById('eventSubmitBtn');
    if (submitBtn) {
        submitBtn.textContent = eventId ? 'Update Event' : 'Add Event';
    }

    // Toggle delete button
    const deleteBtn = document.getElementById('deleteEventBtn');
    if (deleteBtn) {
        if (eventId) {
            deleteBtn.style.display = 'inline-flex';
            deleteBtn.onclick = async () => {
                const success = await deleteEvent(eventId);
                if (success) closeEventModal();
            };
        } else {
            deleteBtn.style.display = 'none';
        }
    }

    if (eventId) {
        const event = events.find(e => e.id == eventId);
        if (event) {
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventStartTime').value = event.start_time;
            document.getElementById('eventEndTime').value = event.end_time;
        }
    }

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
    else if (roleType === 'bar-help') subtitle = 'Bar Help';
    else if (roleType === 'line-cleaning') subtitle = 'Line Cleaning';
    else if (roleType === 'glass-collecting') subtitle = 'Glass Collecting';
    else if (roleType === 'custom') subtitle = document.getElementById('customRole').value;
    
    const shiftType = document.getElementById('shiftType').value;
    const quantity = isUnfilled ? parseInt(document.getElementById('shiftQuantity').value) || 1 : 1;
    const shiftId = document.getElementById('shiftId').value;
    
    const data = {
        date: document.getElementById('shiftDate').value,
        volunteer_name: isUnfilled ? null : document.getElementById('volunteerName').value,
        subtitle: subtitle,
        shift_type: shiftType,
        custom_start_time: shiftType === 'custom' ? document.getElementById('customStartTime').value : null,
        custom_end_time: shiftType === 'custom' ? document.getElementById('customEndTime').value : null,
        quantity: quantity
    };
    
    if (shiftId) {
        data.id = shiftId;
    }
    
    const action = shiftId ? 'update_shift' : 'add_shift';
    
    try {
        const response = await fetch(`api.php?action=${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to save shift');
        }
        
        closeShiftModal();
        loadData();
    } catch (error) {
        console.error('Failed to save shift:', error);
        alert('Error saving shift: ' + error.message);
    }
}

async function handleEventSubmit(e) {
    e.preventDefault();
    
    const eventId = document.getElementById('eventId').value;

    const data = {
        date: document.getElementById('eventDate').value,
        title: document.getElementById('eventTitle').value,
        start_time: document.getElementById('eventStartTime').value,
        end_time: document.getElementById('eventEndTime').value
    };
    
    if (eventId) {
        data.id = eventId;
    }
    
    const action = eventId ? 'update_event' : 'add_event';

    try {
        const response = await fetch(`api.php?action=${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to save event');
        }
        
        closeEventModal();
        loadData();
    } catch (error) {
        console.error('Failed to save event:', error);
        alert('Error saving event: ' + error.message);
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

async function cancelRegularShift(dateStr, shiftType, role) {
    if (!confirm('Remove this required shift?')) return;
    
    try {
        const data = {
            date: dateStr,
            shift_type: shiftType,
            volunteer_name: CANCELLED_SHIFT_NAME,
            subtitle: role,
            custom_start_time: null,
            custom_end_time: null
        };
        
        const response = await fetch('api.php?action=add_shift', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to remove shift');
        }
        
        loadData();
    } catch (error) {
        console.error('Failed to remove shift:', error);
        alert('Error removing shift: ' + error.message);
    }
}

async function deleteEvent(id) {
    if (!confirm('Remove this event?')) return false;
    
    try {
        const response = await fetch(`api.php?action=delete_event&id=${id}`);
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to delete event');
        }
        
        loadData();
        return true;
    } catch (error) {
        console.error('Failed to delete event:', error);
        alert('Error deleting event: ' + error.message);
        return false;
    }
}

// PDF Generation
function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    const monthName = currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const grid = getMonthGrid();
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`The Blue Pig - ${monthName}`, 148.5, 15, { align: 'center' });
    
    // Grid settings
    const startX = 10;
    const startY = 25;
    const cellWidth = 39.5; // Slightly adjusted to fit A4 margins
    const cellHeight = 30;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Day headers
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
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
        doc.setLineWidth(0.1);
        doc.rect(x, y, cellWidth, cellHeight);
        
        if (!cell.isCurrentMonth) {
            doc.setFillColor(250, 250, 250);
            doc.rect(x, y, cellWidth, cellHeight, 'F');
        }
        
        // Date number
        doc.setFontSize(9);
        doc.setFont('helvetica', cell.isCurrentMonth ? 'bold' : 'normal');
        doc.setTextColor(cell.isCurrentMonth ? 0 : 150);
        doc.text(cell.date.getDate().toString(), x + 2, y + 4);
        
        // --- Data Preparation (Matching renderMonthView) ---
        const dateStr = formatDateISO(cell.date);
        const dayShifts = getShiftsForDate(dateStr);
        const dayEvents = getEventsForDate(dateStr);
        
        const filled = dayShifts.filter(s => s.volunteer_name && s.volunteer_name !== CANCELLED_SHIFT_NAME);
        // const uniqueUnfilled = filterRedundantUnfilled(dayShifts); // Handles DB unfilled
        // const missing = getUnfilledShifts(dateStr); // Handles Regular unfilled - Unused for PDF

        
        // Merge DB unfilled and Missing Regular, filtering duplicates logic is in filterRedundantUnfilled but we need to combine carefuly
        // Actually, renderMonthView logic is:
        // const taken = sortShifts(dayShifts.filter(s => s.volunteer_name));
        // const unfilledDB = dayShifts.filter(s => !s.volunteer_name);
        // const missing = getUnfilledShifts(dateStr);
        // const allUnfilled = [...unfilledDB, ...missing]...
        
        const taken = sortShifts(filled);
        
        // Combine DB unfilled and Calculated missing logic moved below

        let contentY = y + 8;
        const lineHeight = 4;
        
        // --- Rendering ---
        
        // 1. Events
        dayEvents.forEach(event => {
            if (contentY < y + cellHeight - 2) {
                doc.setFontSize(8);
                doc.setTextColor(180, 130, 40); // Gold/Orange
                doc.setFont('helvetica', 'bold');
                // Truncate if too long
                let title = event.title;
                if (title.length > 20) title = title.substring(0, 19) + '...';
                
                // Format time
                const timeStr = formatTimeRangeCompact(event.start_time, event.end_time);
                // Simplify time for PDF: "12-3", "3-6"
                let shortTime = timeStr.replace('pm','').replace('am','').replace(':00','');
                
                doc.text(`${title} (${shortTime})`, x + 2, contentY);
                contentY += lineHeight;
            }
        });
        
        // 2. Filled Shifts
        taken.forEach(shift => {
            if (contentY < y + cellHeight - 2) {
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                
                // Color coding
                if (shift.subtitle === 'Bar Staff') {
                    doc.setTextColor(0, 100, 200); // Blue
                } else if (shift.subtitle === 'Line Cleaning') {
                    doc.setTextColor(0, 150, 0); // Green
                } else {
                    doc.setTextColor(50, 50, 50); // Dark Grey
                }
                
                let text = `${shift.volunteer_name}`;
                // Optional: Add time if needed, or just name to save space like month view often does
                // Month view card: Name (bold), Subtitle (small), Time (small)
                // Let's try to fit: "Name (Time)"
                const timeStr = SHIFT_LABELS[shift.shift_type] || formatTimeRangeCompact(shift.custom_start_time, shift.custom_end_time);
                // Simplify time for PDF: "12-3", "3-6"
                let shortTime = timeStr.replace('pm','').replace('am','').replace(':00','');
                
                text += ` (${shortTime})`;
                
                doc.text(text, x + 2, contentY);
                contentY += lineHeight;
            }
        });
        
        // 3. Unfilled Shifts - Hidden in PDF as per request

    });
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 10, 200);
    
    // Open PDF
    const blob = doc.output('blob');
    window.open(URL.createObjectURL(blob), '_blank');
}

function generateWhatsAppLink() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    let message = `*The Blue Pig Volunteer Rota - Unfilled Shifts for ${currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}*\n\n`;
    let hasUnfilled = false;

    for (let d = 1; d <= lastDay; d++) {
        const date = new Date(year, month, d);
        const dateStr = formatDateISO(date);
        
        if (isPast(dateStr)) continue;

        const regularUnfilled = getUnfilledShifts(dateStr);
        const dayShifts = getShiftsForDate(dateStr);
        const dbUnfilled = dayShifts.filter(s => !s.volunteer_name); 

        let needed = [];
        
        regularUnfilled.forEach(u => {
             needed.push(`${u.role} (${u.label})`);
        });
        
        dbUnfilled.forEach(s => {
             const label = SHIFT_LABELS[s.shift_type] || `${s.custom_start_time}-${s.custom_end_time}`;
             needed.push(`${s.subtitle} (${label})`);
        });

        if (needed.length > 0) {
            hasUnfilled = true;
            const dayName = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
            message += `*${dayName}*\n`;
            needed.forEach(n => message += `- ${n}\n`);
            message += `\n`;
        }
    }

    if (!hasUnfilled) {
        alert('No future unfilled shifts found for this month!');
        return;
    }
    
    message += `Please reply if you can cover any of these!`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
}
