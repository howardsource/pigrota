<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Volunteer Rota - The Blue Pig</title>
    <link rel="stylesheet" href="https://use.typekit.net/ohf8ixk.css">
    <link rel="stylesheet" href="styles.css?v=<?php echo time(); ?>">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="header-inner">
                <img src="bluepig.png" alt="The Blue Pig" class="header-logo">
                <div class="header-titles">
                    <h1>The Blue Pig</h1>
                    <h2>Volunteer Rota</h2>
                    
                </div>
            </div>

        <nav class="nav">
            <div class="nav-left" id="standardNav">
                <button class="nav-btn" id="prevBtn">&larr;</button>
                <span class="date-display" id="dateDisplay"></span>
                <button class="nav-btn" id="nextBtn">&rarr;</button>
                <button class="nav-btn" id="todayBtn">Today</button>
                <button class="nav-btn pdf-btn" id="pdfBtn" style="display:inline-flex;">
                    <span class="pdf-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                    </span>
                    <span class="pdf-text">Download PDF</span>
                </button>
                <?php /* REMOVED FOR THE TIME BEING! <button class="nav-btn whatsapp-btn" id="whatsappBtn" style="display:inline-flex;">
                    <span class="whatsapp-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                    </span>
                    <span class="whatsapp-text">WhatsApp</span>
                </button> */ ?>
            </div>

            <div class="date-range-controls" id="dateRangeControls" style="display: none;">
                <input type="date" id="listStartDate" class="nav-date-input">
                <span class="date-separator">to</span>
                <input type="date" id="listEndDate" class="nav-date-input">
                <button id="applyDateRangeBtn" class="nav-btn btn-primary">Go</button>
            </div>
            
            <div class="view-toggle">
                <button class="view-btn active" data-view="month">Month</button>
                <button class="view-btn" data-view="week">Week</button>
                <button class="view-btn" data-view="list">List</button>
            </div>
        </nav>
        
        <main id="calendarView"></main>
    </div>
    
    <!-- Add Shift Modal -->
    <div class="modal-overlay" id="shiftModal">
        <div class="modal">
            <h2>Add Shift</h2>
            <form id="shiftForm">
                <input type="hidden" id="shiftDate" name="date">
                <input type="hidden" id="shiftId" name="id">
                
                <div class="checkbox-group" id="unfilledGroup">
                    <input type="checkbox" id="isUnfilled" name="is_unfilled">
                    <label for="isUnfilled">Mark as unfilled (volunteer needed)</label>
                </div>

                <div class="form-group" id="quantityGroup" style="display:none;">
                    <label for="shiftQuantity">Quantity Needed</label>
                    <select id="shiftQuantity" name="quantity">
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                    </select>
                </div>
                
                <div class="form-group" id="volunteerNameGroup">
                    <label for="volunteerName">Your Name *</label>
                    <input type="text" id="volunteerName" name="volunteer_name" required>
                </div>
                
                <div class="form-group">
                    <label for="roleType">Role</label>
                    <select id="roleType" name="role_type">
                        <option value="bar-staff">Bar Staff</option>
                        <option value="bar-help">Bar Help</option>
                        <option value="line-cleaning">Line Cleaning</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>
                
                <div class="form-group" id="customRoleGroup" style="display:none;">
                    <label for="customRole">Custom Role</label>
                    <input type="text" id="customRole" name="custom_role">
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
                    <button type="submit" class="btn btn-primary" id="shiftSubmitBtn">Add Shift</button>
                    <button type="button" class="btn btn-danger" id="deleteShiftBtn" style="display:none;">Delete</button>
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
                <input type="hidden" id="eventId" name="id">
                
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
                    <button type="submit" class="btn btn-primary" id="eventSubmitBtn">Add Event</button>
                    <button type="button" class="btn btn-danger" id="deleteEventBtn" style="display:none;">Delete</button>
                </div>
            </form>
        </div>
    </div>
    
    <script src="app.js?v=<?php echo time(); ?>"></script>
</body>
</html>
