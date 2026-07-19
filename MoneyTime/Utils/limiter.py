import os

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

redis_url = os.environ.get('REDIS_URL')

if redis_url :
    limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri=redis_url
)
    
else :
    limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://" 
)