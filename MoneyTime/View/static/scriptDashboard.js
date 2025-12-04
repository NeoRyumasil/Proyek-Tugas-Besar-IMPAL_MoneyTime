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

    // 1. Cek Input Pencarian
    const searchQuery = searchInput ? searchInput.value.trim() : '';
    let displayData = [];

    if (searchQuery.length > 0) {
        // --- MODE PENCARIAN ---
        // Tampilkan SEMUA data hasil fetch (hasil search dari backend), abaikan bulan/tahun
        displayData = allTransactions;
        
        // Ubah label bulan untuk indikasi visual
        if (monthLabel) monthLabel.textContent = `Search: "${searchQuery}"`;
    } else {
        // --- MODE NORMAL ---
        // Filter berdasarkan Bulan & Tahun yang dipilih
        if (monthLabel) monthLabel.textContent = `${monthNames[month]} ${year}`;

        displayData = allTransactions.filter(t => {
            if(!t.tanggal) return false;
            const d = new Date(t.tanggal);
            return d.getFullYear() === year && d.getMonth() === month;
        });
    }

    // 2. Hitung Summary untuk Kartu (Income & Expense mengikuti data yang TAMPIL)
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

    // 3. Update Elemen UI
    if (incomeEl) incomeEl.textContent = formatRupiah(totalIncome);
    if (expenseEl) expenseEl.textContent = formatRupiah(totalExpense);
    if (balanceEl) balanceEl.textContent = formatRupiah(totalBalance);

    // 4. Render Ulang List & Chart
    // (renderList ini sudah memiliki atribut data-* untuk hover tooltip)
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

// BATAS

document.addEventListener('DOMContentLoaded', () => {
  // --- HELPER: FORMAT TANGGAL ---
  function formatFullDate(dateInput) {
    if (!dateInput) return '';

    // Pisahkan teks suffix seperti "(Overdue)"
    let isOverdue = false;
    let cleanDate = dateInput;

    if (dateInput.toLowerCase().includes('overdue')) {
      isOverdue = true;
      // Hapus (Overdue) dari string untuk parsing tanggal
      cleanDate = dateInput.replace(/\(?overdue\)?/gi, '').replace(/[()]/g, '').trim();
    }

    let dateObj = new Date(cleanDate);

    // Fallback: Jika invalid atau tahun 2001, paksa ke 2025
    if (isNaN(dateObj.getTime()) || dateObj.getFullYear() === 2001) {
      dateObj = new Date(`${cleanDate}, 2025`);
    }

    if (isNaN(dateObj.getTime())) return dateInput;

    // Pastikan 2025
    if (dateObj.getFullYear() !== 2025 && !cleanDate.match(/\d{4}/)) {
      dateObj.setFullYear(2025);
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const formatted = `${days[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

    // Return HTML jika Overdue, agar bisa ganti baris
    if (isOverdue) {
      return `${formatted}<span class="overdue-text">(Overdue)</span>`;
    }
    return formatted;
  }

  // --- 1. FORMAT TANGGAL DI LIST SAAT LOAD ---
  const dateElements = document.querySelectorAll('.sch-date');
  dateElements.forEach(el => {
    const originalText = el.textContent.trim();
    // Gunakan innerHTML karena kita mungkin menyisipkan <span> dan <br> (via CSS block)
    el.innerHTML = formatFullDate(originalText);
  });

  // --- 2. NAVBAR LOGIC ---
  const navToggle = document.getElementById('navToggle');
  const header = document.querySelector('.header-guest');

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      header.classList.toggle('menu-open');
    });
  }

  // --- 4. CHECKBOX INTERACTIVE ---
  const checkboxes = document.querySelectorAll('.sch-checkbox');
  checkboxes.forEach(box => {
    box.addEventListener('click', (e) => {
      e.stopPropagation();
      // Toggle logic sederhana untuk visual
      if (box.classList.contains('wontdo')) return; // Won't do biasanya statis di list
      box.classList.toggle('checked');
    });
  });

  // --- 5. SCHEDULE ITEM CLICK (PASS DATA) ---
  const scheduleItems = document.querySelectorAll('.schedule-row');
  scheduleItems.forEach(item => {
    item.addEventListener('click', () => {
      const titleEl = item.querySelector('.sch-title');
      const timeEl = item.querySelector('.sch-time');
      const badgeEl = item.querySelector('.t-badge');
      const dateEl = item.querySelector('.sch-date');
      const dotEl = item.querySelector('.priority-dot');

      let priority = 'None';
      if (dotEl) {
        if (dotEl.classList.contains('low')) priority = 'Low';
        else if (dotEl.classList.contains('medium')) priority = 'Medium';
        else if (dotEl.classList.contains('high')) priority = 'High';
        else if (dotEl.classList.contains('critical')) priority = 'Critical';
      }

      // Ambil teks tanggal (tanpa tag HTML overdue)
      let rawDateText = dateEl ? dateEl.textContent.trim() : '';
      // Bersihkan teks (Overdue) jika terbawa oleh textContent
      rawDateText = rawDateText.replace('(Overdue)', '').trim();

      const itemData = {
        description: titleEl ? titleEl.textContent.trim() : '',
        time: timeEl ? timeEl.textContent.trim() : '',
        category: badgeEl ? badgeEl.textContent.trim() : '',
        date: rawDateText,
        priority: priority
      };

      if (typeof openScheduleDetail === 'function') {
        openScheduleDetail(itemData);
      }
    });
  });

  // --- 6. VIEW MORE (Max 4 Items, Today Show All) ---
  const MAX_ITEMS = 4; // Update sesuai permintaan

  function initViewMore(group) {
    // Jika grup adalah "Today", jangan di-collapse
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

  // --- 7. MINIMIZE BOX ---
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
        initViewMore(card); // Re-init view more state
      } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(-90deg)';
        if (viewMore) viewMore.style.display = 'none';
      }
    });
  });

  // --- 8. FILTER TABS ---
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
});