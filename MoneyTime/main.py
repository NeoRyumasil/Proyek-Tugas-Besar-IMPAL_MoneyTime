from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from markupsafe import escape
import os
import secrets

# ada bebberapa kode yang mungkin bisa dihapus dan tidak, ubah saja, beberapa kode dibawah hnya untuk testing auth

app = Flask(__name__)

# mengamankan aplikasi Flask dengan secret key yang diambil dari environment variable atau secara otomatis digenerate jika tidak ada
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))


# db sementara
users = {
}

# Route untuk landing page
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/auth')
def auth():
    return render_template('RegisLogin.html')

@app.route('/register', methods=['POST'])
def register():
    username = request.form.get('register_username')
    email = request.form.get('register_email')
    password = request.form.get('register_password')
    confirm = request.form.get('register_confirm')

     # inform pada form auth FE
    if not all([username, email, password, confirm]):
        return jsonify({'success': False, 'message': 'All fields are required'})

    if password != confirm:
        return jsonify({'success': False, 'message': 'Passwords do not match'})

    # Check if email already exists
    if email in users:
        return jsonify({'success': False, 'message': 'Email already registered'})

    # penyimpanan variabel nama dll ke dictionary(nantinya masukan ke DB)
    users[email] = {
        'username': username,
        'password': password
    }

    return jsonify({'success': True, 'message': 'Registration successful'})

@app.route('/login', methods=['POST'])
def login():
    email = request.form.get('login_email')
    password = request.form.get('login_password')

     # inform pada form auth FE
    if email in users and users[email]['password'] == password:
        # Setelah login berhasil, simpan data pengguna di session untuk melacak status login
        session['user'] = {'username': users[email]['username'], 'email': email}

        # Kembalikan respons JSON sukses; frontend (JavaScript) akan menangani redirect ke /dashboard (scriptRegisLogin.js line 115)        
        return jsonify({'success': True, 'message': 'Login successful'})
    else:
        return jsonify({'success': False, 'message': 'Invalid email or password'})

# Route dashboard: hanya bisa diakses jika user sudah login (ada di session)
@app.route('/dashboard')
def dashboard():
    # Periksa apakah user sudah login; jika tidak, redirect ke halaman auth
    if 'user' not in session:
        return redirect(url_for('auth'))
    
    # Jika sudah login, render template dashboard dengan data user dari session
    return render_template('dashboard.html', user=session['user'])

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('auth'))


if __name__ == '__main__':
    app.run(debug=True)
