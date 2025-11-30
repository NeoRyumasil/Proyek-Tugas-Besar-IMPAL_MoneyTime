document.addEventListener('DOMContentLoaded', function () {

  // --- NAVBAR & UI UTILS ---
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

  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');

  if (searchBtn && searchInput) {
    const performSearch = () => {
      const query = searchInput.value.trim();
      if (query) {
        alert(`Searching for: "${query}"`);
      } else {
        searchInput.focus();
      }
    };
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearch();
    });
  }

  const profilePill = document.getElementById('profilePill');
  const profileContainer = document.querySelector('.profile-container');

  if (profilePill && profileContainer) {
    profilePill.addEventListener('click', (e) => {
      profileContainer.classList.toggle('active');
      e.stopPropagation();
    });
    document.addEventListener('click', (e) => {
      if (!profileContainer.contains(e.target)) {
        profileContainer.classList.remove('active');
      }
    });
  }

  // --- CORE LOGIC ---
  let allTransactions = [];
  let currentViewDate = new Date();
  let chartInstance = null;
  let currentStatsType = 'Expense'; // Default stats view

  // Elements
  const prevBtn = document.getElementById('prevMonthBtn');
  const nextBtn = document.getElementById('nextMonthBtn');
  const monthLabel = document.getElementById('currentMonthLabel');
  const monthPicker = document.getElementById('monthPickerInput');

  // Stats Toggles
  const statsIncomeBtn = document.getElementById('statsIncomeBtn');
  const statsExpenseBtn = document.getElementById('statsExpenseBtn');

  // Dashboard Cards
  const listContainer = document.getElementById('transactionListContainer');
  const incomeEl = document.getElementById('monthly-income');
  const expenseEl = document.getElementById('monthly-expenses');
  const balanceEl = document.getElementById('total-balance');

  // Chart Elements
  const legendContainer = document.getElementById('statsLegend');
  const chartCanvas = document.getElementById('moneyPieChart');

  const categoryColors = {
    'kos': '#5d4037',
    'makan': '#f97316',
    'langganan': '#7c3aed',
    'jajan': '#eab308',
    'transportasi': '#0ea5e9',
    'gaji': '#16a34a',
    'investasi': '#15803d',
    'bonus': '#10b981',
    'other': '#64748b'
  };

  function getColor(cat) {
    if (!cat) return '#999999';
    const lowerCat = cat.toLowerCase();
    if (categoryColors[lowerCat]) {
      return categoryColors[lowerCat];
    }
    let hash = 0;
    for (let i = 0; i < lowerCat.length; i++) {
      hash = lowerCat.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 65%, 55%)`;
  }

  const formatRupiah = (num) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(num);

  // --- API FETCH ---
  async function fetchTransactions() {
    try {
      const response = await fetch('/api/transactions');
      const data = await response.json();
      if (data.success) {
        allTransactions = data.transactions;
        updateDashboard();
      } else {
        if (listContainer) listContainer.innerHTML = '<div style="text-align:center;">Failed to load data.</div>';
      }
    } catch (error) {
      console.error('Error:', error);
      if (listContainer) listContainer.innerHTML = '<div style="text-align:center;">Connection error.</div>';
    }
  }

  // --- UPDATE DASHBOARD ---
  function updateDashboard() {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    if (monthLabel) monthLabel.textContent = `${monthNames[month]} ${year}`;

    if (monthPicker) {
      const fmtMonth = String(month + 1).padStart(2, '0');
      monthPicker.value = `${year}-${fmtMonth}`;
    }

    // Filter transaksi bulan ini
    const monthlyData = allTransactions.filter(t => {
      const d = new Date(t.tanggal);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    // Hitung Summary
    let totalIncome = 0;
    let totalExpense = 0;
    let totalBalance = allTransactions.reduce((acc, t) => {
      return t.type === 'Income' ? acc + t.nominal : acc - t.nominal;
    }, 0);

    monthlyData.forEach(t => {
      if (t.type === 'Income') totalIncome += t.nominal;
      else totalExpense += t.nominal;
    });

    if (incomeEl) incomeEl.textContent = formatRupiah(totalIncome);
    if (expenseEl) expenseEl.textContent = formatRupiah(totalExpense);
    if (balanceEl) balanceEl.textContent = formatRupiah(totalBalance);

    renderList(monthlyData);
    renderChart(monthlyData); // Render chart berdasarkan toggle aktif
  }

  // --- RENDER LIST ---
  function renderList(transactions) {
    if (!listContainer) return;
    listContainer.innerHTML = '';

    if (transactions.length === 0) {
      listContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">No transactions this month.</div>';
      return;
    }

    const grouped = {};
    transactions.forEach(t => {
      if (!grouped[t.tanggal]) grouped[t.tanggal] = [];
      grouped[t.tanggal].push(t);
    });

    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

    sortedDates.forEach(dateStr => {
      const dateObj = new Date(dateStr);
      const dateNum = dateObj.getDate();
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

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

        itemsHtml += `
            <div class="t-item" onclick="openTransactionDetail(JSON.parse(decodeURIComponent('${transactionString}')))">
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
                            <span class="day-name">${dayName}</span>
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

  // --- RENDER CHART ---
  function renderChart(transactions) {
    if (!chartCanvas) return;

    // Filter berdasarkan toggle (Income / Expense)
    const filteredTrans = transactions.filter(t => t.type === currentStatsType);

    // Agregasi Kategori
    const catTotals = {};
    let totalAmount = 0;

    filteredTrans.forEach(t => {
      const catName = t.kategori;
      if (!catTotals[catName]) catTotals[catName] = 0;
      catTotals[catName] += t.nominal;
      totalAmount += t.nominal;
    });

    const labels = Object.keys(catTotals);
    const dataVal = Object.values(catTotals);
    const colors = labels.map(l => getColor(l));

    // Render Legend Custom
    if (legendContainer) {
      legendContainer.innerHTML = '';
      if (labels.length === 0) {
        legendContainer.innerHTML = '<div style="text-align:center; color:#888; font-size:14px;">No data available</div>';
      } else {
        labels.forEach((cat, idx) => {
          const pct = totalAmount > 0 ? ((dataVal[idx] / totalAmount) * 100).toFixed(2) + '%' : '0%';
          legendContainer.innerHTML += `
              <div class="l-item">
                  <div class="l-left">
                      <span class="l-pct" style="background-color: ${colors[idx]}">${pct}</span>
                      <span class="l-name">${cat}</span>
                  </div>
                  <span class="l-val">${formatRupiah(dataVal[idx])}</span>
              </div>
          `;
        });
      }
    }

    if (chartInstance) chartInstance.destroy();

    // Setup ChartJS
    if (labels.length > 0) {
      chartInstance = new Chart(chartCanvas, {
        type: 'pie', // Pie chart sesuai gambar
        data: {
          labels: labels,
          datasets: [{
            data: dataVal,
            backgroundColor: colors,
            borderWidth: 0,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }, // Kita pakai custom legend
            tooltip: {
              // --- KUSTOMISASI TOOLTIP (TAMBAH RP) ---
              callbacks: {
                label: function (context) {
                  let label = context.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed !== null) {
                    // Format rupiah di dalam tooltip
                    label += formatRupiah(context.parsed);
                  }
                  return label;
                }
              }
            }
          },
          cutout: '0%' // Full Pie
        }
      });
    } else {
      // Clear canvas jika tidak ada data
      const ctx = chartCanvas.getContext('2d');
      ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    }
  }

  // --- STATS TOGGLE EVENT LISTENERS ---
  if (statsIncomeBtn && statsExpenseBtn) {
    statsIncomeBtn.addEventListener('click', () => {
      if (currentStatsType !== 'Income') {
        currentStatsType = 'Income';
        statsIncomeBtn.classList.add('active');
        statsExpenseBtn.classList.remove('active');
        updateDashboard(); // Re-render chart
      }
    });

    statsExpenseBtn.addEventListener('click', () => {
      if (currentStatsType !== 'Expense') {
        currentStatsType = 'Expense';
        statsExpenseBtn.classList.add('active');
        statsIncomeBtn.classList.remove('active');
        updateDashboard(); // Re-render chart
      }
    });
  }

  // --- DATE NAVIGATION ---
  if (prevBtn) prevBtn.addEventListener('click', () => { currentViewDate.setMonth(currentViewDate.getMonth() - 1); updateDashboard(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { currentViewDate.setMonth(currentViewDate.getMonth() + 1); updateDashboard(); });

  if (monthPicker) {
    monthPicker.addEventListener('change', (e) => {
      if (e.target.value) {
        const [yearStr, monthStr] = e.target.value.split('-');
        currentViewDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
        updateDashboard();
      }
    });

    monthPicker.addEventListener('click', () => {
      if ('showPicker' in HTMLInputElement.prototype) {
        try { monthPicker.showPicker(); } catch (err) { }
      }
    });
  }

  const addBtn = document.getElementById('openTransactionModalBtn');
  const popup = document.getElementById('add-transaction-modal-overlay');

  if (addBtn && popup) {
    addBtn.addEventListener('click', () => {
      popup.style.display = 'flex';
    });
  }

  fetchTransactions();
});