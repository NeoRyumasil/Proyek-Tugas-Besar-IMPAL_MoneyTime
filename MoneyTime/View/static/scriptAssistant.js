// Function untuk membuka dan menutup Assistant
function toggleAssistant() {
    const assistantWindow = document.getElementById('mt-assistant-window');
    const triggerBtn = document.getElementById('mt-assistant-trigger');

    if (assistantWindow.classList.contains('hidden')) {
        // Buka Window
        assistantWindow.classList.remove('hidden');
        // Opsi: Sembunyikan tombol trigger saat window terbuka
        // triggerBtn.style.display = 'none'; 
    } else {
        // Tutup Window
        assistantWindow.classList.add('hidden');
        // triggerBtn.style.display = 'flex';
    }
}

// Optional: Menutup assistant jika user klik di luar area assistant
document.addEventListener('click', function(event) {
    const assistantWindow = document.getElementById('mt-assistant-window');
    const triggerBtn = document.getElementById('mt-assistant-trigger');
    
    // Cek jika yang diklik BUKAN window dan BUKAN tombol trigger
    if (!assistantWindow.contains(event.target) && !triggerBtn.contains(event.target) && !assistantWindow.classList.contains('hidden')) {
        toggleAssistant();
    }
});