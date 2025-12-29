document.addEventListener('DOMContentLoaded', function () {

  // =========================================
  // 0. TOAST & NAVBAR
  // =========================================
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

  const navToggle = document.getElementById('navToggle');
  const header = document.querySelector('.header-guest');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      header.classList.toggle('menu-open');
    });
  }

  // =========================================
  // 1. GLOBAL VARIABLES & SEARCH LOGIC
  // =========================================
  const searchInput = document.getElementById('searchInput');
  
  // Data Store
  let allTransactions = [];
  let allSchedules = []; 

  // --- MAIN SEARCH HANDLER (MONEY & TIME) ---
  function handleGlobalSearch() {
      // 1. Update bagian Money (Transaksi)
      updateDashboard();

      // 2. Update bagian Time (Jadwal)
      const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      let filteredSchedules = allSchedules;

      if (query.length > 0) {
          filteredSchedules = allSchedules.filter(sch => 
              (sch.title || "").toLowerCase().includes(query) ||
              (sch.category || "").toLowerCase().includes(query) ||
              (sch.description || "").toLowerCase().includes(query)
          );
      }

      // Render ulang jadwal berdasarkan hasil filter
      renderGroupedSchedules(filteredSchedules);

      // Tampilkan pesan jika tidak ada hasil di kolom Schedule
      const scheduleListSection = document.querySelector('.schedule-list-section');
      const oldMsg = document.getElementById('schedule-not-found-msg');
      if(oldMsg) oldMsg.remove();

      if (filteredSchedules.length === 0 && query.length > 0) {
          ['group-today', 'group-next7', 'group-later', 'group-completed'].forEach(id => {
              const el = document.getElementById(id);
              if(el) el.style.display = 'none';
          });
          
          const msgDiv = document.createElement('div');
          msgDiv.id = 'schedule-not-found-msg';
          msgDiv.style.textAlign = 'center';
          msgDiv.style.padding = '20px';
          msgDiv.style.color = '#888';
          msgDiv.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i><br>Jadwal "${searchInput.value}" tidak ditemukan.`;
          scheduleListSection.appendChild(msgDiv);
      }
  }

  if (searchInput) {
      let timeout = null;
      searchInput.addEventListener('input', () => {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
              handleGlobalSearch();
          }, 300);
      });
  }

  // =========================================
  // 2. TRANSACTION LOGIC (MONEY)
  // =========================================
  let currentViewDate = new Date();
  let chartInstance = null;
  let currentStatsType = 'Expense';

  const listContainer = document.getElementById('transactionListContainer');
  const monthLabel = document.getElementById('currentMonthLabel');

  const formatRupiah = (num) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(num);

  const distinctColorsMoney = [
      "#FF0000", "#0000FF", "#008000", "#FFD700", "#800080", 
      "#00FFFF", "#FF00FF", "#FF4500", "#00CED1", "#2E8B57", 
      "#8B4513", "#4682B4", "#D2691E", "#9ACD32", "#4B0082"
  ];
  let categoryColorMapMoney = {}; 
  function assignColorsToCategories(transactions) {
      categoryColorMapMoney = {}; 
      const uniqueCategories = [...new Set(transactions.map(t => t.kategori))]; 
      uniqueCategories.forEach((cat, index) => {
          categoryColorMapMoney[cat] = distinctColorsMoney[index % distinctColorsMoney.length];
      });
  }
  function getColorMoney(cat) { return categoryColorMapMoney[cat] || '#999999'; }

  // --- COLOR GENERATOR FOR SCHEDULE ---
  const distinctColorsSchedule = [
      "#FF0000", "#0000FF", "#008000", "#FFD700", "#800080", 
      "#ffd700", "#FF00FF", "#FF4500", "#00CED1", "#2E8B57", 
      "#8B4513", "#4682B4", "#D2691E", "#9ACD32", "#4B0082", 
      "#DC143C", "#000080", "#DAA520", "#808000", "#708090", 
      "#FF1493", "#7B68EE", "#00FA9A", "#C71585", "#191970", 
      "#556B2F", "#FF6347", "#40E0D0", "#8B0000", "#9932CC"
  ];
  
  let scheduleCategoryColorMap = {};

  function assignColorsToScheduleCategories(schedules) {
      scheduleCategoryColorMap = {};
      const uniqueCategories = [...new Set(schedules.map(s => s.category || "Other"))].sort();
      uniqueCategories.forEach((cat, index) => {
          scheduleCategoryColorMap[cat] = distinctColorsSchedule[index % distinctColorsSchedule.length];
      });
  }
  
  function getCategoryColorSchedule(categoryName) {
      const cat = categoryName || "Other";
      return scheduleCategoryColorMap[cat] || "#333333"; 
  }

  // --- DATE PICKER (MONEY) ---
  const pickerContainer = document.getElementById('datePickerContainer');
  let pickerYearView = currentViewDate.getFullYear();
  const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function renderPicker() {
    const label = document.getElementById('pickerYearLabel');
    const grid = document.getElementById('pickerMonthsGrid');
    if (!label || !grid) return;
    label.textContent = pickerYearView;
    grid.innerHTML = '';
    shortMonths.forEach((mName, index) => {
      const monthDiv = document.createElement('div');
      monthDiv.className = 'month-item';
      monthDiv.textContent = mName;
      if (pickerYearView === currentViewDate.getFullYear() && index === currentViewDate.getMonth()) monthDiv.classList.add('selected');
      monthDiv.onclick = (e) => {
        e.stopPropagation();
        currentViewDate.setFullYear(pickerYearView);
        currentViewDate.setMonth(index);
        currentViewDate.setDate(1);
        if(searchInput) {
            searchInput.value = '';
            handleGlobalSearch();
        } else {
            updateDashboard();
        }
        pickerContainer.classList.remove('active');
      };
      grid.appendChild(monthDiv);
    });
  }
  if(pickerContainer) {
      pickerContainer.addEventListener('click', (e) => {
          if(!e.target.closest('.custom-date-popup')) pickerContainer.classList.toggle('active');
          if(pickerContainer.classList.contains('active')) {
              pickerYearView = currentViewDate.getFullYear();
              renderPicker();
          }
      });
  }
  document.getElementById('pickerPrevYear')?.addEventListener('click', (e) => { e.stopPropagation(); pickerYearView--; renderPicker(); });
  document.getElementById('pickerNextYear')?.addEventListener('click', (e) => { e.stopPropagation(); pickerYearView++; renderPicker(); });
  document.getElementById('prevMonthBtn')?.addEventListener('click', () => { 
      currentViewDate.setMonth(currentViewDate.getMonth() - 1); 
      if(searchInput) { searchInput.value = ''; handleGlobalSearch(); }
      else updateDashboard(); 
  });
  document.getElementById('nextMonthBtn')?.addEventListener('click', () => { 
      currentViewDate.setMonth(currentViewDate.getMonth() + 1); 
      if(searchInput) { searchInput.value = ''; handleGlobalSearch(); }
      else updateDashboard(); 
  });

  async function fetchTransactions() {
    try {
      const response = await fetch('/api/transactions');
      const data = await response.json();
      if (data.success) {
        allTransactions = data.transactions;
        assignColorsToCategories(allTransactions);
        updateDashboard();
      }
    } catch (error) { console.error('Error:', error); }
  }

  function updateDashboard() {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    let displayData = [];

    if (listContainer) listContainer.innerHTML = '';

    if (query.length > 0) {
        if (monthLabel) monthLabel.textContent = `Search: "${searchInput.value}"`;
        displayData = allTransactions.filter(t => 
            t.deskripsi.toLowerCase().includes(query) ||
            t.kategori.toLowerCase().includes(query) ||
            t.type.toLowerCase().includes(query)
        );
        if (displayData.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align:center; padding:40px; color:#888;">
                    <i class="fa-solid fa-magnifying-glass" style="font-size: 24px; margin-bottom: 10px;"></i><br>
                    Data "${searchInput.value}" not found.
                </div>`;
        }
    } else {
        if (monthLabel) monthLabel.textContent = `${monthNames[month]} ${year}`;
        displayData = allTransactions.filter(t => {
            if (!t.tanggal) return false;
            const d = new Date(t.tanggal);
            return d.getFullYear() === year && d.getMonth() === month;
        });
        if (displayData.length === 0) {
            listContainer.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">No transactions found this month.</div>';
        }
    }

    let inc = 0, exp = 0;
    displayData.forEach(t => { if(t.type === 'Income') inc += t.nominal; else exp += t.nominal; });
    
    const globalBal = allTransactions.reduce((acc, t) => t.type === 'Income' ? acc + t.nominal : acc - t.nominal, 0);

    const incomeEl = document.getElementById('monthly-income');
    const expenseEl = document.getElementById('monthly-expenses');
    const balanceEl = document.getElementById('total-balance');

    if(incomeEl) incomeEl.textContent = formatRupiah(inc);
    if(expenseEl) expenseEl.textContent = formatRupiah(exp);
    if(balanceEl) balanceEl.textContent = formatRupiah(globalBal);

    if (displayData.length > 0) renderList(displayData);
    renderChart(displayData);
  }

  function renderList(transactions) {
    if(!listContainer) return;
    const grouped = {};
    transactions.forEach(t => {
      const k = t.tanggal || 'No Date';
      if(!grouped[k]) grouped[k] = [];
      grouped[k].push(t);
    });
    
    Object.keys(grouped).sort((a,b) => new Date(b) - new Date(a)).forEach(dateStr => {
        const dateObj = new Date(dateStr);
        let dInc = 0, dExp = 0;
        let itemsHtml = '';
        
        grouped[dateStr].forEach(t => {
            if(t.type==='Income') dInc+=t.nominal; else dExp+=t.nominal;
            const itemData = encodeURIComponent(JSON.stringify(t));
            itemsHtml += `
            <div class="t-item" onclick="openTransactionDetail(JSON.parse(decodeURIComponent('${itemData}')))">
                <span class="t-desc">${t.deskripsi}</span>
                <span class="t-badge" style="background-color: ${getColorMoney(t.kategori)}">${t.kategori}</span>
                <span class="t-val ${t.type==='Income'?'val-green':'val-red'}">${t.type==='Income'?'+':'-'} ${formatRupiah(t.nominal)}</span>
            </div>`;
        });
        
        listContainer.innerHTML += `
        <div class="day-card">
            <div class="day-header">
                <div class="dh-left">
                    <div class="date-box">${dateObj.getDate()}</div>
                    <span class="day-name">${dateObj.toLocaleDateString('en-US', { weekday: 'long' })}</span>
                </div>
                <div class="dh-right">
                    <span class="val-green"><i class="fa-solid fa-arrow-trend-up"></i> ${formatRupiah(dInc)}</span>
                    <span class="val-red"><i class="fa-solid fa-arrow-trend-down"></i> ${formatRupiah(dExp)}</span>
                </div>
            </div>
            <div class="trans-items">${itemsHtml}</div>
        </div>`;
    });
  }

  function renderChart(transactions) {
    const ctx = document.getElementById('moneyPieChart');
    if(!ctx) return;
    const filtered = transactions.filter(t => t.type === currentStatsType);
    const totals = {};
    filtered.forEach(t => { totals[t.kategori] = (totals[t.kategori] || 0) + t.nominal; });
    const labels = Object.keys(totals);
    const values = Object.values(totals);
    const colors = labels.map(l => getColorMoney(l));

    if(chartInstance) chartInstance.destroy();
    if(labels.length > 0) {
        chartInstance = new Chart(ctx, {
            type: 'pie',
            data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth:0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: {display:false} }, cutout: '0%' }
        });
    } else {
        const context = ctx.getContext('2d');
        context.clearRect(0,0, ctx.width, ctx.height);
    }
  }
  
  document.getElementById('openTransactionModalBtn')?.addEventListener('click', () => {
      document.getElementById('add-transaction-modal-overlay').style.display = 'flex';
  });

  // =========================================
  // 5. SCHEDULE LOGIC (REAL-TIME & SORTING)
  // =========================================
  async function fetchAndRenderSchedules() {
      try {
          const response = await fetch('/api/schedules');
          const data = await response.json();
          if (data.success) {
              allSchedules = data.schedules;
              assignColorsToScheduleCategories(allSchedules);
              handleGlobalSearch();
              updateUpcomingCount();
          }
      } catch (error) { console.error('Error fetching schedules:', error); }
  }
  window.fetchSchedules = fetchAndRenderSchedules;

  function updateUpcomingCount() {
      const now = new Date();
      const pendingCount = allSchedules.filter(s => {
          if(s.status === 'Completed') return false;
          const schTime = new Date(`${s.date}T${s.time || "00:00"}:00`);
          return schTime >= now;
      }).length;
      const schCard = document.getElementById('upcoming-schedule-count');
      if(schCard) schCard.textContent = pendingCount;
  }

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

      const groups = { today: [], next7: [], later: [], completed: [] };

      schedules.forEach(sch => {
          if(!sch.date) return;
          const timeString = sch.time || "00:00";
          const schDateTime = new Date(`${sch.date}T${timeString}:00`); 
          const schDateOnly = new Date(sch.date); schDateOnly.setHours(0,0,0,0);
          const status = (sch.status || 'Pending');

          if (status === 'Completed' || schDateTime < now) {
              groups.completed.push(sch);
          } else {
              if (schDateOnly.getTime() === todayStart.getTime()) groups.today.push(sch);
              else if (schDateOnly > todayStart && schDateOnly <= next7DaysEnd) groups.next7.push(sch);
              else if (schDateOnly > next7DaysEnd) groups.later.push(sch);
          }
      });

      // --- SORTING: OVERDUE DI ATAS COMPLETED ---
      groups.completed.sort((a, b) => {
          const timeA = new Date(`${a.date}T${a.time || "00:00"}:00`);
          const timeB = new Date(`${b.date}T${b.time || "00:00"}:00`);
          const isOverdueA = (a.status !== 'Completed' && timeA < now);
          const isOverdueB = (b.status !== 'Completed' && timeB < now);
          if (isOverdueA && !isOverdueB) return -1;
          if (!isOverdueA && isOverdueB) return 1;
          return timeB - timeA;
      });

      for (const [key, items] of Object.entries(groups)) {
          if (containers[key]) {
              items.forEach(sch => {
                  containers[key].insertAdjacentHTML('beforeend', createScheduleItemHTML(sch, now));
              });
              let title = key.charAt(0).toUpperCase() + key.slice(1);
              if(key==='next7') title="Next 7 Days";
              if(key==='completed') title="Completed & Overdue";
              updateGroupHeader(`group-${key}`, title, items.length);
          }
      }
      attachScheduleListeners();
  }

  function createScheduleItemHTML(sch, now) {
      const timeString = sch.time || "00:00";
      const schDateTime = new Date(`${sch.date}T${timeString}:00`);
      const isExpired = schDateTime < now;
      const dateObj = new Date(sch.date);
      const dateStr = dateObj.toLocaleDateString('en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
      
      let checkboxClass = 'sch-checkbox' + (sch.status === 'Completed' ? ' checked' : '');
      let iconHTML = '<i class="fa-solid fa-check check-mark" style="display:' + (sch.status === 'Completed' ? 'block' : 'none') + '"></i>';
      
      let dateHTML = `<span class="sch-date">${dateStr}</span>`;
      if(sch.status !== 'Completed' && isExpired) {
          dateHTML = `<span class="sch-date text-red">${dateStr}<br><span class="overdue-text">(Overdue)</span></span>`;
      }

      const bgColor = getCategoryColorSchedule(sch.category||"Other");
      const itemJson = JSON.stringify(sch).replace(/"/g, '&quot;');

      return `
      <div class="t-item schedule-row" data-json="${itemJson}">
          <div class="sch-left">
              <div class="priority-dot ${(sch.priority||'none').toLowerCase()}"></div>
              <div class="${checkboxClass}" onclick="toggleStatus(event, ${sch.id}, '${sch.status}')">
                  ${iconHTML}
              </div>
              <div class="sch-info">
                  <div class="sch-title">${sch.title}</div>
                  <div class="sch-time">${sch.time}</div>
              </div>
          </div>
          <div class="sch-center">
            <span class="t-badge" style="background-color: ${bgColor}; color: #fff;">${sch.category}</span>
          </div>
          <div class="sch-right">${dateHTML}</div>
      </div>`;
  }

  function updateGroupHeader(id, title, count) {
      const el = document.getElementById(id);
      if(el) {
          el.querySelector('.day-name').textContent = `${title} (${count})`;
          el.style.display = count > 0 ? 'block' : 'none';
          el.setAttribute('data-count', count);
          
          const items = el.querySelectorAll('.schedule-row');
          const btn = el.querySelector('.view-more');
          const MAX_ITEMS = 5;

          if(items.length > MAX_ITEMS) {
              items.forEach((it, i) => { if(i >= MAX_ITEMS) it.classList.add('hidden-task'); });
              if(btn) {
                  btn.style.display = 'block';
                  const newBtn = btn.cloneNode(true);
                  btn.parentNode.replaceChild(newBtn, btn);
                  newBtn.onclick = (e) => {
                      e.stopPropagation();
                      const expand = newBtn.textContent === 'View more';
                      items.forEach((it, i) => { if(i >= MAX_ITEMS) it.classList.toggle('hidden-task', !expand); });
                      newBtn.textContent = expand ? 'View less' : 'View more';
                  };
              }
          } else {
              items.forEach(it => it.classList.remove('hidden-task'));
              if(btn) btn.style.display = 'none';
          }
      }
  }

  // --- MODIFIKASI: TOGGLE STATUS INSTAN (REAL-TIME) ---
  window.toggleStatus = async function(e, id, currentStatus) {
        e.stopPropagation();
        let newStatus = (currentStatus === 'Completed') ? 'Pending' : 'Completed';

        const idx = allSchedules.findIndex(s => s.id === id);
        if (idx !== -1) {
            const oldStatus = allSchedules[idx].status;
            allSchedules[idx].status = newStatus;

            // Update UI lokal instan
            handleGlobalSearch();
            updateUpcomingCount();

            try {
                const response = await fetch('/update-schedule-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: id, status: newStatus })
                });
                const res = await response.json();
                if (!res.success) throw new Error();
            } catch (err) {
                allSchedules[idx].status = oldStatus;
                handleGlobalSearch();
                updateUpcomingCount();
                if (typeof showToast === 'function') showToast("Koneksi gagal, status dikembalikan.", "error");
            }
        }
    };

  function attachScheduleListeners() {
      document.querySelectorAll('.schedule-row').forEach(row => {
          row.onclick = () => {
              const data = JSON.parse(row.getAttribute('data-json'));
              if(typeof openScheduleDetail === 'function') openScheduleDetail(data);
          };
      });
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

          content.style.display = isHidden ? 'block' : 'none';
          if (icon) icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)';
          if (viewMoreBtn && !isHidden) viewMoreBtn.style.display = 'none';
          else if (viewMoreBtn && isHidden && (card.getAttribute('data-count') > 5)) viewMoreBtn.style.display = 'block';
      });
  });

  fetchTransactions();
  fetchAndRenderSchedules();
});