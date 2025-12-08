document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const overlay = document.getElementById('add-schedule-modal-overlay');
    const openBtn = document.getElementById('addScheduleBtn');
    const closeBtn = document.getElementById('closeScheduleModalIcon');
    const cancelBtn = document.getElementById('scheduleCancelBtn');
    const confirmBtn = document.getElementById('scheduleConfirmBtn');

    // Inputs
    const descInput = document.getElementById('scheduleDescription');
    const timeDisplay = document.getElementById('scheduleTimeDisplay');
    const timeHidden = document.getElementById('scheduleTime');
    const dateDisplayInput = document.getElementById('scheduleDateDisplay');
    const dateHiddenInput = document.getElementById('scheduleDate');
    const categoryInput = document.getElementById('scheduleCategoryInput');
    const priorityHidden = document.getElementById('schedulePriority');

    // --- MODAL OPEN/CLOSE ---
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            if (overlay) { overlay.style.display = 'flex'; clearForm(); }
        });
    }
    function isFormDirty() {
        return (descInput.value || timeHidden.value || dateDisplayInput.value || categoryInput.value || priorityHidden.value !== 'None');
    }
    function closeModal() { if (overlay) overlay.style.display = 'none'; clearForm(); }
    function clearForm() {
        descInput.value = ''; timeDisplay.value = ''; timeHidden.value = ''; dateDisplayInput.value = ''; dateHiddenInput.value = ''; categoryInput.value = '';
        document.querySelectorAll('.priority-option').forEach(opt => opt.classList.remove('active'));
        const noneOpt = document.querySelector('.priority-option.none');
        if (noneOpt) noneOpt.classList.add('active');
        if (priorityHidden) priorityHidden.value = 'None';
        if (addCategoryBtn) addCategoryBtn.style.display = 'none';
        renderCategoryList();
        currentHour = 12; currentMinute = 0;
    }

    // Discard Logic
    function handleCloseAttempt() { if (isFormDirty()) showDiscardModal(); else closeModal(); }
    function showDiscardModal() {
        const discardModal = document.getElementById('discard-modal-overlay');
        if (discardModal) {
            discardModal.style.display = 'flex';
            const modalContent = discardModal.querySelector('.modal');
            if (modalContent) setTimeout(() => modalContent.classList.add('show'), 10);
            const noBtn = document.getElementById('discardNoBtn');
            const yesBtn = document.getElementById('discardYesBtn');
            const newNo = noBtn.cloneNode(true); const newYes = yesBtn.cloneNode(true);
            noBtn.parentNode.replaceChild(newNo, noBtn); yesBtn.parentNode.replaceChild(newYes, yesBtn);
            newNo.onclick = () => { if (modalContent) modalContent.classList.remove('show'); setTimeout(() => discardModal.style.display = 'none', 300); };
            newYes.onclick = () => { if (modalContent) modalContent.classList.remove('show'); setTimeout(() => { discardModal.style.display = 'none'; closeModal(); }, 300); };
        }
    }
    if (closeBtn) closeBtn.addEventListener('click', handleCloseAttempt);
    if (cancelBtn) cancelBtn.addEventListener('click', handleCloseAttempt);

    // --- PRIORITY ---
    const priorityOptions = document.querySelectorAll('.priority-option');
    priorityOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            priorityOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            if (priorityHidden) priorityHidden.value = opt.dataset.value;
        });
    });

    // --- CATEGORY LOGIC ---
    const catDropdown = document.getElementById('scheduleCategoryDropdown');
    const catList = catDropdown ? catDropdown.querySelector('.schedule-dropdown-list') : null;
    const addCategoryBtn = document.getElementById('scheduleAddCategoryBtn');
    const catHeader = catDropdown ? catDropdown.querySelector('.schedule-dropdown-header') : null;
    const defaultCategories = ["Academic", "Project", "Organization", "Personal", "Entertainment", "Other"];
    let categoryItems = [];

    function renderCategoryList() {
        if (!catList) return;
        Array.from(catList.querySelectorAll('.schedule-dropdown-item')).forEach(i => i.remove());
        defaultCategories.forEach(cat => {
            const item = document.createElement('div');
            item.className = 'schedule-dropdown-item'; item.textContent = cat;
            item.onclick = () => { categoryInput.value = cat; catDropdown.classList.remove('active'); if (addCategoryBtn) addCategoryBtn.style.display = 'none'; };
            if (addCategoryBtn) catList.insertBefore(item, addCategoryBtn);
        });
        categoryItems = Array.from(catList.querySelectorAll('.schedule-dropdown-item'));
    }
    renderCategoryList();

    if (categoryInput) {
        // 1. Buka Dropdown saat Input DIKLIK (Fitur yang diminta)
        categoryInput.addEventListener('click', (e) => {
            e.stopPropagation(); // Mencegah event bubbling menutupnya lagi
            if (catDropdown && !catDropdown.classList.contains('active')) {
                catDropdown.classList.add('active');
            }
        });

        // 2. Filter saat MENGETIK
        categoryInput.addEventListener('input', () => {
            const val = categoryInput.value.trim().toLowerCase();
            let hasExactMatch = false;

            // Pastikan dropdown terbuka saat mengetik
            if (!catDropdown.classList.contains('active')) catDropdown.classList.add('active');

            categoryItems.forEach(item => {
                const text = item.textContent;
                if (text.toLowerCase().includes(val)) item.style.display = 'block';
                else item.style.display = 'none';
                if (text.toLowerCase() === val) hasExactMatch = true;
            });
            if (addCategoryBtn) {
                if (val.length > 0 && !hasExactMatch) { addCategoryBtn.textContent = `Add "${categoryInput.value}" as new category`; addCategoryBtn.style.display = 'block'; }
                else { addCategoryBtn.style.display = 'none'; }
            }
        });
    }

    if (addCategoryBtn) addCategoryBtn.addEventListener('click', (e) => { e.stopPropagation(); categoryInput.value = categoryInput.value.trim(); catDropdown.classList.remove('active'); addCategoryBtn.style.display = 'none'; });

    // Toggle lewat panah/header (kecuali input)
    if (catHeader) catHeader.addEventListener('click', (e) => {
        if (e.target !== categoryInput) catDropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => { if (catDropdown && !catDropdown.contains(e.target)) catDropdown.classList.remove('active'); });

    // --- CUSTOM TIME PICKER ---
    const timeWrapper = document.getElementById('scheduleTimePickerWrapper');
    const timePopup = document.getElementById('customTimePopup');
    const hourUp = document.getElementById('timeHourUp');
    const hourDown = document.getElementById('timeHourDown');
    const minUp = document.getElementById('timeMinuteUp');
    const minDown = document.getElementById('timeMinuteDown');
    const timeOk = document.getElementById('timeOkBtn');
    const timeCancel = document.getElementById('timeCancelBtn');

    const hourPrev = document.getElementById('hourPrev');
    const hourInput = document.getElementById('hourInput');
    const hourNext = document.getElementById('hourNext');
    const minPrev = document.getElementById('minutePrev');
    const minInput = document.getElementById('minuteInput');
    const minNext = document.getElementById('minuteNext');

    const hourScrollView = document.getElementById('hourScrollView');
    const minuteScrollView = document.getElementById('minuteScrollView');

    let currentHour = 12;
    let currentMinute = 0;

    function fmt(num) { return num.toString().padStart(2, '0'); }

    function updateTimeUI() {
        let prevH = currentHour - 1 < 0 ? 23 : currentHour - 1;
        let nextH = currentHour + 1 > 23 ? 0 : currentHour + 1;
        let prevM = currentMinute - 1 < 0 ? 59 : currentMinute - 1;
        let nextM = currentMinute + 1 > 59 ? 0 : currentMinute + 1;

        hourPrev.textContent = fmt(prevH);
        hourNext.textContent = fmt(nextH);
        minPrev.textContent = fmt(prevM);
        minNext.textContent = fmt(nextM);

        if (document.activeElement !== hourInput) hourInput.value = fmt(currentHour);
        if (document.activeElement !== minInput) minInput.value = fmt(currentMinute);
    }

    function handleTimeInput(input, maxVal, isHour) {
        input.addEventListener('change', () => {
            let val = parseInt(input.value);
            if (isNaN(val)) val = 0;
            if (val < 0) val = 0;
            if (val > maxVal) val = maxVal;
            if (isHour) currentHour = val; else currentMinute = val;
            updateTimeUI();
        });
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
    }
    if (hourInput) handleTimeInput(hourInput, 23, true);
    if (minInput) handleTimeInput(minInput, 59, false);

    if (hourUp) hourUp.onclick = (e) => { e.stopPropagation(); currentHour = currentHour - 1 < 0 ? 23 : currentHour - 1; updateTimeUI(); };
    if (hourDown) hourDown.onclick = (e) => { e.stopPropagation(); currentHour = currentHour + 1 > 23 ? 0 : currentHour + 1; updateTimeUI(); };
    if (minUp) minUp.onclick = (e) => { e.stopPropagation(); currentMinute = currentMinute - 1 < 0 ? 59 : currentMinute - 1; updateTimeUI(); };
    if (minDown) minDown.onclick = (e) => { e.stopPropagation(); currentMinute = currentMinute + 1 > 59 ? 0 : currentMinute + 1; updateTimeUI(); };

    function setupDragAndScroll(element, isHour) {
        let isDragging = false; let startY = 0; let diffY = 0; const threshold = 10;
        element.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY > 0) { if (isHour) currentHour = currentHour + 1 > 23 ? 0 : currentHour + 1; else currentMinute = currentMinute + 1 > 59 ? 0 : currentMinute + 1; }
            else { if (isHour) currentHour = currentHour - 1 < 0 ? 23 : currentHour - 1; else currentMinute = currentMinute - 1 < 0 ? 59 : currentMinute - 1; }
            updateTimeUI();
        });
        element.addEventListener('mousedown', (e) => { if (e.target.tagName === 'INPUT') return; isDragging = true; startY = e.clientY; });
        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return; e.preventDefault(); diffY = e.clientY - startY;
            if (Math.abs(diffY) > threshold) {
                if (diffY > 0) { if (isHour) currentHour = currentHour - 1 < 0 ? 23 : currentHour - 1; else currentMinute = currentMinute - 1 < 0 ? 59 : currentMinute - 1; }
                else { if (isHour) currentHour = currentHour + 1 > 23 ? 0 : currentHour + 1; else currentMinute = currentMinute + 1 > 59 ? 0 : currentMinute + 1; }
                updateTimeUI(); startY = e.clientY;
            }
        });
        window.addEventListener('mouseup', () => { isDragging = false; });
    }
    if (hourScrollView) setupDragAndScroll(hourScrollView, true);
    if (minuteScrollView) setupDragAndScroll(minuteScrollView, false);

    if (timeDisplay) timeDisplay.addEventListener('click', (e) => {
        e.stopPropagation();
        const cal = document.getElementById('scheduleCalendarPopup');
        if (cal) cal.classList.remove('active');
        const now = new Date();
        if (!timeHidden.value) { currentHour = now.getHours(); currentMinute = now.getMinutes(); }
        else { const p = timeHidden.value.split(':'); if (p.length === 2) { currentHour = parseInt(p[0]); currentMinute = parseInt(p[1]); } }
        updateTimeUI();
        timePopup.classList.add('active');
    });

    if (timeOk) timeOk.onclick = (e) => { e.stopPropagation(); const f = `${fmt(currentHour)}:${fmt(currentMinute)}`; timeDisplay.value = f; timeHidden.value = f; timePopup.classList.remove('active'); };
    if (timeCancel) timeCancel.onclick = (e) => { e.stopPropagation(); timePopup.classList.remove('active'); };
    document.addEventListener('click', (e) => { if (timePopup && timePopup.classList.contains('active')) { if (!timeWrapper.contains(e.target)) timePopup.classList.remove('active'); } });

    // --- DATE PICKER ---
    const dateWrapper = document.getElementById('scheduleDatePickerWrapper');
    const calPopup = document.getElementById('scheduleCalendarPopup');
    const daysGrid = document.getElementById('schCalDaysGrid');
    const monthsGrid = document.getElementById('schCalMonthsGrid');
    const calMonthLabel = document.getElementById('schCalMonthLabel');
    const viewDays = document.getElementById('schCalendarViewDays');
    const viewMonths = document.getElementById('schCalendarViewMonths');
    const calPrev = document.getElementById('schCalPrevBtn');
    const calNext = document.getElementById('schCalNextBtn');

    let calDate = new Date();
    let currentView = 'days';
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    function updateCalHeader() {
        const y = calDate.getFullYear(); const m = calDate.getMonth();
        if (currentView === 'days') { calMonthLabel.textContent = `${months[m]} ${y}`; viewDays.style.display = 'block'; viewMonths.style.display = 'none'; }
        else { calMonthLabel.textContent = `${y}`; viewDays.style.display = 'none'; viewMonths.style.display = 'block'; }
    }
    function renderCalendar() { if (currentView === 'days') renderDays(); else renderMonths(); updateCalHeader(); }
    function renderDays() {
        daysGrid.innerHTML = ''; const y = calDate.getFullYear(); const m = calDate.getMonth();
        const firstDay = new Date(y, m, 1).getDay(); const totalDays = new Date(y, m + 1, 0).getDate();
        for (let i = 0; i < firstDay; i++) { const d = document.createElement('div'); d.className = 'sch-cal-day empty'; daysGrid.appendChild(d); }
        for (let i = 1; i <= totalDays; i++) {
            const d = document.createElement('div'); d.className = 'sch-cal-day'; d.textContent = i;
            d.onclick = (e) => {
                e.stopPropagation(); const sel = new Date(y, m, i);
                dateDisplayInput.value = `${sel.toLocaleDateString('en-US', { weekday: 'long' })}, ${i} ${months[m]} ${y}`;
                dateHiddenInput.value = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                calPopup.classList.remove('active');
            };
            daysGrid.appendChild(d);
        }
    }
    function renderMonths() {
        monthsGrid.innerHTML = ''; const curM = calDate.getMonth();
        shortMonths.forEach((mn, idx) => {
            const d = document.createElement('div'); d.className = 'sch-cal-month'; d.textContent = mn;
            if (idx === curM) d.classList.add('selected');
            d.onclick = (e) => { e.stopPropagation(); calDate.setMonth(idx); currentView = 'days'; renderCalendar(); };
            monthsGrid.appendChild(d);
        });
    }
    if (dateDisplayInput) dateDisplayInput.addEventListener('click', (e) => { e.stopPropagation(); if (timePopup) timePopup.classList.remove('active'); calPopup.classList.toggle('active'); renderCalendar(); });
    if (calMonthLabel) calMonthLabel.addEventListener('click', (e) => { e.stopPropagation(); currentView = (currentView === 'days') ? 'months' : 'days'; renderCalendar(); });
    if (calPrev) calPrev.onclick = (e) => { e.stopPropagation(); if (currentView === 'days') calDate.setMonth(calDate.getMonth() - 1); else calDate.setFullYear(calDate.getFullYear() - 1); renderCalendar(); };
    if (calNext) calNext.onclick = (e) => { e.stopPropagation(); if (currentView === 'days') calDate.setMonth(calDate.getMonth() + 1); else calDate.setFullYear(calDate.getFullYear() + 1); renderCalendar(); };
    document.addEventListener('click', (e) => { if (calPopup && calPopup.classList.contains('active')) { if (!dateWrapper.contains(e.target)) calPopup.classList.remove('active'); } });

    if (confirmBtn) confirmBtn.addEventListener('click', async () => {
        if (!descInput.value || !dateDisplayInput.value || !timeDisplay.value) { showToast('Please fill in Description, Date, and Time', 'error'); return; }
        try {
            const response = await fetch('/add-schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description: descInput.value.trim(),
                    date: dateHiddenInput.value,
                    time: timeHidden.value,
                    category: categoryInput.value.trim(),
                    priority: priorityHidden.value
                })
            });

            const result = await response.json();

            if (result.success) {
                showToast("Data has been added", "success");
                clearForm();
                closeModal();
                location.reload();
            } else {
                showToast(result.message || 'Failed to add schedule', 'error');
            }
        } catch (error) {
            console.error('Error adding schedule:', error);
            showToast("Error adding schedule. Please try again.", "error");
        }
    });
});