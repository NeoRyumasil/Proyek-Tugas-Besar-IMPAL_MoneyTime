from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from markupsafe import escape

# ada bebberapa kode yang mungkin bisa dihapus dan tidak, ubah saja, beberapa kode dibawah hnya untuk testing auth

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'

# In-memory database
users = {
    'test@example.com': {'username': 'Test User', 'password': '123'}
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

    if not all([username, email, password, confirm]):
        return jsonify({'success': False, 'message': 'All fields are required'})

    if password != confirm:
        return jsonify({'success': False, 'message': 'Passwords do not match'})

    # Check if email already exists
    if email in users:
        return jsonify({'success': False, 'message': 'Email already registered'})

    # Add user
    users[email] = {
        'username': username,
        'password': password
    }

    return jsonify({'success': True, 'message': 'Registration successful'})

@app.route('/login', methods=['POST'])
def login():
    email = request.form.get('login_email')
    password = request.form.get('login_password')

    if email in users and users[email]['password'] == password:
        session['user'] = {'username': users[email]['username'], 'email': email}
        return jsonify({'success': True, 'message': 'Login successful'})
    else:
        return jsonify({'success': False, 'message': 'Invalid email or password'})

@app.route('/dashboard')
def dashboard():
    if 'user' not in session:
        return redirect(url_for('auth'))
    return render_template('dashboard.html', user=session['user'])

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('auth'))


if __name__ == '__main__':
    app.run(debug=True)
