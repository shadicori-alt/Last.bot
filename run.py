#!/usr/bin/env python3
"""
Last.bot - Quick Start Script
تشغيل هذا الملف = تشغيل البوت مباشرة
"""

import os
import sys
import time

def check_files():
    """التحقق من وجود كل الملفات المطلوبة"""
    required_files = [
        'app.py', 'config.json', '.env', 'requirements.txt',
        'bot/__init__.py', 'bot/core.py',
        'utils/__init__.py', 'utils/whatsapp.py',
        'handlers/__init__.py', 'handlers/auth_handler.py',
        'web/templates/login.html', 'web/templates/dashboard.html',
        'web/templates/api.html', 'web/templates/whatsapp.html',
        'web/static/css/style.css'
    ]
    
    missing = []
    for file in required_files:
        if not os.path.exists(file):
            missing.append(file)
    
    if missing:
        print("❌ الملفات المفقودة:")
        for f in missing:
            print(f"   - {f}")
        return False
    
    print("✅ كل الملفات موجودة!")
    return True

def check_env():
    """التحقق من ملف .env"""
    if not os.path.exists('.env'):
        print("❌ ملف .env غير موجود!")
        print("💡 أنشئه من .env.example")
        return False
    return True

def main():
    print("=" * 50)
    print("🚀 فاحص Last.bot...")
    print("=" * 50)
    
    # 1. التحقق من الملفات
    if not check_files():
        print("\n⚠️  بعض الملفات ناقصة. أوقف البرنامج وأكمل الملفات ثم أعد التشغيل.")
        input("اضغط Enter للخروج...")
        sys.exit(1)
    
    # 2. التحقق من .env
    if not check_env():
        input("اضغط Enter للخروص...")
        sys.exit(1)
    
    print("\n✅ كل شيء جاهز!")
    print("📱 افتح المتصفح واذهب إلى: http://localhost:5000")
    print("🔐 اسم المستخدم: admin")
    print("🔑 كلمة المرور: admin123")
    print("=" * 50)
    print("🚀 جاري تشغيل البوت...\n")
    
    # انتظار 3 ثواني
    time.sleep(3)
    
    # تشغيل app.py
    os.system(f'"{sys.executable}" app.py')

if __name__ == '__main__':
    main()