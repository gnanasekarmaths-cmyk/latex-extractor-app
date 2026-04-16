"""Launcher that guarantees CWD is the backend directory."""
import os
import sys

os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.dont_write_bytecode = True

import uvicorn
from config import settings

uvicorn.run("main:app", host=settings.HOST, port=settings.PORT)
