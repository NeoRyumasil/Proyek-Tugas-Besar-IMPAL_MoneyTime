document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMEN UTAMA ---
    const editOverlay = document.getElementById('edit-schedule-modal-overlay');
    const detailOverlay = document.getElementById('schedule-detail-modal-overlay');

    const closeBtn = document.getElementById('closeEditSchModalIcon');
    const cancelBtn = document.getElementById('editSchCancelBtn');
    const confirmBtn = document.getElementById('editSchConfirmBtn');

    const descInput = document.getElementById('editSchDescription');
    const timeDisplay = document.getElementById('editSchTimeDisplay');
    const timeHidden = document.getElementById('editSchTime');
    const dateDisplayInput = document.getElementById('editSchDateDisplay');
    const dateHiddenInput = document.getElementById('editSchDate');
    const categoryInput = document.getElementById('editSchCategoryInput');
    const priorityHidden = document.getElementById('editSchPriority');

    let initialFormData = {};
    let editCalDate = new Date(); // Default hari ini
    let editHour = 12;
    let editMinute = 0;

    // --- HELPER: FORMAT TANGGAL (Output: Friday, 12 December 2025) ---
    function formatFullDate(dateObj) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        const dayName = days[dateObj.getDay()];
        const d = dateObj.getDate();
        const m = months[dateObj.getMonth()];
        const y = dateObj.getFullYear();
        return `${dayName}, ${d} ${m} ${y}`;
    }

    // --- 1. BUKA MODAL EDIT ---
    const editDetailBtn = document.getElementById('schDetailEditBtn');

    if (editDetailBtn) {
        const newEditBtn = editDetailBtn.cloneNode(true);
        editDetailBtn.parentNode.replaceChild(newEditBtn, editDetailBtn);

        newEditBtn.addEventListener('click', () => {
            // Ambil data dari Detail Modal
            const currentDesc = document.getElementById('schDetailDescription').value;
            const currentTime = document.getElementById('schDetailTime').value;
            const currentDate = document.getElementById('schDetailDate').value;
            const currentCat = document.getElementById('schDetailCategory').value;
            const prioEl = document.getElementById('schDetailPriority');
            const currentPrio = prioEl ? prioEl.value : 'None';

            // Isi Form Edit
            descInput.value = currentDesc;
            timeDisplay.value = currentTime;
            timeHidden.value = currentTime;
            if (currentTime && currentTime.includes(':')) {
                const parts = currentTime.split(':');
                editHour = parseInt(parts[0]);
                editMinute = parseInt(parts[1]);
            }

            // DATE FORMATTING (Edit Modal)
            // Parse teks tanggal dari detail (yg sudah format lengkap)
            let parsedDate = new Date(currentDate);

            // Jika parsing gagal, coba tambah tahun 2025 secara eksplisit
            if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() === 2001) {
                parsedDate = new Date(`${currentDate}, 2025`);
            }

            if (!isNaN(parsedDate.getTime())) {
                editCalDate = parsedDate;
                // Pastikan tampilan di form edit juga lengkap
                dateDisplayInput.value = formatFullDate(parsedDate);

                // Set Hidden Value (Format YYYY-MM-DD)
                const y = parsedDate.getFullYear();
                const m = String(parsedDate.getMonth() + 1).padStart(2, '0');
                const d = String(parsedDate.getDate()).padStart(2, '0');
                dateHiddenInput.value = `${y}-${m}-${d}`;
            } else {
                dateDisplayInput.value = currentDate;
                dateHiddenInput.value = currentDate;
            }

            // Category
            categoryInput.value = currentCat;

            // Priority
            const prioContainer = document.getElementById('editSchPrioritySelector');
            const options = prioContainer.querySelectorAll('.priority-option');
            options.forEach(opt => opt.classList.remove('active'));
            let targetPrio = (currentPrio || 'None').toLowerCase();
            const matchingOption = prioContainer.querySelector(`.priority-option.${targetPrio}`);
            if (matchingOption) {
                matchingOption.classList.add('active');
                priorityHidden.value = matchingOption.dataset.value;
            } else {
                const noneOpt = prioContainer.querySelector('.priority-option.none');
                if (noneOpt) noneOpt.classList.add('active');
                priorityHidden.value = 'None';
            }

            // Simpan State Awal
            initialFormData = {
                desc: descInput.value,
                time: timeHidden.value,
                date: dateDisplayInput.value,
                cat: categoryInput.value,
                prio: priorityHidden.value
            };

            // Switch Modal
            if (detailOverlay) detailOverlay.style.display = 'none';
            if (editOverlay) editOverlay.style.display = 'flex';
        });
    }

    // --- 2. LOGIKA CLOSE / DISCARD ---
    function isFormDirty() {
        return (
            descInput.value !== initialFormData.desc ||
            timeHidden.value !== initialFormData.time ||
            dateDisplayInput.value !== initialFormData.date ||
            categoryInput.value !== initialFormData.cat ||
            priorityHidden.value !== initialFormData.prio
        );
    }
    function closeModal() { if (editOverlay) editOverlay.style.display = 'none'; }
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

    // --- 3. COMPONENTS ---
    const priorityContainer = document.getElementById('editSchPrioritySelector');
    if (priorityContainer) {
        priorityContainer.querySelectorAll('.priority-option').forEach(opt => {
            opt.addEventListener('click', () => {
                priorityContainer.querySelectorAll('.priority-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                priorityHidden.value = opt.dataset.value;
            });
        });
    }

    // Category
    const catDropdown = document.getElementById('editSchCategoryDropdown');
    const catList = catDropdown ? catDropdown.querySelector('.schedule-dropdown-list') : null;
    const addCategoryBtn = document.getElementById('editSchAddCategoryBtn');
    const defaultCategories = ["Academic", "Project", "Organization", "Personal", "Entertainment", "Other"];

    function renderCategoryList() {
        if (!catList) return;
        Array.from(catList.querySelectorAll('.schedule-dropdown-item')).forEach(i => i.remove());
        defaultCategories.forEach(cat => {
            const item = document.createElement('div');
            item.className = 'schedule-dropdown-item'; item.textContent = cat;
            item.onclick = () => { categoryInput.value = cat; catDropdown.classList.remove('active'); if (addCategoryBtn) addCategoryBtn.style.display = 'none'; };
            if (addCategoryBtn) catList.insertBefore(item, addCategoryBtn);
        });
    }
    renderCategoryList();

    if (categoryInput) {
        categoryInput.addEventListener('click', (e) => { e.stopPropagation(); if (catDropdown) catDropdown.classList.add('active'); });
        categoryInput.addEventListener('input', () => {
            const val = categoryInput.value.trim().toLowerCase();
            if (!catDropdown.classList.contains('active')) catDropdown.classList.add('active');
            let hasMatch = false;
            catList.querySelectorAll('.schedule-dropdown-item').forEach(item => {
                if (item.textContent.toLowerCase().includes(val)) item.style.display = 'block'; else item.style.display = 'none';
                if (item.textContent.toLowerCase() === val) hasMatch = true;
            });
            if (addCategoryBtn) {
                if (val.length > 0 && !hasMatch) { addCategoryBtn.textContent = `Add "${categoryInput.value}" as new`; addCategoryBtn.style.display = 'block'; } else { addCategoryBtn.style.display = 'none'; }
            }
        });
    }
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', (e) => {
            e.stopPropagation(); const val = categoryInput.value.trim();
            if (val) { categoryInput.value = val; catDropdown.classList.remove('active'); addCategoryBtn.style.display = 'none'; }
        });
    }
    document.addEventListener('click', (e) => { if (catDropdown && !catDropdown.contains(e.target)) catDropdown.classList.remove('active'); });

    // Time Picker
    const timePopup = document.getElementById('editSchTimePopup');
    const timeWrapper = document.getElementById('editSchTimePickerWrapper');
    function fmt(num) { return num.toString().padStart(2, '0'); }
    function updateEditTimeUI() {
        const hInput = document.getElementById('editSchHourInput');
        const mInput = document.getElementById('editSchMinuteInput');
        if (hInput && document.activeElement !== hInput) hInput.value = fmt(editHour);
        if (mInput && document.activeElement !== mInput) mInput.value = fmt(editMinute);
        document.getElementById('editSchHourPrev').textContent = fmt(editHour - 1 < 0 ? 23 : editHour - 1);
        document.getElementById('editSchHourNext').textContent = fmt(editHour + 1 > 23 ? 0 : editHour + 1);
        document.getElementById('editSchMinutePrev').textContent = fmt(editMinute - 1 < 0 ? 59 : editMinute - 1);
        document.getElementById('editSchMinuteNext').textContent = fmt(editMinute + 1 > 59 ? 0 : editMinute + 1);
    }
    const hUp = document.getElementById('editSchHourUp');
    if (hUp) {
        hUp.addEventListener('click', (e) => { e.stopPropagation(); editHour = editHour - 1 < 0 ? 23 : editHour - 1; updateEditTimeUI(); });
        document.getElementById('editSchHourDown').addEventListener('click', (e) => { e.stopPropagation(); editHour = editHour + 1 > 23 ? 0 : editHour + 1; updateEditTimeUI(); });
        document.getElementById('editSchMinuteUp').addEventListener('click', (e) => { e.stopPropagation(); editMinute = editMinute - 1 < 0 ? 59 : editMinute - 1; updateEditTimeUI(); });
        document.getElementById('editSchMinuteDown').addEventListener('click', (e) => { e.stopPropagation(); editMinute = editMinute + 1 > 59 ? 0 : editMinute + 1; updateEditTimeUI(); });
    }
    if (timeDisplay) timeDisplay.addEventListener('click', (e) => { e.stopPropagation(); updateEditTimeUI(); if (timePopup) timePopup.classList.add('active'); });
    document.getElementById('editSchTimeOkBtn')?.addEventListener('click', (e) => { e.stopPropagation(); timeDisplay.value = `${fmt(editHour)}:${fmt(editMinute)}`; timeHidden.value = timeDisplay.value; if (timePopup) timePopup.classList.remove('active'); });
    document.getElementById('editSchTimeCancelBtn')?.addEventListener('click', (e) => { e.stopPropagation(); if (timePopup) timePopup.classList.remove('active'); });
    document.addEventListener('click', (e) => { if (timePopup && timePopup.classList.contains('active')) { if (timeWrapper && !timeWrapper.contains(e.target)) timePopup.classList.remove('active'); } });

    // --- 6. DATE PICKER (Calendar) ---
    const dateWrapper = document.getElementById('editSchDatePickerWrapper');
    const calPopup = document.getElementById('editSchCalendarPopup');
    const daysGrid = document.getElementById('editSchCalDaysGrid');
    const monthsGrid = document.getElementById('editSchCalMonthsGrid');
    const calLabel = document.getElementById('editSchCalMonthLabel');
    let editCalView = 'days';
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    function renderEditCalendar() {
        const y = editCalDate.getFullYear(); const m = editCalDate.getMonth();
        if (calLabel) calLabel.textContent = (editCalView === 'days') ? `${monthNames[m]} ${y}` : `${y}`;

        const vDays = document.getElementById('editSchCalendarViewDays');
        const vMonths = document.getElementById('editSchCalendarViewMonths');

        if (editCalView === 'days') {
            vDays.style.display = 'block'; vMonths.style.display = 'none';
            daysGrid.innerHTML = '';
            const firstDay = new Date(y, m, 1).getDay();
            const totalDays = new Date(y, m + 1, 0).getDate();

            for (let i = 0; i < firstDay; i++) daysGrid.appendChild(Object.assign(document.createElement('div'), { className: 'sch-cal-day empty' }));

            for (let i = 1; i <= totalDays; i++) {
                const d = document.createElement('div');
                d.className = 'sch-cal-day'; d.textContent = i;

                // Highlight
                if (dateHiddenInput.value && !isNaN(Date.parse(dateHiddenInput.value))) {
                    const savedDate = new Date(dateHiddenInput.value);
                    if (savedDate.getDate() === i && savedDate.getMonth() === m && savedDate.getFullYear() === y) {
                        d.classList.add('selected');
                    }
                }

                d.onclick = (e) => {
                    e.stopPropagation(); const sel = new Date(y, m, i);

                    // FORMAT TANGGAL YANG DIPILIH: Friday, 12 December 2025
                    dateDisplayInput.value = formatFullDate(sel);

                    // Value Backend YYYY-MM-DD
                    dateHiddenInput.value = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                    calPopup.classList.remove('active');
                };
                daysGrid.appendChild(d);
            }
        } else {
            vDays.style.display = 'none'; vMonths.style.display = 'block';
            monthsGrid.innerHTML = '';
            shortMonths.forEach((mn, idx) => {
                const d = document.createElement('div');
                d.className = 'sch-cal-month'; d.textContent = mn;
                if (idx === m) d.classList.add('selected');
                d.onclick = (e) => { e.stopPropagation(); editCalDate.setMonth(idx); editCalView = 'days'; renderEditCalendar(); };
                monthsGrid.appendChild(d);
            });
        }
    }

    if (dateDisplayInput) dateDisplayInput.addEventListener('click', (e) => { e.stopPropagation(); if (timePopup) timePopup.classList.remove('active'); if (calPopup) { calPopup.classList.toggle('active'); renderEditCalendar(); } });
    document.getElementById('editSchCalPrevBtn')?.addEventListener('click', (e) => { e.stopPropagation(); if (editCalView === 'days') editCalDate.setMonth(editCalDate.getMonth() - 1); else editCalDate.setFullYear(editCalDate.getFullYear() - 1); renderEditCalendar(); });
    document.getElementById('editSchCalNextBtn')?.addEventListener('click', (e) => { e.stopPropagation(); if (editCalView === 'days') editCalDate.setMonth(editCalDate.getMonth() + 1); else editCalDate.setFullYear(editCalDate.getFullYear() + 1); renderEditCalendar(); });
    if (calLabel) calLabel.addEventListener('click', (e) => { e.stopPropagation(); editCalView = (editCalView === 'days') ? 'months' : 'days'; renderEditCalendar(); });
    document.addEventListener('click', (e) => { if (calPopup && calPopup.classList.contains('active')) { if (!dateWrapper.contains(e.target)) calPopup.classList.remove('active'); } });

    // --- 7. CONFIRM ---
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (!descInput.value || !dateDisplayInput.value || !timeDisplay.value) { alert("Please fill all fields."); return; }
            console.log("Updated:", { desc: descInput.value, date: dateHiddenInput.value });
            alert("Schedule updated successfully!");
            closeModal();
        });
    }
});