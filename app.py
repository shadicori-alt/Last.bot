from flask import Flask, request, jsonify, send_from_directory, render_template, session, redirect, url_for
from flask_cors import CORS
import asyncio
import threading
import logging
import os
import json
from datetime import datetime
from functools import wraps

# إعداد التسجيل
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('bot.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

# إنشاء التطبيق Flask
app = Flask(__name__, static_folder='web/static', template_folder='web/templates')
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-12345-change-this')
CORS(app)

# المتغيرات العامة
bot_core = None
wa_manager = None
auth_manager = None

# محاكاة قاعدة بيانات مؤقتة
temp_data = {
    'whatsapp_connected': False,
    'message_count': 0,
    'logs': []
}

def log_action(action):
    """تسجيل أي إجراء"""
    timestamp = datetime.now().strftime('%H:%M:%S')
    temp_data['logs'].append(f"[{timestamp}] {action}")
    if len(temp_data['logs']) > 100:
        temp_data['logs'].pop(0)
    logging.info(action)

def login_required(f):
    """Decorator للتحقق من تسجيل الدخول"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login_page'))
        return f(*args, **kwargs)
    return decorated_function

def initialize_bot():
    """تهيئة البوت في الخلفية"""
    global bot_core, wa_manager, auth_manager
    
    try:
        log_action("🔄 جاري تهيئة البوت...")
        
        # إنشاء كائنات البوت
        bot_core = LastBotCore()
        wa_manager = WhatsAppManager()
        
        # إنشاء AuthManager
        secret = os.getenv('JWT_SECRET_KEY', app.config['SECRET_KEY'])
        auth_manager = AuthManager(secret)
        auth_manager.create_default_admin()
        
        log_action("✅ تمت تهيئة البوت بنجاح")
        
    except Exception as e:
        log_action(f"❌ خطأ في التهيئة: {e}")
        logging.error(f"خطأ حرج: {e}")

# --- ROUTES ---

@app.route('/')
def index():
    """الصفحة الرئيسية - إعادة توجيه"""
    if 'user_id' in session:
        return redirect(url_for('dashboard_page'))
    return redirect(url_for('login_page'))

@app.route('/login')
def login_page():
    """صفحة تسجيل الدخول"""
    return send_from_directory('web/templates', 'login.html')

@app.route('/dashboard')
@login_required
def dashboard_page():
    """لوحة التحكم"""
    return render_template('dashboard.html', 
                          whatsapp_status=temp_data['whatsapp_connected'],
                          message_count=temp_data['message_count'],
                          token=session.get('token', ''),
                          logs='\n'.join(temp_data['logs'][-15:]))

@app.route('/api')
@login_required
def api_docs():
    """صفحة API Documentation"""
    return render_template('api.html', token=session.get('token', ''))

@app.route('/whatsapp')
@login_required
def whatsapp_page():
    """صفحة إعداد WhatsApp"""
    qr_path = url_for('static', filename='css/qr_code.png') if os.path.exists('web/static/css/qr_code.png') else ''
    return render_template('whatsapp.html', qr_path=qr_path)

@app.route('/logout')
def logout():
    """تسجيل الخروج"""
    username = session.get('username', 'user')
    log_action(f"خروج المستخدم: {username}")
    session.clear()
    return redirect(url_for('login_page'))

# --- API ROUTES ---

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    """API تسجيل الدخول"""
    try:
        data = request.get_json()
        
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({'error': 'بيانات غير كاملة'}), 400
        
        # التحقق من المستخدم
        user = auth_manager.verify_user(data['username'], data['password'])
        
        if user:
            token = auth_manager.create_token(user)
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['token'] = token
            
            log_action(f"✅ دخول المستخدم: {user['username']}")
            
            return jsonify({
                'success': True,
                'token': token,
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'role': user['role']
                }
            })
        
        log_action(f"❌ محاولة دخول فاشلة: {data.get('username')}")
        return jsonify({'error': 'اسم المستخدم أو كلمة المرور غير صحيحة'}), 401
        
    except Exception as e:
        log_action(f"❌ خطأ في API تسجيل الدخول: {e}")
        return jsonify({'error': 'خطأ في الخادم'}), 500

@app.route('/api/status')
@login_required
def api_status():
    """حالة البوت"""
    return jsonify({
        'status': 'running',
        'whatsapp': temp_data['whatsapp_connected'],
        'messages': temp_data['message_count'],
        'uptime': '0h 0m'
    })

@app.route('/api/whatsapp/qr')
@login_required
def api_whatsapp_qr():
    """جلب QR Code"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(wa_manager.initialize())
        
        if result['status'] == 'qr_ready':
            temp_data['whatsapp_connected'] = True
            log_action("✅ تم إنشاء QR Code")
        
        return jsonify(result)
    except Exception as e:
        log_action(f"❌ خطأ في جلب QR: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/test-message', methods=['POST'])
@login_required
def api_test_message():
    """إرسال رسالة اختبار"""
    try:
        temp_data['message_count'] += 1
        log_action("📤 إرسال رسالة اختبار")
        return jsonify({'success': True, 'message': 'تم إرسال رسالة اختبار!'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/logs')
@login_required
def api_logs():
    """جلب السجلات"""
    return jsonify({'logs': temp_data['logs']})

@app.route('/api/restart', methods=['POST'])
@login_required
def api_restart():
    """إعادة تشغيل البوت"""
    try:
        log_action("🔄 إعادة تشغيل البوت")
        threading.Thread(target=initialize_bot, daemon=True).start()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- STATIC FILES ---

@app.route('/static/<path:filename>')
def static_files(filename):
    """خدمة الملفات الثابتة"""
    try:
        return send_from_directory('web/static', filename)
    except:
        return jsonify({'error': 'ملف غير موجود'}), 404

@app.errorhandler(404)
def not_found(error):
    """صفحة 404"""
    return jsonify({'error': 'الصفحة غير موجودة', 'status': 404}), 404

@app.errorhandler(500)
def server_error(error):
    """صفحة 500"""
    log_action(f"❌ خطأ داخلي 500: {error}")
    return jsonify({'error': 'خطأ في الخادم', 'status': 500}), 500

# --- CLASSES ---

class LastBotCore:
    """محاكاة للبوت الأساسي"""
    def __init__(self):
        self.is_running = True
        log_action("✅ تم تهيئة LastBotCore")

class WhatsAppManager:
    """محاكاة لإدارة WhatsApp"""
    def __init__(self):
        self.is_connected = False
    
    async def initialize(self):
        return {
            'status': 'qr_ready',
            'qr_path': '/static/qr_code.png',
            'message': 'امسح رمز QR للاتصال'
        }

class AuthManager:
    """إدارة المصادقة"""
    def __init__(self, secret_key):
        self.secret_key = secret_key
        self.users_file = "data/users.json"
        os.makedirs(os.path.dirname(self.users_file), exist_ok=True)
    
    def create_default_admin(self):
        if os.path.exists(self.users_file):
            return
        
        default_user = {
            "id": "admin_001",
            "username": "admin",
            "password_hash": "admin123",  # في الإنتاج استخدم bcrypt
            "role": "admin"
        }
        
        with open(self.users_file, 'w') as f:
            json.dump({"users": [default_user]}, f, indent=2)
        log_action("✅ تم إنشاء مستخدم admin افتراضي")
    
    def verify_user(self, username, password):
        try:
            if not os.path.exists(self.users_file):
                self.create_default_admin()
            
            with open(self.users_file, 'r') as f:
                data = json.load(f)
            
            for user in data.get("users", []):
                if user["username"] == username and user["password_hash"] == password:
                    return user
            return None
        except:
            return None
    
    def create_token(self, user_data):
        return f"mock-token-{user_data['id']}-2024"

# --- START ---

if __name__ == '__main__':
    log_action("🚀 بدء تشغيل Last.bot...")
    
    # تشغيل البوت
    initialize_bot()
    
    # تشغيل Flask
    log_action("🌐 خادم Flask يعمل على http://localhost:5000")
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('FLASK_PORT', 5000)),
        debug=False,
        threaded=True
    )