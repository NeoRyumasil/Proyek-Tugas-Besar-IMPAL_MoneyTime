document.addEventListener('DOMContentLoaded', function () {

  // =========================================
  // 0. TOAST & NAVBAR
  // =========================================
  const toastContainer = document.getElementById('toast-container');
  function showToast(message, type = 'success') {
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
  // 2. TRANSACTION LOGIC (MONEY)
  // =========================================
  let allTransactions = [];
  let currentViewDate = new Date();
  let chartInstance = null;
  let currentStatsType = 'Expense';

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
        updateDashboard();
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
  document.getElementById('prevMonthBtn')?.addEventListener('click', () => { currentViewDate.setMonth(currentViewDate.getMonth() - 1); updateDashboard(); });
  document.getElementById('nextMonthBtn')?.addEventListener('click', () => { currentViewDate.setMonth(currentViewDate.getMonth() + 1); updateDashboard(); });

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
    document.getElementById('currentMonthLabel').textContent = `${monthNames[month]} ${year}`;
    
    const displayData = allTransactions.filter(t => {
        if (!t.tanggal) return false;
        const d = new Date(t.tanggal);
        return d.getFullYear() === year && d.getMonth() === month;
    });

    let inc = 0, exp = 0;
    displayData.forEach(t => { if(t.type === 'Income') inc += t.nominal; else exp += t.nominal; });
    const globalBal = allTransactions.reduce((acc, t) => t.type === 'Income' ? acc + t.nominal : acc - t.nominal, 0);

    document.getElementById('monthly-income').textContent = formatRupiah(inc);
    document.getElementById('monthly-expenses').textContent = formatRupiah(exp);
    document.getElementById('total-balance').textContent = formatRupiah(globalBal);

    renderList(displayData);
    renderChart(displayData);
  }

  function renderList(transactions) {
    const container = document.getElementById('transactionListContainer');
    if(!container) return;
    container.innerHTML = '';
    if(transactions.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">No transactions found this month.</div>';
        return;
    }
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
        container.innerHTML += `
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
    const legend = document.getElementById('statsLegend');
    if(legend) {
        legend.innerHTML = '';
        if(labels.length === 0) legend.innerHTML = '<div style="text-align:center; color:#888;">No data</div>';
        else {
            const total = values.reduce((a,b)=>a+b,0);
            labels.forEach((l, i) => {
                legend.innerHTML += `
                <div class="l-item">
                    <div class="l-left">
                        <span class="l-pct" style="background-color:${colors[i]}">${((values[i]/total)*100).toFixed(1)}%</span>
                        <span class="l-name">${l}</span>
                    </div>
                    <span class="l-val ${currentStatsType==='Income'?'val-green-stats':''}">${formatRupiah(values[i])}</span>
                </div>`;
            });
        }
    }
  }
  const statsIncomeBtn = document.getElementById('statsIncomeBtn');
  const statsExpenseBtn = document.getElementById('statsExpenseBtn');
  if(statsIncomeBtn && statsExpenseBtn) {
      statsIncomeBtn.onclick = () => { currentStatsType = 'Income'; statsIncomeBtn.classList.add('active'); statsExpenseBtn.classList.remove('active'); updateDashboard(); };
      statsExpenseBtn.onclick = () => { currentStatsType = 'Expense'; statsExpenseBtn.classList.add('active'); statsIncomeBtn.classList.remove('active'); updateDashboard(); };
  }
  document.getElementById('openTransactionModalBtn')?.addEventListener('click', () => {
      document.getElementById('add-transaction-modal-overlay').style.display = 'flex';
  });

  // =========================================
  // 5. SCHEDULE LOGIC (FIXED)
  // =========================================
  async function fetchAndRenderSchedules() {
      try {
          const response = await fetch('/api/schedules');
          const data = await response.json();
          if (data.success) {
              assignColorsToScheduleCategories(data.schedules);
              renderGroupedSchedules(data.schedules);
              
              const now = new Date();
              const pendingCount = data.schedules.filter(s => {
                  if(s.status === 'Completed') return false;
                  const schTime = new Date(`${s.date}T${s.time || "00:00"}:00`);
                  return schTime >= now;
              }).length;
              
              const schCard = document.getElementById('upcoming-schedule-count');
              if(schCard) schCard.textContent = pendingCount;
          }
      } catch (error) { console.error('Error fetching schedules:', error); }
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

      const now = new Date();
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const next7DaysEnd = new Date(todayStart); next7DaysEnd.setDate(todayStart.getDate() + 7);

      const counts = { today: 0, next7: 0, later: 0, completed: 0 };

      schedules.forEach(sch => {
          if(!sch.date) return;
          const timeString = sch.time ? sch.time : "00:00";
          const schDateTime = new Date(`${sch.date}T${timeString}:00`); 
          const schDateOnly = new Date(sch.date); schDateOnly.setHours(0,0,0,0);

          let grp = null;
          const status = (sch.status || 'Pending');

          if (status === 'Completed' || schDateTime < now) {
              grp = 'completed';
          } else {
              if (schDateOnly.getTime() === todayStart.getTime()) grp = 'today';
              else if (schDateOnly > todayStart && schDateOnly <= next7DaysEnd) grp = 'next7';
              else if (schDateOnly > next7DaysEnd) grp = 'later';
          }

          if(grp && containers[grp]) {
              counts[grp]++;
              containers[grp].insertAdjacentHTML('beforeend', createScheduleItemHTML(sch, now));
          }
      });

      updateGroupHeader('group-today', 'Today', counts.today);
      updateGroupHeader('group-next7', 'Next 7 Days', counts.next7);
      updateGroupHeader('group-later', 'Later', counts.later);
      updateGroupHeader('group-completed', 'Completed & Overdue', counts.completed);
      
      attachScheduleListeners();
  }

  function createScheduleItemHTML(sch, now) {
      const timeString = sch.time ? sch.time : "00:00";
      const schDateTime = new Date(`${sch.date}T${timeString}:00`);
      const isExpired = schDateTime < now;

      const dateObj = new Date(sch.date);
      const dateStr = dateObj.toLocaleDateString('en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
      
      let onClickAttribute = `onclick="toggleStatus(event, ${sch.id}, '${sch.status}')"`;

      let dateHTML = `<span class="sch-date">${dateStr}</span>`;
      let checkboxClass = 'sch-checkbox';
      let iconHTML = '<i class="fa-solid fa-check check-mark"></i>';
      
      // PRIORITASKAN STATUS COMPLETED DULU
      if(sch.status === 'Completed') {
          checkboxClass += ' checked';
          // Pastikan dateHTML normal, TIDAK MERAH, TIDAK ADA TEXT OVERDUE
          dateHTML = `<span class="sch-date">${dateStr}</span>`;
      } 
      // Baru cek jika expired dan BELUM Completed
      else if(isExpired) {
          // Hanya ubah teks jadi merah. Checkbox tetap aktif/bisa diklik.
          dateHTML = `<span class="sch-date text-red">${dateStr}<br><span class="overdue-text">(Overdue)</span></span>`;
      }

      const bgColor = getCategoryColorSchedule(sch.category||"Other");
      const textColor = '#ffffff';
      const itemJson = JSON.stringify(sch).replace(/"/g, '&quot;');

      return `
      <div class="t-item schedule-row" data-json="${itemJson}">
          <div class="sch-left">
              <div class="priority-dot ${(sch.priority||'none').toLowerCase()}"></div>
              <div class="${checkboxClass}" ${onClickAttribute}>
                  ${iconHTML}
              </div>
              <div class="sch-info">
                  <div class="sch-title">${sch.title}</div>
                  <div class="sch-time">${sch.time}</div>
              </div>
          </div>
          <div class="sch-center">
            <span class="t-badge" style="background-color: ${bgColor}; color: ${textColor};">${sch.category}</span>
          </div>
          <div class="sch-right">${dateHTML}</div>
      </div>`;
  }

  function updateGroupHeader(id, title, count) {
      const el = document.getElementById(id);
      if(el) {
          el.querySelector('.day-name').textContent = `${title} (${count})`;
          el.style.display = count > 0 ? 'block' : 'none';
          
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

  window.toggleStatus = async function(e, id, currentStatus) {
        e.stopPropagation();
        let newStatus = (currentStatus === 'Completed') ? 'Pending' : 'Completed';

        const item = e.target.closest('.t-item');
        const checkbox = item.querySelector('.sch-checkbox'); 
        const icon = checkbox.querySelector('i'); 

        // Optimistic UI: Update Checkbox Visual
        if (newStatus === 'Completed') {
            checkbox.className = 'sch-checkbox checked';
            if(icon) {
                icon.className = 'fa-solid fa-check check-mark';
                icon.style.display = 'block';
            }
            // [FIX] LANGSUNG HILANGKAN TEKS MERAH/OVERDUE SECARA VISUAL
            const dateContainer = item.querySelector('.sch-right .sch-date');
            if(dateContainer) {
                dateContainer.classList.remove('text-red'); // Hapus warna merah
                const overdueSpan = dateContainer.querySelector('.overdue-text');
                if(overdueSpan) {
                     overdueSpan.style.display = 'none'; // Sembunyikan tulisan (Overdue)
                }
                // Hapus <br> jika ada (optional hacky way)
                dateContainer.innerHTML = dateContainer.innerHTML.split('<br>')[0];
            }
        } else {
            checkbox.className = 'sch-checkbox';
            if(icon) icon.style.display = 'none';
        }

        // Simpan onclick lama jika gagal
        const originalOnclick = checkbox.getAttribute('onclick');
        checkbox.setAttribute('onclick', `toggleStatus(event, ${id}, '${newStatus}')`);

        try {
            const response = await fetch('/update-schedule-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id, status: newStatus })
            });
            const res = await response.json();
            if (!res.success) throw new Error("Gagal update status");

            // Refresh data dari server untuk memastikan sinkronisasi
            await fetchAndRenderSchedules();

        } catch (err) {
            console.error('Failed to update status', err);
            // Revert changes (ini hanya terjadi jika error koneksi)
            checkbox.setAttribute('onclick', originalOnclick);
            if (typeof showToast === 'function') showToast("Koneksi gagal, status dikembalikan.", "error");
            // Refresh ulang untuk mengembalikan tampilan semula
            await fetchAndRenderSchedules();
        }
    };

  function attachScheduleListeners() {
      document.querySelectorAll('.schedule-row').forEach(row => {
          row.addEventListener('click', () => {
              const data = JSON.parse(row.getAttribute('data-json'));
              const modalData = {
                  id: data.id,
                  title: data.title, 
                  description: data.description, 
                  time: data.time,
                  date: data.date,
                  category: data.category,
                  priority: data.priority,
                  status: data.status
              };
              if(typeof openScheduleDetail === 'function') openScheduleDetail(modalData);
          });
      });
  }

  // --- DROPDOWN DASHBOARD ---
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

  // --- INIT ---
  fetchTransactions();
  fetchAndRenderSchedules();
});