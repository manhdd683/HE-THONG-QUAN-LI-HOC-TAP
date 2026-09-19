@echo off
chcp 65001 >nul
echo =======================================
echo   DANG DONG BO DU LIEU LEN GITHUB...
echo =======================================

git add .
git commit -m "Auto-sync: Cập nhật mã nguồn lúc %date% %time%"
git push origin main

echo =======================================
echo   DONG BO THANH CONG!
echo =======================================
pause
