document.addEventListener('DOMContentLoaded', () => {
    // ============================================================
    // 1. VARIABLE & ELEMENT SELECTIONS
    // ============================================================
    const overlay = document.getElementById('add-schedule-modal-overlay');
    const openBtn = document.getElementById('addScheduleBtn');
    const closeBtn = document.getElementById('closeScheduleModalIcon');
    const cancelBtn = document.getElementById('scheduleCancelBtn');
    const confirmBtn = document.getElementById('scheduleConfirmBtn');

    // Form Inputs
    const activityNameInput = document.getElementById('scheduleActivityName');
    const descDetailsInput = document.getElementById('scheduleDescriptionDetails');
    const timeDisplay = document.getElementById('scheduleTimeDisplay');
    const timeHidden = document.getElementById('scheduleTime');
    const dateDisplayInput = document.getElementById('scheduleDateDisplay');
    const dateHiddenInput = document.getElementById('scheduleDate');
    const categoryInput = document.getElementById('scheduleCategoryInput');
    const priorityHidden = document.getElementById('schedulePriority');

    // Time Picker Elements
    const timePopup = document.getElementById('customTimePopup');
    const timeOk = document.getElementById('timeOkBtn');
    const timeCancel = document.getElementById('timeCancelBtn');
    
    // Hour Elements
    const hourInput = document.getElementById('hourInput');
    const hourScroll = document.getElementById('hourScrollView');
    const btnHourUp = document.getElementById('timeHourUp');
    const btnHourDown = document.getElementById('timeHourDown');
    const elHourPrev = document.getElementById('hourPrev');
    const elHourNext = document.getElementById('hourNext');

    // Minute Elements
    const minInput = document.getElementById('minuteInput');
    const minScroll = document.getElementById('minuteScrollView');
    const btnMinUp = document.getElementById('timeMinuteUp');
    const btnMinDown = document.getElementById('timeMinuteDown');
    const elMinPrev = document.getElementById('minutePrev');
    const elMinNext = document.getElementById('minuteNext');

    let currentHour = 12;
    let currentMinute = 0;

    // ============================================================
    // 2. MODAL & FORM UTILITY (OPEN, CLOSE, CLEAR)
    // ============================================================
    
    // Buka Modal
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            if (overlay) {
                overlay.style.display = 'flex';
                clearForm();
                fetchCategories(); 
                
                // Reset Time Picker ke default
                currentHour = 12;
                currentMinute = 0;
                updateTimeUI();
            }
        });
    }

    // Cek apakah form sudah terisi (Dirty Check)
    function isFormDirty() {
        return (
            (activityNameInput && activityNameInput.value.trim() !== '') ||
            (descDetailsInput && descDetailsInput.value.trim() !== '') ||
            (timeHidden && timeHidden.value !== '') ||
            (dateDisplayInput && dateDisplayInput.value !== '') ||
            (categoryInput && categoryInput.value.trim() !== '') ||
            (priorityHidden && priorityHidden.value !== 'None')
        );
    }

    // Tutup Modal
    function closeModal() {
        if (overlay) overlay.style.display = 'none';
        clearForm();
    }

    // Bersihkan Form
    function clearForm() {
        if (activityNameInput) activityNameInput.value = '';
        if (descDetailsInput) descDetailsInput.value = '';
        if (timeDisplay) timeDisplay.value = '';
        if (timeHidden) timeHidden.value = '';
        if (dateDisplayInput) dateDisplayInput.value = '';
        if (dateHiddenInput) dateHiddenInput.value = '';
        if (categoryInput) categoryInput.value = '';
        
        // Reset Date Picker State
        selectedDate = null;
        schCalDate = new Date();

        const prioContainer = document.getElementById('addSchPrioritySelector');
        if (prioContainer) {
            prioContainer.querySelectorAll('.priority-option').forEach(opt => opt.classList.remove('active'));
            const noneOpt = prioContainer.querySelector('.priority-option.none');
            if (noneOpt) noneOpt.classList.add('active');
        }
        if (priorityHidden) priorityHidden.value = 'None';

        const addCategoryBtn = document.getElementById('scheduleAddCategoryBtn');
        if (addCategoryBtn) addCategoryBtn.style.display = 'none';
    }

    // ============================================================
    // 3. DISCARD CHANGES LOGIC
    // ============================================================
    function handleCloseAttempt() {
        if (isFormDirty()) showDiscardModal();
        else closeModal();
    }

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

            newNo.onclick = () => {
                if (modalContent) modalContent.classList.remove('show');
                setTimeout(() => discardModal.style.display = 'none', 300);
            };

            newYes.onclick = () => {
                if (modalContent) modalContent.classList.remove('show');
                setTimeout(() => {
                    discardModal.style.display = 'none';
                    closeModal();
                }, 300);
            };
        }
    }

    if (closeBtn) closeBtn.addEventListener('click', handleCloseAttempt);
    if (cancelBtn) cancelBtn.addEventListener('click', handleCloseAttempt);

    // ============================================================
    // 4. CATEGORY LOGIC
    // ============================================================
    const catDropdown = document.getElementById('scheduleCategoryDropdown');
    const catList = catDropdown ? catDropdown.querySelector('.schedule-dropdown-list') : null;
    const addCategoryBtn = document.getElementById('scheduleAddCategoryBtn');
    let scheduleCategories = []; 

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
        Array.from(catList.querySelectorAll('.schedule-dropdown-item')).forEach(i => i.remove());
        
        const filtered = scheduleCategories.filter(c => c.toLowerCase().includes(filterText.toLowerCase()));
        let hasExactMatch = false;

        filtered.forEach(cat => {
            if (cat.toLowerCase() === filterText.toLowerCase()) hasExactMatch = true;
            const item = document.createElement('div');
            item.className = 'schedule-dropdown-item';
            item.textContent = cat;
            item.style.backgroundColor = '#ffffff';
            item.style.color = '#333333';
            item.onclick = (e) => {
                e.stopPropagation(); 
                categoryInput.value = cat;
                catDropdown.classList.remove('active');
                if (addCategoryBtn) addCategoryBtn.style.display = 'none';
            };
            if (addCategoryBtn) catList.insertBefore(item, addCategoryBtn);
            else catList.appendChild(item);
        });

        if (addCategoryBtn) {
            if (filterText && !hasExactMatch) {
                addCategoryBtn.textContent = `Add "${filterText}"`;
                addCategoryBtn.style.display = 'block';
            } else {
                addCategoryBtn.style.display = 'none';
            }
        }
    }

    if (categoryInput) {
        categoryInput.addEventListener('click', (e) => { e.stopPropagation(); catDropdown.classList.toggle('active'); renderCategoryList(categoryInput.value); });
        categoryInput.addEventListener('input', () => { if (!catDropdown.classList.contains('active')) catDropdown.classList.add('active'); renderCategoryList(categoryInput.value.trim()); });
    }
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', (e) => { e.stopPropagation(); categoryInput.value = categoryInput.value.trim(); catDropdown.classList.remove('active'); addCategoryBtn.style.display = 'none'; });
    }
    document.addEventListener('click', (e) => { if (catDropdown && !catDropdown.contains(e.target)) catDropdown.classList.remove('active'); });

    // ============================================================
    // 5. PRIORITY LOGIC
    // ============================================================
    const addPrioContainer = document.getElementById('addSchPrioritySelector');
    if (addPrioContainer) {
        addPrioContainer.querySelectorAll('.priority-option').forEach(opt => {
            opt.addEventListener('click', () => {
                addPrioContainer.querySelectorAll('.priority-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                if (priorityHidden) priorityHidden.value = opt.dataset.value;
            });
        });
    }

    // ============================================================
    // 6. NEW TIME PICKER LOGIC (SCROLL, DRAG, PREV/NEXT)
    // ============================================================

    function fmt(n) { return n.toString().padStart(2, '0'); }

    function updateTimeUI() {
        // --- JAM ---
        if (currentHour > 23) currentHour = 0;
        if (currentHour < 0) currentHour = 23;

        if (hourInput) hourInput.value = fmt(currentHour);

        let hPrev = currentHour - 1; if (hPrev < 0) hPrev = 23;
        let hNext = currentHour + 1; if (hNext > 23) hNext = 0;
        
        if(elHourPrev) elHourPrev.textContent = fmt(hPrev);
        if(elHourNext) elHourNext.textContent = fmt(hNext);

        // --- MENIT ---
        if (currentMinute > 59) currentMinute = 0;
        if (currentMinute < 0) currentMinute = 59;

        if (minInput) minInput.value = fmt(currentMinute);

        let mPrev = currentMinute - 1; if (mPrev < 0) mPrev = 59;
        let mNext = currentMinute + 1; if (mNext > 59) mNext = 0;

        if(elMinPrev) elMinPrev.textContent = fmt(mPrev);
        if(elMinNext) elMinNext.textContent = fmt(mNext);
    }

    if(btnHourUp) btnHourUp.addEventListener('click', (e) => { e.stopPropagation(); currentHour--; updateTimeUI(); });
    if(btnHourDown) btnHourDown.addEventListener('click', (e) => { e.stopPropagation(); currentHour++; updateTimeUI(); });
    
    if(btnMinUp) btnMinUp.addEventListener('click', (e) => { e.stopPropagation(); currentMinute--; updateTimeUI(); });
    if(btnMinDown) btnMinDown.addEventListener('click', (e) => { e.stopPropagation(); currentMinute++; updateTimeUI(); });

    if(hourInput) {
        hourInput.addEventListener('change', () => {
            let val = parseInt(hourInput.value);
            if(isNaN(val)) val = 0;
            currentHour = val;
            updateTimeUI();
        });
    }
    if(minInput) {
        minInput.addEventListener('change', () => {
            let val = parseInt(minInput.value);
            if(isNaN(val)) val = 0;
            currentMinute = val;
            updateTimeUI();
        });
    }

    function setupInteraction(element, isHour) {
        if (!element) return;
        let isDragging = false;
        let startY = 0;
        
        element.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY > 0) isHour ? currentHour++ : currentMinute++;
            else isHour ? currentHour-- : currentMinute--;
            updateTimeUI();
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
                isHour ? currentHour++ : currentMinute++;
                updateTimeUI();
                startY = e.clientY;
            } else if (diffY < -threshold) {
                isHour ? currentHour-- : currentMinute--;
                updateTimeUI();
                startY = e.clientY;
            }
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
            if(element) element.style.cursor = 'grab';
        });
    }

    setupInteraction(hourScroll, true);
    setupInteraction(minScroll, false);

    if(timeDisplay) {
        timeDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            updateTimeUI();
            if(timePopup) timePopup.classList.add('active');
            if(calPopup) calPopup.classList.remove('active'); // Close calendar if open
        });
    }
    if(timeOk) {
        timeOk.addEventListener('click', (e) => {
            e.stopPropagation();
            timeDisplay.value = `${fmt(currentHour)}:${fmt(currentMinute)}`;
            timeHidden.value = timeDisplay.value;
            if(timePopup) timePopup.classList.remove('active');
        });
    }
    if(timeCancel) {
        timeCancel.addEventListener('click', (e) => {
            e.stopPropagation();
            if(timePopup) timePopup.classList.remove('active');
        });
    }

    // ============================================================
    // 7. DATE PICKER LOGIC (MATCHING TRANSACTION FE)
    // ============================================================
    const calPopup = document.getElementById('scheduleCalendarPopup');
    const schDatePickerWrapper = document.getElementById('scheduleDatePickerWrapper');

    // Header & Views
    const calMonthLabel = document.getElementById('schCalMonthLabel');
    const calPrevBtn = document.getElementById('schCalPrevBtn');
    const calNextBtn = document.getElementById('schCalNextBtn');
    const viewDays = document.getElementById('schCalendarViewDays');
    const viewMonths = document.getElementById('schCalendarViewMonths');
    const calDaysGrid = document.getElementById('schCalDaysGrid');
    const calMonthsGrid = document.getElementById('schCalMonthsGrid');

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
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'sch-cal-day empty'; // style via css if needed
            emptyDiv.style.visibility = 'hidden';
            calDaysGrid.appendChild(emptyDiv);
        }

        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'schedule-calendar-day'; // Use existing class or new
            dayDiv.textContent = d;

            // Highlight Today
            if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayDiv.classList.add('today'); 
                dayDiv.style.fontWeight = 'bold';
                dayDiv.style.color = '#1a3e7f';
            }

            // Highlight Selected
            if (selectedDate &&
                d === selectedDate.getDate() &&
                month === selectedDate.getMonth() &&
                year === selectedDate.getFullYear()) {
                dayDiv.classList.add('active'); // Or 'selected'
                dayDiv.style.backgroundColor = '#1a3e7f';
                dayDiv.style.color = '#fff';
            } else {
                // Default cursor style
                dayDiv.style.cursor = 'pointer';
                dayDiv.style.textAlign = 'center';
                dayDiv.style.padding = '5px';
                dayDiv.style.borderRadius = '5px';
            }

            dayDiv.onclick = (e) => {
                e.stopPropagation();
                selectedDate = new Date(year, month, d);

                // Format Display: "Monday, 18 September 2025"
                const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
                if(dateDisplayInput) dateDisplayInput.value = `${dayName}, ${d} ${monthNames[month]} ${year}`;

                // Format Backend: YYYY-MM-DD
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
            mDiv.className = 'schedule-calendar-month-item'; // CSS class needs to exist or style inline
            mDiv.textContent = mName;
            
            // Inline style for layout (grid item)
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
        schCalDate = selectedDate ? new Date(selectedDate) : new Date();
        currentView = 'days';
        renderCalendar();
        if (calPopup) calPopup.classList.add('active');
        if (calPopup) calPopup.style.display = 'block'; // Ensure display block if css uses that
    }

    function closeCalendar() {
        if (calPopup) {
            calPopup.classList.remove('active');
            calPopup.style.display = 'none';
        }
    }

    // Listeners for Date Picker
    if(dateDisplayInput) {
        dateDisplayInput.addEventListener('click', (e) => {
            e.stopPropagation();
            if(timePopup) timePopup.classList.remove('active'); // Close time if open
            
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
            if (currentView === 'days') {
                schCalDate.setMonth(schCalDate.getMonth() - 1);
            } else {
                schCalDate.setFullYear(schCalDate.getFullYear() - 1);
            }
            renderCalendar();
        });
    }

    if(calNextBtn) {
        calNextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentView === 'days') {
                schCalDate.setMonth(schCalDate.getMonth() + 1);
            } else {
                schCalDate.setFullYear(schCalDate.getFullYear() + 1);
            }
            renderCalendar();
        });
    }

    // Close when clicking outside
    document.addEventListener('click', (e)=>{
        if(calPopup && (calPopup.style.display === 'block' || calPopup.classList.contains('active'))) { 
            if(schDatePickerWrapper && !schDatePickerWrapper.contains(e.target)) {
                closeCalendar();
            }
        }
        
        const wrapperTime = document.getElementById('scheduleTimePickerWrapper');
        if(timePopup && timePopup.classList.contains('active') && wrapperTime && !wrapperTime.contains(e.target)) { 
            timePopup.classList.remove('active'); 
        }
    });

    // ============================================================
    // 8. CONFIRM BUTTON (SAVE)
    // ============================================================
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            if (!activityNameInput.value || !dateDisplayInput.value || !timeDisplay.value) {
                if (typeof showToast === 'function') showToast('Please fill required fields', 'error');
                return;
            }
            try {
                const response = await fetch('/add-schedule', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: activityNameInput.value.trim(),
                        description: descDetailsInput.value.trim(),
                        date: dateHiddenInput.value,
                        time: timeHidden.value,
                        category: categoryInput.value.trim() || 'Other',
                        priority: priorityHidden.value
                    })
                });
                const result = await response.json();
                if (result.success) {
                    if (typeof showToast === 'function') showToast("Schedule added", "success");
                    closeModal();
                    if (typeof window.fetchSchedules === 'function') window.fetchSchedules();
                    else location.reload();
                } else {
                    if (typeof showToast === 'function') showToast(result.message, 'error');
                }
            } catch (error) { console.error(error); }
        });
    }
});