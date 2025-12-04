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

  // --- SEARCH ELEMENT (LOGIKA BARU AKAN DITAMBAHKAN DI BAWAH) ---
  const searchInput = document.getElementById('searchInput');
  
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
  let currentStatsType = 'Expense';

  // Elements Dashboard
  const prevBtn = document.getElementById('prevMonthBtn');
  const nextBtn = document.getElementById('nextMonthBtn');
  const monthLabel = document.getElementById('currentMonthLabel');

  // Elements Custom Picker
  const pickerContainer = document.getElementById('datePickerContainer');
  const pickerPopup = document.getElementById('customDatePicker');
  const pickerYearLabel = document.getElementById('pickerYearLabel');
  const pickerMonthsGrid = document.getElementById('pickerMonthsGrid');
  const pickerPrevYear = document.getElementById('pickerPrevYear');
  const pickerNextYear = document.getElementById('pickerNextYear');

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

  // Variabel internal picker
  let pickerYearView = currentViewDate.getFullYear();
  const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
    if (categoryColors[lowerCat]) return categoryColors[lowerCat];
    let hash = 0;
    for (let i = 0; i < lowerCat.length; i++) hash = lowerCat.charCodeAt(i) + ((hash << 5) - hash);
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 65%, 55%)`;
  }

  const formatRupiah = (num) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(num);

  // --- LOGIKA CUSTOM PICKER ---

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

        updateDashboard();
        closePicker();
      });

      pickerMonthsGrid.appendChild(monthDiv);
    });
  }

  function togglePicker() {
    if (pickerContainer.classList.contains('active')) {
      closePicker();
    } else {
      openPicker();
    }
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
      if (!e.target.closest('.custom-date-popup')) {
        togglePicker();
      }
    });
  }

  if (pickerPrevYear) {
    pickerPrevYear.addEventListener('click', (e) => {
      e.stopPropagation();
      pickerYearView--;
      renderPicker();
    });
  }

  if (pickerNextYear) {
    pickerNextYear.addEventListener('click', (e) => {
      e.stopPropagation();
      pickerYearView++;
      renderPicker();
    });
  }

  document.addEventListener('click', (e) => {
    if (pickerContainer && !pickerContainer.contains(e.target)) {
      closePicker();
    }
  });

  // --- [UPDATED] API FETCH WITH SEARCH SUPPORT ---
  async function fetchTransactions(query = '') {
    try {
      // Jika query ada, tambahkan ke URL. Jika tidak, ambil semua.
      const url = query 
          ? `/api/transactions?q=${encodeURIComponent(query)}` 
          : '/api/transactions';

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        allTransactions = data.transactions;
        updateDashboard(); // Render ulang tampilan
      } else {
        if (listContainer) listContainer.innerHTML = '<div style="text-align:center;">Failed to load data.</div>';
      }
    } catch (error) {
      console.error('Error:', error);
      if (listContainer) listContainer.innerHTML = '<div style="text-align:center;">Connection error.</div>';
    }
  }

  // --- [UPDATED] EVENT LISTENER SEARCH BAR (LIVE SEARCH) ---
  if (searchInput) {
    let timeout = null;

    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;

      // Debounce: Tunggu 300ms agar tidak spam request
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        fetchTransactions(val);
      }, 300);
    });
    
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        clearTimeout(timeout);
        fetchTransactions(searchInput.value);
      }
    });
  }

  // --- UPDATE DASHBOARD ---
// --- UPDATE DASHBOARD (DIPERBARUI) ---
  function updateDashboard() {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // 1. Cek apakah user sedang mencari sesuatu
    const searchQuery = searchInput ? searchInput.value.trim() : '';
    let displayData = [];

    if (searchQuery.length > 0) {
        // --- LOGIC PENCARIAN ---
        // Jika sedang search, tampilkan SEMUA data hasil fetch (jangan filter by bulan)
        displayData = allTransactions;
        
        // Ubah label bulan agar user sadar ini hasil pencarian
        if (monthLabel) monthLabel.textContent = `Search: "${searchQuery}"`;
        
    } else {
        // --- LOGIC NORMAL ---
        // Jika tidak search, filter berdasarkan Bulan & Tahun yang dipilih
        if (monthLabel) monthLabel.textContent = `${monthNames[month]} ${year}`;

        displayData = allTransactions.filter(t => {
            if(!t.tanggal) return false;
            const d = new Date(t.tanggal);
            return d.getFullYear() === year && d.getMonth() === month;
        });
    }

    // 2. Hitung Summary (Income/Expense) berdasarkan data yang DITAMPILKAN
    let totalIncome = 0;
    let totalExpense = 0;

    displayData.forEach(t => {
      if (t.type === 'Income') totalIncome += t.nominal;
      else totalExpense += t.nominal;
    });

    // Total Balance tetap dihitung dari akumulasi seluruh data yang tersedia (bukan hanya bulan ini/hasil search)
    // agar mencerminkan "Saldo Akhir" pengguna.
    let totalBalance = allTransactions.reduce((acc, t) => {
      return t.type === 'Income' ? acc + t.nominal : acc - t.nominal;
    }, 0);

    // 3. Update UI Kartu Atas
    if (incomeEl) incomeEl.textContent = formatRupiah(totalIncome);
    if (expenseEl) expenseEl.textContent = formatRupiah(totalExpense);
    if (balanceEl) balanceEl.textContent = formatRupiah(totalBalance);

    // 4. Render List & Chart
    // (RenderList sudah otomatis support hover detailing karena menggunakan data-attributes yang kita buat sebelumnya)
    renderList(displayData);
    renderChart(displayData);
  }

  // --- RENDER LIST ---
// ... (Kode sebelumnya tetap sama)

  // --- RENDER LIST (DIMODIFIKASI) ---
  function renderList(transactions) {
    if (!listContainer) return;
    listContainer.innerHTML = '';

    if (transactions.length === 0) {
      listContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">No transactions found.</div>';
      return;
    }

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
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
          dateDisplay = dayName; 
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

        // --- PERUBAHAN DISINI: Menambahkan data attributes untuk Tooltip ---
        // Kita escape tanda kutip agar aman di dalam atribut HTML
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

  // --- LOGIC HOVER TOOLTIP (BARU) ---
  // 1. Buat elemen tooltip dan masukkan ke body
  const tooltipEl = document.createElement('div');
  tooltipEl.className = 'transaction-tooltip';
  document.body.appendChild(tooltipEl);

  // 2. Event Delegation untuk Mouse Enter (Menampilkan Tooltip)
  document.addEventListener('mouseover', (e) => {
      const item = e.target.closest('.t-item');
      if (item) {
          const desc = item.getAttribute('data-desc');
          const date = item.getAttribute('data-date');
          const nominal = item.getAttribute('data-nominal');
          const type = item.getAttribute('data-type');
          const category = item.getAttribute('data-category');

          // Format Tampilan Tooltip
          tooltipEl.innerHTML = `
              <div class="tooltip-header">
                  <span>${type}</span>
                  <span>${category}</span>
              </div>
              <div class="tooltip-row">
                  <span class="tooltip-label">Date</span>
                  <span class="tooltip-val">${date}</span>
              </div>
              <div class="tooltip-row">
                  <span class="tooltip-label">Desc</span>
                  <span class="tooltip-val">${desc.length > 20 ? desc.substring(0, 20) + '...' : desc}</span>
              </div>
              <div class="tooltip-row" style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 4px;">
                  <span class="tooltip-label">Total</span>
                  <span class="tooltip-val" style="color: #fff; font-size: 15px;">${nominal}</span>
              </div>
          `;
          tooltipEl.style.display = 'block';
      }
  });

  // 3. Event Delegation untuk Mouse Move (Mengikuti Kursor)
  document.addEventListener('mousemove', (e) => {
      // Cek apakah sedang hover di t-item
      if (tooltipEl.style.display === 'block') {
          // Cegah tooltip keluar layar
          let top = e.clientY + 15;
          let left = e.clientX + 15;

          if (left + 240 > window.innerWidth) {
              left = e.clientX - 240; // Pindah ke kiri kursor
          }
          
          if (top + 150 > window.innerHeight) {
              top = e.clientY - 150; // Pindah ke atas kursor
          }

          tooltipEl.style.top = `${top}px`;
          tooltipEl.style.left = `${left}px`;
      }
  });

  // 4. Event Delegation untuk Mouse Leave (Menyembunyikan Tooltip)
  document.addEventListener('mouseout', (e) => {
      const item = e.target.closest('.t-item');
      if (item) {
          tooltipEl.style.display = 'none';
      }
  });

// ... (Sisa kode existing seperti fetchTransactions, chart, dll tetap di bawah)

  // --- RENDER CHART ---
  function renderChart(transactions) {
    if (!chartCanvas) return;

    const filteredTrans = transactions.filter(t => t.type === currentStatsType);
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

    if (labels.length > 0) {
      chartInstance = new Chart(chartCanvas, {
        type: 'pie',
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
        }
      });
    } else {
      const ctx = chartCanvas.getContext('2d');
      ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    }
  }

  // --- STATS TOGGLE ---
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

  // --- DATE NAVIGATION ---
  if (prevBtn) prevBtn.addEventListener('click', () => {
    currentViewDate.setMonth(currentViewDate.getMonth() - 1);
    updateDashboard();
  });

  if (nextBtn) nextBtn.addEventListener('click', () => {
    currentViewDate.setMonth(currentViewDate.getMonth() + 1);
    updateDashboard();
  });

  const addBtn = document.getElementById('openTransactionModalBtn');
  const popup = document.getElementById('add-transaction-modal-overlay');

  if (addBtn && popup) {
    addBtn.addEventListener('click', () => {
      popup.style.display = 'flex';
    });
  }

  // Fetch data pertama kali
  fetchTransactions();
});