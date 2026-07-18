from flask import Blueprint, request, jsonify, session
from Controller.notificationController import NotificationController

notification = Blueprint('notification', __name__)

notification_controller = NotificationController()

# Mark Notification Route
@notification.route('/mark-notif-read', methods=['POST'])
def mark_read() :

     # Auth Check
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    data = request.get_json()
    activity_id = data.get('id')

    success = notification_controller.mark_as_read(activity_id)

    if success :
        return jsonify({'success': True})
    
    return jsonify({'success': False}), 500

# Mark All Notification Route
@notification.route('/mark-all-read', methods=['POST'])
def mark_all_read() :

     # Auth Check
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    user_id = session['user'].get('id')

    success = notification_controller.mark_all_read(user_id)

    if success : 
        return jsonify({'success': True, 'message': 'All notifications marked as read'})
    
    return jsonify({'success': False, 'message': 'Failed to update database'}), 500

# Toggle Notification Route
@notification.route('/toggle-notification', methods=['POST'])
def toggle_notification() :

    # Auth Check
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    data = request.get_json()
    notif_id = data.get('id')

    success, new_status = notification_controller.toggle_status(notif_id)

    if success:
        return jsonify({'success': True, 'is_read': bool(new_status)})
    
    return jsonify({'success': False, 'message': 'Failed to toggle status'}), 500