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
    const scheduleListSection = document.querySelector('.schedule-list-section');

    // ==========================================
    // 3. COLOR LOGIC (Tetap 30 Warna Asli)
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

    window.fetchSchedules = fetchAndRenderSchedules;

    function renderGroupedSchedules(schedules) {
        const containers = {
            today: document.querySelector('#group-today .trans-items'),
            next7: document.querySelector('#group-next7 .trans-items'),
            later: document.querySelector('#group-later .trans-items'),
            completed: document.querySelector('#group-completed .trans-items')
        };

        Object.values(containers).forEach(el => { if(el) el.innerHTML = ''; });
        
        const oldMsg = document.getElementById('schedule-not-found-msg');
        if(oldMsg) oldMsg.remove();

        const now = new Date();
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const next7DaysEnd = new Date(todayStart); next7DaysEnd.setDate(todayStart.getDate() + 7);

        // MODIFIKASI: Kumpulkan data ke array dulu agar bisa di-sort
        const groups = { today: [], next7: [], later: [], completed: [] };
        let hasDataDisplayed = false;

        schedules.forEach(sch => {
            if (!sch.date) return;

            const timeString = sch.time ? sch.time : "00:00";
            const dateTimeString = `${sch.date}T${timeString}:00`; 
            const schDateTime = new Date(dateTimeString); 
            const schDateOnly = new Date(sch.date); 
            schDateOnly.setHours(0,0,0,0);

            const status = (sch.status || 'Pending');

            if (status === 'Completed' || status === 'WontDo' || schDateTime < now) {
                groups.completed.push(sch);
            } else {
                if (schDateOnly.getTime() === todayStart.getTime()) {
                    groups.today.push(sch);
                } else if (schDateOnly > todayStart && schDateOnly <= next7DaysEnd) {
                    groups.next7.push(sch);
                } else if (schDateOnly > next7DaysEnd) {
                    groups.later.push(sch);
                }
            }
        });

        // --- SORTING KHUSUS: OVERDUE DI ATAS COMPLETED ---
        groups.completed.sort((a, b) => {
            const timeA = new Date(`${a.date}T${a.time || "00:00"}:00`);
            const timeB = new Date(`${b.date}T${b.time || "00:00"}:00`);
            const isOverdueA = (a.status !== 'Completed' && a.status !== 'WontDo' && timeA < now);
            const isOverdueB = (b.status !== 'Completed' && b.status !== 'WontDo' && timeB < now);

            if (isOverdueA && !isOverdueB) return -1;
            if (!isOverdueA && isOverdueB) return 1;
            return timeB - timeA; 
        });

        // Masukkan item yang sudah di-sort ke container
        for (const [key, items] of Object.entries(groups)) {
            if (containers[key]) {
                items.forEach(sch => {
                    const itemHTML = createScheduleItemHTML(sch, now);
                    containers[key].insertAdjacentHTML('beforeend', itemHTML);
                    hasDataDisplayed = true;
                });
                
                let baseTitle = key.charAt(0).toUpperCase() + key.slice(1);
                if(key === 'next7') baseTitle = "Next 7 Days";
                if(key === 'completed') baseTitle = "Completed & Overdue";
                
                updateGroupHeader(`group-${key}`, baseTitle, items.length);
            }
        }

        applyTabFilter();
        
        if (!hasDataDisplayed && scheduleListSection) {
            ['group-today', 'group-next7', 'group-later', 'group-completed'].forEach(id => {
                const el = document.getElementById(id);
                if(el) el.style.display = 'none';
            });
            
            const msgDiv = document.createElement('div');
            msgDiv.id = 'schedule-not-found-msg';
            msgDiv.style.textAlign = 'center';
            msgDiv.style.padding = '40px';
            msgDiv.style.color = '#888';
            
            const query = searchInput ? searchInput.value.trim() : '';
            if (query.length > 0) {
                msgDiv.innerHTML = `<i class="fa-solid fa-magnifying-glass" style="font-size: 24px; margin-bottom: 10px;"></i><br>Jadwal "${query}" tidak ditemukan.`;
            } else {
                msgDiv.innerHTML = `<p>Belum ada jadwal pada kategori ini.</p>`;
            }
            scheduleListSection.appendChild(msgDiv);
        }

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
            
            if (currentFilter === 'all') {
                el.style.display = count > 0 ? 'block' : 'none';
            } else {
                el.style.display = (gid === currentFilter && count > 0) ? 'block' : 'none';
            }
        });
    }

    function createScheduleItemHTML(sch, now) {
        const timeString = sch.time ? sch.time : "00:00";
        const schDateTime = new Date(`${sch.date}T${timeString}:00`);
        const isExpired = schDateTime < now;
        
        const dateObj = new Date(sch.date);
        const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        
        let onClickAttribute = `onclick="toggleStatus(event, ${sch.id}, '${sch.status}')"`;
        
        let dateHTML = `<span class="sch-date">${dateStr}</span>`;
        let checkboxClass = 'sch-checkbox';
        let iconHTML = '<i class="fa-solid fa-check check-mark" style="display:none"></i>';
        
        if (sch.status === 'Completed') {
            checkboxClass += ' checked';
            iconHTML = '<i class="fa-solid fa-check check-mark" style="display:block"></i>';
        } else if (sch.status === 'WontDo') {
            checkboxClass += ' wontdo';
            iconHTML = '<i class="fa-solid fa-xmark x-mark" style="display:block"></i>';
        }

        if (isExpired && sch.status === 'Pending') {
            dateHTML = `<span class="sch-date text-red">${dateStr}<br><span class="overdue-text">(Overdue)</span></span>`;
        }

        const prioClass = (sch.priority || 'none').toLowerCase();
        const catName = sch.category || "Other";
        const bgColor = getCategoryColor(catName);
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
                    <span class="t-badge" style="background-color: ${bgColor}; color: #ffffff;">${catName}</span>
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
            return schTime >= now && s.status === 'Pending';
        }).length;
        const completed = schedules.filter(s => s.status === 'Completed').length;
        const overdue = schedules.filter(s => {
            const schTime = new Date(`${s.date}T${s.time || "00:00"}:00`);
            return schTime < now && s.status === 'Pending';
        }).length;

        const cards = document.querySelectorAll('.m-card .card-amount');
        if(cards.length >= 3) {
            cards[0].textContent = upcoming;
            cards[1].textContent = completed;
            cards[2].textContent = overdue;
        }
    }

    // --- MODIFIKASI: TOGGLE STATUS REAL-TIME (INSTAN TANPA RELOAD) ---
    window.toggleStatus = async function(e, id, currentStatus) {
        e.stopPropagation();
        let newStatus = (currentStatus === 'Completed' || currentStatus === 'WontDo') ? 'Pending' : 'Completed';

        const scheduleIndex = allSchedules.findIndex(s => s.id === id);
        if (scheduleIndex !== -1) {
            const oldStatus = allSchedules[scheduleIndex].status;
            allSchedules[scheduleIndex].status = newStatus;

            // Update UI lokal seketika
            searchHandler(); 
            updateSummaryCards(allSchedules);

            try {
                const response = await fetch('/update-schedule-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: id, status: newStatus })
                });
                const res = await response.json();
                if (!res.success) throw new Error();
            } catch (err) {
                // Revert jika gagal
                allSchedules[scheduleIndex].status = oldStatus;
                searchHandler();
                updateSummaryCards(allSchedules);
                if (typeof showToast === 'function') showToast("Gagal memperbarui status.", "error");
            }
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
        renderGroupedSchedules(filteredData);
    }

    if (searchInput) {
        let timeout = null;
        searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => { searchHandler(); }, 300); 
        });
    }

    const tabs = document.querySelectorAll('.time-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.target;
            searchHandler(); 
        });
    });

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
                if (viewMoreBtn && card.getAttribute('data-count') > MAX_ITEMS) {
                    viewMoreBtn.style.display = 'block';
                }
            } else {
                content.style.display = 'none';
                if (icon) icon.style.transform = 'rotate(-90deg)';
                if (viewMoreBtn) viewMoreBtn.style.display = 'none';
            }
        });
    });

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

    fetchAndRenderSchedules();
});