document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. NAVBAR & UI LOGIC
    // ==========================================
    const navToggle = document.getElementById('navToggle');
    const header = document.querySelector('.header-guest');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            const expanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', String(!expanded));
            header.classList.toggle('menu-open');
        });
    }


    // ==========================================
    // 2. CORE VARIABLES & HELPERS 
    // ==========================================
    let currentFilter = 'all'; 
    let allSchedules = [];     

    const searchInput = document.getElementById('searchInput'); 
    const schedulesContainer = document.getElementById('schedulesContainer'); 

    // ==========================================
    // 3. COLOR LOGIC (Dynamic Category Color)
    // ==========================================
    const distinctColorsSchedule = [
        "#FF0000", "#0000FF", "#008000", "#FFD700", "#800080", 
        "#ffd700", "#FF00FF", "#FF4500", "#00CED1", "#2E8B57", 
        "#8B4513", "#4682B4", "#D2691E", "#9ACD32", "#4B0082", 
        "#DC143C", "#000080", "#DAA520", "#808000", "#708090", 
        "#FF1493", "#7B68EE", "#00FA9A", "#C71585", "#191970", 
        "#556B2F", "#FF6347", "#40E0D0", "#8B0000", "#9932CC"
    ];

    let scheduleCategoryColorMap = {};

    function assignColorsToCategories(schedules) {
        scheduleCategoryColorMap = {};
        const uniqueCategories = [...new Set(schedules.map(s => s.category || "Other"))].sort();
        
        uniqueCategories.forEach((cat, index) => {
            scheduleCategoryColorMap[cat] = distinctColorsSchedule[index % distinctColorsSchedule.length];
        });
    }

    function getCategoryColor(categoryName) {
        const cat = categoryName || "Other";
        return scheduleCategoryColorMap[cat] || "#333333";
    }

    // ==========================================
    // 4. FETCH & RENDER SCHEDULES
    // ==========================================

    async function fetchAndRenderSchedules() {
        try {
            const response = await fetch('/api/schedules'); 
            const data = await response.json();

            if (data.success) {
                allSchedules = data.schedules; 
                assignColorsToCategories(allSchedules);
                
                searchHandler(); 
                updateSummaryCards(allSchedules);
            }
        } catch (error) {
            console.error('Error fetching schedules:', error);
        }
    }

    // Expose ke global agar bisa dipanggil setelah Add/Edit/Delete
    window.fetchSchedules = fetchAndRenderSchedules;

    function renderGroupedSchedules(schedules) {
        const containers = {
            today: document.querySelector('#group-today .trans-items'),
            next7: document.querySelector('#group-next7 .trans-items'),
            later: document.querySelector('#group-later .trans-items'),
            completed: document.querySelector('#group-completed .trans-items')
        };

        // Reset konten HTML
        Object.values(containers).forEach(el => { if(el) el.innerHTML = ''; });

        const now = new Date();
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const next7DaysEnd = new Date(todayStart); next7DaysEnd.setDate(todayStart.getDate() + 7);

        const counts = { today: 0, next7: 0, later: 0, completed: 0 };

        schedules.forEach(sch => {
            if (!sch.date) return;

            const timeString = sch.time ? sch.time : "00:00";
            const dateTimeString = `${sch.date}T${timeString}:00`; 
            const schDateTime = new Date(dateTimeString); 
            const schDateOnly = new Date(sch.date); 
            schDateOnly.setHours(0,0,0,0);

            let targetGroup = null;
            const status = (sch.status || 'Pending');

            // --- LOGIKA GROUPING ---
            if (status === 'WontDo' || schDateTime < now) {
                targetGroup = 'completed';
            } else {
                if (schDateOnly.getTime() === todayStart.getTime()) {
                    targetGroup = 'today';
                } else if (schDateOnly > todayStart && schDateOnly <= next7DaysEnd) {
                    targetGroup = 'next7';
                } else if (schDateOnly > next7DaysEnd) {
                    targetGroup = 'later';
                }
            }

            if (targetGroup && containers[targetGroup]) {
                counts[targetGroup]++;
                const itemHTML = createScheduleItemHTML(sch, now);
                containers[targetGroup].insertAdjacentHTML('beforeend', itemHTML);
            }
        });

        // Update Header & View More
        updateGroupHeader('group-today', 'Today', counts.today);
        updateGroupHeader('group-next7', 'Next 7 Days', counts.next7);
        updateGroupHeader('group-later', 'Later', counts.later);
        updateGroupHeader('group-completed', 'Completed & Won\'t Do (History)', counts.completed);

        // Terapkan filter tab
        applyTabFilter();
        attachItemListeners();
    }

    function updateGroupHeader(groupId, baseTitle, count) {
        const group = document.getElementById(groupId);
        if (group) {
            const titleEl = group.querySelector('.day-name');
            if (titleEl) titleEl.textContent = `${baseTitle} (${count})`;
            group.setAttribute('data-count', count);
            initViewMore(groupId, count);
        }
    }

    function applyTabFilter() {
        const groups = ['group-today', 'group-next7', 'group-later', 'group-completed'];
        groups.forEach(gid => {
            const el = document.getElementById(gid);
            if (!el) return;
            const count = parseInt(el.getAttribute('data-count') || '0');
            
            if ((currentFilter === 'all' || currentFilter === gid) && count > 0) {
                el.style.display = 'block';
            } else {
                el.style.display = 'none';
            }
        });
    }

    function createScheduleItemHTML(sch, now) {
        const timeString = sch.time ? sch.time : "00:00";
        const schDateTime = new Date(`${sch.date}T${timeString}:00`);
        const isExpired = schDateTime < now;
        
        const dateObj = new Date(sch.date);
        const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        
        const inCompletedGroup = (sch.status === 'WontDo' || isExpired);
        let onClickAttribute = inCompletedGroup ? '' : `onclick="toggleStatus(event, ${sch.id}, '${sch.status}')"`;
        
        let dateHTML = `<span class="sch-date">${dateStr}</span>`;
        let checkboxClass = 'sch-checkbox';
        let iconHTML = '<i class="fa-solid fa-check check-mark"></i>';
        
        if (sch.status === 'Completed') {
            checkboxClass += ' checked';
        } else if (sch.status === 'WontDo') {
            checkboxClass += ' wontdo';
            iconHTML = '<i class="fa-solid fa-xmark x-mark"></i>';
        } else if (isExpired && sch.status === 'Pending') {
            checkboxClass += ' failed';
            iconHTML = '<i class="fa-solid fa-xmark x-mark"></i>';
            dateHTML = `<span class="sch-date text-red">${dateStr}<br><span class="overdue-text">(Expired)</span></span>`;
        }

        const prioClass = (sch.priority || 'none').toLowerCase();
        const catName = sch.category || "Other";
        const bgColor = getCategoryColor(catName);
        
        // [UPDATE] Teks Putih
        const textColor = '#ffffff';

        const itemData = JSON.stringify(sch).replace(/"/g, '&quot;');

        return `
            <div class="t-item schedule-row" data-json="${itemData}">
                <div class="sch-left">
                    <div class="priority-dot ${prioClass}"></div>
                    <div class="${checkboxClass}" ${onClickAttribute}>
                        ${iconHTML}
                    </div>
                    <div class="sch-info">
                        <div class="sch-title">${sch.title}</div>
                        <div class="sch-time">${sch.time}</div>
                    </div>
                </div>
                <div class="sch-center">
                    <span class="t-badge" style="background-color: ${bgColor}; color: ${textColor};">${catName}</span>
                </div>
                <div class="sch-right">
                    ${dateHTML}
                </div>
            </div>
        `;
    }

    function updateSummaryCards(schedules) {
        const now = new Date();
        const upcoming = schedules.filter(s => {
            const schTime = new Date(`${s.date}T${s.time || "00:00"}:00`);
            return schTime >= now && s.status !== 'Completed' && s.status !== 'WontDo';
        }).length;

        const completed = schedules.filter(s => s.status === 'Completed').length;
        const overdue = schedules.filter(s => {
            const schTime = new Date(`${s.date}T${s.time || "00:00"}:00`);
            return schTime < now && s.status !== 'Completed' && s.status !== 'WontDo';
        }).length;

        const cards = document.querySelectorAll('.m-card .card-amount');
        if(cards.length >= 3) {
            cards[0].textContent = upcoming;
            cards[1].textContent = completed;
            cards[2].textContent = overdue;
        }
    }

    // ==========================================
    // 5. INTERACTION LOGIC
    // ==========================================

    window.toggleStatus = async function(e, id, currentStatus) {
        e.stopPropagation();
        let newStatus = (currentStatus === 'Completed' || currentStatus === 'WontDo') ? 'Pending' : 'Completed';

        const item = e.target.closest('.t-item');
        const checkbox = item.querySelector('.sch-checkbox');
        const icon = checkbox.querySelector('i');

        const originalCheckboxClass = checkbox.className;
        const originalIconDisplay = icon ? icon.style.display : 'none';
        const originalOnclick = checkbox.getAttribute('onclick'); 

        // Optimistic UI
        if (newStatus === 'Completed') {
            checkbox.className = 'sch-checkbox checked';
            if(icon) {
                icon.className = 'fa-solid fa-check check-mark';
                icon.style.display = 'block';
            }
        } else {
            checkbox.className = 'sch-checkbox';
            if(icon) icon.style.display = 'none';
        }
        checkbox.setAttribute('onclick', `toggleStatus(event, ${id}, '${newStatus}')`);

        try {
            const response = await fetch('/update-schedule-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id, status: newStatus })
            });
            const res = await response.json();
            if (!res.success) throw new Error("Gagal update status");
        } catch (err) {
            console.error('Failed to update status', err);
            checkbox.className = originalCheckboxClass;
            if(icon) icon.style.display = originalIconDisplay;
            checkbox.setAttribute('onclick', originalOnclick);
            if (typeof showToast === 'function') showToast("Koneksi gagal, status dikembalikan.", "error");
        }
    };

    function attachItemListeners() {
        document.querySelectorAll('.schedule-row').forEach(row => {
            row.addEventListener('click', () => {
                const data = JSON.parse(row.getAttribute('data-json'));
                if (typeof openScheduleDetail === 'function') openScheduleDetail(data);
            });
        });
    }

   function searchHandler() {
        
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        
        let filteredData = allSchedules;

        if (query.length > 0) {
            filteredData = filteredData.filter(sch => 
                (sch.title || "").toLowerCase().includes(query) ||
                (sch.category || "").toLowerCase().includes(query) ||
                (sch.description || "").toLowerCase().includes(query)
            );
        }

        if (currentFilter !== 'all') {
            filteredData = filteredData.filter(sch => 
                (sch.status || "").toLowerCase() === currentFilter
            );
        }
        
        renderGroupedSchedules(filteredData);

        if (schedulesContainer) {
            if (filteredData.length === 0) {
                schedulesContainer.innerHTML = `
                    <div style="text-align:center; padding:40px; color:#888;">
                        <i class="fa-solid fa-magnifying-glass" style="font-size: 24px; margin-bottom: 10px;"></i><br>
                        ${query.length > 0 ? `Aktivitas "${searchInput.value}" tidak ditemukan.` : 'Belum ada aktivitas yang ditambahkan.'}
                    </div>`;
            }
        }
    }

    // Event Listener
    if (searchInput) {
        searchInput.addEventListener('input', searchHandler);
    }

    // ==========================================
    // 6. VIEW MORE & DROPDOWN LOGIC
    // ==========================================
    const MAX_ITEMS = 5; 

    function initViewMore(groupId, count) {
        const group = document.getElementById(groupId);
        const btn = group.querySelector('.view-more');
        const items = group.querySelectorAll('.schedule-row');
        
        items.forEach(i => i.classList.remove('hidden-task'));
        if (btn) btn.style.display = 'none';

        if (count > MAX_ITEMS) {
            items.forEach((item, index) => {
                if (index >= MAX_ITEMS) item.classList.add('hidden-task');
            });
            
            if (btn) {
                btn.style.display = 'block';
                btn.textContent = 'View more';
                
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                
                newBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isExpanded = newBtn.textContent === 'View less';
                    const currentItems = group.querySelectorAll('.schedule-row');
                    
                    if (isExpanded) {
                        currentItems.forEach((item, idx) => {
                            if (idx >= MAX_ITEMS) item.classList.add('hidden-task');
                        });
                        newBtn.textContent = 'View more';
                    } else {
                        currentItems.forEach(item => item.classList.remove('hidden-task'));
                        newBtn.textContent = 'View less';
                    }
                });
            }
        }
    }

    // Header Dropdown Click
    const groupHeaders = document.querySelectorAll('.toggle-group-btn');
    groupHeaders.forEach(header => {
        header.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = header.closest('.day-card');
            const content = card.querySelector('.trans-items');
            const icon = header.querySelector('.toggle-icon');
            const viewMoreBtn = card.querySelector('.view-more');

            const isHidden = content.style.display === 'none';

            if (isHidden) {
                content.style.display = 'block';
                if (icon) icon.style.transform = 'rotate(0deg)';
                
                const hasHiddenItems = content.querySelector('.hidden-task');
                const isExpandedMode = viewMoreBtn && viewMoreBtn.textContent === 'View less';
                if (viewMoreBtn && (hasHiddenItems || isExpandedMode)) {
                    viewMoreBtn.style.display = 'block';
                }
            } else {
                content.style.display = 'none';
                if (icon) icon.style.transform = 'rotate(-90deg)';
                if (viewMoreBtn) viewMoreBtn.style.display = 'none';
            }
        });
    });

    const tabs = document.querySelectorAll('.time-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.target;
            
            searchHandler(); 
        });
    });

    // Toast Global
    const toastContainer = document.getElementById('toast-container');
    function showToast(message, type = 'success') {
        if(!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => { if (toastContainer.contains(toast)) toastContainer.removeChild(toast); }, 300);
        }, 3000);
    }
    window.showToast = showToast;

    if (searchInput) {
        let timeout = null;
        searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                searchHandler(); 
            }, 300); 
        });
    }
    
    fetchAndRenderSchedules();

});