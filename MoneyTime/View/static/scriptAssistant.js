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