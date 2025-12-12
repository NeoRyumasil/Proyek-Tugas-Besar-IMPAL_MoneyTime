document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMEN UTAMA ---
    const editOverlay = document.getElementById('edit-schedule-modal-overlay');
    const detailOverlay = document.getElementById('schedule-detail-modal-overlay');

    const closeBtn = document.getElementById('closeEditSchModalIcon');
    const cancelBtn = document.getElementById('editSchCancelBtn');
    const confirmBtn = document.getElementById('editSchConfirmBtn');

    // Inputs
    const titleInput = document.getElementById('editSchTitle'); 
    const descriptionInput = document.getElementById('editSchDescription');
    const timeDisplay = document.getElementById('editSchTimeDisplay');
    const timeHidden = document.getElementById('editSchTime');
    const dateDisplayInput = document.getElementById('editSchDateDisplay');
    const dateHiddenInput = document.getElementById('editSchDate');
    const priorityHidden = document.getElementById('editSchPriority');

    // --- CATEGORY ELEMENTS ---
    const categoryInput = document.getElementById('editSchCategoryInput');
    const catDropdown = document.getElementById('editSchCategoryDropdown');
    const catList = catDropdown ? catDropdown.querySelector('.schedule-dropdown-list') : null;
    const catAddBtn = document.getElementById('editSchAddCategoryBtn');

    // --- COLOR GENERATOR ---
    const distinctColors = [
        "#1F77B4", "#FF7F0E", "#2CA02C", "#D62728", "#9467BD",
        "#8C564B", "#E377C2", "#7F7F7F", "#BCBD22", "#17BECF",
        "#E6194B", "#3CB44B", "#FFE119", "#4363D8", "#F58231"
    ];

    function getCategoryColor(categoryName) {
        if (!categoryName) return "#333333";
        let hash = 0;
        const str = categoryName.toString().toLowerCase().trim();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        const index = Math.abs(hash) % distinctColors.length;
        return distinctColors[index];
    }

    // --- STATE DATA ---
    let initialEditData = {}; 
    let scheduleCategories = []; 
    let editHour = 12, editMinute = 0;

    // Helper Format
    function fmt(n) { return n.toString().padStart(2, '0'); }
    function formatFullDate(dateObj) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return `${days[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    }

    // ============================================
    // 1. LOGIKA KATEGORI (FETCH + COLOR)
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
            
            // [UPDATE] Warna Warni + Teks Putih
            const bgVal = getCategoryColor(cat);
            item.style.backgroundColor = bgVal;
            item.style.color = '#ffffff';
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
    // 2. BUKA MODAL EDIT
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
            
            if(data.time && data.time.includes(':')) {
                const p = data.time.split(':');
                editHour = parseInt(p[0]); editMinute = parseInt(p[1]);
            }
            updateEditTimeUI();
            
            if(dateHiddenInput) dateHiddenInput.value = data.date || "";
            if(data.date) {
                const d = new Date(data.date);
                if(dateDisplayInput) dateDisplayInput.value = formatFullDate(d);
            }
            
            if(categoryInput) categoryInput.value = data.category || "";
            
            // Priority
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
    // 3. CONFIRM EDIT
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

    // --- DISCARD LOGIC ---
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

    // --- TIME UI (Simplified) ---
    const editSchHourInput = document.getElementById('editSchHourInput');
    const editSchMinuteInput = document.getElementById('editSchMinuteInput');
    const editSchHourScroll = document.getElementById('editSchHourScrollView');
    const editSchMinuteScroll = document.getElementById('editSchMinuteScrollView');
    const timePopup = document.getElementById('editSchTimePopup');
    
    function updateEditTimeUI() {
        if(editSchHourInput) editSchHourInput.value = fmt(editHour);
        if(editSchMinuteInput) editSchMinuteInput.value = fmt(editMinute);
    }

    function setupEditDragAndScroll(element, isHour) {
        if (!element) return;
        element.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY > 0) isHour ? (editHour = editHour+1>23?0:editHour+1) : (editMinute = editMinute+1>59?0:editMinute+1);
            else isHour ? (editHour = editHour-1<0?23:editHour-1) : (editMinute = editMinute-1<0?59:editMinute-1);
            updateEditTimeUI();
        });
    }
    setupEditDragAndScroll(editSchHourScroll, true);
    setupEditDragAndScroll(editSchMinuteScroll, false);

    if(timeDisplay) timeDisplay.addEventListener('click', (e)=>{
        e.stopPropagation(); updateEditTimeUI();
        if(timePopup) timePopup.classList.add('active');
    });
    
    document.getElementById('editSchTimeOkBtn')?.addEventListener('click', (e)=>{
        e.stopPropagation();
        if(timeDisplay) timeDisplay.value = `${fmt(editHour)}:${fmt(editMinute)}`;
        if(timeHidden) timeHidden.value = `${fmt(editHour)}:${fmt(editMinute)}`;
        if(timePopup) timePopup.classList.remove('active');
    });
    document.getElementById('editSchTimeCancelBtn')?.addEventListener('click', (e)=>{
        e.stopPropagation(); if(timePopup) timePopup.classList.remove('active');
    });

    // Priority Click
    const prioOptions = document.querySelectorAll('#editSchPrioritySelector .priority-option');
    prioOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            prioOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            if(priorityHidden) priorityHidden.value = opt.dataset.value;
        });
    });
});