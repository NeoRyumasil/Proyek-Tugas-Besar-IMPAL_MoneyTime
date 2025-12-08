document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMEN UTAMA ---
    const editModalOverlay = document.getElementById('edit-transaction-modal-overlay');
    const detailModalOverlay = document.getElementById('transaction-detail-modal-overlay');

    // Tombol di Modal Edit
    const closeEditBtn = document.getElementById('closeEditModalIcon');
    const cancelEditBtn = document.getElementById('editCancelBtn');
    const confirmEditBtn = document.getElementById('editConfirmBtn');

    // Toggle Tipe
    const editTypeIncome = document.getElementById('editTypeIncome');
    const editTypeExpense = document.getElementById('editTypeExpense');

    // Input Form
    const editDescInput = document.getElementById('editDescription');
    const editAmountInput = document.getElementById('editAmount');
    const editCategoryInput = document.getElementById('editCategoryInput');
    const editDateDisplay = document.getElementById('editDateDisplay');
    const editDateHidden = document.getElementById('editDate');

    // --- STATE ---
    let currentEditType = "Income";
    let initialFormData = {}; // Untuk cek discard changes

    // --- 1. BUKA MODAL EDIT (Dari Tombol Edit di Detail) ---
    const editDetailBtn = document.getElementById('detailEditBtn');

    if (editDetailBtn) {
        // Clone untuk refresh listener
        const newBtn = editDetailBtn.cloneNode(true);
        editDetailBtn.parentNode.replaceChild(newBtn, editDetailBtn);

        newBtn.addEventListener('click', () => {
            // Ambil data dari Modal Detail
            const currentDesc = document.getElementById('detailDescription').value;
            const currentAmount = document.getElementById('detailAmount').value;
            const currentDateStr = document.getElementById('detailDate').value;
            const currentCat = document.getElementById('detailCategory').value;

            // Cek tipe
            const isIncome = document.getElementById('detailTypeIncome').classList.contains('tab-active-blue');
            currentEditType = isIncome ? "Income" : "Expense";

            // Isi Form
            updateEditTypeUI();
            editDescInput.value = currentDesc;

            // Parse Amount
            let rawAmount = currentAmount.replace(/[^0-9]/g, '');
            editAmountInput.value = rawAmount;
            formatEditAmount();

            // Set Tanggal
            if (currentDateStr && currentDateStr !== '-') {
                editDateDisplay.value = currentDateStr;
                const parsedDate = new Date(currentDateStr);
                if (!isNaN(parsedDate)) {
                    editCalDate = parsedDate;
                    selectedEditDate = parsedDate;
                    // Also set the hidden date field
                    const fmtMonth = String(parsedDate.getMonth() + 1).padStart(2, '0');
                    const fmtDay = String(parsedDate.getDate()).padStart(2, '0');
                    if (editDateHidden) editDateHidden.value = `${parsedDate.getFullYear()}-${fmtMonth}-${fmtDay}`;
                }
            } else {
                editDateDisplay.value = "";
                selectedEditDate = null;
                if (editDateHidden) editDateHidden.value = "";
            }

            editCategoryInput.value = currentCat;

            // Simpan state awal
            initialFormData = {
                type: currentEditType,
                desc: editDescInput.value,
                amount: editAmountInput.value,
                date: editDateDisplay.value,
                cat: editCategoryInput.value
            };

            // Switch Modal
            if (detailModalOverlay) detailModalOverlay.style.display = 'none';
            if (editModalOverlay) editModalOverlay.style.display = 'flex';
        });
    }

    // --- 2. LOGIKA FORM ---
    function updateEditTypeUI() {
        if (currentEditType === "Income") {
            editTypeIncome.classList.add('active');
            editTypeExpense.classList.remove('active');
        } else {
            editTypeExpense.classList.add('active');
            editTypeIncome.classList.remove('active');
        }
    }

    if (editTypeIncome && editTypeExpense) {
        editTypeIncome.addEventListener('click', () => { currentEditType = "Income"; updateEditTypeUI(); });
        editTypeExpense.addEventListener('click', () => { currentEditType = "Expense"; updateEditTypeUI(); });
    }

    // --- 3. FORMAT AMOUNT ---
    function formatEditAmount() {
        let raw = editAmountInput.value.replace(/[^0-9]/g, "");
        if (raw.length === 0) { editAmountInput.value = ""; return; }
        editAmountInput.value = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    if (editAmountInput) editAmountInput.addEventListener("input", formatEditAmount);

    // --- 4. KATEGORI DROPDOWN ---
    const editCatDropdown = document.getElementById("editCategoryDropdown");
    const editCatHeader = editCatDropdown ? editCatDropdown.querySelector(".edit-dropdown-header") : null;
    const editCatList = editCatDropdown ? editCatDropdown.querySelector(".edit-dropdown-list") : null;
    const editAddCatBtn = document.getElementById("editAddCategoryBtn");

    const categories = {
        Income: ["Gaji", "Return Investasi", "Jual Barang", "Other"],
        Expense: ["Academic", "Project", "Organization", "Entertainment", "Other"]
    };

    function loadEditCategories() {
        if (!editCatList) return;
        // Hapus item lama (selector class harus sesuai)
        Array.from(editCatList.querySelectorAll(".edit-dropdown-item")).forEach(i => i.remove());

        if (categories[currentEditType]) {
            categories[currentEditType].forEach(cat => {
                const item = document.createElement("div");
                item.className = "edit-dropdown-item"; // Class baru
                item.textContent = cat;
                item.onclick = () => {
                    editCategoryInput.value = cat;
                    editCatDropdown.classList.remove("active");
                };
                editCatList.insertBefore(item, editAddCatBtn);
            });
        }
    }

    if (editCatHeader) {
        editCatHeader.addEventListener("click", (e) => {
            if (e.target === editCategoryInput) return;
            loadEditCategories();
            editCatDropdown.classList.toggle("active");
        });
    }
    document.addEventListener("click", (e) => {
        if (editCatDropdown && !editCatDropdown.contains(e.target)) {
            editCatDropdown.classList.remove("active");
        }
    });

    // --- 5. CUSTOM DATE PICKER (EDIT) ---
    const editDateWrapper = document.getElementById('editTransactionDatePicker');
    const editCalPopup = document.getElementById('editCalendarPopup');

    const editMonthLabel = document.getElementById('editCalMonthLabel');
    const editPrevBtn = document.getElementById('editCalPrevBtn');
    const editNextBtn = document.getElementById('editCalNextBtn');

    const editViewDays = document.getElementById('editCalendarViewDays');
    const editViewMonths = document.getElementById('editCalendarViewMonths');
    const editDaysGrid = document.getElementById('editCalDaysGrid');
    const editMonthsGrid = document.getElementById('editCalMonthsGrid');

    let editCalDate = new Date();
    let selectedEditDate = null;
    let editCurrentView = 'days';

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    function updateEditHeader() {
        if (!editMonthLabel) return;
        const year = editCalDate.getFullYear();
        const month = editCalDate.getMonth();

        if (editCurrentView === 'days') {
            editMonthLabel.textContent = `${monthNames[month]} ${year}`;
            editViewDays.style.display = 'block';
            editViewMonths.style.display = 'none';
        } else {
            editMonthLabel.textContent = `${year}`;
            editViewDays.style.display = 'none';
            editViewMonths.style.display = 'block';
        }
    }

    function renderEditDays() {
        if (!editDaysGrid) return;
        editDaysGrid.innerHTML = '';

        const year = editCalDate.getFullYear();
        const month = editCalDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'edit-cal-day empty'; // Class baru
            editDaysGrid.appendChild(empty);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'edit-cal-day'; // Class baru
            dayDiv.textContent = d;

            if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayDiv.classList.add('today');
            }

            if (selectedEditDate &&
                d === selectedEditDate.getDate() &&
                month === selectedEditDate.getMonth() &&
                year === selectedEditDate.getFullYear()) {
                dayDiv.classList.add('selected');
            }

            dayDiv.onclick = (e) => {
                e.stopPropagation();
                selectedEditDate = new Date(year, month, d);

                const dayName = selectedEditDate.toLocaleDateString('en-US', { weekday: 'long' });
                editDateDisplay.value = `${dayName}, ${d} ${monthNames[month]} ${year}`;

                const fmtMonth = String(month + 1).padStart(2, '0');
                const fmtDay = String(d).padStart(2, '0');
                if (editDateHidden) editDateHidden.value = `${year}-${fmtMonth}-${fmtDay}`;

                closeEditCalendar();
            };
            editDaysGrid.appendChild(dayDiv);
        }
    }

    function renderEditMonths() {
        if (!editMonthsGrid) return;
        editMonthsGrid.innerHTML = '';
        const currentMonthIdx = editCalDate.getMonth();

        shortMonths.forEach((m, idx) => {
            const div = document.createElement('div');
            div.className = 'edit-cal-month'; // Class baru
            div.textContent = m;

            if (idx === currentMonthIdx) div.classList.add('selected');

            div.onclick = (e) => {
                e.stopPropagation();
                editCalDate.setMonth(idx);
                editCurrentView = 'days';
                renderEditCalendar();
            };
            editMonthsGrid.appendChild(div);
        });
    }

    function renderEditCalendar() {
        updateEditHeader();
        if (editCurrentView === 'days') renderEditDays();
        else renderEditMonths();
    }

    function openEditCalendar() {
        editCalDate = selectedEditDate ? new Date(selectedEditDate) : new Date();
        editCurrentView = 'days';
        renderEditCalendar();
        if (editCalPopup) editCalPopup.classList.add('active');
    }

    function closeEditCalendar() {
        if (editCalPopup) editCalPopup.classList.remove('active');
    }

    if (editDateDisplay) {
        editDateDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            if (editCalPopup.classList.contains('active')) closeEditCalendar();
            else openEditCalendar();
        });
    }

    if (editPrevBtn) editPrevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (editCurrentView === 'days') editCalDate.setMonth(editCalDate.getMonth() - 1);
        else editCalDate.setFullYear(editCalDate.getFullYear() - 1);
        renderEditCalendar();
    });

    if (editNextBtn) editNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (editCurrentView === 'days') editCalDate.setMonth(editCalDate.getMonth() + 1);
        else editCalDate.setFullYear(editCalDate.getFullYear() + 1);
        renderEditCalendar();
    });

    if (editMonthLabel) editMonthLabel.addEventListener('click', (e) => {
        e.stopPropagation();
        editCurrentView = (editCurrentView === 'days') ? 'months' : 'days';
        renderEditCalendar();
    });

    document.addEventListener('click', (e) => {
        if (editCalPopup && editCalPopup.classList.contains('active')) {
            if (!editDateWrapper.contains(e.target)) {
                closeEditCalendar();
            }
        }
    });

    // --- 6. LOGIKA CLOSE / DISCARD ---
    function isEditFormDirty() {
        return (
            currentEditType !== initialFormData.type ||
            editDescInput.value !== initialFormData.desc ||
            editAmountInput.value !== initialFormData.amount ||
            editDateDisplay.value !== initialFormData.date ||
            editCategoryInput.value !== initialFormData.cat
        );
    }

    function closeEditModal() {
        if (editModalOverlay) editModalOverlay.style.display = 'none';
    }

    function handleEditClose() {
        if (isEditFormDirty()) {
            showDiscardModal();
        } else {
            closeEditModal();
        }
    }

    function showDiscardModal() {
        const discardModal = document.getElementById('discard-modal-overlay');
        if (discardModal) {
            discardModal.style.display = 'flex';

            const noBtn = document.getElementById('discardNoBtn');
            const yesBtn = document.getElementById('discardYesBtn');

            const newNo = noBtn.cloneNode(true);
            const newYes = yesBtn.cloneNode(true);
            noBtn.parentNode.replaceChild(newNo, noBtn);
            yesBtn.parentNode.replaceChild(newYes, yesBtn);

            newNo.onclick = () => {
                discardModal.style.display = 'none';
            };

            newYes.onclick = () => {
                discardModal.style.display = 'none';
                closeEditModal();
            };

            const modalContent = discardModal.querySelector('.modal');
            if (modalContent) modalContent.classList.add('show');
        }
    }

    if (closeEditBtn) closeEditBtn.addEventListener('click', handleEditClose);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', handleEditClose);

    // --- 7. TOMBOL CONFIRM ---
    if (confirmEditBtn) {
        confirmEditBtn.addEventListener('click', async () => {
            // Validate all required fields
            if (!editDescInput.value.trim()) {
                showToast("Please enter a description.", "error");
                editDescInput.focus();
                return;
            }

            if (!editAmountInput.value.trim()) {
                showToast("Please enter an amount.", "error");
                editAmountInput.focus();
                return;
            }

            if (!editDateDisplay.value.trim()) {
                showToast("Please select a date.", "error");
                return;
            }

            if (!editCategoryInput.value.trim()) {
                showToast("Please select a category.", "error");
                return;
            }

            const transactionId = window.currentTransactionDetail ? window.currentTransactionDetail.id : null;
            if (!transactionId) {
                showToast("Error: Transaction ID not found.", "error");
                return;
            }

            // Parse amount (remove formatting)
            const rawAmount = editAmountInput.value.replace(/[^0-9]/g, '');
            if (!rawAmount || parseInt(rawAmount) <= 0) {
                showToast("Please enter a valid amount.", "error");
                editAmountInput.focus();
                return;
            }

            // Ensure date is in correct format
            if (!editDateHidden.value) {
                showToast("Please select a valid date.", "error");
                return;
            }

            try {
                const response = await fetch('/edit-transaction', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: transactionId,
                        type: currentEditType,
                        description: editDescInput.value.trim(),
                        amount: rawAmount,
                        date: editDateHidden.value,
                        category: editCategoryInput.value.trim()
                    })
                });

                const result = await response.json();

                if (result.success) {
                    showSuccessModal();
                    closeEditModal();
                    // Refresh dashboard data
                    if (typeof fetchTransactions === 'function') {
                        fetchTransactions();
                    } else {
                        location.reload();
                    }
                } else {
                    // Show error in transaction detail modal
                    const detailModal = document.getElementById('transaction-detail-modal-overlay');
                    if (detailModal) {
                        detailModal.style.display = 'flex';
                        const errorMsg = detailModal.querySelector('.error-message');
                        if (errorMsg) {
                            errorMsg.textContent = result.message || 'Failed to update transaction';
                            errorMsg.style.display = 'block';
                        }
                    }
                }
            } catch (error) {
                console.error('Error updating transaction:', error);
                showToast("Error updating transaction. Please try again.", "error");
            }
        });
    }
});