from flask_talisman import Talisman

talisman = Talisman()

def init_talisman(app):
    csp = {
        'default-src': [
            '\'self\'',
            '\'unsafe-inline\'',
            'https://cdn.jsdelivr.net',
            'https://cdn.tailwindcss.com',
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://cdnjs.cloudflare.com',
            'https://fonts.cdnfonts.com'
        ],
        'font-src': [
            '\'self\'',
            'https://fonts.gstatic.com',
            'https://cdnjs.cloudflare.com',
            'https://fonts.cdnfonts.com'
        ]
    }

    talisman.init_app(
        app,
        content_security_policy=csp,
        force_https=True,
        strict_transport_security=True,
        session_cookie_secure=True, 
        session_cookie_http_only=True
    )