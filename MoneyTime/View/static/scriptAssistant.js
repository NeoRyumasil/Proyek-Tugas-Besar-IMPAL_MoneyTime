// Fungsi untuk load chat history dari backend dan menambahkan clear button
document.addEventListener('DOMContentLoaded', function() {
    loadChatHistory();
    addClearButton();
});

// Fungsi untuk load chat history dari backend
async function loadChatHistory() {
    try {
        const response = await fetch('/api/chat-history');
        const data = await response.json();

        if (data.success && data.history.length > 0) {
            renderHistory(data.history);
        }
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
}

// Render chat history ke dalam chat body
function renderHistory(history) {
    const chatBody = document.getElementById('mt-chat-body');
    if (!chatBody) return;

    console.log("History dari server:", history); 

    chatBody.innerHTML = '';

    history.forEach((item, index) => {
        console.log(`Item ${index}: role=${item.role}, content=${item.content.substring(0, 30)}...`); 
        
        const isUser = item.role === 'user';  
        addMessage(item.content, isUser);
    });

    scrollToBottom();
}
// Fungsi tambah pesan ke chat body
function addMessage(text, isUser) {
    const chatBody = document.getElementById('mt-chat-body');

    if (!chatBody) return;

    const div = document.createElement('div');  
    div.className = isUser ? 'mt-msg-container mt-msg-user' : 'mt-msg-container mt-msg-bot';

    if (isUser) {
        div.innerHTML = `
            <div class="mt-user-avatar-frame">
                <img src="/static/avatarUser.svg" alt="User Avatar" />
            </div>
            <div class="mt-bubble mt-bubble-user">      
                ${escapeHtml(text).replace(/\n/g, '<br>')}
            </div>
        `;
    } else {
        div.innerHTML = `
            <div class="mt-avatar-frame">
                <img src="/static/Daylili.png" alt="Bot Avatar" style="width: 60px; height: 60px;"/>
            </div>
            <div class="mt-bubble mt-bubble-bot">      
                ${typeof marked !== 'undefined' ? marked.parse(text) : escapeHtml(text).replace(/\n/g, '<br>')}
            </div>
        `;
    }
            
    chatBody.appendChild(div);
    scrollToBottom();       
}

// Escape HTML untuk mencegah XSS
function escapeHtml(text) {
    const div = document.createElement('div');  
    div.textContent = text;
    return div.innerHTML;   
}


// Fungsi untuk scroll ke bawah
function scrollToBottom() {
    const chatBody = document.getElementById('mt-chat-body');
    if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
    }
}

// Fungsi untuk toggle assistant window
function toggleAssistant() {
    const assistantWindow = document.getElementById('mt-assistant-window');
    if (assistantWindow.classList.contains('hidden')) {
        assistantWindow.classList.remove('hidden');
        setTimeout(scrollToBottom, 100); 
    } else {
        assistantWindow.classList.add('hidden');
    }
}

// Event listener click outside
document.addEventListener('click', function(event) {
    const assistantWindow = document.getElementById('mt-assistant-window');
    const triggerBtn = document.getElementById('mt-assistant-trigger');
    
    if (assistantWindow && !assistantWindow.classList.contains('hidden')) {
        if (!assistantWindow.contains(event.target) && !triggerBtn.contains(event.target)) {
            toggleAssistant();
        }
    }
});

// Setup Marked & Highlight
if (typeof marked !== 'undefined') {
    marked.setOptions({
        highlight: function(code, lang) {
            if (typeof hljs !== 'undefined') {
                const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                return hljs.highlight(code, { language }).value;
            }
            return code;
        }
    });
}

// Fungsi menampilkan pesan ke chat body
function appendMessage(message, ...classNames){
    const chatBody = document.getElementById('mt-chat-body');
    const messageContainer = document.createElement('div');
    
    let avatarSrc = '/static/Daylili.png'; 
    let bubbleClass = 'mt-bubble-bot';
    
    if (classNames.includes('mt-user-message')) {
        avatarSrc = '/static/avatarUser.svg'; 
        bubbleClass = 'mt-bubble-user';
        
        messageContainer.className = 'mt-msg-container mt-msg-user';
        messageContainer.innerHTML = `
            <div class="mt-user-avatar-frame">
                <img src="${avatarSrc}" alt="User Avatar" />
            </div>
            <div class="mt-bubble ${bubbleClass}">
                ${typeof marked !== 'undefined' ? marked.parse(message) : message}
            </div>
        `;
    } else {
        messageContainer.className = 'mt-msg-container mt-msg-bot';
        messageContainer.innerHTML = `
            <div class="mt-avatar-frame">
                <img src="${avatarSrc}" alt="Bot Avatar" style="width: 60px; height: 60px;"/>
            </div>
            <div class="mt-bubble ${bubbleClass}">
                ${typeof marked !== 'undefined' ? marked.parse(message) : message}
            </div>
        `;
    }

    chatBody.appendChild(messageContainer);
    scrollToBottom();
}

// Event listener untuk tombol kirim
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); 
        sendMessage();
    }
}

// Fungsi untuk mengirim pesan ke backend
function sendMessage(){
    const userInput = document.getElementById('mt-user-input');
    const message = userInput.value.trim();
    const loadingIndicator = document.querySelector('.mt-loading-indicator');
    
    if(message === '') return;

    appendMessage(message, 'mt-message', 'mt-user-message');
    
    userInput.value = '';
    if(loadingIndicator) loadingIndicator.style.display = 'block';
    scrollToBottom();

    fetch('/assistant', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: message })
    })
    .then(response => response.json())
    .then(data => {
        if(loadingIndicator) loadingIndicator.style.display = 'none';
        
        if (data.reply) {
            appendMessage(data.reply, 'mt-message', 'mt-assistant-message');
        } else if (data.error) {
            appendMessage("Error: " + data.error, 'mt-message', 'mt-assistant-message');
        }
    })
    .catch(error => {
        if(loadingIndicator) loadingIndicator.style.display = 'none';
        appendMessage('Terjadi kesalahan koneksi.', 'mt-message', 'mt-assistant-message');
        console.error('Error:', error);
    });
}

// Fungsi untuk menambahkan tombol clear
function addClearButton() {
    const header = document.querySelector('.mt-header');
    if (!header || document.getElementById('clear-button')) return;
    
    // Pastikan header punya position relative
    if (getComputedStyle(header).position === 'static') {
        header.style.position = 'relative';
    }
    
    const btn = document.createElement('button');
    btn.id = 'clear-button';
    btn.innerHTML = '<i class="fa-solid fa-trash" style="color:#fff;font-size:12px;"></i>';
    btn.style.cssText = `
        background: rgba(249, 0, 0, 0.79);
        border: none;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        right: 70px;        
        top: 50%;
        transform: translateY(-50%);
    `;
    btn.title = "Clear Chat History";
    btn.onclick = clearHistory;
    
    header.appendChild(btn);
}

// Fungsi untuk clear chat history
async function clearHistory() {
    if(!confirm('Hapus Semua Riwayat Chat?')) return;

    try {
        const result = await fetch('/api/chat-history/clear', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await result.json();

        if (data.success) {
            const chatBody = document.getElementById('mt-chat-body');
            if (chatBody) chatBody.innerHTML = `
                <div class="mt-msg-container mt-msg-bot">
                    <div class="mt-avatar-frame">
                        <img src="/static/Daylili.png" alt="Arvita" style="width:60px;height:60px;"/>
                    </div>
                    <div class="mt-bubble mt-bubble-bot">
                        Halo Aku Arvita! Asisten virtual untuk membantu keuangan dan aktivitasmu.
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Gagal menghapus riwayat chat:', error);
    }
}