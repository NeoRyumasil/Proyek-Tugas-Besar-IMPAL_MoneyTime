document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const detailOverlay = document.getElementById('schedule-detail-modal-overlay');
    const closeBtn = document.getElementById('closeSchDetailModalIcon');
    const deleteBtn = document.getElementById('schDetailDeleteBtn');
    const wontDoBtn = document.getElementById('schDetailWontDoBtn');
    const editBtn = document.getElementById('schDetailEditBtn'); // Tombol Edit

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

    // --- WON'T DO LOGIC ---
    if (wontDoBtn) {
        wontDoBtn.addEventListener('click', () => {
            if (wontDoOverlay) {
                wontDoOverlay.style.display = 'flex';
                setTimeout(() => { if (wontDoModal) wontDoModal.classList.add('show'); }, 10);
            }
        });
    }

    if (wontDoConfirmBtn) {
        wontDoConfirmBtn.addEventListener('click', async () => {
            if (!window.currentScheduleDetail) return;
            try {
                const response = await fetch('/update-schedule-status', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ id: window.currentScheduleDetail.id, status: 'WontDo' })
                });
                if((await response.json()).success) {
                    if (typeof showToast === 'function') showToast("Marked as Won't Do", "success");
                    if(wontDoModal) wontDoModal.classList.remove('show');
                    setTimeout(() => {
                        if(wontDoOverlay) wontDoOverlay.style.display = 'none';
                        closeDetail();
                        // REFRESH HALAMAN
                        if (typeof window.fetchSchedules === 'function') window.fetchSchedules();
                    }, 300);
                }
            } catch(e) { console.error(e); }
        });
    }

    if (wontDoCancelBtn) {
        wontDoCancelBtn.addEventListener('click', () => {
            if (wontDoModal) wontDoModal.classList.remove('show');
            setTimeout(() => { if (wontDoOverlay) wontDoOverlay.style.display = 'none'; }, 300);
        });
    }

    // --- DELETE LOGIC ---
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (globalDeleteOverlay) {
                globalDeleteOverlay.style.display = 'flex';
                setTimeout(() => { if (globalDeleteModal) globalDeleteModal.classList.add('show'); }, 10);

                const yesBtn = document.getElementById('deleteYesBtn');
                const newYesBtn = yesBtn.cloneNode(true);
                yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);

                newYesBtn.addEventListener('click', async () => {
                    const schId = window.currentScheduleDetail ? window.currentScheduleDetail.id : null;
                    if(!schId) return;

                    try {
                        const response = await fetch('/delete-schedule', {
                            method: 'DELETE',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ id: schId })
                        });

                        const res = await response.json();
                        if (res.success) {
                            if (typeof showToast === 'function') showToast("Activity deleted", "success");
                            globalDeleteModal.classList.remove('show');
                            setTimeout(() => {
                                globalDeleteOverlay.style.display = 'none';
                                closeDetail(); // TUTUP MODAL
                                // REFRESH OTOMATIS
                                if (typeof window.fetchSchedules === 'function') window.fetchSchedules();
                            }, 300);
                        } else {
                            if (typeof showToast === 'function') showToast("Failed to delete", "error");
                        }
                    } catch(e) { console.error(e); }
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

// --- GLOBAL FUNCTION UTAMA ---
function openScheduleDetail(data) {
    const detailOverlay = document.getElementById('schedule-detail-modal-overlay');
    if (!detailOverlay) return;

    window.currentScheduleDetail = data;

    function formatFullDate(dateInput) {
        if (!dateInput) return '-';
        let dateObj = new Date(dateInput);
        if (isNaN(dateObj.getTime())) return dateInput;
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return `${days[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    }

    // Populate Fields
    const titleEl = document.getElementById('schDetailTitle'); 
    const descEl = document.getElementById('schDetailDescription'); 
    
    if(titleEl) titleEl.value = data.title || '-'; 
    if(descEl) descEl.value = data.description || ''; 
    
    document.getElementById('schDetailTime').value = data.time || '-';
    document.getElementById('schDetailDate').value = formatFullDate(data.date);
    document.getElementById('schDetailCategory').value = data.category || '-';

    // Priority Styling
    const prioContainer = document.getElementById('schDetailPriorityContainer');
    const options = prioContainer.querySelectorAll('.priority-option');
    options.forEach(opt => opt.classList.remove('active'));

    const targetPrio = (data.priority || 'None').toLowerCase();
    const matchingOption = prioContainer.querySelector(`.priority-option.${targetPrio}`);
    if (matchingOption) matchingOption.classList.add('active');
    
    // --- [LOGIKA PENTING: SEMBUNYIKAN EDIT JIKA RESTRICTED] ---
    const editBtn = document.getElementById('schDetailEditBtn');
    const wontDoBtn = document.getElementById('schDetailWontDoBtn');
    
    // Hitung Waktu
    const now = new Date();
    const timeString = data.time ? data.time : "00:00";
    const itemDateTime = new Date(`${data.date}T${timeString}:00`);
    
    // Cek Kondisi: Apakah Expired ATAU Statusnya Won't Do?
    const isExpired = itemDateTime < now;
    const isRestricted = (data.status === 'WontDo' || isExpired);

    if (editBtn) {
        if (isRestricted) {
            editBtn.style.display = 'none';   // Hilangkan Edit
            if(wontDoBtn) wontDoBtn.style.display = 'none'; // Hilangkan tombol WontDo juga jika sudah di grup bawah
        } else {
            editBtn.style.display = 'flex';   // Tampilkan Edit
            if(wontDoBtn) wontDoBtn.style.display = 'flex';
        }
    }

    detailOverlay.style.display = 'flex';
}