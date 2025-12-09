from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from markupsafe import escape
from dotenv import load_dotenv

from Controller.databaseController import db_connect
from Controller.userController import UserController
from Controller.finansialController import FinansialController
from Controller.notificationController import NotificationController
from Controller.assistantController import AssistantController

import os
import secrets

# Load environment variables from .env file
load_dotenv()

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

# Route register (UPDATED: Simpan ke Session, BUKAN Database)
@app.route('/register', methods=['POST'])
def register():
    username = request.form.get('register_username')
    email = request.form.get('register_email')
    password = request.form.get('register_password')
    confirm = request.form.get('register_confirm')

    if password == confirm:
        # Cek apakah username/email sudah terpakai
        if user_controller.check_username_exists(username):
            return jsonify({'success': False, 'message': 'Username already exists.'})
        if user_controller.check_email_exists(email):
            return jsonify({'success': False, 'message': 'Email already exists.'})

        # SIMPAN SEMENTARA DI SESSION (Belum masuk DB)
        session['pending_registration'] = {
            'username': username,
            'email': email,
            'password': password
        }
        
        # Simpan email untuk keperluan validasi
        session['pending_validation_email'] = email

        # Redirect ke halaman validasi
        return jsonify({
            'success': True, 
            'message': 'Please verify your email.', 
            'redirect': '/account-validation'
        })
    
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

# Route Notification
@app.route('/notification')
def notification():
    if 'user' not in session:
        return redirect(url_for('auth'))

    notification_controller = NotificationController()
    user_id = session['user'].get('id')
    

    return render_template('notification.html', user=session['user'])

# Endpoint tambah transaksi
@app.route('/add-transaction', methods=['POST'])
def add_transaction():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    data = request.get_json() or {}
    ttype = data.get('type')
    description = data.get('description')
    amount = data.get('amount')
    date = data.get('date')
    category = data.get('category') or 'Other'

    if not ttype or not description or not amount or not date:
        return jsonify({'success': False, 'message': 'Missing fields'}), 400

    user = session['user']
    user_id = user.get('id')

    status_finansial = 'Pemasukan' if str(ttype).lower() == 'income' else 'Pengeluaran'
    finansial_id = finansial_controller.get_or_create_finansial(user_id, category, status=status_finansial)
    
    if not finansial_id:
        return jsonify({'success': False, 'message': 'Failed to create finansial record'}), 500

    try:
        nominal = int(amount)
    except Exception:
        return jsonify({'success': False, 'message': 'Invalid amount'}), 400

    if str(ttype).lower() == 'income':
        ok = finansial_controller.add_pemasukan(finansial_id, description, nominal, date)
    else:
        ok = finansial_controller.add_pengeluaran(finansial_id, description, nominal, date)

    if ok:
        return jsonify({'success': True, 'message': 'Transaction added'})
    return jsonify({'success': False, 'message': 'Failed to add transaction'}), 500

# Endpoint ambil data transaksi
@app.route('/api/transactions', methods=['GET'])
def api_transactions():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    user_id = session['user'].get('id')
    keyword = request.args.get('q', '')
    transactions = finansial_controller.get_transactions(user_id, keyword)

    return jsonify({'success': True, 'transactions': transactions})

# Endpoint ambil kategori dinamis
@app.route('/api/categories', methods=['GET'])
def api_categories():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    user_id = session['user'].get('id')
    categories = finansial_controller.get_categories(user_id)

    return jsonify({'success': True, 'categories': categories})

# Endpoint hapus transaksi
@app.route('/delete-transaction', methods=['DELETE'])
def delete_transaction():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    data = request.get_json() or {}
    transaction_id = data.get('id')
    transaction_type = data.get('type')

    if not transaction_id or not transaction_type:
        return jsonify({'success': False, 'message': 'Missing transaction ID or type'}), 400

    user_id = session['user'].get('id')
    success = finansial_controller.delete_transaction(user_id, int(transaction_id), transaction_type)

    if success:
        return jsonify({'success': True, 'message': 'Transaction deleted successfully'})
    return jsonify({'success': False, 'message': 'Failed to delete transaction'}), 500

# Endpoint edit transaksi
@app.route('/edit-transaction', methods=['PUT'])
def edit_transaction():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    data = request.get_json() or {}
    transaction_id = data.get('id')
    transaction_type = data.get('type')
    description = data.get('description')
    amount = data.get('amount')
    date = data.get('date')
    category = data.get('category')

    if not all([transaction_id, transaction_type, description, amount, date, category]):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400

    try:
        nominal = int(amount)
    except Exception:
        return jsonify({'success': False, 'message': 'Invalid amount'}), 400

    user_id = session['user'].get('id')
    success = finansial_controller.edit_transaction(user_id, int(transaction_id), transaction_type,
                                                  description, nominal, date, category)

    if success:
        return jsonify({'success': True, 'message': 'Transaction updated successfully'})
    return jsonify({'success': False, 'message': 'Failed to update transaction'}), 500

# Route logout
@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('index'))

# Route forgot password
@app.route('/forgot-password')
def forgot_password():
    return render_template('forgot_password.html')

# Route Kirim OTP
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

# Route Verifikasi OTP
@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    user_otp = request.form.get('otp')
    server_otp = session.get('reset_otp')
    if server_otp and user_otp == server_otp:
        return jsonify({'success': True, 'message': 'OTP Valid.'})
    else:
        return jsonify({'success': False, 'message': 'Kode OTP salah.'})

# Route Update Password
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

# Route Validasi Akun setelah Registrasi
@app.route('/account-validation')
def account_validation():
    # Pastikan ada data pendaftaran di session
    if 'pending_registration' not in session:
        return redirect(url_for('auth'))
    return render_template('account_validation.html')

# Route Kirim OTP Validasi Akun
@app.route('/send-validation-otp', methods=['POST'])
def send_validation_otp():
    email = request.form.get('email')
    if not email:
        email = session.get('pending_validation_email')
    if not email:
        return jsonify({'success': False, 'message': 'Email tidak ditemukan. Silakan daftar ulang.'})
        
    otp = user_controller.send_validation_otp(email)
    if otp:
        session['validation_otp'] = otp
        session['validation_email'] = email
        return jsonify({'success': True, 'message': 'OTP terkirim.'})
    else:
        return jsonify({'success': False, 'message': 'Gagal mengirim email.'})

# Route Verifikasi OTP Validasi Akun
@app.route('/verify-validation-otp', methods=['POST'])
def verify_validation_otp():
    user_otp = request.form.get('otp')
    server_otp = session.get('validation_otp')
    email = session.get('validation_email')
    
    # Ambil data user dari session (karena belum ada di DB)
    pending_reg = session.get('pending_registration')

    if server_otp and user_otp == server_otp and pending_reg:
        
        # === SIMPAN KE DATABASE SEKARANG ===
        reg_username = pending_reg['username']
        reg_password = pending_reg['password']
        reg_email = pending_reg['email']

        # Panggil Controller Registrasi (yang melakukan INSERT)
        result = user_controller.registrasi(reg_username, reg_password, reg_email)
        
        if result == True:
            # Sukses simpan, bersihkan session
            session.pop('validation_otp', None)
            session.pop('validation_email', None)
            session.pop('pending_validation_email', None)
            session.pop('pending_registration', None)
            
            return jsonify({'success': True, 'message': 'Account verified successfully.'})
        else:
            return jsonify({'success': False, 'message': 'Database error.'})
            
    elif not pending_reg:
        return jsonify({'success': False, 'message': 'Session expired. Please register again.'})
    else:
        # PESAN ERROR BAHASA INGGRIS (Untuk ditampilkan di form)
        return jsonify({'success': False, 'message': 'Invalid verification code.'})

# Route Khusus untuk Halaman Video troll ke windah tol cipularang
@app.route('/support-video')
def support_video():
    return render_template('support_video.html')

# Route untuk Assistant AI
@app.route('/assistant', methods=['POST']) 
def assistant():
    if 'user' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    user_message = data.get('message', '')
    
    if not user_message:
        return jsonify({'error': 'Empty message'}), 400

    user_id = session['user'].get('id')
    chat_history = session.get('chat_history', [])

    assistant_controller = AssistantController()
    
    financial_summary = finansial_controller.get_financial_summary(user_id)

    ai_reply = assistant_controller.send_message_with_history(
        user_message, 
        chat_history,
        context_data=financial_summary
    )

    chat_history.append({
        'role': 'user', 
        'parts': [user_message]
    })

    chat_history.append({
        'role': 'model', 
        'parts': [ai_reply]
    })
    
    session['chat_history'] = chat_history[-20:]

    return jsonify({'reply': ai_reply})

if __name__ == '__main__':
    app.run(debug=True)