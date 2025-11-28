document.addEventListener('DOMContentLoaded', function () {
    // --- STATE MANAGEMENT ---
    let allTransactions = [];
    let currentViewDate = new Date(); // Default ke hari ini
    let chartInstance = null;
    
    // Cache DOM Elements
    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');
    const monthLabel = document.getElementById('currentMonthLabel');
    const listContainer = document.getElementById('transactionListContainer');
    const incomeEl = document.getElementById('monthly-income');
    const expenseEl = document.getElementById('monthly-expenses');
    const balanceEl = document.getElementById('total-balance');
    const legendContainer = document.getElementById('statsLegend');
    const chartCanvas = document.getElementById('stats-piechart');

    // Color Cache untuk menjaga warna kategori tetap konsisten
    const categoryColorMap = {
        'Makan': '#e67e22',
        'Kos': '#8e44ad',
        'Transportasi': '#3498db',
        'Jajan': '#f39c12',
        'Langganan': '#2980b9',
        'Gaji': '#27ae60',
        'Investasi': '#16a085'
    };

    // Fungsi Generate Random Color yang enak dilihat (Pastel/Vibrant)
    function getCategoryColor(category) {
        if (categoryColorMap[category]) {
            return categoryColorMap[category];
        }
        // Generate warna baru jika belum ada
        const hue = Math.floor(Math.random() * 360);
        const color = `hsl(${hue}, 70%, 50%)`;
        categoryColorMap[category] = color;
        return color;
    }

    // Format Rupiah
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    };

    // --- API FETCHING ---
    async function fetchTransactions() {
        try {
            const response = await fetch('/api/transactions');
            const data = await response.json();
            if (data.success) {
                allTransactions = data.transactions;
                updateDashboard(); // Render awal
            } else {
                listContainer.innerHTML = '<div style="text-align:center;">Failed to load data.</div>';
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            listContainer.innerHTML = '<div style="text-align:center;">Error connecting to server.</div>';
        }
    }

    // --- CORE LOGIC: FILTER & RENDER ---
    function updateDashboard() {
        // 1. Animasi Transisi (Fade Out)
        listContainer.classList.remove('fade-active');
        document.getElementById('chartContainer').classList.remove('fade-active');

        setTimeout(() => {
            // 2. Filter Data Berdasarkan Bulan & Tahun yang dipilih
            const year = currentViewDate.getFullYear();
            const month = currentViewDate.getMonth(); // 0-11

            // Update Label Header
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            monthLabel.innerHTML = `${monthNames[month]}, <span class="year-label">${year}</span>`;

            // Filter Transaksi
            const monthlyTransactions = allTransactions.filter(t => {
                if (!t.tanggal) return false;
                const d = new Date(t.tanggal);
                return d.getFullYear() === year && d.getMonth() === month;
            });

            // 3. Hitung Summary (Income, Expense) Bulan Ini
            let totalIncome = 0;
            let totalExpense = 0;
            let totalBalanceAllTime = 0; // Balance dihitung dari SEMUA transaksi, bukan cuma bulan ini

            // Hitung total balance (All Time)
            allTransactions.forEach(t => {
                if (t.type === 'Income') totalBalanceAllTime += t.nominal;
                else totalBalanceAllTime -= t.nominal;
            });

            // Hitung income/expense (Bulan Ini)
            monthlyTransactions.forEach(t => {
                if (t.type === 'Income') totalIncome += t.nominal;
                else totalExpense += t.nominal;
            });

            // Update Kartu Summary
            incomeEl.textContent = formatRupiah(totalIncome);
            expenseEl.textContent = formatRupiah(totalExpense);
            balanceEl.textContent = formatRupiah(totalBalanceAllTime);

            // 4. Render List Transaksi
            renderTransactionList(monthlyTransactions);

            // 5. Render Chart & Legend
            renderChart(monthlyTransactions);

            // 6. Animasi Transisi (Fade In)
            listContainer.classList.add('fade-active');
            document.getElementById('chartContainer').classList.add('fade-active');

        }, 300); // Tunggu 300ms sesuai CSS transition
    }

    function renderTransactionList(transactions) {
        listContainer.innerHTML = '';

        if (transactions.length === 0) {
            listContainer.innerHTML = '<div style="text-align:center; padding: 20px; color:#888;">No transactions this month.</div>';
            return;
        }

        // Grouping berdasarkan tanggal
        const grouped = {};
        transactions.forEach(t => {
            const dateKey = t.tanggal; // 'YYYY-MM-DD'
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(t);
        });

        // Sort tanggal descending (terbaru di atas)
        const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

        sortedDates.forEach(dateStr => {
            const dateObj = new Date(dateStr);
            const dateNum = dateObj.getDate();
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
            
            // Hitung daily summary
            let dailyIncome = 0;
            let dailyExpense = 0;
            grouped[dateStr].forEach(t => {
                if (t.type === 'Income') dailyIncome += t.nominal;
                else dailyExpense += t.nominal;
            });

            // HTML Structure per Hari
            const dayDiv = document.createElement('div');
            dayDiv.className = 'transaction-day';
            
            let itemsHtml = '';
            grouped[dateStr].forEach(item => {
                const isIncome = item.type === 'Income';
                const amountClass = isIncome ? 'plus' : 'minus';
                const sign = isIncome ? '+' : '-';
                const color = getCategoryColor(item.kategori);

                itemsHtml += `
                    <div class="transaction-item">
                        <span class="transaction-desc">${item.deskripsi}</span>
                        <span class="transaction-tag" style="background-color: ${color}">${item.kategori}</span>
                        <span class="transaction-amount ${amountClass}">${sign} ${formatRupiah(item.nominal)}</span>
                    </div>
                `;
            });

            dayDiv.innerHTML = `
                <div class="transaction-date">
                    <span class="date-number">${dateNum}</span>
                    <span class="date-day">${dayName}</span>
                </div>
                <div class="transaction-items">
                    ${itemsHtml}
                </div>
                <div class="transaction-summary">
                    <span class="transaction-income plus">${formatRupiah(dailyIncome)}</span>
                    <span class="transaction-expense minus">${formatRupiah(dailyExpense)}</span>
                </div>
            `;
            listContainer.appendChild(dayDiv);
        });
    }

    function renderChart(transactions) {
        // Filter hanya Expense untuk Pie Chart (biasanya chart fokus ke pengeluaran)
        const expenses = transactions.filter(t => t.type === 'Expense');
        
        // Group by Category
        const categoryTotals = {};
        expenses.forEach(t => {
            if (!categoryTotals[t.kategori]) categoryTotals[t.kategori] = 0;
            categoryTotals[t.kategori] += t.nominal;
        });

        const labels = Object.keys(categoryTotals);
        const dataValues = Object.values(categoryTotals);
        const bgColors = labels.map(cat => getCategoryColor(cat));

        // Update Legend HTML
        legendContainer.innerHTML = '';
        if (labels.length === 0) {
            legendContainer.innerHTML = '<div style="text-align:center; color:#888;">No expenses data.</div>';
        } else {
            labels.forEach((cat, index) => {
                const item = document.createElement('div');
                item.className = 'legend-item';
                item.innerHTML = `
                    <div><span class="legend-color" style="background:${bgColors[index]}"></span>${cat}</div>
                    <span class="legend-value">${formatRupiah(dataValues[index])}</span>
                `;
                legendContainer.appendChild(item);
            });
        }

        // Update Chart.js
        if (chartInstance) {
            chartInstance.destroy();
        }

        if (labels.length > 0) {
            chartInstance = new Chart(chartCanvas, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: dataValues,
                        backgroundColor: bgColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (label) label += ': ';
                                    label += formatRupiah(context.raw);
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            // Bersihkan canvas jika tidak ada data
            const ctx = chartCanvas.getContext('2d');
            ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
        }
    }

    // --- NAVIGATION EVENTS ---
    prevBtn.addEventListener('click', () => {
        currentViewDate.setMonth(currentViewDate.getMonth() - 1);
        updateDashboard();
    });

    nextBtn.addEventListener('click', () => {
        currentViewDate.setMonth(currentViewDate.getMonth() + 1);
        updateDashboard();
    });

    // --- INITIALIZATION ---
    fetchTransactions();

    // --- OTHER UI HANDLERS (Modal, Dropdown - Existing Code) ---
    const addBtn = document.querySelector('.add-transaction-btn');
    const transactionModalOverlay = document.getElementById('add-transaction-modal-overlay');
    if (addBtn && transactionModalOverlay) {
        addBtn.addEventListener('click', function () {
            transactionModalOverlay.style.display = 'flex';
        });
    }

    const userDropdown = document.getElementById('user-dropdown');
    const profileDropdown = document.getElementById('profile-dropdown');
    if (userDropdown && profileDropdown) {
        userDropdown.addEventListener('click', function (e) {
            e.stopPropagation();
            profileDropdown.style.display = (profileDropdown.style.display === 'block') ? 'none' : 'block';
        });
        document.addEventListener('click', function () {
            profileDropdown.style.display = 'none';
        });
    }
});