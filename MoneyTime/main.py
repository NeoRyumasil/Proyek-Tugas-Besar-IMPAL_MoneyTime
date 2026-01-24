from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from markupsafe import escape
from dotenv import load_dotenv

# Import Controllers
from Controller.databaseController import db_connect
from Controller.userController import UserController
from Controller.finansialController import FinansialController
from Controller.notificationController import NotificationController
from Controller.assistantController import AssistantController
from Controller.scheduleController import ScheduleController

import os
import secrets

# Load environment variables
load_dotenv()

# Inisialisasi Objek Controller
user_controller = UserController()
finansial_controller = FinansialController()
notification_controller = NotificationController()
schedule_controller = ScheduleController()

base_dir = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__,
    template_folder=os.path.join(base_dir, 'View/Templates'),
    static_folder=os.path.join(base_dir, 'View/static'))

# Secret key untuk session management
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))

# ==========================================
#              CONTEXT PROCESSOR
# ==========================================
# Kode ini akan dijalankan setiap kali membuka halaman APAPUN.
# Tujuannya agar variabel 'notifications' bisa diakses di navbar (dropdown) 
# pada halaman Dashboard, Money, Time, dll.
@app.context_processor
def inject_notifications():
    if 'user' in session:
        try:
            user_id = session['user'].get('id')
            notifications = notification_controller.get_notifications(user_id)
            
            # --- TAMBAHKAN LOGIKA INI ---
            # Hitung berapa yang is_read-nya 0 (False)
            unread_count = 0
            if notifications:
                unread_count = sum(1 for n in notifications if n['is_read'] == 0)
            
            # Kembalikan notifications DAN unread_count
            return dict(notifications=notifications, unread_count=unread_count)
            # -----------------------------
            
        except Exception as e:
            print(f"Error injecting notifications: {e}")
            return dict(notifications=[], unread_count=0)
    return dict(notifications=[], unread_count=0)

# ==========================================
#              PAGE ROUTES
# ==========================================

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/auth')
def auth():
    return render_template('RegisLogin.html')

@app.route('/dashboard')
def dashboard():
    if 'user' not in session:
        return redirect(url_for('auth'))
    return render_template('dashboard.html', user=session['user'])

@app.route('/money')
def money():
    if 'user' not in session:
        return redirect(url_for('auth'))
    return render_template('money.html', user=session['user'])

@app.route('/time')
def time():
    if 'user' not in session:
        return redirect(url_for('auth'))
    return render_template('time.html', user=session['user'])

@app.route('/notification')
def notification():
    if 'user' not in session:
        return redirect(url_for('auth'))
    
    user_id = session['user']['id']
    
    # Mengambil data dari controller
    data_notifikasi = notification_controller.get_notifications(user_id)
    
    # Mengirim data 'notifications' ke HTML
    return render_template('notification.html', user=session['user'], notifications=data_notifikasi)

@app.route('/mark-notif-read', methods=['POST'])
def mark_notif_read():
    if 'user' not in session:
        return jsonify({'success': False}), 401
    
    data = request.get_json()
    activity_id = data.get('id')
    
    if notification_controller.mark_as_read(activity_id):
        return jsonify({'success': True})
    return jsonify({'success': False}), 500

@app.route('/mark-all-read', methods=['POST'])
def mark_all_read():
    # 1. Cek Login
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    # 2. Ambil ID User dari session
    user_id = session['user'].get('id')

    # 3. Panggil Controller
    if notification_controller.mark_all_read(user_id):
        return jsonify({'success': True, 'message': 'All notifications marked as read'})
    
    return jsonify({'success': False, 'message': 'Failed to update database'}), 500

@app.route('/toggle-notif-status', methods=['POST'])
def toggle_notif_status():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    data = request.get_json()
    notif_id = data.get('id')

    success, new_status = notification_controller.toggle_status(notif_id)

    if success:
        # new_status = 1 (Read/True) atau 0 (Unread/False)
        return jsonify({
            'success': True, 
            'is_read': bool(new_status) 
        })
    
    return jsonify({'success': False, 'message': 'Failed to toggle status'}), 500

# ==========================================
#           AUTHENTICATION ROUTES
# ==========================================

# Register Route
@app.route('/register', methods=['POST'])
def register():
    username = request.form.get('register_username')
    email = request.form.get('register_email')
    password = request.form.get('register_password')
    confirm = request.form.get('register_confirm')

    # Validasi
    validation = user_controller.validate_registration(username, email, password, confirm)

    if not validation['success']:
        return jsonify(validation)
    
    # Simpan Session untuk sementara
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
@app.route('/login', methods=['POST'])
def login():
    # Mengambil input (username bisa berupa email atau username biasa)
    username_input = request.form.get('login_username')
    password_input = request.form.get('login_password')
    remember_me = request.form.get('remember_me')

    # Autentikasi
    user = user_controller.authenticate(username_input, password_input)

    # Handle autentikasi
    if user:
        session['user'] = {
            'id': user.user_id,
            'username': user.username,
            'email': user.email_address
        }
    
        if remember_me == 'on':
            session.permanent = True
    
        return jsonify({'success': True, 'message' : 'Login Success'})

    return jsonify({'success' : False, 'message' : 'Email atau Password Salah'})
            
# Logout Route
@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('index'))

# ==========================================
#           ACCOUNT VALIDATION
# ==========================================

# Account Validation Route
@app.route('/account-validation')
def account_validation():
    if 'pending_registration' not in session:
        return redirect(url_for('auth'))
    return render_template('account_validation.html')

# Send Validation OTP Route
@app.route('/send-validation-otp', methods=['POST'])
def send_validation_otp():
    email = request.form.get('email') or session.get('pending_validation_email')

    if not email:
        return jsonify({'success' : False, 'message' : 'Email tidak ditemukan'})
    
    otp = user_controller.send_validation_otp(email)

    if otp:
        session['validation_otp'] = otp
        session['validation_email'] = email
        return jsonify({'success' : True, 'message' : 'OTP sent.'})
    
    return jsonify({'success' : False, 'message' : 'Failed send OTP.'})

# OTP Validation Verification Route
@app.route('/verify-validation-otp', methods=['POST'])
def verify_validation_otp():
    user_otp = request.form.get('otp')
    server_otp = session.get('validation_otp')
    pending_reg = session.get('pending_registration')

    if server_otp and str(user_otp) == str(server_otp) and pending_reg:
        success = user_controller.finalize_registration(
            pending_reg['username'],
            pending_reg['email'],
            pending_reg['password']
        )

        if success:
            # Clear Session
            session.pop('validation_otp', None)
            session.pop('validation_email', None)
            session.pop('pending_validation_email', None)
            session.pop('pending_registration', None)
            return jsonify({'success' : True, 'message' : 'Akun Terverifikasi'})
        
        return jsonify({'success' : False, 'message' : 'Error Database'})
    
    return jsonify({'success' : False, 'message' : 'Session Expired atau Kode Verifikasi Invalid'})

# ==========================================
#           FORGOT PASSWORD
# ==========================================

# Forgot Password Route
@app.route('/forgot-password')
def forgot_password():
    return render_template('forgot_password.html')

# Send OTP Route
@app.route('/send-otp', methods=['POST'])
def send_otp():
    email = request.form.get('email')
    if not user_controller.check_email_exists(email):
        return jsonify({'success': False, 'message': 'Email not found.'})
    
    otp = user_controller.send_reset_otp(email)

    if otp:
        session['reset_otp'] = otp
        session['reset_email'] = email
        return jsonify({'success': True, 'message': 'OTP sent.'})
    
    return jsonify({'success': False, 'message': 'Failed to send email.'})

# Verify OTP Route
@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    user_otp = request.form.get('otp')
    server_otp = session.get('reset_otp')

    if server_otp and user_otp == str(server_otp):
        return jsonify({'success': True, 'message': 'OTP Valid.'})
    
    return jsonify({'success': False, 'message': 'Invalid OTP.'})

# Update Password Route
@app.route('/update-password', methods=['POST'])
def update_password():
    new_password = request.form.get('new_password')
    email = session.get('reset_email')

    if not email:
        return jsonify({'success': False, 'message': 'Session expired.'})
    
    if user_controller.update_password(email, new_password):
        session.pop('reset_otp', None)
        session.pop('reset_email', None)
        return jsonify({'success': True, 'message': 'Password updated successfully.'})
    
    return jsonify({'success': False, 'message': 'Failed to update password.'})

# ==========================================
#           TRANSACTION ROUTES
# ==========================================

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

    user_id = session['user'].get('id')
    status_finansial = 'Pemasukan' if str(ttype).lower() == 'income' else 'Pengeluaran'
    
    finansial_id = finansial_controller.get_or_create_finansial(user_id, category, status=status_finansial)
    
    if not finansial_id:
        return jsonify({'success': False, 'message': 'Failed to create record'}), 500

    try:
        nominal = int(amount)
    except:
        return jsonify({'success': False, 'message': 'Invalid amount'}), 400

    if str(ttype).lower() == 'income':
        ok = finansial_controller.add_pemasukan(finansial_id, description, nominal, date)
    else:
        ok = finansial_controller.add_pengeluaran(finansial_id, description, nominal, date)

    if ok:
        return jsonify({'success': True, 'message': 'Transaction added'})
    return jsonify({'success': False, 'message': 'Database error'}), 500

@app.route('/api/transactions', methods=['GET'])
def api_transactions():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    user_id = session['user'].get('id')
    keyword = request.args.get('q', '')
    transactions = finansial_controller.get_transactions(user_id, keyword)
    return jsonify({'success': True, 'transactions': transactions})

@app.route('/api/categories', methods=['GET'])
def api_categories():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    user_id = session['user'].get('id')
    categories = finansial_controller.get_categories(user_id)
    return jsonify({'success': True, 'categories': categories})

@app.route('/delete-transaction', methods=['DELETE'])
def delete_transaction():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    data = request.get_json() or {}
    transaction_id = data.get('id')
    transaction_type = data.get('type')
    
    if not transaction_id or not transaction_type:
        return jsonify({'success': False, 'message': 'Invalid Data'}), 400

    user_id = session['user'].get('id')
    if finansial_controller.delete_transaction(user_id, int(transaction_id), transaction_type):
        return jsonify({'success': True, 'message': 'Deleted successfully'})
    return jsonify({'success': False, 'message': 'Delete failed'}), 500

@app.route('/edit-transaction', methods=['PUT'])
def edit_transaction():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    data = request.get_json() or {}
    
    try:
        transaction_id = int(data.get('id'))
        nominal = int(data.get('amount'))
    except:
        return jsonify({'success': False, 'message': 'Invalid ID or Amount'}), 400

    user_id = session['user'].get('id')
    success = finansial_controller.edit_transaction(
        user_id, transaction_id, data.get('type'),
        data.get('description'), nominal, data.get('date'), data.get('category')
    )

    if success:
        return jsonify({'success': True, 'message': 'Updated successfully'})
    return jsonify({'success': False, 'message': 'Update failed'}), 500

# ==========================================
#           SCHEDULE ROUTES (BARU)
# ==========================================

@app.route('/add-schedule', methods=['POST'])
def add_schedule():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    data = request.get_json()
    
    # Ambil data terpisah (Clean)
    title = data.get('title')          # Activity Name
    description = data.get('description') # Details
    date = data.get('date')
    time = data.get('time')
    category = data.get('category')
    priority = data.get('priority')

    user_id = session['user'].get('id')
    
    if schedule_controller.add_schedule(user_id, title, description, date, time, category, priority):
        return jsonify({'success': True, 'message': 'Schedule added successfully'})
    return jsonify({'success': False, 'message': 'Failed to add schedule'}), 500

@app.route('/api/schedules', methods=['GET'])
def get_schedules():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    user_id = session['user'].get('id')
    schedules = schedule_controller.get_schedules(user_id)
    return jsonify({'success': True, 'schedules': schedules})

@app.route('/update-schedule-status', methods=['POST'])
def update_schedule_status():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
        
    data = request.get_json()
    schedule_id = data.get('id')
    status = data.get('status') 
    
    if schedule_controller.update_status(schedule_id, status):
        return jsonify({'success': True})
    return jsonify({'success': False, 'message': 'Update failed'}), 500

# ==========================================
#           AI ASSISTANT & SUPPORT
# ==========================================

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

    assistant_controller = AssistantController(finansial_controller, schedule_controller, user_id)
    
    financial_summary = finansial_controller.get_financial_summary(user_id)
    schedule_summary = schedule_controller.get_schedule_summary(user_id)

    context_data = (
        f"Data Keuangan Saya:\n {financial_summary}"
        f"Data Aktivitas Saya:\n {schedule_summary}"
    )

    ai_reply = assistant_controller.send_message_with_history(
        user_message, 
        chat_history,
        context_data=context_data
    )

    chat_history.append({'role': 'user', 'parts': [user_message]})
    chat_history.append({'role': 'model', 'parts': [ai_reply]})
    
    session['chat_history'] = chat_history[-20:]

    return jsonify({'reply': ai_reply})

@app.route('/support-video')
def support_video():
    return render_template('support_video.html')

# ... (Import dan kode lain tetap sama)

# --- Tambahkan Route ini di bawah route Schedule lainnya ---

@app.route('/edit-schedule', methods=['PUT'])
def edit_schedule():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    data = request.get_json()
    schedule_id = data.get('id')
    
    # AMBIL DATA TERPISAH (Clean Architecture)
    title = data.get('title')          # Activity Name
    description = data.get('description') # Description Details
    date = data.get('date')
    time = data.get('time')
    category = data.get('category')
    priority = data.get('priority')

    if schedule_controller.edit_schedule(schedule_id, title, description, date, time, category, priority):
        return jsonify({'success': True, 'message': 'Schedule updated successfully'})
    return jsonify({'success': False, 'message': 'Failed to update schedule'}), 500

@app.route('/delete-schedule', methods=['DELETE'])
def delete_schedule():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    data = request.get_json()
    schedule_id = data.get('id')

    if schedule_controller.delete_schedule(schedule_id):
        return jsonify({'success': True, 'message': 'Schedule deleted successfully'})
    return jsonify({'success': False, 'message': 'Failed to delete schedule'}), 500

@app.route('/api/schedule-categories', methods=['GET'])
def api_schedule_categories():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    user_id = session['user'].get('id')
    categories = schedule_controller.get_categories(user_id)
    return jsonify({'success': True, 'categories': categories})

if __name__ == '__main__':
    app.run(debug=True)