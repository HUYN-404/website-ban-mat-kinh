@echo off

cd /d "%~dp0"

call .\PythonServer\.venv\Scripts\activate.bat

python PythonServer\manage.py migrate

python PythonServer\manage.py runserver