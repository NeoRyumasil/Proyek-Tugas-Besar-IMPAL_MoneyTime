from flask import Blueprint, render_template, redirect, url_for, session
from Controller.notificationController import NotificationController

page = Blueprint('page', __name__)

notification_controller = NotificationController()

# Landing Page
@page.route('/')
def index() :
    return render_template('index.html')

# Auth Page
@page.route('/auth')
def auth() :
    return render_template('RegisLogin.html')

# Dashboard Page
@page.route('/dashboard')
def dashboard() :
    if 'user' not in session :
        return redirect(url_for('page.auth'))
    
    return render_template('dashboard.html', user=session['user'])

# Money Page
@page.route('/money')
def money() :
    if 'user' not in session :
        return redirect(url_for('page.auth'))
    
    return render_template('money.html', user=session['user'])

# Time Page
@page.route('/time')
def time() :
    if 'user' not in session :
        return redirect(url_for('page.auth'))
    
    return render_template('time.html', user=session['user'])

# Notification Page
@page.route('/notification')
def notification() :
    if 'user' not in session:
        return redirect(url_for('page.auth'))
    
    user_id = session['user']['id']
    data = notification_controller.get_notifications(user_id)

    return render_template('notification.html', user=session['user'], notifications=data)

# Forgot Password Page
@page.route('/forgot-password')
def forgot_password() :
    return render_template('forgot_password.html')

# Account Validation Page
@page.route('/account-validation')
def account_validation() :
    if 'pending_registration' not in session :
        return redirect(url_for('page.auth'))
    
    return render_template('account_validation.html')