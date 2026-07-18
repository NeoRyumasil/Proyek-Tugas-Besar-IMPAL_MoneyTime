from flask import jsonify

def error_handlers(app):
    
    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({
            "success": False,
            "message": f"Too Many Request"
        }), 429

    @app.errorhandler(404)
    def not_found_error(e):
        return jsonify({
            "success": False,
            "message": "Not Found"
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({
            "success": False,
            "message": "Method Not Allowed."
        }), 405

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({
            "success": False,
            "message": "Internal Server Error"
        }), 500

    @app.errorhandler(Exception)
    def handle_exception(e):
        print(f"URGENT ERROR (Global): {e}") 
        
        return jsonify({
            "success": False,
            "message": "Internal Server Error."
        }), 500