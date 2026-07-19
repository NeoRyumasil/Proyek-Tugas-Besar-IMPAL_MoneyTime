from flask import Flask, session
from dotenv import load_dotenv
from sqlalchemy.pool import NullPool

import os
import secrets

from Database.orm import db

from Utils.cache import cache
from Utils.limiter import limiter
from Utils.error_handler import error_handlers
from Utils.talisman import init_talisman
from Utils.marshmallow import marshmallow

from Controller.notificationController import NotificationController

from Routes.assistant_route import assistant
from Routes.auth_route import auth
from Routes.notification_route import notification
from Routes.page_route import page
from Routes.schedule_route import schedule
from Routes.transaction_route import transaction

load_dotenv()

base_dir = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__,
    template_folder=os.path.join(base_dir, 'View/Templates'),
    static_folder=os.path.join(base_dir, 'View/static')
    )

app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("SUPABASE_URL")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'poolclass': NullPool,
    'pool_pre_ping': True  
}

db.init_app(app)
marshmallow.init_app(app)
cache.init_app(app)
limiter.init_app(app)

error_handlers(app)
init_talisman(app)

notification_controller = NotificationController()

# Context Processor
@app.context_processor
def inject_notifications():
    if 'user' in session:
        try:
            user_id = session['user'].get('id')
            notifications = notification_controller.get_notifications(user_id)
            
            unread_count = 0
            if notifications:
                for notification in notifications:
                    is_read_value = notification.get('is_read', True)
                    is_unread = not is_read_value if isinstance(is_read_value, bool) else not bool(is_read_value)
                    
                    if is_unread:
                        unread_count += 1
            
            return dict(notifications=notifications, unread_count=unread_count)
            
        except Exception as e:
            print(f"Error injecting notifications: {e}")
            return dict(notifications=[], unread_count=0)
        
    return dict(notifications=[], unread_count=0)

# Route Registers
app.register_blueprint(assistant)
app.register_blueprint(auth)
app.register_blueprint(notification)
app.register_blueprint(page)
app.register_blueprint(schedule)
app.register_blueprint(transaction)

if __name__ == '__main__':
    app.run(debug=True)