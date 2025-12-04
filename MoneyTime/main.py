from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from markupsafe import escape
from Controller.databaseController import db_connect
from Controller.userController import UserController
from Controller.finansialController import FinansialController
import os
import secrets

# Inisialisasi Objek
user_controller = UserController()
finansial_controller = FinansialController()

app = Flask(__name__,
    template_folder='View/Templates',
    static_folder='View/static')

# Secret key untuk session management
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))

# Route untuk landing page
@app.route('/')
def index():
    return render_template('index.html')

# Route untuk halaman auth (register/login)
@app.route('/auth')
def auth():
    return render_template('RegisLogin.html')

# Route register
@app.route('/register', methods=['POST'])
def register():
    username = request.form.get('register_username')
    email = request.form.get('register_email')
    password = request.form.get('register_password')
    confirm = request.form.get('register_confirm')

    if password == confirm:
        registration_result = user_controller.registrasi(username, password, email)
        if registration_result == True:
            return jsonify({'success': True, 'message': 'Registration successful'})
        elif registration_result == "exists":
            return jsonify({'success': False, 'message': 'Account already exists, please use a new one.'})
        elif registration_result == False:
            return jsonify({'success': False, 'message': 'Registration failed. Please try again.'})
        else:
            return jsonify({'success': False, 'message': 'Unexpected error occurred during registration.'})
    return jsonify({'success': False, 'message': 'Passwords do not match.'})

# Route login
@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('login_username')
    email = username
    password = request.form.get('login_password')
    remember_me = request.form.get('remember_me')

    if user_controller.login(username, email, password):
        user = user_controller.get_current_user()
        session['user'] = {
            'id': user.get_user_id(),
            'username': user.username,
            'email': user.email_address
        }
        if remember_me == 'on':
            session.permanent = True
        return jsonify({'success': True, 'message': 'Login successful'})
    else:
        return jsonify({'success': False, 'message': 'Invalid email or password'})

# Route dashboard
@app.route('/dashboard')
def dashboard():
    if 'user' not in session:
        return redirect(url_for('auth'))
    return render_template('dashboard.html', user=session['user'])

# Route Money
@app.route('/money')
def money():
    if 'user' not in session:
        return redirect(url_for('auth'))
    return render_template('money.html', user=session['user'])

# Route Time
@app.route('/time')
def time():
    if 'user' not in session:
        return redirect(url_for('auth'))
    return render_template('time.html', user=session['user'])

# [UPDATED] Endpoint tambah transaksi
@app.route('/add-transaction', methods=['POST'])
def add_transaction():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    data = request.get_json() or {}
    ttype = data.get('type')  # 'Income' or 'Expense'
    description = data.get('description')
    amount = data.get('amount')
    date = data.get('date')   # Ambil Tanggal
    category = data.get('category') or 'Other'

    if not ttype or not description or not amount or not date:
        return jsonify({'success': False, 'message': 'Missing fields'}), 400

    user = session['user']
    user_id = user.get('id')

    # Tentukan status Finansial ('Pemasukan'/'Pengeluaran') berdasarkan tipe
    status_finansial = 'Pemasukan' if str(ttype).lower() == 'income' else 'Pengeluaran'

    # get or create finansial record dengan status
    finansial_id = finansial_controller.get_or_create_finansial(user_id, category, status=status_finansial)
    
    if not finansial_id:
        return jsonify({'success': False, 'message': 'Failed to create finansial record'}), 500

    try:
        nominal = int(amount)
    except Exception:
        return jsonify({'success': False, 'message': 'Invalid amount'}), 400

    # Panggil fungsi add dengan parameter tanggal
    if str(ttype).lower() == 'income':
        ok = finansial_controller.add_pemasukan(finansial_id, description, nominal, date)
    else:
        ok = finansial_controller.add_pengeluaran(finansial_id, description, nominal, date)

    if ok:
        return jsonify({'success': True, 'message': 'Transaction added'})
    return jsonify({'success': False, 'message': 'Failed to add transaction'}), 500

# [UPDATED] Endpoint ambil data transaksi (Support Search)
@app.route('/api/transactions', methods=['GET'])
def api_transactions():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    user_id = session['user'].get('id')

    # Ambil parameter search 'q' dari URL
    keyword = request.args.get('q', '')

    # Panggil controller dengan keyword
    transactions = finansial_controller.get_transactions(user_id, keyword)

    return jsonify({'success': True, 'transactions': transactions})

# [NEW] Endpoint ambil kategori dinamis
@app.route('/api/categories', methods=['GET'])
def api_categories():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    user_id = session['user'].get('id')

    # Panggil controller untuk ambil kategori
    categories = finansial_controller.get_categories(user_id)

    return jsonify({'success': True, 'categories': categories})

# Route logout
@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('index'))

# --- Fitur Forgot Password ---
@app.route('/forgot-password')
def forgot_password():
    return render_template('forgot_password.html')

@app.route('/send-otp', methods=['POST'])
def send_otp():
    email = request.form.get('email')
    if not user_controller.check_email_exists(email):
        return jsonify({'success': False, 'message': 'Email tidak terdaftar.'})
    otp = user_controller.send_otp(email)
    if otp:
        session['reset_otp'] = otp
        session['reset_email'] = email
        return jsonify({'success': True, 'message': 'OTP terkirim.'})
    else:
        return jsonify({'success': False, 'message': 'Gagal mengirim email.'})

@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    user_otp = request.form.get('otp')
    server_otp = session.get('reset_otp')
    if server_otp and user_otp == server_otp:
        return jsonify({'success': True, 'message': 'OTP Valid.'})
    else:
        return jsonify({'success': False, 'message': 'Kode OTP salah.'})

@app.route('/update-password', methods=['POST'])
def update_password():
    new_password = request.form.get('new_password')
    email = session.get('reset_email')
    if not email:
        return jsonify({'success': False, 'message': 'Sesi habis, ulangi proses.'})
    if user_controller.update_password(email, new_password):
        session.pop('reset_otp', None)
        session.pop('reset_email', None)
        return jsonify({'success': True, 'message': 'Password berhasil diubah.'})
    else:
        return jsonify({'success': False, 'message': 'Gagal update password.'})

if __name__ == '__main__':
    app.run(debug=True)