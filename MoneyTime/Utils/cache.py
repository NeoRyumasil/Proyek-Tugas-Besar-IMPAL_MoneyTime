import os
from flask_caching import Cache

redis_url = os.environ.get('REDIS_URL')

if redis_url :
    cache_config = {
        'CACHE_TYPE': 'RedisCache',
        'CACHE_REDIS_URL': redis_url,
        'CACHE_DEFAULT_TIMEOUT': 300 
    }

else :
    cache_config = {
        'CACHE_TYPE': 'SimpleCache',
        'CACHE_DEFAULT_TIMEOUT': 300
    }

cache = Cache(config=cache_config)