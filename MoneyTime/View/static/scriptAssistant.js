// Pas buka otomatis di bawah
function scrollToBottom() {
    const chatBody = document.querySelector('.mt-body');
    if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
    }
}

// Function untuk membuka dan menutup Assistant
function toggleAssistant() {
    const assistantWindow = document.getElementById('mt-assistant-window');
    
    if (assistantWindow.classList.contains('hidden')) {
        // Buka Window
        assistantWindow.classList.remove('hidden');
        
        // TAMBAHAN: Auto scroll ke bawah saat dibuka
        // Diberi sedikit timeout agar transisi CSS selesai dulu (opsional tapi lebih mulus)
        setTimeout(scrollToBottom, 100); 
        
    } else {
        // Tutup Window
        assistantWindow.classList.add('hidden');
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