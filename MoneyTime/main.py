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


# db sementara
users = {
}

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

# Route untuk mengirim OTP
@app.route('/send-otp', methods=['POST'])
def send_otp():
    email = request.form.get('email')
    # For now, just simulate success
    # In real implementation, send OTP to email
    return jsonify({'success': True, 'message': 'OTP sent to your email'})

# Route untuk verifikasi OTP
@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    otp = request.form.get('otp')
    # For now, just simulate success
    # In real implementation, verify OTP
    return jsonify({'success': True, 'message': 'OTP verified'})

# Route untuk update password baru
@app.route('/update-password', methods=['POST'])
def update_password():
    new_password = request.form.get('new_password')
    # For now, just simulate success
    # In real implementation, update password in DB
    return jsonify({'success': True, 'message': 'Password updated'})

# Menjalankan aplikasi
if __name__ == '__main__':
    app.run(debug=True)
