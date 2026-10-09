@echo off

cd /d "%~dp0"

".\src\backend\.venv\Scripts\python.exe" src\backend\manage.py migrate

".\src\backend\.venv\Scripts\python.exe" src\backend\manage.py runserver