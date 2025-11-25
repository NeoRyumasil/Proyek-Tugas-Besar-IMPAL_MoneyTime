
// Pie chart for stats section
document.addEventListener('DOMContentLoaded', function () {
	const ctx = document.getElementById('stats-piechart');
	if (ctx && window.Chart) {
		new Chart(ctx, {
			type: 'pie',
			data: {
				labels: ['Kos', 'Makan', 'Langganan', 'Jajan', 'Transportasi'],
				datasets: [{
					data: [1200000, 80000, 80000, 25000, 15000],
					backgroundColor: [
						'#8e44ad', // Kos
						'#e67e22', // Makan
						'#2980b9', // Langganan
						'#f39c12', // Jajan
						'#3498db'  // Transportasi
					],
					borderWidth: 1
				}]
			},
			options: {
				plugins: {
					legend: {
						display: false
					}
				}
			}
		});
	}

	// Add Transaction button (example interaction)
	// Add Transaction button
	const addBtn = document.querySelector('.add-transaction-btn');
	const transactionModalOverlay = document.getElementById('add-transaction-modal-overlay');
	if (addBtn && transactionModalOverlay) {
		addBtn.addEventListener('click', function () {
			transactionModalOverlay.style.display = 'flex';
		});
	}

	// Profile dropdown toggle
	const userDropdown = document.getElementById('user-dropdown');
	const profileDropdown = document.getElementById('profile-dropdown');
	if (userDropdown && profileDropdown) {
		userDropdown.addEventListener('click', function (e) {
			e.stopPropagation();
			profileDropdown.style.display = (profileDropdown.style.display === 'block') ? 'none' : 'block';
		});
		document.addEventListener('click', function () {
			profileDropdown.style.display = 'none';
		});
		// Optional: handle Profil click
		const profilItem = profileDropdown.querySelector('.dropdown-item');
		if (profilItem) {
			profilItem.addEventListener('click', function (e) {
				e.preventDefault();
				alert('Profil feature coming soon!');
				profileDropdown.style.display = 'none';
			});
		}
	}
});
