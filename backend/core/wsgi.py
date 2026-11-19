import os
import sys
from pathlib import Path

# Add backend directory and its parent to sys.path so 'core' and 'apps' are always resolvable
CURRENT_DIR = Path(__file__).resolve().parent.parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))
if str(CURRENT_DIR.parent) not in sys.path:
    sys.path.insert(1, str(CURRENT_DIR.parent))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
app = application
handler = application
