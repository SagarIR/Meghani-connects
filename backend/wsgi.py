"""
Vercel WSGI entrypoint for Django backend service.
"""
import os
from core.wsgi import application

app = application
handler = application
