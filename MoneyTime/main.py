from flask import Flask, render_template, request, jsonify, redirect, url_for
from markupsafe import escape

app = Flask(__name__)

# In-memory database
users = [
    {'name': 'Test User', 'email': 'test@example.com', 'username': 'test@example.com', 'password': '123'}
]

# Route untuk landing page
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/auth')
def auth():
    return render_template('RegisLogin.html')

@app.route('/register', methods=['POST'])
def register():
    name = request.form.get('register_name')
    email = request.form.get('register_email')
    password = request.form.get('register_password')
    confirm = request.form.get('register_confirm')

    if not all([name, email, password, confirm]):
        return jsonify({'success': False, 'message': 'All fields are required'})

    if password != confirm:
        return jsonify({'success': False, 'message': 'Passwords do not match'})

    # Check if email already exists
    for user in users:
        if user['email'] == email:
            return jsonify({'success': False, 'message': 'Email already registered'})

    # Add user
    users.append({
        'name': name,
        'email': email,
        'username': email,
        'password': password
    })

    return jsonify({'success': True, 'message': 'Registration successful'})

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('login_username')
    password = request.form.get('login_password')

    print(f"Login attempt: username='{username}', password='{password}'")

    if not all([username, password]):
        return jsonify({'success': False, 'message': 'Username and password are required'})

    # Check credentials
    for user in users:
        if user['username'] == username and user['password'] == password:
            return jsonify({'success': True, 'message': 'Login successful'})

    return jsonify({'success': False, 'message': 'Invalid username or password'})

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html', users=users)

if __name__ == '__main__':
    app.run(debug=True)
