document.addEventListener('DOMContentLoaded', function () {

  // =========================================
  // 0. TOAST NOTIFICATION SYSTEM
  // =========================================
  const toastContainer = document.getElementById('toast-container');

  function showToast(message, type = 'success') {
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.textContent = message;

      toastContainer.appendChild(toast);

      // Animation in
      setTimeout(() => toast.classList.add('show'), 100);

      setTimeout(() => {
          toast.classList.remove('show');
          setTimeout(() => {
              if (toastContainer.contains(toast)) {
                  toastContainer.removeChild(toast);
              }
          }, 300);
      }, 3000);
  }

  // Make showToast globally available for other scripts
  window.showToast = showToast;

  // =========================================
  // 1. NAVBAR & UI UTILS
  // =========================================
  const navToggle = document.getElementById('navToggle');
  const header = document.querySelector('.header-guest');

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      header.classList.toggle('menu-open');
    });
  }

  document.querySelectorAll('.page-switch .page-link').forEach(a => {
    a.addEventListener('click', () => {
      if (header.classList.contains('menu-open')) {
        header.classList.remove('menu-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // --- PROFILE DROPDOWN LOGIC ---
  const profilePill = document.getElementById('profilePill');
  const profileContainer = document.querySelector('.profile-container');

  if (profilePill && profileContainer) {
    profilePill.addEventListener('click', (e) => {
      // Close notif if open
      if (notifWrapper) notifWrapper.classList.remove('active');
      
      profileContainer.classList.toggle('active');
      e.stopPropagation();
    });
  }

  // --- NOTIFICATION DROPDOWN LOGIC (NEW) ---
  const notifWrapper = document.getElementById('notificationWrapper');
  const notifDropdown = document.getElementById('notificationDropdown');

  if (notifWrapper && notifDropdown) {
    notifWrapper.addEventListener('click', (e) => {
      // Close profile if open
      if (profileContainer) profileContainer.classList.remove('active');

      // Toggle Active Class
      notifWrapper.classList.toggle('active');
      e.stopPropagation();
    });

    // Prevent closing when clicking inside the dropdown itself
    notifDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // Global Click listener to close dropdowns
  document.addEventListener('click', (e) => {
    if (profileContainer && !profileContainer.contains(e.target)) {
      profileContainer.classList.remove('active');
    }
    if (notifWrapper && !notifWrapper.contains(e.target)) {
      notifWrapper.classList.remove('active');
    }
  });


  // =========================================
  // 2. CORE VARIABLES & HELPERS
  // =========================================
  let allTransactions = [];
  let currentViewDate = new Date();
  let chartInstance = null;
  let currentStatsType = 'Expense';

  // Elements
  const prevBtn = document.getElementById('prevMonthBtn');
  const nextBtn = document.getElementById('nextMonthBtn');
  const monthLabel = document.getElementById('currentMonthLabel');
  const searchInput = document.getElementById('searchInput');
  
  // Dashboard UI Elements
  const listContainer = document.getElementById('transactionListContainer');
  const incomeEl = document.getElementById('monthly-income');
  const expenseEl = document.getElementById('monthly-expenses');
  const balanceEl = document.getElementById('total-balance');
  const legendContainer = document.getElementById('statsLegend');
  const chartCanvas = document.getElementById('moneyPieChart');

  // Custom Date Picker Elements
  const pickerContainer = document.getElementById('datePickerContainer');
  const pickerYearLabel = document.getElementById('pickerYearLabel');
  const pickerMonthsGrid = document.getElementById('pickerMonthsGrid');
  const pickerPrevYear = document.getElementById('pickerPrevYear');
  const pickerNextYear = document.getElementById('pickerNextYear');
  let pickerYearView = currentViewDate.getFullYear();
  const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Helper: Format Rupiah
  const formatRupiah = (num) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(num);

  // --- COLOR LOGIC: SEQUENTIAL UNIQUE MAPPING ---
  // Palet 30 Warna Berbeda (High Contrast & Distinct)
  const distinctColors = [
      "#FF0000", "#0000FF", "#008000", "#FFD700", "#800080", 
      "#00FFFF", "#FF00FF", "#FF4500", "#00CED1", "#2E8B57", 
      "#8B4513", "#4682B4", "#D2691E", "#9ACD32", "#4B0082", 
      "#DC143C", "#000080", "#DAA520", "#808000", "#708090", 
      "#FF1493", "#7B68EE", "#00FA9A", "#C71585", "#191970", 
      "#556B2F", "#FF6347", "#40E0D0", "#8B0000", "#9932CC"
  ];

  let categoryColorMap = {}; 

  function assignColorsToCategories(transactions) {
      categoryColorMap = {}; 
      const uniqueCategories = [...new Set(transactions.map(t => t.kategori))]; 
      
      uniqueCategories.forEach((cat, index) => {
          const colorIndex = index % distinctColors.length;
          categoryColorMap[cat] = distinctColors[colorIndex];
      });
  }

  function getColor(cat) {
      if (!cat) return '#999999';
      return categoryColorMap[cat] || '#999999';
  }

  // =========================================
  // 3. DATE PICKER LOGIC
  // =========================================
  function renderPicker() {
    if (!pickerYearLabel || !pickerMonthsGrid) return;
    pickerYearLabel.textContent = pickerYearView;
    pickerMonthsGrid.innerHTML = '';

    shortMonths.forEach((mName, index) => {
      const monthDiv = document.createElement('div');
      monthDiv.classList.add('month-item');
      monthDiv.textContent = mName;
      if (pickerYearView === currentViewDate.getFullYear() && index === currentViewDate.getMonth()) {
        monthDiv.classList.add('selected');
      }
      monthDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        currentViewDate.setFullYear(pickerYearView);
        currentViewDate.setMonth(index);
        currentViewDate.setDate(1);
        
        if (searchInput) searchInput.value = ''; 
        updateDashboard();
        closePicker();
      });
      pickerMonthsGrid.appendChild(monthDiv);
    });
  }

  function togglePicker() {
    pickerContainer.classList.contains('active') ? closePicker() : openPicker();
  }

  function openPicker() {
    pickerYearView = currentViewDate.getFullYear();
    renderPicker();
    pickerContainer.classList.add('active');
  }

  function closePicker() {
    pickerContainer.classList.remove('active');
  }

  if (pickerContainer) {
    pickerContainer.addEventListener('click', (e) => {
      if (!e.target.closest('.custom-date-popup')) togglePicker();
    });
  }
  if (pickerPrevYear) pickerPrevYear.addEventListener('click', (e) => { e.stopPropagation(); pickerYearView--; renderPicker(); });
  if (pickerNextYear) pickerNextYear.addEventListener('click', (e) => { e.stopPropagation(); pickerYearView++; renderPicker(); });
  
  document.addEventListener('click', (e) => {
    if (pickerContainer && !pickerContainer.contains(e.target)) closePicker();
  });

  if (prevBtn) prevBtn.addEventListener('click', () => {
    currentViewDate.setMonth(currentViewDate.getMonth() - 1);
    if(searchInput) searchInput.value = ''; 
    updateDashboard();
  });

  if (nextBtn) nextBtn.addEventListener('click', () => {
    currentViewDate.setMonth(currentViewDate.getMonth() + 1);
    if(searchInput) searchInput.value = ''; 
    updateDashboard();
  });

  // =========================================
  // 4. TRANSACTION LOGIC (FETCH, SEARCH, RENDER)
  // =========================================
  
  // --- FETCH DATA ---
  async function fetchTransactions() {
    try {
      const response = await fetch('/api/transactions');
      const data = await response.json();
      if (data.success) {
        allTransactions = data.transactions;
        assignColorsToCategories(allTransactions);
        updateDashboard();
      } else {
        if (listContainer) listContainer.innerHTML = '<div style="text-align:center;">Failed to load data.</div>';
      }
    } catch (error) {
      console.error('Error:', error);
      if (listContainer) listContainer.innerHTML = '<div style="text-align:center;">Connection error.</div>';
    }
  }

  // --- SEARCH HANDLER ---
  if (searchInput) {
    let timeout = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        updateDashboard();
      }, 300);
    });
  }

  // --- UPDATE DASHBOARD (LOGIC SEARCH + FILTER) ---
  function updateDashboard() {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    let displayData = [];

    // Reset Container
    if (listContainer) listContainer.innerHTML = '';

    if (query.length > 0) {
        // [A] MODE SEARCH: Global Filter
        if (monthLabel) monthLabel.textContent = `Search: "${searchInput.value}"`;
        
        displayData = allTransactions.filter(t => 
            t.deskripsi.toLowerCase().includes(query) ||
            t.kategori.toLowerCase().includes(query) ||
            t.type.toLowerCase().includes(query)
        );

        // Empty State Search
        if (displayData.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align:center; padding:40px; color:#888;">
                    <i class="fa-solid fa-magnifying-glass" style="font-size: 24px; margin-bottom: 10px;"></i><br>
                    Data "${searchInput.value}" not found.
                </div>`;
        }

    } else {
        // [B] MODE NORMAL: Filter by Month
        if (monthLabel) monthLabel.textContent = `${monthNames[month]} ${year}`;

        displayData = allTransactions.filter(t => {
            if (!t.tanggal) return false;
            const d = new Date(t.tanggal);
            return d.getFullYear() === year && d.getMonth() === month;
        });

        // Empty State Normal
        if (displayData.length === 0) {
            listContainer.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">No transactions found this month.</div>';
        }
    }

    // Hitung Summary (Berdasarkan data yang TAMPIL)
    let displayedIncome = 0;
    let displayedExpense = 0;

    displayData.forEach(t => {
      if (t.type === 'Income') displayedIncome += t.nominal;
      else displayedExpense += t.nominal;
    });

    // Total Balance Selalu Global (Saldo Akhir dari SEMUA data)
    let globalBalance = allTransactions.reduce((acc, t) => {
        return t.type === 'Income' ? acc + t.nominal : acc - t.nominal;
    }, 0);

    // Update UI Cards
    if (incomeEl) incomeEl.textContent = formatRupiah(displayedIncome);
    if (expenseEl) expenseEl.textContent = formatRupiah(displayedExpense);
    if (balanceEl) balanceEl.textContent = formatRupiah(globalBalance);

    // Render List & Chart
    if (displayData.length > 0) {
        renderList(displayData);
    }
    renderChart(displayData);
  }

  // --- RENDER LIST ---
  function renderList(transactions) {
    if (!listContainer) return;

    const grouped = {};
    transactions.forEach(t => {
      const dateKey = t.tanggal || 'No Date';
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(t);
    });

    const sortedDates = Object.keys(grouped).sort((a, b) => {
        if (a === 'No Date') return 1;
        if (b === 'No Date') return -1;
        return new Date(b) - new Date(a);
    });

    sortedDates.forEach(dateStr => {
      let dateDisplay = dateStr;
      let dateNum = '';
      if(dateStr !== 'No Date'){
          const dateObj = new Date(dateStr);
          dateNum = dateObj.getDate();
          dateDisplay = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      }

      let dInc = 0, dExp = 0;
      let itemsHtml = '';

      grouped[dateStr].forEach(t => {
        if (t.type === 'Income') dInc += t.nominal;
        else dExp += t.nominal;

        const color = getColor(t.kategori);
        const isInc = t.type === 'Income';
        const sign = isInc ? '+' : '-';
        const valClass = isInc ? 'val-green' : 'val-red';
        const transactionString = encodeURIComponent(JSON.stringify(t));
        const safeDesc = t.deskripsi.replace(/"/g, '&quot;');

        itemsHtml += `
            <div class="t-item" 
                 onclick="openTransactionDetail(JSON.parse(decodeURIComponent('${transactionString}')))"
                 data-desc="${safeDesc}"
                 data-date="${t.tanggal || '-'}"
                 data-nominal="${formatRupiah(t.nominal)}"
                 data-type="${t.type}"
                 data-category="${t.kategori}">
                 
                <span class="t-desc">${t.deskripsi}</span>
                <span class="t-badge" style="background-color: ${color}">${t.kategori}</span>
                <span class="t-val ${valClass}">${sign} ${formatRupiah(t.nominal)}</span>
            </div>
        `;
      });

      const cardHtml = `
                <div class="day-card">
                    <div class="day-header">
                        <div class="dh-left">
                            <div class="date-box">${dateNum}</div>
                            <span class="day-name">${dateDisplay}</span>
                        </div>
                        <div class="dh-right">
                            <span class="val-green"><i class="fa-solid fa-arrow-trend-up"></i> ${formatRupiah(dInc)}</span>
                            <span class="val-red"><i class="fa-solid fa-arrow-trend-down"></i> ${formatRupiah(dExp)}</span>
                        </div>
                    </div>
                    <div class="trans-items">${itemsHtml}</div>
                </div>
            `;
      listContainer.innerHTML += cardHtml;
    });
  }

  // --- RENDER CHART (WITH EMPTY STATE) ---
// --- RENDER CHART (UPDATED COLOR LOGIC) ---
  function renderChart(transactions) {
    if (!chartCanvas) return;

    // 1. Filter Data
    const filteredTrans = transactions.filter(t => t.type === currentStatsType);
    const catTotals = {};
    let totalAmount = 0;

    filteredTrans.forEach(t => {
      const catName = t.kategori || 'Uncategorized';
      if (!catTotals[catName]) catTotals[catName] = 0;
      catTotals[catName] += t.nominal;
      totalAmount += t.nominal;
    });

    const labels = Object.keys(catTotals);
    const dataVal = Object.values(catTotals);
    const colors = labels.map(l => getColor(l));

    // 2. Render Legend
    if (legendContainer) {
      legendContainer.innerHTML = '';
      if (labels.length === 0) {
        legendContainer.innerHTML = '<div style="text-align:center; color:#888; font-size:14px; padding: 10px;">Data not found</div>';
      } else {
        // --- LOGIKA WARNA BARU DI SINI ---
        // Jika sedang tab Income, gunakan 'val-green', jika Expense gunakan 'val-red'
        const amountClass = currentStatsType === 'Income' ? 'val-green' : 'val-red';

        labels.forEach((cat, idx) => {
          const pct = totalAmount > 0 ? ((dataVal[idx] / totalAmount) * 100).toFixed(2) + '%' : '0%';
          
          legendContainer.innerHTML += `
              <div class="l-item">
                  <div class="l-left">
                      <span class="l-pct" style="background-color: ${colors[idx]}">${pct}</span>
                      <span class="l-name">${cat}</span>
                  </div>
                  <span class="l-val ${amountClass}">${formatRupiah(dataVal[idx])}</span>
              </div>
          `;
        });
      }
    }

    // 3. Destroy Old Chart
    if (chartInstance) chartInstance.destroy();

    // 4. Config for Chart
    let chartData, chartOptions;

    if (labels.length > 0) {
        // NORMAL STATE
        chartData = {
            labels: labels,
            datasets: [{
                data: dataVal,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 6
            }]
        };
        chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            if (label) label += ': ';
                            if (context.parsed !== null) label += formatRupiah(context.parsed);
                            return label;
                        }
                    }
                }
            },
            cutout: '0%'
        };
    } else {
        // EMPTY STATE (Gray Placeholder)
        chartData = {
            labels: ["No Data"],
            datasets: [{
                data: [1], 
                backgroundColor: ["#E5E7EB"], 
                borderWidth: 0,
                hoverOffset: 0
            }]
        };
        chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false } 
            },
            cutout: '0%'
        };
    }

    // 5. Create Chart
    chartInstance = new Chart(chartCanvas, {
        type: 'pie',
        data: chartData,
        options: chartOptions
    });
  }

  // --- STATS TOGGLE ---
  const statsIncomeBtn = document.getElementById('statsIncomeBtn');
  const statsExpenseBtn = document.getElementById('statsExpenseBtn');

  if (statsIncomeBtn && statsExpenseBtn) {
    statsIncomeBtn.addEventListener('click', () => {
      if (currentStatsType !== 'Income') {
        currentStatsType = 'Income';
        statsIncomeBtn.classList.add('active');
        statsExpenseBtn.classList.remove('active');
        updateDashboard();
      }
    });

    statsExpenseBtn.addEventListener('click', () => {
      if (currentStatsType !== 'Expense') {
        currentStatsType = 'Expense';
        statsExpenseBtn.classList.add('active');
        statsIncomeBtn.classList.remove('active');
        updateDashboard();
      }
    });
  }

  // --- ADD TRANSACTION BUTTON ---
  const addBtn = document.getElementById('openTransactionModalBtn');
  const popup = document.getElementById('add-transaction-modal-overlay');
  if (addBtn && popup) {
    addBtn.addEventListener('click', () => { popup.style.display = 'flex'; });
  }

  // =========================================
  // 5. SCHEDULE LOGIC (Dashboard Specific)
  // =========================================
  
  const MAX_ITEMS = 4;
  function initViewMore(group) {
    if (group.id === 'group-today') {
      const btn = group.querySelector('.view-more');
      if (btn) btn.style.display = 'none';
      return;
    }
    const items = group.querySelectorAll('.schedule-row');
    const btn = group.querySelector('.view-more');

    if (items.length > MAX_ITEMS) {
      items.forEach((item, index) => {
        if (index >= MAX_ITEMS) item.classList.add('hidden-task');
        else item.classList.remove('hidden-task');
      });

      if (btn) {
        btn.style.display = 'block';
        btn.textContent = 'View more';
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isExpanded = newBtn.textContent === 'View less';
          if (isExpanded) {
            items.forEach((item, idx) => {
              if (idx >= MAX_ITEMS) item.classList.add('hidden-task');
            });
            newBtn.textContent = 'View more';
          } else {
            items.forEach(item => item.classList.remove('hidden-task'));
            newBtn.textContent = 'View less';
          }
        });
      }
    } else {
      items.forEach(item => item.classList.remove('hidden-task'));
      if (btn) btn.style.display = 'none';
    }
  }

  const groups = document.querySelectorAll('.day-card');
  groups.forEach(g => initViewMore(g));

  const toggleHeaders = document.querySelectorAll('.toggle-group-btn');
  toggleHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.day-card');
      const content = card.querySelector('.trans-items');
      const icon = header.querySelector('.toggle-icon');
      const viewMore = card.querySelector('.view-more');

      if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.style.transform = 'rotate(0deg)';
        initViewMore(card);
      } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(-90deg)';
        if (viewMore) viewMore.style.display = 'none';
      }
    });
  });

  const tabs = document.querySelectorAll('.time-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.target;

      groups.forEach(group => {
        const content = group.querySelector('.trans-items');
        const icon = group.querySelector('.toggle-icon');
        if (content) content.style.display = 'block';
        if (icon) icon.style.transform = 'rotate(0deg)';

        if (target === 'all') {
          group.style.display = 'block';
        } else {
          if (group.id === target) group.style.display = 'block';
          else group.style.display = 'none';
        }
        if (group.style.display !== 'none') initViewMore(group);
      });
    });
  });

  const checkboxes = document.querySelectorAll('.sch-checkbox');
  checkboxes.forEach(box => {
    box.addEventListener('click', (e) => {
      e.stopPropagation();
      if (box.classList.contains('wontdo')) return;
      box.classList.toggle('checked');
    });
  });

  // =========================================
  // 6. TOOLTIP LOGIC (HOVER DETAIL)
  // =========================================
  const tooltipEl = document.createElement('div');
  tooltipEl.className = 'transaction-tooltip';
  document.body.appendChild(tooltipEl);

  document.addEventListener('mouseover', (e) => {
      const item = e.target.closest('.t-item');
      if (item && item.hasAttribute('data-desc')) {
          const desc = item.getAttribute('data-desc');
          const date = item.getAttribute('data-date');
          const nominal = item.getAttribute('data-nominal');
          const type = item.getAttribute('data-type');
          const category = item.getAttribute('data-category');

          tooltipEl.innerHTML = `
              <div class="tooltip-header">
                  <span>${category}</span>
                  <span style="font-weight:400; opacity:0.8; font-size:12px;">${type}</span>
              </div>
              <div class="tooltip-row">
                  <span class="tooltip-label">Date:</span>
                  <span class="tooltip-val">${date}</span>
              </div>
              <div class="tooltip-row">
                  <span class="tooltip-label">Desc:</span>
                  <span class="tooltip-val" style="max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${desc}</span>
              </div>
              <div class="tooltip-row" style="margin-top: 6px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 4px;">
                  <span class="tooltip-label">Amount:</span>
                  <span class="tooltip-val" style="font-size: 14px;">${nominal}</span>
              </div>
          `;
          tooltipEl.style.display = 'block';
      }
  });

  document.addEventListener('mousemove', (e) => {
      if (tooltipEl.style.display === 'block') {
          let top = e.clientY + 15;
          let left = e.clientX + 15;
          
          if (left + 220 > window.innerWidth) left = e.clientX - 230;
          if (top + 150 > window.innerHeight) top = e.clientY - 160;
          
          tooltipEl.style.top = `${top}px`;
          tooltipEl.style.left = `${left}px`;
      }
  });

  document.addEventListener('mouseout', (e) => {
      const item = e.target.closest('.t-item');
      if (item) tooltipEl.style.display = 'none';
  });

  // Init Data
  fetchTransactions();
});