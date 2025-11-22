from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from markupsafe import escape
from Controller.databaseController import db_connect
from Controller.userController import UserController
import os
import secrets

# Inisialisasi Objek
user_controller = UserController()

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
    # Ambil data dari form
    username = request.form.get('register_username')
    email = request.form.get('register_email')
    password = request.form.get('register_password')
    confirm = request.form.get('register_confirm')

    if password == confirm:
        if user_controller.registrasi(username, password, email):
            return jsonify({'success': True, 'message': 'Registration successful'})

# Route login
@app.route('/login', methods=['POST'])
def login():
    # Ambil data dari form
    username = request.form.get('login_username')
    email = username
    password = request.form.get('login_password')
    remember_me = request.form.get('remember_me')

    # Verifikasi user menggunakan UserController
    if user_controller.login(username, email, password):
        user = user_controller.get_current_user()
        session['user'] = {
            'id': user.get_user_id(),
            'username': user.username,
            'email': user.email_address
        }

        # Jika remember me buat sessionnya jadi permanent
        if remember_me == 'on':
            session.permanent = True
        return jsonify({'success': True, 'message': 'Login successful'})
    else:
        return jsonify({'success': False, 'message': 'Invalid email or password'})

# Route dashboard: hanya bisa diakses jika user sudah login (ada di session)
@app.route('/dashboard')
def dashboard():
    if 'user' not in session:
        return redirect(url_for('auth'))
    
    return render_template('dashboard.html', user=session['user'])

# Route logout
@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('index'))

# Route lupa password
@app.route('/forgot-password')
def forgot_password():
    return render_template('forgot_password.html')

@app.route('/send-otp', methods=['POST'])
def send_otp():
    email = request.form.get('email')
    
    # Cek Email
    if not user_controller.check_email_exists(email):
        return jsonify({'success': False, 'message': 'Email tidak terdaftar.'})

    # Kirim OTP
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