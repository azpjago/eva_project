@echo off
cd /d "C:\Users\ACER\Documents\Eva\eva_project"
call venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause