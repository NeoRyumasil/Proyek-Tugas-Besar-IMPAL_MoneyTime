from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from markupsafe import escape

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


@app.route('/login', methods=['POST'])
def login():
    email = request.form.get('login_email')
    password = request.form.get('login_password')


@app.route('/dashboard')
def dashboard():
    # gunakan session untuk memeriksa apakah user sudah login(kamu bisa lanjutin rak, route bisa di ganti)
    if 'user' not in session:


@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('auth'))


if __name__ == '__main__':
    app.run(debug=True)
