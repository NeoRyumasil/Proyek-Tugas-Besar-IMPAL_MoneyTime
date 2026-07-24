from flask import Blueprint, request, jsonify, session
from Controller.finansialController import FinansialController
from datetime import date, datetime

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

    # Langsung ambil data mentah array list tanpa argumen paginasi
    raw_transactions = finansial_controller.get_transactions(user_id, keyword)

    items = raw_transactions if isinstance(raw_transactions, list) else []

    formatted_items = []
    for t in items:
        t_type = str(t.get('type') or t.get('status') or '').lower()
        final_type = 'Income' if t_type in ['pemasukan', 'income', 'pemasukkan'] else 'Expense'

        raw_date = t.get('tanggal') or t.get('date')
        if isinstance(raw_date, (date, datetime)):
            formatted_date = raw_date.strftime('%Y-%m-%d')
        else:
            formatted_date = str(raw_date) if raw_date else None

        formatted_items.append({
            'id': t.get('id') or t.get('pemasukkanid') or t.get('pengeluaranid') or t.get('transaction_id'),
            'tanggal': formatted_date,
            'type': final_type,
            'nominal': float(t.get('nominal') or t.get('amount') or 0),
            'deskripsi': t.get('deskripsi') or t.get('description') or '-',
            'kategori': t.get('kategori') or t.get('kategorialokasi') or '-',
            'alokasi_data': t.get('alokasi_data') or None 
        })

    # Kembalikan murni array saja, tanpa dicampur info meta halaman
    return jsonify({
        'success': True, 
        'transactions': formatted_items
    })

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
    trans_type = data.get('type')
    description = data.get('description')
    amount = data.get('amount')
    trans_date = data.get('date')
    category = data.get('category') or 'Other'
    
    allocation = data.get('allocation')
    
    # Tangkap pilihan potong saldo (Needs/Wants/Savings)
    expense_source = data.get('expense_source')

    if not trans_type or not description or not amount or not trans_date :
        return jsonify({'success': False, 'message': 'Missing fields'}), 400
    
    user_id = session['user'].get('id')
    status = 'Pemasukkan' if str(trans_type).lower() == 'income' else 'Pengeluaran'

    finansial_id = finansial_controller.get_or_create_finansial(user_id, category, status=status)

    if not finansial_id :
        return jsonify({'success': False, 'message': 'Failed to create record'}), 500
    
    try :
        nominal = int(amount)
    
    except :
        return jsonify({'success': False, 'message': 'Invalid amount'}), 400

    if str(trans_type).lower() == 'income' :
        success = finansial_controller.add_pemasukan(finansial_id, description, nominal, trans_date, persentase_alokasi=allocation)
    else :
        success = finansial_controller.add_pengeluaran(finansial_id, description, nominal, trans_date, sumber_potongan=expense_source)
    
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