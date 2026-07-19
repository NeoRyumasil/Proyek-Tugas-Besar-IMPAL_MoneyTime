from flask import Blueprint, request, jsonify, session, redirect, url_for
from Controller.userController import UserController
from Utils.limiter import limiter

auth = Blueprint('auth', __name__)

user_controller = UserController()

# Register Route
@auth.route('/register', methods=['POST'])
def register() :
    username = request.form.get('register_username')
    email = request.form.get('register_email')
    password = request.form.get('register_password')
    confirm = request.form.get('register_confirm')

    validation = user_controller.validate_registration(username, email, password, confirm)

    if not validation :
        return jsonify(validation)
    
    session['pending_registration'] = {
        'username' : username,
        'email' : email,
        'password' : password
    }

    session['pending_validation_email'] = email 

    return jsonify({
        'success' : True,
        'message' : 'Please Verify Your Email',
        'redirect' : '/account-validation'
    })

# Login Route
@auth.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login() :
    username = request.form.get('login_username')
    password = request.form.get('login_password')
    remember_me = request.form.get('remember_me')

    user = user_controller.authenticate(username, password)

    if user:
        session['user'] = {
            'id': user.id,       
            'username': user.username,
            'email': user.email   
        }

        if remember_me == 'on' :
            session.permanent = True
        
        return jsonify({'success': True, 'message' : 'Login Success'})
    
    return jsonify({'success' : False, 'message' : 'Email atau Password Salah'})

# Logout Route
@auth.route('/logout')
def logout() :
    session.pop('user', None)
    return redirect(url_for('page.index'))

# Send Validation OTP Route
@auth.route('/send-validation-otp', methods=['POST'])
@limiter.limit("3 per minute")
def send_validation_otp() :
    email = request.form.get('email') or session.get('pending_validation_email')

    if not email :
        return jsonify({'success' : False, 'message' : 'Email tidak ditemukan'})
    
    otp = user_controller.send_validation_otp(email)

    if otp :
        session['validation_otp'] = otp
        session['validation_email'] = email
        return jsonify({'success' : True, 'message' : 'OTP sent.'})
    
    return jsonify({'success' : False, 'message' : 'Failed send OTP.'})

# Verify Validation OTP Route
@auth.route('/verify-validation-otp', methods=['POST'])
def verify_validation_otp() :
    user_otp = request.form.get('otp')
    server_otp = session.get('validation_otp')
    pending_reg = session.get('pending_registration')

    if server_otp and str(user_otp) == str(server_otp) and pending_reg :
        success = user_controller.finalize_registration(
            pending_reg['username'],
            pending_reg['email'],
            pending_reg['password']
        )

        if success :
            # Clear Session
            session.pop('validation_otp', None)
            session.pop('validation_email', None)
            session.pop('pending_validation_email', None)
            session.pop('pending_registration', None)
            return jsonify({'success' : True, 'message' : 'Akun Terverifikasi'})
        
        return jsonify({'success' : False, 'message' : 'Error Database'})
    
    return jsonify({'success' : False, 'message' : 'Session Expired or Code Invalid'})

# Send Forgot Password OTP Route
@auth.route('/send-forgot-password-otp', methods=['POST'])
@limiter.limit("3 per minute")
def send_forgot_password_otp() :
    email = request.form.get('email')

    email_verify = user_controller.check_email(email)

    if not email_verify :
        return jsonify({'success': False, 'message': 'Email not found.'})
    
    otp = user_controller.send_reset_otp(email)

    if otp :
        session['reset_otp'] = otp
        session['reset_email'] = email
        return jsonify({'success': True, 'message': 'OTP sent.'})
    
    return jsonify({'success': False, 'message': 'Failed to send email.'})

# Verify Forgot Password OTP Route
@auth.route('/verify-forgot-password-otp', methods=['POST'])
def verify_forgot_password_otp() :
    user_otp = request.form.get('otp')
    server_otp = session.get('reset_otp')

    if server_otp and user_otp == str(server_otp):
        return jsonify({'success': True, 'message': 'OTP Valid.'})
    
    return jsonify({'success': False, 'message': 'Invalid OTP.'})

# Update Password Route
@auth.route('/update-password', methods=['POST'])
def update_password() :
    new_password = request.form.get('new_password')
    email = session.get('reset_email')

    if not email:
        return jsonify({'success': False, 'message': 'Session expired.'})
    
    updated = user_controller.update_password(email, new_password)

    if updated :
        session.pop('reset_otp', None)
        session.pop('reset_email', None)
        return jsonify({'success': True, 'message': 'Password updated successfully.'})
    
    return jsonify({'success': False, 'message': 'Failed to update password.'})