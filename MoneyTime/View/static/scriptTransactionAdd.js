document.addEventListener('DOMContentLoaded', () => {

    const typeButtons = document.querySelectorAll(".transaction-type-toggle-item");
    const categoryDropdown = document.getElementById("categoryDropdown");
    const categoryHeader = categoryDropdown ? categoryDropdown.querySelector(".dropdown-header") : null;
    const categoryInput = document.getElementById("categoryInput");
    const categoryList = categoryDropdown ? categoryDropdown.querySelector(".dropdown-list") : null;
    const addCategoryBtn = document.getElementById("addCategoryBtn");

    const categories = {
        Income: ["Gaji", "Return Investasi", "Jual Barang", "Other"],
        Expense: ["Academic", "Project", "Organization", "Entertainment", "Other"]
    };

    let currentType = "Income";
    let categoryItems = [];

    // --- CATEGORY LOGIC ---
    function setCategoryOptions(type) {
        if (!categoryList) return;
        Array.from(categoryList.querySelectorAll(".dropdown-item")).forEach(item => item.remove());

        if (categories[type]) {
            categories[type].forEach(cat => {
                const item = document.createElement("div");
                item.className = "dropdown-item";
                item.textContent = cat;
                categoryList.insertBefore(item, addCategoryBtn);
            });
        }
        categoryItems = Array.from(categoryList.querySelectorAll(".dropdown-item"));
        attachCategoryItemHandlers();
    }

    typeButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            typeButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentType = btn.querySelector(".tab-label").textContent;
            setCategoryOptions(currentType);
            if (categoryInput) categoryInput.value = "";
        });
    });

    if (categoryList) setCategoryOptions(currentType);

    function attachCategoryItemHandlers() {
        categoryItems.forEach(item => {
            item.onclick = () => {
                if (categoryInput) categoryInput.value = item.textContent;
                if (categoryDropdown) categoryDropdown.classList.remove("active");
            };
        });
    }

    if (categoryHeader) {
        categoryHeader.addEventListener("click", (e) => {
            if (e.target === categoryInput) return;
            categoryDropdown.classList.toggle("active");
        });
    }

    document.addEventListener("click", (e) => {
        if (categoryDropdown && !categoryDropdown.contains(e.target)) {
            categoryDropdown.classList.remove("active");
        }
    });

    if (categoryInput) {
        categoryInput.addEventListener("input", () => {
            const value = categoryInput.value.trim();
            if (addCategoryBtn) {
                if (value.length > 0) {
                    addCategoryBtn.textContent = 'Add "' + value + '" as new category';
                    addCategoryBtn.style.display = "block";
                } else {
                    addCategoryBtn.style.display = "none";
                }
            }
        });
    }

    if (addCategoryBtn) {
        addCategoryBtn.addEventListener("click", () => {
            const value = categoryInput.value.trim();
            if (!value) return;
            if (categoryItems.some(item => item.textContent.toLowerCase() === value.toLowerCase())) {
                categoryDropdown.classList.remove("active");
                return;
            }
            const newItem = document.createElement("div");
            newItem.className = "dropdown-item";
            newItem.textContent = value;
            categoryList.insertBefore(newItem, addCategoryBtn);
            categoryItems = Array.from(categoryList.querySelectorAll(".dropdown-item"));
            attachCategoryItemHandlers();
            categoryDropdown.classList.remove("active");
            categoryInput.value = value;
        });
    }

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

    // --- CUSTOM DATE PICKER LOGIC ---
    const datePickerWrapper = document.getElementById('transactionDatePicker');
    const dateDisplayInput = document.getElementById('dateDisplay');
    const dateHiddenInput = document.getElementById('date');
    const calendarPopup = document.getElementById('calendarPopup');

    // Header Elements
    const calMonthLabel = document.getElementById('calMonthLabel');
    const calPrevBtn = document.getElementById('calPrevBtn');
    const calNextBtn = document.getElementById('calNextBtn');

    // View Containers
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
            viewDays.style.display = 'block';
            viewMonths.style.display = 'none';
        } else {
            calMonthLabel.textContent = `${year}`;
            viewDays.style.display = 'none';
            viewMonths.style.display = 'block';
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

        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'cal-day empty';
            calDaysGrid.appendChild(emptyDiv);
        }

        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'cal-day';
            dayDiv.textContent = d;

            if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayDiv.classList.add('today');
            }

            if (selectedDate &&
                d === selectedDate.getDate() &&
                month === selectedDate.getMonth() &&
                year === selectedDate.getFullYear()) {
                dayDiv.classList.add('selected');
            }

            dayDiv.addEventListener('click', (e) => {
                e.stopPropagation();

                // 1. Simpan tanggal terpilih
                selectedDate = new Date(year, month, d);

                // 2. Format Tampilan: "Monday, 18 September 2025"
                const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
                dateDisplayInput.value = `${dayName}, ${d} ${monthNames[month]} ${year}`;

                // 3. Format Backend: YYYY-MM-DD
                const fmtMonth = String(month + 1).padStart(2, '0');
                const fmtDay = String(d).padStart(2, '0');
                dateHiddenInput.value = `${year}-${fmtMonth}-${fmtDay}`;

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

            if (idx === currentMonth) {
                mDiv.classList.add('selected');
            }

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
        if (currentView === 'days') {
            renderDays();
        } else {
            renderMonths();
        }
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

    // --- EVENT LISTENERS ---

    if (dateDisplayInput) {
        dateDisplayInput.addEventListener('click', (e) => {
            e.stopPropagation();
            if (calendarPopup.classList.contains('active')) {
                closeCalendar();
            } else {
                openCalendar();
            }
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
            if (currentView === 'days') {
                calDate.setMonth(calDate.getMonth() - 1);
            } else {
                calDate.setFullYear(calDate.getFullYear() - 1);
            }
            renderCalendar();
        });
    }

    if (calNextBtn) {
        calNextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentView === 'days') {
                calDate.setMonth(calDate.getMonth() + 1);
            } else {
                calDate.setFullYear(calDate.getFullYear() + 1);
            }
            renderCalendar();
        });
    }

    document.addEventListener('click', (e) => {
        if (calendarPopup && calendarPopup.classList.contains('active')) {
            if (!datePickerWrapper.contains(e.target)) {
                closeCalendar();
            }
        }
    });

    // --- MODAL & SUBMIT LOGIC ---
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

    function showDiscardModal() {
        const discardModalOverlay = document.getElementById('discard-modal-overlay');
        if (discardModalOverlay) {
            discardModalOverlay.style.display = 'flex';
            const modalContent = discardModalOverlay.querySelector('.modal');
            if (modalContent) {
                setTimeout(() => {
                    modalContent.classList.add('show');
                }, 10);
            }
            attachDiscardModalHandlers();
        }
    }

    function attachDiscardModalHandlers() {
        const discardModalOverlay = document.getElementById('discard-modal-overlay');
        if (!discardModalOverlay) return;

        const noBtn = discardModalOverlay.querySelector('#discardNoBtn');
        const yesBtn = discardModalOverlay.querySelector('#discardYesBtn');

        if (noBtn) {
            noBtn.onclick = () => {
                const modalContent = discardModalOverlay.querySelector('.modal');
                if (modalContent) modalContent.classList.remove('show');
                setTimeout(() => {
                    discardModalOverlay.style.display = 'none';
                }, 400);
            };
        }

        if (yesBtn) {
            yesBtn.onclick = () => {
                const modalContent = discardModalOverlay.querySelector('.modal');
                if (modalContent) modalContent.classList.remove('show');
                setTimeout(() => {
                    discardModalOverlay.style.display = 'none';
                    if (modal) modal.style.display = 'none';
                    clearForm();
                }, 400);
            };
        }
    }

    function clearForm() {
        document.getElementById("description").value = "";
        document.getElementById("amount").value = "";
        document.getElementById("date").value = "";
        document.getElementById("dateDisplay").value = "";
        selectedDate = null;
        document.getElementById("categoryInput").value = "";

        currentType = "Income";
        typeButtons.forEach(b => b.classList.remove("active"));
        if (typeButtons[0]) typeButtons[0].classList.add("active");
        setCategoryOptions("Income");

        if (addCategoryBtn) addCategoryBtn.style.display = "none";
    }

    function handleClose() {
        if (isFormDirty()) {
            showDiscardModal();
        } else {
            closeModal();
        }
    }

    function closeModal() {
        if (modal) modal.style.display = "none";
    }

    if (exitBtn) exitBtn.addEventListener("click", handleClose);
    if (cancelBtn) cancelBtn.addEventListener("click", handleClose);

    if (confirmBtn) {
        confirmBtn.addEventListener("click", async () => {
            const type = document.querySelector(".transaction-type-toggle-item.active .tab-label")?.textContent;
            const description = document.getElementById("description")?.value;
            const amount = document.getElementById("amount")?.value.replace(/\./g, "");
            const date = document.getElementById("date")?.value;
            const category = document.getElementById("categoryInput")?.value;

            if (!description || !amount) {
                alert('Please enter description and amount');
                return;
            }
            if (!date) {
                alert('Please select a date');
                return;
            }

            const payload = { type, description, amount, date, category };

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
                        alert('Transaction added');
                        clearForm();
                        closeModal();
                        location.reload();
                    } else {
                        alert(body.message || 'Failed to add transaction');
                    }
                } else {
                    const text = await res.text();
                    console.error("Server Error:", text);
                    alert("Terjadi kesalahan pada server.");
                }
            } catch (err) {
                console.error(err);
                alert('Network error while adding transaction');
            }
        });
    }
});