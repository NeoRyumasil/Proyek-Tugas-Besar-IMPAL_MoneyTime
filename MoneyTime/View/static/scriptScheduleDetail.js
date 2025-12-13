document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const detailOverlay = document.getElementById('schedule-detail-modal-overlay');
    const closeBtn = document.getElementById('closeSchDetailModalIcon');
    const deleteBtn = document.getElementById('schDetailDeleteBtn');
    const editBtn = document.getElementById('schDetailEditBtn'); 

    // Modals
    const globalDeleteOverlay = document.getElementById('delete-modal-overlay');
    const globalDeleteModal = document.getElementById('delete-item-modal');

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
    
    // --- HIDE EDIT BUTTON IF OVERDUE (OPTIONAL LOGIC) ---
    const editBtn = document.getElementById('schDetailEditBtn');
    
    const now = new Date();
    const timeString = data.time ? data.time : "00:00";
    const itemDateTime = new Date(`${data.date}T${timeString}:00`);
    
    // Cek Kondisi: Apakah Expired (Overdue)
    const isExpired = itemDateTime < now;

    if (editBtn) {
        // Jika sudah expired/overdue dan belum completed, mungkin kita restrict edit
        // Atau jika Completed juga bisa di-restrict. Sesuaikan kebijakan.
        // Di sini saya buat jika Expired -> Hide Edit agar konsisten
        if (isExpired) {
            editBtn.style.display = 'none'; 
        } else {
            editBtn.style.display = 'flex'; 
        }
    }

    detailOverlay.style.display = 'flex';
}