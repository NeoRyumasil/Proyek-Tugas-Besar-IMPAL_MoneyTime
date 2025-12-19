document.addEventListener('DOMContentLoaded', () => {
    // ============================================
    // 1. ELEMEN UTAMA & VARIABEL
    // ============================================
    const editOverlay = document.getElementById('edit-schedule-modal-overlay');
    const detailOverlay = document.getElementById('schedule-detail-modal-overlay');

    const closeBtn = document.getElementById('closeEditSchModalIcon');
    const cancelBtn = document.getElementById('editSchCancelBtn');
    const confirmBtn = document.getElementById('editSchConfirmBtn');

    // Inputs Form
    const titleInput = document.getElementById('editSchTitle'); 
    const descriptionInput = document.getElementById('editSchDescription');
    const timeDisplay = document.getElementById('editSchTimeDisplay');
    const timeHidden = document.getElementById('editSchTime');
    const dateDisplayInput = document.getElementById('editSchDateDisplay');
    const dateHiddenInput = document.getElementById('editSchDate');
    const priorityHidden = document.getElementById('editSchPriority');

    // Category Elements
    const categoryInput = document.getElementById('editSchCategoryInput');
    const catDropdown = document.getElementById('editSchCategoryDropdown');
    const catList = catDropdown ? catDropdown.querySelector('.schedule-dropdown-list') : null;
    const catAddBtn = document.getElementById('editSchAddCategoryBtn');

    // Time Picker Elements (Edit)
    const timePopup = document.getElementById('editSchTimePopup');
    const editSchHourInput = document.getElementById('editSchHourInput');
    const editSchMinuteInput = document.getElementById('editSchMinuteInput');
    const editSchHourScroll = document.getElementById('editSchHourScrollView');
    const editSchMinuteScroll = document.getElementById('editSchMinuteScrollView');
    
    // Tombol Navigasi Time
    const btnHourUp = document.getElementById('editSchHourUp');
    const btnHourDown = document.getElementById('editSchHourDown');
    const btnMinUp = document.getElementById('editSchMinuteUp');
    const btnMinDown = document.getElementById('editSchMinuteDown');

    // Elemen Prev/Next Time
    const elHourPrev = document.getElementById('editSchHourPrev');
    const elHourNext = document.getElementById('editSchHourNext');
    const elMinPrev = document.getElementById('editSchMinutePrev');
    const elMinNext = document.getElementById('editSchMinuteNext');

    // State Data
    let initialEditData = {}; 
    let scheduleCategories = []; 
    let editHour = 12, editMinute = 0;

    // Helper Functions
    function fmt(n) { return n.toString().padStart(2, '0'); }
    function formatFullDate(dateObj) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return `${days[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    }

    // ============================================
    // 2. LOGIKA KATEGORI (FETCH + COLOR)
    // ============================================
    async function fetchCategories() {
        try {
            const response = await fetch('/api/schedule-categories');
            const data = await response.json();
            if (data.success) {
                scheduleCategories = data.categories;
                renderCategoryList("");
            }
        } catch (error) {
            console.error("Gagal mengambil kategori:", error);
            scheduleCategories = []; 
        }
    }

    function renderCategoryList(filterText = "") {
        if (!catList) return;
        Array.from(catList.querySelectorAll('.schedule-dropdown-item')).forEach(el => el.remove());

        const filtered = scheduleCategories.filter(c => c.toLowerCase().includes(filterText.toLowerCase()));
        let hasExactMatch = false;

        filtered.forEach(cat => {
            if (cat.toLowerCase() === filterText.toLowerCase()) hasExactMatch = true;
            
            const item = document.createElement('div');
            item.className = 'schedule-dropdown-item';
            item.textContent = cat;
            
            // Tampilan Polos (Putih)
            item.style.backgroundColor = '#ffffff';
            item.style.color = '#333333';
            item.style.fontWeight = '500';
            item.style.marginBottom = '4px';
            item.style.borderRadius = '6px';

            item.onclick = (e) => {
                e.stopPropagation();
                categoryInput.value = cat;
                catDropdown.classList.remove('active');
                if (catAddBtn) catAddBtn.style.display = 'none';
            };
            if (catAddBtn) catList.insertBefore(item, catAddBtn);
            else catList.appendChild(item);
        });

        if (catAddBtn) {
            if (filterText && !hasExactMatch) {
                catAddBtn.style.display = 'block';
                catAddBtn.textContent = `Add "${filterText}"`;
                catAddBtn.onclick = (e) => {
                    e.stopPropagation();
                    categoryInput.value = filterText;
                    catDropdown.classList.remove('active');
                    catAddBtn.style.display = 'none';
                };
            } else {
                catAddBtn.style.display = 'none';
            }
        }
    }

    if (categoryInput) {
        categoryInput.addEventListener('click', (e) => {
            e.stopPropagation();
            catDropdown.classList.toggle('active');
            renderCategoryList(categoryInput.value);
        });
        categoryInput.addEventListener('input', (e) => {
            const val = e.target.value;
            if (!catDropdown.classList.contains('active')) catDropdown.classList.add('active');
            renderCategoryList(val);
        });
    }
    document.addEventListener('click', (e) => {
        if (catDropdown && !catDropdown.contains(e.target)) catDropdown.classList.remove('active');
    });

    // ============================================
    // 3. TIME PICKER LOGIC (FULL FEATURE)
    // ============================================
    function updateEditTimeUI() {
        // --- JAM ---
        if (editHour > 23) editHour = 0;
        if (editHour < 0) editHour = 23;

        if (editSchHourInput) editSchHourInput.value = fmt(editHour);

        let hPrev = editHour - 1; if (hPrev < 0) hPrev = 23;
        let hNext = editHour + 1; if (hNext > 23) hNext = 0;
        
        if(elHourPrev) elHourPrev.textContent = fmt(hPrev);
        if(elHourNext) elHourNext.textContent = fmt(hNext);

        // --- MENIT ---
        if (editMinute > 59) editMinute = 0;
        if (editMinute < 0) editMinute = 59;

        if (editSchMinuteInput) editSchMinuteInput.value = fmt(editMinute);

        let mPrev = editMinute - 1; if (mPrev < 0) mPrev = 59;
        let mNext = editMinute + 1; if (mNext > 59) mNext = 0;

        if(elMinPrev) elMinPrev.textContent = fmt(mPrev);
        if(elMinNext) elMinNext.textContent = fmt(mNext);
    }

    // A. Tombol Panah
    if(btnHourUp) btnHourUp.addEventListener('click', (e) => { e.stopPropagation(); editHour--; updateEditTimeUI(); });
    if(btnHourDown) btnHourDown.addEventListener('click', (e) => { e.stopPropagation(); editHour++; updateEditTimeUI(); });
    
    if(btnMinUp) btnMinUp.addEventListener('click', (e) => { e.stopPropagation(); editMinute--; updateEditTimeUI(); });
    if(btnMinDown) btnMinDown.addEventListener('click', (e) => { e.stopPropagation(); editMinute++; updateEditTimeUI(); });

    // B. Input Manual
    if(editSchHourInput) {
        editSchHourInput.addEventListener('change', () => {
            let val = parseInt(editSchHourInput.value);
            if(isNaN(val)) val = 0;
            editHour = val;
            updateEditTimeUI();
        });
    }
    if(editSchMinuteInput) {
        editSchMinuteInput.addEventListener('change', () => {
            let val = parseInt(editSchMinuteInput.value);
            if(isNaN(val)) val = 0;
            editMinute = val;
            updateEditTimeUI();
        });
    }

    // C. Scroll & Drag
    function setupEditDragAndScroll(element, isHour) {
        if (!element) return;
        let isDragging = false;
        let startY = 0;
        
        element.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY > 0) isHour ? editHour++ : editMinute++;
            else isHour ? editHour-- : editMinute--;
            updateEditTimeUI();
        });

        element.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            isDragging = true;
            startY = e.clientY;
            element.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const diffY = e.clientY - startY;
            const threshold = 15;

            if (diffY > threshold) {
                isHour ? editHour++ : editMinute++;
                updateEditTimeUI();
                startY = e.clientY;
            } else if (diffY < -threshold) {
                isHour ? editHour-- : editMinute--;
                updateEditTimeUI();
                startY = e.clientY;
            }
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
            if(element) element.style.cursor = 'grab';
        });
    }

    setupEditDragAndScroll(editSchHourScroll, true);
    setupEditDragAndScroll(editSchMinuteScroll, false);

    // D. Open/Close Time Popup
    if(timeDisplay) {
        timeDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            updateEditTimeUI();
            if(timePopup) timePopup.classList.add('active');
            // Close date calendar if open
            if(calPopup) closeCalendar();
        });
    }
    document.getElementById('editSchTimeOkBtn')?.addEventListener('click', (e)=>{
        e.stopPropagation();
        const finalTime = `${fmt(editHour)}:${fmt(editMinute)}`;
        if(timeDisplay) timeDisplay.value = finalTime;
        if(timeHidden) timeHidden.value = finalTime;
        if(timePopup) timePopup.classList.remove('active');
    });
    document.getElementById('editSchTimeCancelBtn')?.addEventListener('click', (e)=>{
        e.stopPropagation(); 
        if(timePopup) timePopup.classList.remove('active');
    });

    // ============================================
    // 4. DATE PICKER LOGIC (EDIT MODE)
    // ============================================
    const calPopup = document.getElementById('editSchCalendarPopup');
    const datePickerWrapper = document.getElementById('editSchDatePickerWrapper');
    
    // Header & Views
    const calMonthLabel = document.getElementById('editSchCalMonthLabel');
    const calPrevBtn = document.getElementById('editSchCalPrevBtn');
    const calNextBtn = document.getElementById('editSchCalNextBtn');
    const viewDays = document.getElementById('editSchCalendarViewDays');
    const viewMonths = document.getElementById('editSchCalendarViewMonths');
    const calDaysGrid = document.getElementById('editSchCalDaysGrid');
    const calMonthsGrid = document.getElementById('editSchCalMonthsGrid');

    let schCalDate = new Date();
    let selectedDate = null;
    let currentView = 'days';
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    function updateCalHeader() {
        if (!calMonthLabel) return;
        const year = schCalDate.getFullYear();
        const month = schCalDate.getMonth();

        if (currentView === 'days') {
            calMonthLabel.textContent = `${monthNames[month]} ${year}`;
            if(viewDays) viewDays.style.display = 'block';
            if(viewMonths) viewMonths.style.display = 'none';
        } else {
            calMonthLabel.textContent = `${year}`;
            if(viewDays) viewDays.style.display = 'none';
            if(viewMonths) viewMonths.style.display = 'block';
        }
    }

    function renderCalDays() {
        if (!calDaysGrid) return;
        calDaysGrid.innerHTML = '';

        const year = schCalDate.getFullYear();
        const month = schCalDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        for (let i = 0; i < firstDay; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'sch-cal-day empty'; // Ensure style matches
            emptyDiv.style.visibility = 'hidden';
            calDaysGrid.appendChild(emptyDiv);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'schedule-calendar-day';
            dayDiv.textContent = d;

            // Styles
            dayDiv.style.cursor = 'pointer';
            dayDiv.style.textAlign = 'center';
            dayDiv.style.padding = '5px';
            dayDiv.style.borderRadius = '5px';

            if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayDiv.classList.add('today');
                dayDiv.style.fontWeight = 'bold';
                dayDiv.style.color = '#1a3e7f';
            }

            if (selectedDate &&
                d === selectedDate.getDate() &&
                month === selectedDate.getMonth() &&
                year === selectedDate.getFullYear()) {
                dayDiv.classList.add('active');
                dayDiv.style.backgroundColor = '#1a3e7f';
                dayDiv.style.color = '#fff';
            }

            dayDiv.onclick = (e) => {
                e.stopPropagation();
                selectedDate = new Date(year, month, d);
                // Display: "Friday, 12 December 2025"
                const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
                if(dateDisplayInput) dateDisplayInput.value = `${dayName}, ${d} ${monthNames[month]} ${year}`;
                
                // Value: YYYY-MM-DD
                const fmtMonth = String(month + 1).padStart(2, '0');
                const fmtDay = String(d).padStart(2, '0');
                if(dateHiddenInput) dateHiddenInput.value = `${year}-${fmtMonth}-${fmtDay}`;

                closeCalendar();
            };
            calDaysGrid.appendChild(dayDiv);
        }
    }

    function renderCalMonths() {
        if (!calMonthsGrid) return;
        calMonthsGrid.innerHTML = '';
        const currentMonth = schCalDate.getMonth();

        shortMonths.forEach((mName, idx) => {
            const mDiv = document.createElement('div');
            mDiv.className = 'schedule-calendar-month-item';
            mDiv.textContent = mName;
            
            mDiv.style.cursor = 'pointer';
            mDiv.style.padding = '10px';
            mDiv.style.textAlign = 'center';
            mDiv.style.borderRadius = '6px';

            if (idx === currentMonth) {
                mDiv.style.backgroundColor = '#e0e7ff';
                mDiv.style.color = '#1a3e7f';
                mDiv.style.fontWeight = 'bold';
            }

            mDiv.onclick = (e) => {
                e.stopPropagation();
                schCalDate.setMonth(idx);
                currentView = 'days';
                renderCalendar();
            };
            calMonthsGrid.appendChild(mDiv);
        });
    }

    function renderCalendar() {
        updateCalHeader();
        if (currentView === 'days') renderCalDays();
        else renderCalMonths();
    }

    function openCalendar() {
        // Initialize calendar view to the selected date if exists, else today
        schCalDate = selectedDate ? new Date(selectedDate) : new Date();
        currentView = 'days';
        renderCalendar();
        if (calPopup) {
            calPopup.classList.add('active');
            calPopup.style.display = 'block';
        }
    }

    function closeCalendar() {
        if (calPopup) {
            calPopup.classList.remove('active');
            calPopup.style.display = 'none';
        }
    }

    // Event Listeners for Date Edit
    if(dateDisplayInput) {
        dateDisplayInput.addEventListener('click', (e) => {
            e.stopPropagation();
            if(timePopup) timePopup.classList.remove('active');
            if(calPopup && (calPopup.style.display === 'block' || calPopup.classList.contains('active'))) {
                closeCalendar();
            } else {
                openCalendar();
            }
        });
    }

    if(calMonthLabel) {
        calMonthLabel.addEventListener('click', (e) => {
            e.stopPropagation();
            currentView = (currentView === 'days') ? 'months' : 'days';
            renderCalendar();
        });
    }
    if(calPrevBtn) {
        calPrevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentView === 'days') schCalDate.setMonth(schCalDate.getMonth() - 1);
            else schCalDate.setFullYear(schCalDate.getFullYear() - 1);
            renderCalendar();
        });
    }
    if(calNextBtn) {
        calNextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentView === 'days') schCalDate.setMonth(schCalDate.getMonth() + 1);
            else schCalDate.setFullYear(schCalDate.getFullYear() + 1);
            renderCalendar();
        });
    }

    // Close when clicking outside
    document.addEventListener('click', (e)=>{
        if(calPopup && (calPopup.style.display === 'block' || calPopup.classList.contains('active'))) {
            if(datePickerWrapper && !datePickerWrapper.contains(e.target)) {
                closeCalendar();
            }
        }
    });

    // ============================================
    // 5. BUKA MODAL EDIT (LOAD DATA)
    // ============================================
    const editDetailBtn = document.getElementById('schDetailEditBtn');

    if (editDetailBtn) {
        editDetailBtn.onclick = function() {
            const data = window.currentScheduleDetail;
            if(!data) {
                if (typeof showToast === 'function') showToast("Error: No data found.", "error");
                return;
            }

            // Fetch Data dari DB
            fetchCategories();

            if(titleInput) titleInput.value = data.title || "";
            if(descriptionInput) descriptionInput.value = data.description || "";
            if(timeDisplay) timeDisplay.value = data.time || "";
            if(timeHidden) timeHidden.value = data.time || "";
            
            // Parse Jam & Menit untuk Time Picker
            if(data.time && data.time.includes(':')) {
                const p = data.time.split(':');
                editHour = parseInt(p[0]); 
                editMinute = parseInt(p[1]);
            } else {
                editHour = 12; editMinute = 0;
            }
            updateEditTimeUI(); // Update tampilan awal Time Picker
            
            // Set Date Data
            if(dateHiddenInput) dateHiddenInput.value = data.date || "";
            if(data.date) {
                const d = new Date(data.date);
                if(!isNaN(d.getTime())) {
                    selectedDate = d; // Set global selected date var
                    if(dateDisplayInput) dateDisplayInput.value = formatFullDate(d);
                } else {
                    selectedDate = null;
                }
            } else {
                selectedDate = null;
            }
            
            if(categoryInput) categoryInput.value = data.category || "";
            
            // Priority Selection
            const prioContainer = document.getElementById('editSchPrioritySelector');
            if(prioContainer) {
                prioContainer.querySelectorAll('.priority-option').forEach(o => o.classList.remove('active'));
                const targetPrio = (data.priority || 'None').toLowerCase();
                const match = prioContainer.querySelector(`.priority-option.${targetPrio}`);
                if(match) { 
                    match.classList.add('active'); 
                    if(priorityHidden) priorityHidden.value = match.dataset.value; 
                } else { 
                    if(priorityHidden) priorityHidden.value = 'None'; 
                    prioContainer.querySelector('.priority-option.none')?.classList.add('active'); 
                }
            }

            initialEditData = {
                title: titleInput ? titleInput.value : "",
                desc: descriptionInput ? descriptionInput.value : "",
                time: timeHidden ? timeHidden.value : "",
                date: dateHiddenInput ? dateHiddenInput.value : "",
                cat: categoryInput ? categoryInput.value : "",
                prio: priorityHidden ? priorityHidden.value : "None"
            };

            if (detailOverlay) detailOverlay.style.display = 'none';
            if (editOverlay) editOverlay.style.display = 'flex';
        };
    }

    // ============================================
    // 6. CONFIRM EDIT & DISCARD
    // ============================================
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            if (!titleInput || !titleInput.value.trim()) { 
                if (typeof showToast === 'function') showToast("Please enter Activity Name.", "error"); 
                return; 
            }
            if (!window.currentScheduleDetail || !window.currentScheduleDetail.id) return;
            
            try {
                const payload = {
                    id: window.currentScheduleDetail.id,
                    title: titleInput.value.trim(),
                    description: descriptionInput ? descriptionInput.value.trim() : "",
                    date: dateHiddenInput ? dateHiddenInput.value : "",
                    time: timeHidden ? timeHidden.value : "",
                    category: categoryInput ? categoryInput.value.trim() : "Other", 
                    priority: priorityHidden ? priorityHidden.value : "None"
                };

                const response = await fetch('/edit-schedule', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                if (result.success) {
                    if (typeof showToast === 'function') showToast("Schedule updated!", "success");
                    initialEditData = { ...initialEditData, ...payload, cat: payload.category };
                    closeModal();
                    if (typeof window.fetchSchedules === 'function') window.fetchSchedules();
                    else location.reload();
                } else {
                    if (typeof showToast === 'function') showToast("Failed: " + result.message, "error");
                }
            } catch (error) { 
                console.error(error); 
                if (typeof showToast === 'function') showToast("Server error.", "error");
            }
        });
    }

    function isEditDirty() {
        return (
            (titleInput && titleInput.value !== initialEditData.title) ||
            (descriptionInput && descriptionInput.value !== initialEditData.desc) ||
            (timeHidden && timeHidden.value !== initialEditData.time) ||
            (dateHiddenInput && dateHiddenInput.value !== initialEditData.date) ||
            (categoryInput && categoryInput.value !== initialEditData.cat) ||
            (priorityHidden && priorityHidden.value !== initialEditData.prio)
        );
    }

    function closeModal() { if (editOverlay) editOverlay.style.display = 'none'; }
    function handleCloseAttempt() { if (isEditDirty()) showDiscardModal(); else closeModal(); }

    function showDiscardModal() {
        const discardModal = document.getElementById('discard-modal-overlay');
        if (discardModal) {
            discardModal.style.display = 'flex';
            const modalContent = discardModal.querySelector('.modal');
            if (modalContent) setTimeout(() => modalContent.classList.add('show'), 10);
            
            const noBtn = document.getElementById('discardNoBtn');
            const yesBtn = document.getElementById('discardYesBtn');
            const newNo = noBtn.cloneNode(true);
            const newYes = yesBtn.cloneNode(true);
            noBtn.parentNode.replaceChild(newNo, noBtn);
            yesBtn.parentNode.replaceChild(newYes, yesBtn);

            newNo.onclick = () => { if (modalContent) modalContent.classList.remove('show'); setTimeout(() => discardModal.style.display = 'none', 300); };
            newYes.onclick = () => { if (modalContent) modalContent.classList.remove('show'); setTimeout(() => { discardModal.style.display = 'none'; closeModal(); }, 300); };
        }
    }

    if (closeBtn) closeBtn.addEventListener('click', handleCloseAttempt);
    if (cancelBtn) cancelBtn.addEventListener('click', handleCloseAttempt);

    // Priority Click Listener
    const prioOptions = document.querySelectorAll('#editSchPrioritySelector .priority-option');
    prioOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            prioOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            if(priorityHidden) priorityHidden.value = opt.dataset.value;
        });
    });
});