document.addEventListener('DOMContentLoaded', () => {
    // Selectors
    const detailModalOverlay = document.getElementById('transaction-detail-modal-overlay');
    const closeDetailBtn = document.getElementById('closeDetailModalIcon');
    const editDetailBtn = document.getElementById('detailEditBtn');
    const deleteDetailBtn = document.getElementById('detailDeleteBtn');

    // Close Modal
    function closeDetailModal() {
        if (detailModalOverlay) {
            detailModalOverlay.style.display = 'none';
        }
    }

    if (closeDetailBtn) closeDetailBtn.addEventListener('click', closeDetailModal);
    if (detailModalOverlay) {
        detailModalOverlay.addEventListener('click', (e) => {
            if (e.target === detailModalOverlay) closeDetailModal();
        });
    }

    // Alert Placeholder
    if (editDetailBtn) editDetailBtn.addEventListener('click', () => alert("Fitur Edit: Coming Soon!"));
    if (deleteDetailBtn) deleteDetailBtn.addEventListener('click', () => alert("Fitur Delete: Coming Soon!"));
});

function openTransactionDetail(transaction) {
    const detailModalOverlay = document.getElementById('transaction-detail-modal-overlay');
    if (!detailModalOverlay) return;

    // 1. Logic Warna Tab
    const typeIncome = document.getElementById('detailTypeIncome');
    const typeExpense = document.getElementById('detailTypeExpense');

    // Reset Class
    typeIncome.className = 'detail-tab-item';
    typeExpense.className = 'detail-tab-item';

    if (transaction.type && transaction.type.toLowerCase() === 'income') {
        typeIncome.classList.add('tab-active-blue');
        typeExpense.classList.add('tab-inactive-grey');
    } else {
        typeExpense.classList.add('tab-active-blue');
        typeIncome.classList.add('tab-inactive-grey');
    }

    // 2. Isi Data
    document.getElementById('detailDescription').value = transaction.deskripsi || '-';

    const nominal = transaction.nominal || 0;
    const formattedAmount = new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(nominal);
    document.getElementById('detailAmount').value = formattedAmount;

    let dateStr = transaction.tanggal;
    if (dateStr) {
        const dateObj = new Date(dateStr);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('detailDate').value = dateObj.toLocaleDateString('en-US', options);
    } else {
        document.getElementById('detailDate').value = '-';
    }

    document.getElementById('detailCategory').value = transaction.kategori || '-';

    // 3. Tampilkan
    detailModalOverlay.style.display = 'flex';
}