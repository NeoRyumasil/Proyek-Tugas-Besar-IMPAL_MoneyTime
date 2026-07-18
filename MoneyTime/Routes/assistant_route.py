from flask import Blueprint, request, jsonify, session
from Controller.assistantController import AssistantController
from Controller.finansialController import FinansialController
from Controller.scheduleController import ScheduleController
from Utils.limiter import limiter

assistant = Blueprint('assistant', __name__)

finansial_controller = FinansialController()
schedule_controller = ScheduleController()

# Assistant Route
@assistant.route('/assistant', methods=['POST'])
@limiter.limit("10 per minute")
def assistant_handler() :

     # Auth Check
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    data = request.get_json()
    user_message = data.get('message', '')

    if not user_message:
        return jsonify({'error': 'Empty message'}), 400
    
    user_id = session['user'].get('id')
    chat_history = session.get('chat_history', [])

    assistant_controller = AssistantController(finansial_controller, schedule_controller, user_id)

    ai_reply = assistant_controller.process_chat(
        user_id=user_id,
        user_message=user_message
    )

    chat_history.append({'role': 'user', 'parts': [user_message]})
    chat_history.append({'role': 'model', 'parts': [ai_reply]})
    
    session['chat_history'] = chat_history[-20:]

    return jsonify({'reply': ai_reply})

# Get Chat History Route
@assistant.route('/api/chat-history', methods=['GET'])
def get_chat_history() :

     # Auth Check
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    user_id = session['user'].get('id')

    assistant = AssistantController(finansial_controller, schedule_controller, user_id)
    history = assistant.get_chat_history(user_id)

    return jsonify({'success': True, 'history': history})

# Clear Chat History Route
@assistant.route('/api/chat-history/clear', methods=['POST'])
def clear_chat_history() :

     # Auth Check
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    user_id = session['user'].get('id')

    assistant = AssistantController(finansial_controller, schedule_controller, user_id)
    success = assistant.clear_chat_history(user_id)

    return jsonify({'success': success})

# History for Frontend
@assistant.route('/api/chat-history-paginated', methods=['GET'])
def get_chat_history_paginated() :

    # Auth Check
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    user_id = session['user'].get('id')
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    assistant_controller = AssistantController(finansial_controller, schedule_controller, user_id)
    
    history_data = assistant_controller.get_paginated_chat_history(user_id, page=page, per_page=per_page)

    return jsonify({'success': True, 'history': history_data})