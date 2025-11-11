#!/usr/bin/env python3
"""
Last.bot - Quick Start Script
يجب تشغيل هذا الملف لبدء البوت
"""

import subprocess
import sys
import os
import time

def check_requirements():
    """التحقق من تثبيت المكتبات"""
    print("🔍 جاري التحقق من المتطلبات...")
    try:
        import flask
        import openai
        import whatsappy_py
        print("✅ جميع المكتبات مثبتة")
        return True
    except ImportError as e:
        print(f"❌ مكتبة مفقودة: {e}")
        print("💡 تشغيل: pip install -r requirements.txt")
        return False

def check_env():
    """التحقق من ملف .env"""
    if not os.path.exists('.env'):
        print("❌ ملف .env غير موجود!")
        print("💡 انسخ .env.example إلى .env وعدّله")
        return False
    
    # التحقق من المتغيرات الأساسية
    with open('.env', 'r') as f:
        content = f.read()
        if 'OPENAI_API_KEY=your-openai-key' in content:
            print("⚠️  تحذير: لم تقم بتعديل مفاتيح API في .env!")
            return False
    return True

def main():
    """الدالة الرئيسية"""
    print("🚀 بدء تشغيل Last.bot...")
    print("=" * 50)
    
    # 1. التحقق من المتطلبات
    if not check_requirements():
        sys.exit(1)
    
    # 2. التحقق من .env
    if not check_env():
        print("\n❌ يجب تعديل ملف .env أولاً!")
        print("📋 قم بفتح ملف .env وضع المفاتيح الحقيقية")
        sys.exit(1)
    
    # 3. تشغيل البوت
    print("\n✅ كل شيء جاهز! جاري تشغيل البوت...")
    print("📱 افتح المتصفح واذهب إلى: http://localhost:5000")
    print("🔐 اسم المستخدم: admin")
    print("🔑 كلمة المرور الافتراضية: admin123")
    print("=" * 50)
    time.sleep(2)
    
    # تشغيل Flask app
    subprocess.run([sys.executable, 'app.py'])

if __name__ == '__main__':
    main()