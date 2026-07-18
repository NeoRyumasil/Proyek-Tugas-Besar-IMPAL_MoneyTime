from flask import Blueprint, request, jsonify, session
from Controller.finansialController import FinansialController

transaction = Blueprint('transaction', __name__)

finansial_controller = FinansialController()

# Get Transaction Route
@transaction.route('/api/transactions', methods=['GET'])
def api_transaction() :

    # Auth Check
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    user_id = session['user'].get('id')
    keyword = request.args.get('q', '')

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    transactions = finansial_controller.get_transactions(user_id, keyword, is_paginate=True, page=page, per_page=per_page)

    return jsonify({'success': True, 'transactions': transactions})

# Get Categories Route
@transaction.route('/api/categories', methods=['GET'])
def api_categories() :

    # Auth Check
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    user_id = session['user'].get('id')
    categories = finansial_controller.get_categories(user_id)

    return jsonify({'success': True, 'categories': categories})

# Add Transaction Route
@transaction.route('/add-transaction', methods=['POST'])
def add_transaction() :

    # Auth Check
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    data = request.get_json() or {}
    type = data.get('type')
    description = data.get('description')
    amount = data.get('amount')
    date = data.get('date')
    category = data.get('category') or 'Other'

    if not type or not description or not amount or not date :
        return jsonify({'success': False, 'message': 'Missing fields'}), 400
    
    user_id = session['user'].get('id')
    status = 'Pemasukan' if str(type).lower() == 'income' else 'Pengeluaran'

    finansial_id = finansial_controller.get_or_create_finansial(user_id, category, status=status)

    if not finansial_id :
        return jsonify({'success': False, 'message': 'Failed to create record'}), 500
    
    try :
        nominal = int(amount)
    
    except :
        return jsonify({'success': False, 'message': 'Invalid amount'}), 400

    if str(type).lower == 'income' :
        success = finansial_controller.add_pemasukan(finansial_id, description, nominal, date)
    else :
        success = finansial_controller.add_pengeluaran(finansial_id, description, nominal, date)
    
    if success :
        return jsonify({'success': True, 'message': 'Transaction added'})
    
    return jsonify({'success': False, 'message': 'Database error'}), 500

# Edit Transaction Route
@transaction.route('/edit-transaction', methods=['PUT'])
def edit_transaction() :

    # Auth Check
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    data = request.get_json() or {}

    try :
        transaction_id = int(data.get('id'))
        nominal = int(data.get('amount'))
    
    except :
        return jsonify({'success': False, 'message': 'Invalid ID or Amount'}), 400
    
    user_id = session['user'].get('id')

    success = finansial_controller.edit_transaction(
        user_id, transaction_id, data.get('type'),
        data.get('description'), nominal, data.get('date'), data.get('category')
    )

    if success :
        return jsonify({'success': True, 'message': 'Updated successfully'})
    
    return jsonify({'success': False, 'message': 'Update failed'}), 500

# Delete Transaction Route
@transaction.route('/delete-transaction', methods=['DELETE'])
def delete_transaction() :

     # Auth Check
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