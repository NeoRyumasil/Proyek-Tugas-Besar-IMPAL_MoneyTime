document.addEventListener('DOMContentLoaded', () => {

    const typeButtons = document.querySelectorAll(".transaction-type-toggle-item");

    // --- KATEGORI VARS ---
    const categoryDropdown = document.getElementById("categoryDropdown");
    const categoryHeader = categoryDropdown ? categoryDropdown.querySelector(".dropdown-header") : null;
    const categoryInput = document.getElementById("categoryInput");
    const categoryList = categoryDropdown ? categoryDropdown.querySelector(".dropdown-list") : null;
    const addCategoryBtn = document.getElementById("addCategoryBtn");

    // --- ALLOCATION VARS ---
    const allocationSection = document.getElementById("allocationSection");
    const allocNeeds = document.getElementById("allocNeeds");
    const allocWants = document.getElementById("allocWants");
    const allocSavings = document.getElementById("allocSavings");
    const allocWarning = document.getElementById("allocWarning");
    const allocTotalSpan = document.getElementById("allocTotal");

    // --- EXPENSE ALLOCATION VARS ---
    const allocExpense = document.getElementById("expenseAllocationSection");
    const expenseRadios = document.querySelectorAll('input[name="expense_source"]');

    let categories = {
        Income: ["Gaji", "Return Investasi", "Jual Barang", "Other"],
        Expense: ["Academic", "Project", "Organization", "Entertainment", "Other"]
    };

    let currentType = "Income";
    let categoryItems = [];

    // --- FETCH CATEGORIES FROM API ---
    async function fetchCategories() {
        try {
            const response = await fetch('/api/categories', { method: 'GET', credentials: 'same-origin' });
            const data = await response.json();
            if (data.success) {
                const ensureDefault = (fetchedList, typeDefault) => {
                    let combined = new Set([...typeDefault, ...(fetchedList || [])]);
                    return Array.from(combined);
                };
                categories.Income = ensureDefault(data.categories.Income, ["Needs", "Wants", "Savings"]);
                categories.Expense = ensureDefault(data.categories.Expense, ["Needs", "Wants", "Savings"]);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    }

    function renderCategoryList(type) {
        if (!categoryList) return;
        Array.from(categoryList.querySelectorAll(".dropdown-item")).forEach(item => item.remove());

        if (categories[type]) {
            categories[type].forEach(cat => {
                const item = document.createElement("div");
                item.className = "dropdown-item";
                item.textContent = cat;

                item.onclick = () => {
                    categoryInput.value = cat;
                    categoryDropdown.classList.remove("active");
                    if (addCategoryBtn) addCategoryBtn.style.display = "none";
                };
                categoryList.insertBefore(item, addCategoryBtn);
            });
        }
        categoryItems = Array.from(categoryList.querySelectorAll(".dropdown-item"));
    }

    fetchCategories().then(() => {
        renderCategoryList(currentType);
    });

    // Validasi Alokasi 100% (Income)
    function validateAllocation() {
        if (currentType !== "Income") return true; 

        let n = parseInt(allocNeeds?.value) || 0;
        let w = parseInt(allocWants?.value) || 0;
        let s = parseInt(allocSavings?.value) || 0;
        let total = n + w + s;

        if (allocTotalSpan) allocTotalSpan.textContent = total;

        if (total !== 100) {
            if (allocWarning) allocWarning.style.display = "block";
            return false;
        } else {
            if (allocWarning) allocWarning.style.display = "none";
            return true;
        }
    }

    if (allocNeeds) allocNeeds.addEventListener("input", validateAllocation);
    if (allocWants) allocWants.addEventListener("input", validateAllocation);
    if (allocSavings) allocSavings.addEventListener("input", validateAllocation);

    // Toggle Income/Expense
    typeButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            typeButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentType = btn.querySelector(".tab-label").textContent;

            // Atur Muncul/Hilangnya form Alokasi sesuai tipe
            if (allocationSection) {
                allocationSection.style.display = (currentType === "Income") ? "block" : "none";
            }
            if (allocExpense) {
                allocExpense.style.display = (currentType === "Expense") ? "block" : "none";
            }

            renderCategoryList(currentType);
            if (categoryInput) categoryInput.value = "";
            if (addCategoryBtn) addCategoryBtn.style.display = "none";
        });
    });

    // --- EXPENSE RADIO BUTTON STYLING LOGIC ---
    if (expenseRadios.length > 0) {
        expenseRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                // Reset semua warna tombol
                document.querySelectorAll('.expense-source-btn').forEach(btn => {
                    btn.style.backgroundColor = 'transparent';
                    btn.style.color = btn.style.borderColor; 
                });
                
                // Warnai tombol yang dipilih
                if(this.checked) {
                    const activeBtn = this.nextElementSibling;
                    if(activeBtn) {
                        activeBtn.style.backgroundColor = activeBtn.style.borderColor;
                        activeBtn.style.color = 'white';
                    }
                }
            });
        });
        // Trigger awal
        const defaultExpenseRadio = document.querySelector('input[name="expense_source"]:checked');
        if(defaultExpenseRadio) defaultExpenseRadio.dispatchEvent(new Event('change'));
    }

    // Dropdown Logic
    if (categoryInput) {
        categoryInput.addEventListener('click', (e) => {
            e.stopPropagation();
            if (categoryDropdown && !categoryDropdown.classList.contains('active')) categoryDropdown.classList.add('active');
        });
        categoryInput.addEventListener("input", () => {
            const val = categoryInput.value.trim();
            const lowerVal = val.toLowerCase();
            let hasExactMatch = false;

            if (categoryDropdown && !categoryDropdown.classList.contains("active")) categoryDropdown.classList.add("active");

            categoryItems.forEach(item => {
                const text = item.textContent;
                if (text.toLowerCase().includes(lowerVal)) item.style.display = "block";
                else item.style.display = "none";
                if (text.toLowerCase() === lowerVal) hasExactMatch = true;
            });

            if (addCategoryBtn) {
                if (val.length > 0 && !hasExactMatch) {
                    addCategoryBtn.textContent = `Add "${val}" as new category`;
                    addCategoryBtn.style.display = "block";
                } else addCategoryBtn.style.display = "none";
            }
        });
    }

    if (addCategoryBtn) {
        addCategoryBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const val = categoryInput.value.trim();
            if (val) {
                categoryInput.value = val;
                categoryDropdown.classList.remove("active");
                addCategoryBtn.style.display = "none";
            }
        });
    }

    if (categoryHeader) {
        categoryHeader.addEventListener("click", (e) => {
            if (e.target === categoryInput) return;
            categoryDropdown.classList.toggle("active");
        });
    }

    document.addEventListener("click", (e) => {
        if (categoryDropdown && !categoryDropdown.contains(e.target)) categoryDropdown.classList.remove("active");
    });

    // Amount Formatting
    const amountInput = document.getElementById("amount");
    if (amountInput) {
        amountInput.addEventListener("input", function () {
            let raw = this.value.replace(/[^0-9]/g, "");
            if (raw.length === 0) {
                this.value = "";
                return;
            }
            this.value = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        });
    }

    // Calendar & Modal Logic
    const datePickerWrapper = document.getElementById('transactionDatePicker');
    const dateDisplayInput = document.getElementById('dateDisplay');
    const dateHiddenInput = document.getElementById('date');
    const calendarPopup = document.getElementById('calendarPopup');
    const calMonthLabel = document.getElementById('calMonthLabel');
    const calPrevBtn = document.getElementById('calPrevBtn');
    const calNextBtn = document.getElementById('calNextBtn');
    const viewDays = document.getElementById('calendarViewDays');
    const viewMonths = document.getElementById('calendarViewMonths');
    const calDaysGrid = document.getElementById('calDaysGrid');
    const calMonthsGrid = document.getElementById('calMonthsGrid');

    let calDate = new Date();
    let selectedDate = null;
    let currentView = 'days';

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    function updateHeader() {
        if (!calMonthLabel) return;
        const year = calDate.getFullYear();
        const month = calDate.getMonth();

        if (currentView === 'days') {
            calMonthLabel.textContent = `${monthNames[month]} ${year}`;
            if(viewDays) viewDays.style.display = 'block';
            if(viewMonths) viewMonths.style.display = 'none';
        } else {
            calMonthLabel.textContent = `${year}`;
            if(viewDays) viewDays.style.display = 'none';
            if(viewMonths) viewMonths.style.display = 'block';
        }
    }

    function renderDays() {
        if (!calDaysGrid) return;
        calDaysGrid.innerHTML = '';
        const year = calDate.getFullYear();
        const month = calDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        for (let i = 0; i < firstDay; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'cal-day empty';
            calDaysGrid.appendChild(emptyDiv);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'cal-day';
            dayDiv.textContent = d;

            if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayDiv.classList.add('today');
            }

            if (selectedDate && d === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()) {
                dayDiv.classList.add('selected');
            }

            dayDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                selectedDate = new Date(year, month, d);
                const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
                if(dateDisplayInput) dateDisplayInput.value = `${dayName}, ${d} ${monthNames[month]} ${year}`;

                const fmtMonth = String(month + 1).padStart(2, '0');
                const fmtDay = String(d).padStart(2, '0');
                if(dateHiddenInput) dateHiddenInput.value = `${year}-${fmtMonth}-${fmtDay}`;

                closeCalendar();
            });

            calDaysGrid.appendChild(dayDiv);
        }
    }

    function renderMonths() {
        if (!calMonthsGrid) return;
        calMonthsGrid.innerHTML = '';
        const currentMonth = calDate.getMonth();

        shortMonths.forEach((mName, idx) => {
            const mDiv = document.createElement('div');
            mDiv.className = 'cal-month';
            mDiv.textContent = mName;

            if (idx === currentMonth) mDiv.classList.add('selected');

            mDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                calDate.setMonth(idx);
                currentView = 'days';
                renderCalendar();
            });

            calMonthsGrid.appendChild(mDiv);
        });
    }

    function renderCalendar() {
        updateHeader();
        if (currentView === 'days') renderDays();
        else renderMonths();
    }

    function openCalendar() {
        calDate = selectedDate ? new Date(selectedDate) : new Date();
        currentView = 'days';
        renderCalendar();
        if (calendarPopup) calendarPopup.classList.add('active');
    }

    function closeCalendar() {
        if (calendarPopup) calendarPopup.classList.remove('active');
    }

    if (dateDisplayInput) {
        dateDisplayInput.addEventListener('click', (e) => {
            e.stopPropagation();
            if (calendarPopup && calendarPopup.classList.contains('active')) closeCalendar();
            else openCalendar();
        });
    }

    if (calMonthLabel) {
        calMonthLabel.addEventListener('click', (e) => {
            e.stopPropagation();
            currentView = (currentView === 'days') ? 'months' : 'days';
            renderCalendar();
        });
    }

    if (calPrevBtn) {
        calPrevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentView === 'days') calDate.setMonth(calDate.getMonth() - 1);
            else calDate.setFullYear(calDate.getFullYear() - 1);
            renderCalendar();
        });
    }

    if (calNextBtn) {
        calNextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentView === 'days') calDate.setMonth(calDate.getMonth() + 1);
            else calDate.setFullYear(calDate.getFullYear() + 1);
            renderCalendar();
        });
    }

    document.addEventListener('click', (e) => {
        if (calendarPopup && calendarPopup.classList.contains('active')) {
            if (datePickerWrapper && !datePickerWrapper.contains(e.target)) closeCalendar();
        }
    });

    const modal = document.getElementById("add-transaction-modal-overlay");
    const exitBtn = document.getElementById("closeModalIcon");
    const cancelBtn = document.querySelector(".btn-secondary");
    const confirmBtn = document.querySelector(".btn-primary");

    function isFormDirty() {
        const description = document.getElementById("description")?.value.trim();
        const amount = document.getElementById("amount")?.value.trim();
        const date = document.getElementById("date")?.value.trim();
        const category = document.getElementById("categoryInput")?.value.trim();
        return description || amount || date || category;
    }

    function clearForm() {
        if(document.getElementById("description")) document.getElementById("description").value = "";
        if(document.getElementById("amount")) document.getElementById("amount").value = "";
        if(document.getElementById("date")) document.getElementById("date").value = "";
        if(document.getElementById("dateDisplay")) document.getElementById("dateDisplay").value = "";
        selectedDate = null;
        if(document.getElementById("categoryInput")) document.getElementById("categoryInput").value = "";

        // Reset Income Allocation
        if(allocNeeds) allocNeeds.value = "50";
        if(allocWants) allocWants.value = "30";
        if(allocSavings) allocSavings.value = "20";
        if(allocWarning) allocWarning.style.display = "none";
        if(allocationSection) allocationSection.style.display = "block";

        // Reset Expense Source
        const defaultRadio = document.querySelector('input[name="expense_source"][value="Needs"]');
        if(defaultRadio) {
            defaultRadio.checked = true;
            defaultRadio.dispatchEvent(new Event('change'));
        }
        if(allocExpense) allocExpense.style.display = "none";

        currentType = "Income";
        typeButtons.forEach(b => b.classList.remove("active"));
        if (typeButtons[0]) typeButtons[0].classList.add("active");
        
        renderCategoryList("Income");
        if (addCategoryBtn) addCategoryBtn.style.display = "none";
    }

    // --- CLOSING MODAL FIX (Hapus .show trigger) ---
    function closeModal() {
        if (modal) {
            const modalContent = modal.querySelector('.modal');
            if (modalContent) modalContent.classList.remove('show');
            setTimeout(() => {
                modal.style.display = "none";
            }, 300); // Tunggu animasi selesai baru di-none
        }
    }

    if (exitBtn) exitBtn.addEventListener("click", () => { if (isFormDirty()) { /* discard */ } else closeModal(); });
    if (cancelBtn) cancelBtn.addEventListener("click", () => { if (isFormDirty()) { /* discard */ } else closeModal(); });

    // Submit ke Backend
    if (confirmBtn) {
        confirmBtn.addEventListener("click", async () => {
            const typeText = document.querySelector(".transaction-type-toggle-item.active .tab-label")?.textContent;
            const description = document.getElementById("description")?.value;
            const amountRaw = document.getElementById("amount")?.value.replace(/\./g, "");
            const date = document.getElementById("date")?.value;
            const category = document.getElementById("categoryInput")?.value;

            if (!description || !amountRaw) {
                if(typeof showToast === 'function') showToast('Please enter description and amount', 'error');
                return;
            }
            if (!date) {
                if(typeof showToast === 'function') showToast('Please select a date', 'error');
                return;
            }
            if (!category) {
                if(typeof showToast === 'function') showToast('Please select a category', 'error');
                return;
            }

            // Pengecekan Alokasi sebelum Submit
            if (typeText.toLowerCase() === "income") {
                if (!validateAllocation()) {
                    if (typeof showToast === 'function') showToast('Total persentase alokasi harus 100%', 'error');
                    return;
                }
            }

            const payload = { 
                type: typeText.toLowerCase(), 
                description: description, 
                amount: parseInt(amountRaw), 
                date: date, 
                category: category 
            };

            // Masukkan data Alokasi Income ATAU Source Expense ke payload
            if (typeText.toLowerCase() === "income") {
                payload.allocation = {
                    Needs: parseInt(allocNeeds.value) || 0,
                    Wants: parseInt(allocWants.value) || 0,
                    Savings: parseInt(allocSavings.value) || 0
                };
            } else if (typeText.toLowerCase() === "expense") {
                const expenseSourceBtn = document.querySelector('input[name="expense_source"]:checked');
                if (expenseSourceBtn) {
                    payload.expense_source = expenseSourceBtn.value;
                }
            }

            try {
                const res = await fetch('/add-transaction', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify(payload)
                });

                const contentType = res.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const body = await res.json();
                    if (res.ok && body.success) {
                        if(typeof showSuccessModal === 'function') showSuccessModal();
                        clearForm();
                        closeModal();
                        if (typeof fetchTransactions === 'function') {
                            fetchTransactions();
                        } else {
                            location.reload();
                        }
                    } else {
                        if(typeof showToast === 'function') showToast(body.message || 'Failed to add transaction', 'error');
                    }
                } else {
                    if(typeof showToast === 'function') showToast('Terjadi kesalahan pada server.', 'error');
                }
            } catch (err) {
                if(typeof showToast === 'function') showToast('Network error while adding transaction', 'error');
            }
        });
    }
});