document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const detailOverlay = document.getElementById('schedule-detail-modal-overlay');
    const closeBtn = document.getElementById('closeSchDetailModalIcon');
    const deleteBtn = document.getElementById('schDetailDeleteBtn');
    const wontDoBtn = document.getElementById('schDetailWontDoBtn');

    // Modals
    const globalDeleteOverlay = document.getElementById('delete-modal-overlay');
    const globalDeleteModal = document.getElementById('delete-item-modal');
    const wontDoModal = document.getElementById('wont-do-modal');
    const wontDoOverlay = document.getElementById('wont-do-modal-overlay');
    const wontDoConfirmBtn = document.getElementById('wontDoConfirmBtn');
    const wontDoCancelBtn = document.getElementById('wontDoCancelBtn');

    // --- CLOSE DETAIL ---
    function closeDetail() {
        if (detailOverlay) detailOverlay.style.display = 'none';
    }
    if (closeBtn) closeBtn.addEventListener('click', closeDetail);
    if (detailOverlay) {
        detailOverlay.addEventListener('click', (e) => {
            if (e.target === detailOverlay) closeDetail();
        });
    }

    // --- WON'T DO ---
    if (wontDoBtn) {
        wontDoBtn.addEventListener('click', () => {
            if (wontDoOverlay) {
                wontDoOverlay.style.display = 'flex';
                setTimeout(() => { if (wontDoModal) wontDoModal.classList.add('show'); }, 10);
            }
        });
    }
    if (wontDoConfirmBtn) {
        wontDoConfirmBtn.addEventListener('click', () => {
            alert("Schedule marked as 'Won't Do'!");
            if (wontDoModal) wontDoModal.classList.remove('show');
            setTimeout(() => {
                if (wontDoOverlay) wontDoOverlay.style.display = 'none';
                closeDetail();
            }, 300);
        });
    }
    if (wontDoCancelBtn) {
        wontDoCancelBtn.addEventListener('click', () => {
            if (wontDoModal) wontDoModal.classList.remove('show');
            setTimeout(() => { if (wontDoOverlay) wontDoOverlay.style.display = 'none'; }, 300);
        });
    }

    // --- DELETE ---
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (globalDeleteOverlay) {
                globalDeleteOverlay.style.display = 'flex';
                setTimeout(() => { if (globalDeleteModal) globalDeleteModal.classList.add('show'); }, 10);

                const yesBtn = document.getElementById('deleteYesBtn');
                const newYesBtn = yesBtn.cloneNode(true);
                yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);

                newYesBtn.addEventListener('click', () => {
                    alert("Schedule deleted successfully!");
                    globalDeleteModal.classList.remove('show');
                    setTimeout(() => {
                        globalDeleteOverlay.style.display = 'none';
                        closeDetail();
                    }, 300);
                });

                const noBtn = document.getElementById('deleteNoBtn');
                const newNoBtn = noBtn.cloneNode(true);
                noBtn.parentNode.replaceChild(newNoBtn, noBtn);
                newNoBtn.addEventListener('click', () => {
                    globalDeleteModal.classList.remove('show');
                    setTimeout(() => globalDeleteOverlay.style.display = 'none', 300);
                });
            }
        });
    }
});

// --- GLOBAL FUNCTION ---
function openScheduleDetail(data) {
    const detailOverlay = document.getElementById('schedule-detail-modal-overlay');
    if (!detailOverlay) return;

    // Helper Format Tanggal Konsisten
    function formatFullDate(dateInput) {
        if (!dateInput) return '-';
        let dateObj = new Date(dateInput);

        // Fallback ke 2025 jika invalid
        if (isNaN(dateObj.getTime()) || dateObj.getFullYear() === 2001) {
            dateObj = new Date(`${dateInput}, 2025`);
        }

        if (isNaN(dateObj.getTime())) return dateInput;

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        return `${days[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    }

    document.getElementById('schDetailDescription').value = data.description || '-';
    document.getElementById('schDetailTime').value = data.time || '-';

    // Terapkan format
    document.getElementById('schDetailDate').value = formatFullDate(data.date);

    document.getElementById('schDetailCategory').value = data.category || '-';

    // Setup Priority
    const prioContainer = document.getElementById('schDetailPriorityContainer');
    const options = prioContainer.querySelectorAll('.priority-option');
    options.forEach(opt => opt.classList.remove('active'));

    const targetPrio = (data.priority || 'None').toLowerCase();
    const matchingOption = prioContainer.querySelector(`.priority-option.${targetPrio}`);

    if (matchingOption) {
        matchingOption.classList.add('active');
    } else {
        const noneOption = prioContainer.querySelector('.priority-option.none');
        if (noneOption) noneOption.classList.add('active');
    }

    // Set hidden input
    const hiddenPrio = document.getElementById('schDetailPriority');
    if (hiddenPrio) hiddenPrio.value = data.priority || 'None';

    detailOverlay.style.display = 'flex';
}