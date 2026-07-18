from flask import Blueprint, request, jsonify, session
from Controller.assistantController import AssistantController
from Controller.finansialController import FinansialController
from Controller.scheduleController import ScheduleController

assistant = Blueprint('assistant', __name__)

finansial_controller = FinansialController()
schedule_controller = ScheduleController()

# Assistant Route
@assistant.route('/assistant', methods=['POST'])
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
    financial_summary = finansial_controller.get_financial_summary(user_id)
    schedule_summary = schedule_controller.get_schedule_summary(user_id)

    context_data = (
        f"Data Keuangan Saya:\n {financial_summary}"
        f"Data Aktivitas Saya:\n {schedule_summary}"
    )

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