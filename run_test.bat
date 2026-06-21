@echo off
call venv\Scripts\activate
python test_req.py > req_results.txt 2>&1
