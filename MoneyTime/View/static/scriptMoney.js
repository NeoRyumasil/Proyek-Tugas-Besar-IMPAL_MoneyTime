document.addEventListener('DOMContentLoaded', function () {
  let allTransactions = [];
  let currentViewDate = new Date();
  
  let chartIncExp = null;
  let chartCategory = null;
  let chartNWS = null;

  const prevBtn = document.getElementById('prevMonthBtn');
  const nextBtn = document.getElementById('nextMonthBtn');
  const monthLabel = document.getElementById('currentMonthLabel');
  const searchInput = document.getElementById('searchInput');
  const listContainer = document.getElementById('transactionListContainer');
  
  const needsEl = document.getElementById('total-needs');
  const wantsEl = document.getElementById('total-wants');
  const savingsEl = document.getElementById('total-savings');
  const balanceEl = document.getElementById('total-balance');

  const formatRupiah = (num) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(num);

  const distinctColors = [
      "#FF0000", "#0000FF", "#008000", "#FFD700", "#800080", 
      "#00FFFF", "#FF00FF", "#FF4500", "#00CED1", "#2E8B57", 
      "#8B4513", "#4682B4", "#D2691E", "#9ACD32", "#4B0082"
  ];

  let categoryColorMap = {}; 
  function getColor(cat) {
      if (!cat) return '#999999';
      if (!categoryColorMap[cat]) {
          categoryColorMap[cat] = distinctColors[Object.keys(categoryColorMap).length % distinctColors.length];
      }
      return categoryColorMap[cat];
  }

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
    }
  }

  function updateDashboard() {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    if (monthLabel) monthLabel.textContent = `${monthNames[month]} ${year}`;

    const displayData = allTransactions.filter(t => {
        if (!t.tanggal) return false;
        const d = new Date(t.tanggal);
        return d.getFullYear() === year && d.getMonth() === month;
    });

    if (displayData.length === 0 && listContainer) {
        listContainer.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">No transactions found this month.</div>';
    } else if (listContainer) {
        renderList(displayData);
    }

    let totalNeeds = 0, totalWants = 0, totalSavings = 0;
    let globalBalance = 0; 
    
    allTransactions.forEach(t => {
        if (t.type === 'Income') globalBalance += t.nominal;
        else globalBalance -= t.nominal;
        
        if (t.alokasi_data) {
           totalNeeds += t.alokasi_data['Needs'] || 0;
           totalWants += t.alokasi_data['Wants'] || 0;
           totalSavings += t.alokasi_data['Savings'] || 0;
        } else if (t.kategori) {
           if(t.kategori.toLowerCase() === 'needs') totalNeeds += t.nominal;
           else if(t.kategori.toLowerCase() === 'wants') totalWants += t.nominal;
           else if(t.kategori.toLowerCase() === 'savings') totalSavings += t.nominal;
        }
    });
    
    if (needsEl) needsEl.textContent = formatRupiah(totalNeeds);
    if (wantsEl) wantsEl.textContent = formatRupiah(totalWants);
    if (savingsEl) savingsEl.textContent = formatRupiah(totalSavings);
    if (balanceEl) balanceEl.textContent = formatRupiah(globalBalance);

    updateChartsByRange(parseInt(document.getElementById('filter-inc-exp').value || 3), 'inc-exp');
    updateChartsByRange(parseInt(document.getElementById('filter-category').value || 3), 'category');
    updateChartsByRange(parseInt(document.getElementById('filter-nws').value || 3), 'nws');
  }

  function renderList(transactions) {
      listContainer.innerHTML = '';

      if (transactions.length === 0) {
          listContainer.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">No transactions found this month.</div>';
          return;
      }

      // 1. Kelompokkan transaksi berdasarkan Tanggal
      const grouped = {};
      transactions.forEach(t => {
          if (!t.tanggal) return;
          const dateString = t.tanggal; 
          
          if (!grouped[dateString]) {
              const d = new Date(t.tanggal);
              grouped[dateString] = {
                  dateObj: d,
                  dayDate: d.getDate(),
                  dayName: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()],
                  transactions: [],
                  totalIncome: 0,
                  totalExpense: 0
              };
          }
          
          grouped[dateString].transactions.push(t);
          if (t.type === 'Income') {
              grouped[dateString].totalIncome += t.nominal;
          } else {
              grouped[dateString].totalExpense += t.nominal;
          }
      });

      // 2. Urutkan dari tanggal terbaru ke terlama
      const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

      // 3. Render HTML untuk setiap grup hari
      sortedDates.forEach(dateStr => {
          const group = grouped[dateStr];
          
          // Generate baris untuk masing-masing transaksi di hari itu
          let itemsHTML = '';
          group.transactions.forEach(t => {
              const isInc = t.type === 'Income';
              const sign = isInc ? '+' : '-';
              const valColor = isInc ? '#16a34a' : '#dc2626'; // Hijau untuk Income, Merah untuk Expense
              const transactionString = encodeURIComponent(JSON.stringify(t));
              
              itemsHTML += `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 10px; cursor: pointer; transition: background 0.2s; border-radius: 8px;"
                       onclick="openTransactionDetail(JSON.parse(decodeURIComponent('${transactionString}')))"
                       onmouseover="this.style.backgroundColor='#f8fafc'"
                       onmouseout="this.style.backgroundColor='transparent'">
                      <div style="flex: 1; font-weight: 500; font-size: 15px; color: #0f172a;">${t.deskripsi}</div>
                      
                      <div style="background-color: ${getColor(t.kategori)}; padding: 6px 16px; border-radius: 6px; color: white; font-size: 12px; font-weight: 600; text-align: center; min-width: 100px;">
                          ${t.kategori}
                      </div>
                      
                      <div style="flex: 1; text-align: right; font-weight: 700; font-size: 15px; color: ${valColor};">
                          ${sign} ${formatRupiah(t.nominal)}
                      </div>
                  </div>
              `;
          });

          // Cetak format kartu untuk hari tersebut (Sesuai Gambar 1)
          listContainer.innerHTML += `
              <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f1f5f9;">
                  
                  <!-- Header Tanggal & Rekap Hari -->
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                      
                      <div style="display: flex; align-items: center; gap: 16px;">
                          <div style="background: #3b82f6; color: white; border-radius: 8px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 20px;">
                              ${group.dayDate}
                          </div>
                          <div style="font-size: 18px; font-weight: 600; color: #1e293b;">
                              ${group.dayName}
                          </div>
                      </div>
                      
                      <div style="display: flex; gap: 20px; font-weight: 600; font-size: 15px;">
                          <div style="color: #16a34a; display: flex; align-items: center; gap: 6px;">
                              <i class="fa-solid fa-arrow-trend-up"></i> ${formatRupiah(group.totalIncome)}
                          </div>
                          <div style="color: #dc2626; display: flex; align-items: center; gap: 6px;">
                              <i class="fa-solid fa-arrow-trend-down"></i> ${formatRupiah(group.totalExpense)}
                          </div>
                      </div>
                  </div>
                  
                  <!-- Garis Pembatas -->
                  <div style="height: 1px; background: #e2e8f0; margin-bottom: 12px;"></div>
                  
                  <!-- List Item Transaksi -->
                  <div>
                      ${itemsHTML}
                  </div>
              </div>
          `;
      });
  }

  function getLastXMonths(x) {
        let result = [];
        let currDate = new Date();
        for(let i=x-1; i>=0; i--) {
            let d = new Date(currDate.getFullYear(), currDate.getMonth() - i, 1);
            result.push({
                label: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
                month: d.getMonth(),
                year: d.getFullYear()
            });
        }
        return result;
  }

  function updateChartsByRange(months, chartType) {
      const pastDate = new Date();
      pastDate.setMonth(new Date().getMonth() - months);
      pastDate.setDate(1);

      const filteredTrans = allTransactions.filter(t => {
          if (!t.tanggal) return false;
          const d = new Date(t.tanggal);
          return d >= pastDate && d <= new Date();
      });

      const monthLabels = getLastXMonths(months);

      if (chartType === 'inc-exp') {
          const incData = new Array(months).fill(0);
          const expData = new Array(months).fill(0);
          
          filteredTrans.forEach(t => {
             const d = new Date(t.tanggal);
             const idx = monthLabels.findIndex(m => m.month === d.getMonth() && m.year === d.getFullYear());
             if(idx !== -1) {
                 if(t.type === 'Income') incData[idx] += t.nominal;
                 else expData[idx] += t.nominal;
             }
          });

          if (chartIncExp) chartIncExp.destroy();
          const ctx = document.getElementById('chart-inc-exp');
          if (!ctx) return;
          chartIncExp = new Chart(ctx.getContext('2d'), {
              type: 'bar',
              data: {
                  labels: monthLabels.map(m => m.label),
                  datasets: [
                      { label: 'Income', data: incData, backgroundColor: '#166534' },
                      { label: 'Expense', data: expData, backgroundColor: '#dc2626' }
                  ]
              },
              options: { responsive: true, maintainAspectRatio: false }
          });
      }
      else if (chartType === 'category') {
          const catTotals = {};
          filteredTrans.forEach(t => {
              const cat = t.kategori || 'Other';
              catTotals[cat] = (catTotals[cat] || 0) + t.nominal;
          });

          const labels = Object.keys(catTotals);
          const dataVal = Object.values(catTotals);
          const colors = labels.map(l => getColor(l));

          if (chartCategory) chartCategory.destroy();
          const ctx = document.getElementById('chart-category');
          if (!ctx) return;
          chartCategory = new Chart(ctx.getContext('2d'), {
              type: 'doughnut',
              data: {
                  labels: labels,
                  datasets: [{ data: dataVal, backgroundColor: colors }]
              },
              options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
          });
          
          const legendBox = document.getElementById('categoryLegend');
          if (legendBox) {
              legendBox.innerHTML = '';
              labels.forEach((cat, idx) => {
                  legendBox.innerHTML += `<div class="l-item"><div class="l-left"><span class="l-pct" style="background-color: ${colors[idx]}">&nbsp;&nbsp;</span><span class="l-name">${cat}</span></div><span class="l-val">${formatRupiah(dataVal[idx])}</span></div>`;
              });
          }
      }
      else if (chartType === 'nws') {
          const needsData = new Array(months).fill(0);
          const wantsData = new Array(months).fill(0);
          const savingsData = new Array(months).fill(0);
          
          filteredTrans.forEach(t => {
             const d = new Date(t.tanggal);
             const idx = monthLabels.findIndex(m => m.month === d.getMonth() && m.year === d.getFullYear());
             if(idx !== -1) {
                 if (t.alokasi_data) {
                     needsData[idx] += t.alokasi_data['Needs'] || 0;
                     wantsData[idx] += t.alokasi_data['Wants'] || 0;
                     savingsData[idx] += t.alokasi_data['Savings'] || 0;
                 } else if (t.kategori) {
                     if(t.kategori.toLowerCase() === 'needs') needsData[idx] += t.nominal;
                     else if(t.kategori.toLowerCase() === 'wants') wantsData[idx] += t.nominal;
                     else if(t.kategori.toLowerCase() === 'savings') savingsData[idx] += t.nominal;
                 }
             }
          });

          if (chartNWS) chartNWS.destroy();
          const ctx = document.getElementById('chart-nws');
          if (!ctx) return;
          chartNWS = new Chart(ctx.getContext('2d'), {
              type: 'bar',
              data: {
                  labels: monthLabels.map(m => m.label),
                  datasets: [
                      { label: 'Needs', data: needsData, backgroundColor: '#1e7e00' },
                      { label: 'Wants', data: wantsData, backgroundColor: '#9f0003' },
                      { label: 'Savings', data: savingsData, backgroundColor: '#2f80ed' }
                  ]
              },
              options: { responsive: true, maintainAspectRatio: false }
          });
      }
  }

  const filterIncExp = document.getElementById('filter-inc-exp');
  if (filterIncExp) filterIncExp.addEventListener('change', function() { updateChartsByRange(parseInt(this.value), 'inc-exp'); });
  
  const filterCategory = document.getElementById('filter-category');
  if (filterCategory) filterCategory.addEventListener('change', function() { updateChartsByRange(parseInt(this.value), 'category'); });
  
  const filterNws = document.getElementById('filter-nws');
  if (filterNws) filterNws.addEventListener('change', function() { updateChartsByRange(parseInt(this.value), 'nws'); });

  if (prevBtn) prevBtn.addEventListener('click', () => {
    currentViewDate.setMonth(currentViewDate.getMonth() - 1);
    updateDashboard();
  });
  
  if (nextBtn) nextBtn.addEventListener('click', () => {
    currentViewDate.setMonth(currentViewDate.getMonth() + 1);
    updateDashboard();
  });

  // --- OPEN ADD TRANSACTION MODAL FIX (.show trigger) ---
  const addBtn = document.getElementById('openTransactionModalBtn');
  const addModalOverlay = document.getElementById('add-transaction-modal-overlay');

  if (addBtn && addModalOverlay) {
      addBtn.addEventListener('click', () => {
          addModalOverlay.style.display = 'flex';
          // Tambahkan class show agar modalnya pop-up
          setTimeout(() => {
              const modalContent = addModalOverlay.querySelector('.modal');
              if (modalContent) modalContent.classList.add('show');
          }, 10);
      });
  }

  fetchTransactions();
});