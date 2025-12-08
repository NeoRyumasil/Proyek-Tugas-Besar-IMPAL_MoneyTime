document.addEventListener('DOMContentLoaded', () => {
    const detailModalOverlay = document.getElementById('transaction-detail-modal-overlay');
    const closeDetailBtn = document.getElementById('closeDetailModalIcon');
    const editDetailBtn = document.getElementById('detailEditBtn');
    const deleteDetailBtn = document.getElementById('detailDeleteBtn');

    const deleteModalOverlay = document.getElementById('delete-modal-overlay');
    const deleteModal = document.getElementById('delete-item-modal');
    const deleteNoBtn = document.getElementById('deleteNoBtn');
    const deleteYesBtn = document.getElementById('deleteYesBtn');

    function closeDetailModal() {
        if (detailModalOverlay) {
            detailModalOverlay.style.display = 'none';
        }
    }

    function closeDeleteModal() {
        if (deleteModal) {
            deleteModal.classList.remove('show');
        }
        setTimeout(() => {
            if (deleteModalOverlay) {
                deleteModalOverlay.style.display = 'none';
            }
        }, 400);
    }

    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', closeDetailModal);
    }

    if (detailModalOverlay) {
        detailModalOverlay.addEventListener('click', (e) => {
            if (e.target === detailModalOverlay) closeDetailModal();
        });
    }

    if (editDetailBtn) {
        editDetailBtn.addEventListener('click', () => {
            // Open edit modal - the logic is handled in scriptTransactionEdit.js
            const editModalOverlay = document.getElementById('edit-transaction-modal-overlay');
            if (editModalOverlay) {
                // Close detail modal
                closeDetailModal();
                // The edit modal opening logic is in scriptTransactionEdit.js
                // It will be triggered by the edit button click there
            }
        });
    }

    if (deleteDetailBtn) {
        deleteDetailBtn.addEventListener('click', () => {
            if (deleteModalOverlay) {
                deleteModalOverlay.style.display = 'flex';
                setTimeout(() => {
                    if (deleteModal) deleteModal.classList.add('show');
                }, 10);
            }
        });
    }

    if (deleteNoBtn) {
        deleteNoBtn.addEventListener('click', closeDeleteModal);
    }

    if (deleteModalOverlay) {
        deleteModalOverlay.addEventListener('click', (e) => {
            if (e.target === deleteModalOverlay) closeDeleteModal();
        });
    }

    if (deleteYesBtn) {
        deleteYesBtn.addEventListener('click', async () => {
            // Ambil data transaksi dari modal detail
            const transactionType = document.getElementById('detailTypeIncome').classList.contains('tab-active-blue') ? 'Income' : 'Expense';
            const transactionId = window.currentTransactionDetail ? window.currentTransactionDetail.id : null;

            if (!transactionId) {
                showToast("Error: Transaction ID not found.", "error");
                return;
            }

            try {
                const response = await fetch('/delete-transaction', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: transactionId,
                        type: transactionType
                    })
                });

                const result = await response.json();

                if (result.success) {
                    showSuccessModal();
                    closeDeleteModal();
                    closeDetailModal();
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
                            errorMsg.textContent = result.message || 'Failed to delete transaction';
                            errorMsg.style.display = 'block';
                        }
                    }
                }
            } catch (error) {
                console.error('Error deleting transaction:', error);
                showToast("Error deleting transaction. Please try again.", "error");
            }
        });
    }
});

function openTransactionDetail(transaction) {
    const detailModalOverlay = document.getElementById('transaction-detail-modal-overlay');
    if (!detailModalOverlay) return;

    // Store transaction data globally for delete/edit operations
    window.currentTransactionDetail = transaction;

    const typeIncome = document.getElementById('detailTypeIncome');
    const typeExpense = document.getElementById('detailTypeExpense');

    typeIncome.className = 'detail-tab-item';
    typeExpense.className = 'detail-tab-item';

    if (transaction.type && transaction.type.toLowerCase() === 'income') {
        typeIncome.classList.add('tab-active-blue');
        typeExpense.classList.add('tab-inactive-grey');
    } else {
        typeExpense.classList.add('tab-active-blue');
        typeIncome.classList.add('tab-inactive-grey');
    }

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

    detailModalOverlay.style.display = 'flex';
}
