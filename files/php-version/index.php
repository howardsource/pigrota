<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Volunteer Rota - The Blue Pig</title>
    <link rel="stylesheet" href="styles.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>The Blue Pig</h1>
            <p>Volunteer Rota</p>
            
            <nav class="nav">
                <div class="view-toggle">
                    <button class="view-btn active" data-view="list">List</button>
                    <button class="view-btn" data-view="week">Week</button>
                    <button class="view-btn" data-view="month">Month</button>
                </div>
                
                <button class="nav-btn" id="prevBtn">&larr;</button>
                <span class="date-display" id="dateDisplay"></span>
                <button class="nav-btn" id="nextBtn">&rarr;</button>
                <button class="nav-btn" id="todayBtn">Today</button>
                <button class="nav-btn pdf-btn" id="pdfBtn" style="display:none;">Download PDF</button>
            </nav>
        </header>
        
        <main id="calendarView"></main>
    </div>
    
    <!-- Add Shift Modal -->
    <div class="modal-overlay" id="shiftModal">
        <div class="modal">
            <h2>Add Shift</h2>
            <form id="shiftForm">
                <input type="hidden" id="shiftDate" name="date">
                
                <div class="checkbox-group">
                    <input type="checkbox" id="isUnfilled" name="is_unfilled">
                    <label for="isUnfilled">Mark as unfilled (volunteer needed)</label>
                </div>
                
                <div id="volunteerFields">
                    <div class="form-group">
                        <label for="volunteerName">Your Name *</label>
                        <input type="text" id="volunteerName" name="volunteer_name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="roleType">Role</label>
                        <select id="roleType" name="role_type">
                            <option value="bar-staff">Bar Staff</option>
                            <option value="line-cleaning">Line Cleaning</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                    
                    <div class="form-group" id="customRoleGroup" style="display:none;">
                        <label for="customRole">Custom Role</label>
                        <input type="text" id="customRole" name="custom_role">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="shiftType">Shift Time</label>
                    <select id="shiftType" name="shift_type">
                        <option value="12-3">12 - 3pm</option>
                        <option value="3-6" selected>3 - 6pm</option>
                        <option value="6-9">6 - 9pm</option>
                        <option value="9-11">9 - 11pm</option>
                        <option value="custom">Custom Time</option>
                    </select>
                </div>
                
                <div id="customTimeFields" style="display:none;">
                    <div class="form-group">
                        <label for="customStartTime">Start Time</label>
                        <input type="time" id="customStartTime" name="custom_start_time" value="09:00">
                    </div>
                    <div class="form-group">
                        <label for="customEndTime">End Time</label>
                        <input type="time" id="customEndTime" name="custom_end_time" value="17:00">
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeShiftModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Shift</button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Add Event Modal -->
    <div class="modal-overlay" id="eventModal">
        <div class="modal">
            <h2>Add Event</h2>
            <form id="eventForm">
                <input type="hidden" id="eventDate" name="date">
                
                <div class="form-group">
                    <label for="eventTitle">Event Title *</label>
                    <input type="text" id="eventTitle" name="title" required>
                </div>
                
                <div class="form-group">
                    <label for="eventStartTime">Start Time</label>
                    <input type="time" id="eventStartTime" name="start_time" value="19:00" required>
                </div>
                
                <div class="form-group">
                    <label for="eventEndTime">End Time</label>
                    <input type="time" id="eventEndTime" name="end_time" value="22:00" required>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeEventModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Event</button>
                </div>
            </form>
        </div>
    </div>
    
    <script src="app.js"></script>
</body>
</html>
