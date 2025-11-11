from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import asyncio
import threading
import logging
import os
from bot.core import LastBotCore
from utils.whatsapp import WhatsAppManager
from handlers.auth_handler import AuthManager

# إعداد التسجيل
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# إنشاء التطبيق Flask
app = Flask(__name__, static_folder='web/static', template_folder='web')
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-secret-key')
CORS(app)

# المتغيرات العامة
bot_core = None
wa_manager = None
auth_manager = None

def initialize_bot():
    """تهيئة البوت في thread منفصل"""
    global bot_core, wa_manager, auth_manager
    
    try:
        logging.info("🔄 جاري تهيئة البوت...")
        
        # إنشاء كائنات البوت
        bot_core = LastBotCore()
        wa_manager = WhatsAppManager()
        auth_manager = AuthManager()
        
        # إنشاء مستخدم افتراضي
        auth_manager.create_default_admin()
        
        logging.info("✅ تمت تهيئة البوت بنجاح")
        
    except Exception as e:
        logging.error(f"❌ خطأ في التهيئة: {e}")
        exit(1)

@app.route('/')
def index():
    """صفحة تسجيل الدخول"""
    return send_from_directory('web', 'login.html')

@app.route('/api/auth/login', methods=['POST'])
def login():
    """API تسجيل الدخول"""
    try:
        data = request.get_json()
        
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({'error': 'بيانات غير كاملة'}), 400
        
        # التحقق من المستخدم
        user = auth_manager.verify_user(data['username'], data['password'])
        
        if user:
            token = auth_manager.create_token(user)
            return jsonify({
                'success': True,
                'token': token,
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'role': user['role']
                }
            })
        
        return jsonify({'error': 'اسم المستخدم أو كلمة المرور غير صحيحة'}), 401
        
    except Exception as e:
        logging.error(f"خطأ في تسجيل الدخول: {e}")
        return jsonify({'error': 'خطأ في الخادم'}), 500

@app.route('/api/whatsapp/qr')
def get_qr():
    """جلب رمز QR الخاص بواتساب"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(wa_manager.initialize())
        return jsonify(result)
    except Exception as e:
        logging.error(f"خطأ في جلب QR: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/status')
def status():
    """حالة البوت"""
    return jsonify({
        'status': 'running' if bot_core else 'stopped',
        'whatsapp': wa_manager.is_connected if wa_manager else False
    })

@app.route('/dashboard')
def dashboard():
    """لوحة التحكم"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Dashboard - Last.bot</title>
        <style>
            body { font-family: Arial; padding: 40px; background: #f0f0f0; }
            .container { background: white; padding: 30px; border-radius: 10px; }
            h1 { color: #667eea; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 لوحة تحكم Last.bot</h1>
            <p>مرحباً! البوت يعمل بنجاح.</p>
            <ul>
                <li>WhatsApp: {}</li>
                <li>الحالة: {}</li>
            </ul>
        </div>
    </body>
    </html>
    """.format(
        "متصل ✅" if wa_manager and wa_manager.is_connected else "غير متصل ❌",
        "قيد التشغيل" if bot_core else "متوقف"
    )

def run_bot():
    """تشغيل البوت في الخلفية"""
    initialize_bot()

if __name__ == '__main__':
    # تشغيل البوت في thread منفصل
    bot_thread = threading.Thread(target=run_bot, daemon=True)
    bot_thread.start()
    
    # تشغيل خادم Flask
    logging.info("🌐 جاري تشغيل خادم Flask...")
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('FLASK_PORT', 5000)),
        debug=os.getenv('DEBUG_MODE', 'False').lower() == 'true'
    )