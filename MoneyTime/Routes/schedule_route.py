from flask import Blueprint, request, jsonify, session
from Controller.scheduleController import ScheduleController

schedule = Blueprint('schedule', __name__)

schedule_controller = ScheduleController()

# Get Schedule Route
@schedule.route('/api/schedules', methods=['GET'])
def get_schedules() :

     # Auth Check
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    user_id = session['user'].get('id')

    # Paginasi dihapus total, langsung ambil datanya
    schedules = schedule_controller.get_schedules(user_id)
    
    return jsonify({'success': True, 'schedules': schedules})

# Get Schedule Categories Route
@schedule.route('/api/schedule-categories', methods=['GET'])
def get_schedule_categories() :
     
     # Auth Check
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    user_id = session['user'].get('id')
    categories = schedule_controller.get_categories(user_id)

    return jsonify({'success': True, 'categories': categories})

# Add Schedule Route
@schedule.route('/add-schedule', methods=['POST'])
def add_schedule() :

     # Auth Check
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    data = request.get_json()

    title = data.get('title')          
    description = data.get('description') 
    date = data.get('date')
    time = data.get('time')
    category = data.get('category')
    priority = data.get('priority')

    user_id = session['user'].get('id')

    success = schedule_controller.add_schedule(user_id, title, description, date, time, category, priority)

    if success :
        return jsonify({'success': True, 'message': 'Schedule added successfully'})
    
    return jsonify({'success': False, 'message': 'Failed to add schedule'}), 500

# Edit Schedule Route
@schedule.route('/edit-schedule', methods=['PUT'])
def edit_schedule() :

    # Auth Check
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    data = request.get_json()
    schedule_id = data.get('id')

    title = data.get('title')          
    description = data.get('description') 
    date = data.get('date')
    time = data.get('time')
    category = data.get('category')
    priority = data.get('priority')

    success = schedule_controller.edit_schedule(schedule_id, title, description, date, time, category, priority)

    if success :
        return jsonify({'success': True, 'message': 'Schedule updated successfully'})

    return jsonify({'success': False, 'message': 'Failed to update schedule'}), 500

# Delete Schedule Route
@schedule.route('/delete-schedule', methods=['DELETE'])
def delete_schedule() :

    # Auth Check
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    data = request.get_json()
    schedule_id = data.get('id')

    success = schedule_controller.delete_schedule(schedule_id)

    if success :
        return jsonify({'success': True, 'message': 'Schedule deleted successfully'})
    
    return jsonify({'success': False, 'message': 'Failed to delete schedule'}), 500

# Update Schedule Status Route
@schedule.route('/update-schedule-status', methods=['POST'])
def update_schedule_status() :

    # Auth Check
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    data = request.get_json()
    schedule_id = data.get('id')
    status = data.get('status')

    success = schedule_controller.update_status(schedule_id, status)

    if success :
        return jsonify({'success': True})
    
    return jsonify({'success': False, 'message': 'Update failed'}), 500