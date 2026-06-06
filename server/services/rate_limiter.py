"""
SIMREKAP Rate Limiter
Thread-safe rate limiting for API endpoint helpers.
"""
import time
import threading
from core.config import RATE_LIMIT_WINDOW_SECONDS


class RateLimiter:
    """Thread-safe rate limiter using sliding window."""
    
    def __init__(self):
        self._lock = threading.Lock()
        self._hits = {}
    
    def is_rate_limited(self, bucket, client_ip, limit, window_seconds=RATE_LIMIT_WINDOW_SECONDS):
        """Check if request should be rate limited."""
        now = time.time()
        key = f"{bucket}:{client_ip}"
        
        with self._lock:
            hits = self._hits.get(key, [])
            threshold = now - window_seconds
            hits = [h for h in hits if h >= threshold]
            
            if len(hits) >= limit:
                self._hits[key] = hits
                return True
            
            hits.append(now)
            self._hits[key] = hits
            return False


# Global instance
rate_limiter = RateLimiter()


def check_rate_limit(bucket, client_ip, limit, window=RATE_LIMIT_WINDOW_SECONDS):
    """Check rate limit (convenience function)."""
    return rate_limiter.is_rate_limited(bucket, client_ip, limit, window)
