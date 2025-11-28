const typeButtons = document.querySelectorAll(".transaction-type-toggle-item");
const categoryDropdown = document.getElementById("categoryDropdown");
const categoryHeader = categoryDropdown.querySelector(".dropdown-header");
const categoryInput = document.getElementById("categoryInput");
const categoryList = categoryDropdown.querySelector(".dropdown-list");
const addCategoryBtn = document.getElementById("addCategoryBtn");

const categories = {
    Income: ["Gaji", "Return Investasi", "Jual Barang", "Other"],
    Expense: ["Academic", "Project", "Organization", "Entertainment", "Other"]
};

let currentType = "Income";
let categoryItems = [];

function setCategoryOptions(type) {
    Array.from(categoryList.querySelectorAll(".dropdown-item")).forEach(item => item.remove());
    categories[type].forEach(cat => {
        const item = document.createElement("div");
        item.className = "dropdown-item";
        item.textContent = cat;
        categoryList.insertBefore(item, addCategoryBtn);
    });
    categoryItems = Array.from(categoryList.querySelectorAll(".dropdown-item"));
    attachCategoryItemHandlers();
}

typeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        typeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentType = btn.querySelector(".tab-label").textContent;
        setCategoryOptions(currentType);
        categoryInput.value = "";
    });
});

setCategoryOptions(currentType);

const dateField = document.querySelector(".date-field");
const dateWrapper = document.querySelector(".date-input");
if (dateField && dateWrapper) {
    dateWrapper.addEventListener("click", () => {
        dateField.focus();
        if (typeof dateField.showPicker === "function") {
            dateField.showPicker();
        }
    });
}

function attachCategoryItemHandlers() {
    categoryItems.forEach(item => {
        item.onclick = () => {
            categoryInput.value = item.textContent;
            categoryDropdown.classList.remove("active");
        };
    });
}

attachCategoryItemHandlers();

categoryHeader.addEventListener("click", (e) => {
    if (e.target === categoryInput) return;
    categoryDropdown.classList.toggle("active");
});

document.addEventListener("click", (e) => {
    if (!categoryDropdown.contains(e.target)) {
        categoryDropdown.classList.remove("active");
    }
});

categoryInput.addEventListener("input", () => {
    const value = categoryInput.value.trim();
    if (value.length > 0) {
        addCategoryBtn.textContent = 'Add "' + value + '" as new category';
        addCategoryBtn.style.display = "block";
    } else {
        addCategoryBtn.style.display = "none";
    }
});

addCategoryBtn.addEventListener("click", () => {
    const value = categoryInput.value.trim();
    if (!value) return;
    if (categoryItems.some(item => item.textContent.toLowerCase() === value.toLowerCase())) {
        categoryDropdown.classList.remove("active");
        return;
    }
    const newItem = document.createElement("div");
    newItem.className = "dropdown-item";
    newItem.textContent = value;
    categoryList.insertBefore(newItem, addCategoryBtn);
    categoryItems = Array.from(categoryList.querySelectorAll(".dropdown-item"));
    attachCategoryItemHandlers();
    categoryDropdown.classList.remove("active");
});

const amountInput = document.getElementById("amount");
if (amountInput) {
    amountInput.addEventListener("input", function () {
        let raw = this.value.replace(/[^0-9]/g, "");
        if (raw.length === 0) {
            this.value = "";
            return;
        }
        this.value = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    });
}

const modal = document.getElementById("add-transaction-modal-overlay");
const exitBtn = document.querySelector(".close-icon");
const cancelBtn = document.querySelector(".btn-secondary");
const confirmBtn = document.querySelector(".btn-primary");

// Helper to check if form is dirty
function isFormDirty() {
    const description = document.getElementById("description")?.value.trim();
    const amount = document.getElementById("amount")?.value.trim();
    const date = document.getElementById("date")?.value.trim();
    const category = document.getElementById("categoryInput")?.value.trim();
    return description || amount || date || category;
}

// Show discard modal
function showDiscardModal() {
    const discardModalOverlay = document.getElementById('discard-modal-overlay');
    if (discardModalOverlay) {
        discardModalOverlay.style.display = 'flex';
        // Add show class for animation if needed, or just rely on flex
        const modalContent = discardModalOverlay.querySelector('.modal');
        if (modalContent) {
            setTimeout(() => {
                modalContent.classList.add('show');
            }, 10);
        }
        attachDiscardModalHandlers();
    }
}

function attachDiscardModalHandlers() {
    const discardModalOverlay = document.getElementById('discard-modal-overlay');
    if (!discardModalOverlay) return;

    const noBtn = discardModalOverlay.querySelector('#discardNoBtn');
    const yesBtn = discardModalOverlay.querySelector('#discardYesBtn');

    if (noBtn) {
        noBtn.onclick = () => {
            const modalContent = discardModalOverlay.querySelector('.modal');
            if (modalContent) modalContent.classList.remove('show');
            setTimeout(() => {
                discardModalOverlay.style.display = 'none';
            }, 400);
        };
    }

    if (yesBtn) {
        yesBtn.onclick = () => {
            const modalContent = discardModalOverlay.querySelector('.modal');
            if (modalContent) modalContent.classList.remove('show');
            setTimeout(() => {
                discardModalOverlay.style.display = 'none';
                if (modal) modal.style.display = 'none';
                clearForm();
            }, 400);
        };
    }
}

function clearForm() {
    document.getElementById("description").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("date").value = "";
    document.getElementById("categoryInput").value = "";

    // Reset type to Income
    currentType = "Income";
    typeButtons.forEach(b => b.classList.remove("active"));
    if (typeButtons[0]) typeButtons[0].classList.add("active");
    setCategoryOptions("Income");

    // Hide add category button if visible
    if (addCategoryBtn) addCategoryBtn.style.display = "none";
}

function handleClose() {
    if (isFormDirty()) {
        showDiscardModal();
    } else {
        closeModal();
    }
}

function closeModal() {
    if (modal) {
        modal.style.display = "none";
    }
}

if (exitBtn) {
    exitBtn.addEventListener("click", handleClose);
}
if (cancelBtn) {
    cancelBtn.addEventListener("click", handleClose);
}
if (confirmBtn) {
    confirmBtn.addEventListener("click", async () => {
        const type = document.querySelector(".transaction-type-toggle-item.active .tab-label")?.textContent;
        const description = document.getElementById("description")?.value;
        const amount = document.getElementById("amount")?.value.replace(/\./g, "");
        const date = document.getElementById("date")?.value;
        const category = document.getElementById("categoryInput")?.value;

        if (!description || !amount) {
            alert('Please enter description and amount');
            return;
        }

        const payload = { type, description, amount, date, category };

        try {
            const res = await fetch('/add-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(payload)
            });

            // --- BAGIAN PERBAIKAN HANDLING RESPONSE ---
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                // Proses JSON jika header benar
                const body = await res.json();
                if (res.ok && body.success) {
                    alert('Transaction added');
                    clearForm();
                    closeModal();
                    // Optional: Refresh halaman agar data baru muncul
                    location.reload(); 
                } else {
                    alert(body.message || 'Failed to add transaction');
                }
            } else {
                // Jika server mengembalikan HTML (misal error 500)
                const text = await res.text();
                console.error("Server Error (Non-JSON Response):", text);
                alert("Terjadi kesalahan pada server. Cek console browser untuk detail.");
            }
        } catch (err) {
            console.error(err);
            alert('Network error while adding transaction');
        }
    });
}
