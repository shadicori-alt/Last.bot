from flask import Flask, request, jsonify, render_template_string
import os
import telebot
from dotenv import load_dotenv

# تحميل المتغيرات البيئية
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'fallback-secret-key')

# تكوين بوت التليجرام
TOKEN = os.getenv('BOT_TOKEN')
if TOKEN:
    bot = telebot.TeleBot(TOKEN)

@app.route('/')
def index():
    """الصفحة الرئيسية"""
    return jsonify({
        "message": "LastBot system is running successfully...",
        "status": "online",
        "endpoints": {
            "/api/health": "فحص حالة السيرفر",
            "/api/chat": "تجربة الذكاء الاصطناعي",
            "/dashboard": "لوحة التحكم"
        }
    })

@app.route('/api/health')
def health_check():
    """فحص حالة النظام"""
    return jsonify({
        "status": "healthy",
        "bot_connected": bool(TOKEN),
        "timestamp": "2024-12-19T03:20:00Z"
    })

@app.route('/webhook', methods=['POST'])
def webhook():
    """ويب هوك لاستقبال تحديثات التليجرام"""
    if request.headers.get('content-type') == 'application/json':
        json_string = request.get_data().decode('utf-8')
        update = telebot.types.Update.de_json(json_string)
        
        if TOKEN:
            bot.process_new_updates([update])
        
        return 'OK'
    return 'Error', 400

@app.route('/dashboard')
def dashboard():
    """لوحة التحكم الأساسية"""
    html_template = """
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>Last.bot Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
            .status { padding: 10px; border-radius: 5px; margin: 10px 0; }
            .online { background: #d4edda; color: #155724; }
            .offline { background: #f8d7da; color: #721c24; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 Last.bot Dashboard</h1>
            <div class="status {{ 'online' if bot_connected else 'offline' }}">
                حالة البوت: {{ 'متصل ✅' if bot_connected else 'غير متصل ❌' }}
            </div>
            <p>النظام يعمل بنجاح على Vercel</p>
            <a href="/api/health">فحص الحالة التقني</a>
        </div>
    </body>
    </html>
    """
    return render_template_string(html_template, bot_connected=bool(TOKEN))

# معالجات بوت التليجرام
if TOKEN:
    @bot.message_handler(commands=['start', 'help'])
    def send_welcome(message):
        bot.reply_to(message, "مرحباً! أنا Last.bot 🤖\nأرسل /status لمعرفة حالة النظام")

    @bot.message_handler(commands=['status'])
    def send_status(message):
        bot.reply_to(message, "✅ النظام يعمل بشكل طبيعي\n🏠 Vercel Deployment")

if __name__ == '__main__':
    app.run(debug=True)