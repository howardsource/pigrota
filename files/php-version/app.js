/**
 * The Blue Pig - Volunteer Rota
 * JavaScript Application
 */

// State
let currentDate = new Date();
let currentView = 'list';
let shifts = [];
let events = [];

// Shift time labels
const SHIFT_LABELS = {
    '12-3': '12-3pm',
    '3-6': '3-6pm',
    '6-9': '6-9pm',
    '9-11': '9-11pm',
    'custom': 'Custom'
};

// Regular opening days (0=Sun, 1=Mon, etc.)
const REGULAR_DAYS = [0, 3, 5, 6]; // Sun, Wed, Fri, Sat

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadData();
});

function setupEventListeners() {
    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            document.getElementById('pdfBtn').style.display = currentView === 'month' ? 'inline-flex' : 'none';
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
        document.getElementById('volunteerFields').style.display = e.target.checked ? 'none' : 'block';
    });
    
    document.getElementById('roleType').addEventListener('change', (e) => {
        document.getElementById('customRoleGroup').style.display = e.target.value === 'custom' ? 'block' : 'none';
    });
    
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

async function loadData() {
    const { startDate, endDate } = getDateRange();
    
    try {
        const [shiftsRes, eventsRes] = await Promise.all([
            fetch(`api.php?action=get_shifts&start_date=${startDate}&end_date=${endDate}`),
            fetch(`api.php?action=get_events&start_date=${startDate}&end_date=${endDate}`)
        ]);
        
        shifts = await shiftsRes.json();
        events = await eventsRes.json();
        
        renderView();
    } catch (error) {
        console.error('Failed to load data:', error);
    }
}

function getDateRange() {
    if (currentView === 'month') {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        return {
            startDate: formatDateISO(start),
            endDate: formatDateISO(end)
        };
    } else {
        const day = currentDate.getDay();
        const monday = new Date(currentDate);
        monday.setDate(currentDate.getDate() - (day === 0 ? 6 : day - 1));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return {
            startDate: formatDateISO(monday),
            endDate: formatDateISO(sunday)
        };
    }
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
    return REGULAR_DAYS.includes(day);
}

function getShiftsForDate(dateStr) {
    return shifts.filter(s => s.date === dateStr);
}

function getEventsForDate(dateStr) {
    return events.filter(e => e.date === dateStr);
}

function getUnfilledShifts(dateStr) {
    const dayShifts = getShiftsForDate(dateStr);
    const filledTypes = dayShifts.filter(s => s.volunteer_name).map(s => s.shift_type);
    const allTypes = ['12-3', '3-6', '6-9', '9-11'];
    return allTypes.filter(t => !filledTypes.includes(t)).map(t => ({ type: t, label: SHIFT_LABELS[t] }));
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

function renderListView() {
    const dates = getWeekDates();
    
    return `<div class="list-view">${dates.map(date => {
        const dateStr = formatDateISO(date);
        const dayShifts = getShiftsForDate(dateStr);
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
                    ${unfilled.length ? renderUnfilledAlert(unfilled) : ''}
                    ${!dayShifts.length && !dayEvents.length ? '<div class="empty-state">No shifts or events</div>' : ''}
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
                const dayShifts = getShiftsForDate(dateStr);
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
                            ${unfilled.length ? renderUnfilledAlert(unfilled) : ''}
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
                const unfilled = getUnfilledShifts(dateStr);
                
                return `
                    <div class="month-day-card ${!isCurrentMonth ? 'outside-month' : ''} ${regular && isCurrentMonth ? 'regular-day' : ''} ${today ? 'today' : ''} ${past && isCurrentMonth ? 'past' : ''}">
                        <div class="day-number" style="${today ? 'color:var(--primary);font-weight:600;' : ''}">
                            ${date.getDate()}${today ? ' <span class="today-badge">Today</span>' : ''}
                        </div>
                        <div class="month-day-content">
                            ${dayEvents.slice(0,1).map(e => `<div class="shift-compact" style="background:rgba(201,162,39,0.15);color:var(--accent);"><span class="name">${e.title}</span></div>`).join('')}
                            ${dayShifts.map(s => {
                                const roleClass = s.subtitle === 'Bar Staff' ? 'bar-staff' : s.subtitle === 'Line Cleaning' ? 'line-cleaning' : '';
                                return `<div class="shift-compact ${roleClass}"><span class="name">${s.volunteer_name || 'Needed'}</span><span class="time">${SHIFT_LABELS[s.shift_type] || s.shift_type}</span></div>`;
                            }).join('')}
                            ${unfilled.length ? `<div style="font-size:8px;color:var(--destructive);">&#9888; ${unfilled.map(u => u.label).join(', ')}</div>` : ''}
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
            <div class="shift-card unfilled">
                <div class="shift-info">
                    <div class="shift-name unfilled">&#9888; Volunteer Needed</div>
                    <div class="shift-time">&#128337; ${SHIFT_LABELS[shift.shift_type] || `${shift.custom_start_time}-${shift.custom_end_time}`}</div>
                </div>
                ${!locked ? `<button class="delete-btn" onclick="deleteShift(${shift.id})">&#10005;</button>` : ''}
            </div>
        `;
    }
    
    return `
        <div class="shift-card ${roleClass}">
            <div class="shift-info">
                <div class="shift-name ${roleClass}">&#128100; ${shift.volunteer_name}</div>
                ${shift.subtitle ? `<div class="shift-subtitle">${shift.subtitle}</div>` : ''}
                <div class="shift-time">&#128337; ${SHIFT_LABELS[shift.shift_type] || `${shift.custom_start_time}-${shift.custom_end_time}`}</div>
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
                <div class="event-time">${formatTime(event.start_time)} - ${formatTime(event.end_time)}</div>
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
    document.getElementById('shiftForm').reset();
    document.getElementById('volunteerFields').style.display = 'block';
    document.getElementById('customRoleGroup').style.display = 'none';
    document.getElementById('customTimeFields').style.display = 'none';
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
    
    if (!isUnfilled) {
        if (roleType === 'bar-staff') subtitle = 'Bar Staff';
        else if (roleType === 'line-cleaning') subtitle = 'Line Cleaning';
        else if (roleType === 'custom') subtitle = document.getElementById('customRole').value;
    }
    
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
        await fetch('api.php?action=add_shift', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeShiftModal();
        loadData();
    } catch (error) {
        console.error('Failed to add shift:', error);
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
        await fetch('api.php?action=add_event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeEventModal();
        loadData();
    } catch (error) {
        console.error('Failed to add event:', error);
    }
}

async function deleteShift(id) {
    if (!confirm('Remove this shift?')) return;
    
    try {
        await fetch(`api.php?action=delete_shift&id=${id}`);
        loadData();
    } catch (error) {
        console.error('Failed to delete shift:', error);
    }
}

async function deleteEvent(id) {
    if (!confirm('Remove this event?')) return;
    
    try {
        await fetch(`api.php?action=delete_event&id=${id}`);
        loadData();
    } catch (error) {
        console.error('Failed to delete event:', error);
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
