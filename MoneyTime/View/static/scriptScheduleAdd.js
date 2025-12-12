document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const overlay = document.getElementById('add-schedule-modal-overlay');
    const openBtn = document.getElementById('addScheduleBtn');
    const closeBtn = document.getElementById('closeScheduleModalIcon');
    const cancelBtn = document.getElementById('scheduleCancelBtn');
    const confirmBtn = document.getElementById('scheduleConfirmBtn');

    // Inputs
    const activityNameInput = document.getElementById('scheduleActivityName');
    const descDetailsInput = document.getElementById('scheduleDescriptionDetails');
    const timeDisplay = document.getElementById('scheduleTimeDisplay');
    const timeHidden = document.getElementById('scheduleTime');
    const dateDisplayInput = document.getElementById('scheduleDateDisplay');
    const dateHiddenInput = document.getElementById('scheduleDate');
    const categoryInput = document.getElementById('scheduleCategoryInput');
    const priorityHidden = document.getElementById('schedulePriority');

    // --- MODAL OPEN/CLOSE ---
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            if (overlay) {
                overlay.style.display = 'flex';
                clearForm();
                fetchCategories(); // Ambil data dari DB saat buka
            }
        });
    }

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

    function closeModal() {
        if (overlay) overlay.style.display = 'none';
        clearForm();
    }

    function clearForm() {
        if (activityNameInput) activityNameInput.value = '';
        if (descDetailsInput) descDetailsInput.value = '';
        if (timeDisplay) timeDisplay.value = '';
        if (timeHidden) timeHidden.value = '';
        if (dateDisplayInput) dateDisplayInput.value = '';
        if (dateHiddenInput) dateHiddenInput.value = '';
        if (categoryInput) categoryInput.value = '';

        const prioContainer = document.getElementById('addSchPrioritySelector');
        if (prioContainer) {
            prioContainer.querySelectorAll('.priority-option').forEach(opt => opt.classList.remove('active'));
            const noneOpt = prioContainer.querySelector('.priority-option.none');
            if (noneOpt) noneOpt.classList.add('active');
        }
        if (priorityHidden) priorityHidden.value = 'None';

        const addCategoryBtn = document.getElementById('scheduleAddCategoryBtn');
        if (addCategoryBtn) addCategoryBtn.style.display = 'none';
        
        currentHour = 12;
        currentMinute = 0;
    }

    // --- CATEGORY LOGIC (DATABASE ONLY + POLOS) ---
    const catDropdown = document.getElementById('scheduleCategoryDropdown');
    const catList = catDropdown ? catDropdown.querySelector('.schedule-dropdown-list') : null;
    const addCategoryBtn = document.getElementById('scheduleAddCategoryBtn');
    const catHeader = catDropdown ? catDropdown.querySelector('.schedule-dropdown-header') : null;
    
    // [UPDATE] Array kosong, diisi dari DB
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
        // Hapus item lama
        Array.from(catList.querySelectorAll('.schedule-dropdown-item')).forEach(i => i.remove());
        
        const filtered = scheduleCategories.filter(c => c.toLowerCase().includes(filterText.toLowerCase()));
        let hasExactMatch = false;

        filtered.forEach(cat => {
            if (cat.toLowerCase() === filterText.toLowerCase()) hasExactMatch = true;

            const item = document.createElement('div');
            item.className = 'schedule-dropdown-item';
            item.textContent = cat;
            
            // [UPDATE] Tampilan Polos (Tanpa Warna Background)
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

        // Tombol Add New
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
        categoryInput.addEventListener('click', (e) => {
            e.stopPropagation();
            if (catDropdown) {
                catDropdown.classList.toggle('active');
                renderCategoryList(categoryInput.value);
            }
        });

        categoryInput.addEventListener('input', () => {
            const val = categoryInput.value.trim();
            if (!catDropdown.classList.contains('active')) catDropdown.classList.add('active');
            renderCategoryList(val);
        });
    }

    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            categoryInput.value = categoryInput.value.trim();
            catDropdown.classList.remove('active');
            addCategoryBtn.style.display = 'none';
        });
    }

    document.addEventListener('click', (e) => {
        if (catDropdown && !catDropdown.contains(e.target)) catDropdown.classList.remove('active');
    });

    // --- DISCARD CHANGES LOGIC ---
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

    // --- PRIORITY ---
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

    // --- TIME & DATE PICKER (Logic Standar) ---
    const timeDisplayInput = document.getElementById('scheduleTimeDisplay');
    const timePopup = document.getElementById('customTimePopup');
    const timeOk = document.getElementById('timeOkBtn');
    const timeCancel = document.getElementById('timeCancelBtn');
    const hourInput = document.getElementById('hourInput');
    const minInput = document.getElementById('minuteInput');
    const hourScroll = document.getElementById('hourScrollView');
    const minScroll = document.getElementById('minuteScrollView');
    
    let currentHour = 12, currentMinute = 0;
    function fmt(n) { return n.toString().padStart(2, '0'); }
    function updateTimeUI() {
        if(hourInput) hourInput.value = fmt(currentHour);
        if(minInput) minInput.value = fmt(currentMinute);
    }
    
    function setupDragAndScroll(element, isHour) {
        if (!element) return;
        let isDragging = false, startY = 0, diffY = 0; const threshold = 10;
        element.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY > 0) isHour ? (currentHour = currentHour+1>23?0:currentHour+1) : (currentMinute = currentMinute+1>59?0:currentMinute+1);
            else isHour ? (currentHour = currentHour-1<0?23:currentHour-1) : (currentMinute = currentMinute-1<0?59:currentMinute-1);
            updateTimeUI();
        });
        element.addEventListener('mousedown', (e) => { if (e.target.tagName !== 'INPUT') { isDragging = true; startY = e.clientY; } });
        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return; e.preventDefault(); diffY = e.clientY - startY;
            if (Math.abs(diffY) > threshold) {
                if (diffY > 0) isHour ? (currentHour = currentHour - 1 < 0 ? 23 : currentHour - 1) : (currentMinute = currentMinute - 1 < 0 ? 59 : currentMinute - 1);
                else isHour ? (currentHour = currentHour + 1 > 23 ? 0 : currentHour + 1) : (currentMinute = currentMinute + 1 > 59 ? 0 : currentMinute + 1);
                updateTimeUI(); startY = e.clientY;
            }
        });
        window.addEventListener('mouseup', () => { isDragging = false; });
    }
    setupDragAndScroll(hourScroll, true);
    setupDragAndScroll(minScroll, false);

    if(timeDisplayInput) timeDisplayInput.addEventListener('click', (e)=>{
        e.stopPropagation(); updateTimeUI(); 
        if(timePopup) timePopup.classList.add('active');
    });
    if(timeOk) timeOk.addEventListener('click', (e)=>{
        e.stopPropagation();
        timeDisplayInput.value = `${fmt(currentHour)}:${fmt(currentMinute)}`;
        timeHidden.value = timeDisplayInput.value;
        if(timePopup) timePopup.classList.remove('active');
    });
    if(timeCancel) timeCancel.addEventListener('click', (e)=>{
        e.stopPropagation(); if(timePopup) timePopup.classList.remove('active');
    });

    const calPopup = document.getElementById('scheduleCalendarPopup');
    if(dateDisplayInput) dateDisplayInput.addEventListener('click', (e)=>{
        e.stopPropagation();
        if(timePopup) timePopup.classList.remove('active');
        if(calPopup) {
            const d = new Date();
            const grid = document.getElementById('schCalDaysGrid');
            if(grid) {
                grid.innerHTML = '';
                const mLabel = document.getElementById('schCalMonthLabel');
                if(mLabel) mLabel.textContent = d.toLocaleString('default', {month:'long', year:'numeric'});
                
                for(let i=1; i<=31; i++){
                    const dv = document.createElement('div'); dv.className='sch-cal-day'; dv.textContent=i;
                    dv.onclick = (ev) => {
                        ev.stopPropagation();
                        dateDisplayInput.value = `${d.toLocaleString('default', {weekday:'long'})}, ${i} ${d.toLocaleString('default', {month:'long'})} ${d.getFullYear()}`;
                        dateHiddenInput.value = `${d.getFullYear()}-${fmt(d.getMonth()+1)}-${fmt(i)}`;
                        calPopup.classList.remove('active');
                    };
                    grid.appendChild(dv);
                }
            }
            calPopup.classList.toggle('active');
        }
    });

    document.addEventListener('click', (e)=>{
        const wrapper = document.getElementById('scheduleDatePickerWrapper');
        if(calPopup && calPopup.classList.contains('active') && wrapper && !wrapper.contains(e.target)) { calPopup.classList.remove('active'); }
        const timeWrap = document.getElementById('scheduleTimePickerWrapper');
        if(timePopup && timePopup.classList.contains('active') && timeWrap && !timeWrap.contains(e.target)) { timePopup.classList.remove('active'); }
    });

    // --- CONFIRM BUTTON ---
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