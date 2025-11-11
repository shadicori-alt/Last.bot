// خادم Node.js يعمل باستمرار
const express = require('express');
const { Client: WhatsAppClient } = require('whatsapp-web.js');
const { Configuration, OpenAIApi } = require('openai');
const { google } = require('googleapis');
const fs = require('fs');

const app = express();
app.use(express.json());

// إعدادات المساعد
const assistantConfig = {
    name: "AI Supervisor",
    role: "مدير العمليات والتفاعل",
    ownerId: "ADMIN_USER_ID",
    activeChannels: ['whatsapp', 'facebook', 'system'],
    aiModel: 'gpt-4-turbo',
    autoReply: true,
    learning: true
};

// تهيئة OpenAI
const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY || 'YOUR_API_KEY'
}));

// تهيئة WhatsApp
const whatsapp = new WhatsAppClient();
let whatsappReady = false;

whatsapp.on('qr', (qr) => {
    console.log('QR Code generated, scan it at /whatsapp-qr.html');
    fs.writeFileSync('./qr-data.txt', qr);
});

whatsapp.on('ready', () => {
    console.log('✅ WhatsApp Connected!');
    whatsappReady = true;
});

whatsapp.on('message', async (message) => {
    if (message.from === 'status@broadcast') return;
    
    console.log(`📱 Message from ${message.from}: ${message.body}`);
    
    // معالجة بالذكاء الصناعي
    const response = await processMessage('whatsapp', message.from, message.body);
    
    if (assistantConfig.autoReply && response) {
        await message.reply(response);
        logInteraction('whatsapp', message.from, message.body, response);
    }
});

// بدء WhatsApp
whatsapp.initialize();

// ** المساعد الذكي يتفاعل معك أنت **
setInterval(async () => {
    // مراقبة النظام وإبلاغك
    const stats = getSystemStats();
    
    if (stats.unansweredMessages > 5) {
        await notifyOwner(`⚠️ لديك ${stats.unansweredMessages} رسائل غير مجابة`);
    }
    
    if (stats.apiErrors > 3) {
        await notifyOwner(`🔴 هناك أخطاء متكررة في APIs`);
    }
    
    if (stats.newLeads > 10) {
        await notifyOwner(`✅ مبروك! لديك ${stats.newLeads} عميل جديد اليوم`);
    }
}, 60000); // كل دقيقة

// معالجة الرسائل بالذكاء الصناعي
async function processMessage(channel, userId, message) {
    const context = buildContext(channel, userId);
    
    try {
        const completion = await openai.createChatCompletion({
            model: assistantConfig.aiModel,
            messages: [
                { role: 'system', content: context },
                { role: 'user', content: message }
            ],
            temperature: 0.8
        });
        
        return completion.data.choices[0].message.content;
    } catch (error) {
        console.error('AI Error:', error);
        return fallbackResponse(channel, message);
    }
}

// بناء سياق ذكي
function buildContext(channel, userId) {
    let context = `أنت ${assistantConfig.name}، ${assistantConfig.role}. `;
    context += `تعمل بنظام التكامل الذكي. `;
    
    // معلومات عن العميل
    const customer = getCustomerData(userId);
    if (customer) {
        context += `هذا العميل: ${customer.name}، آخر تفاعل: ${customer.lastInteraction}. `;
    }
    
    // حالة النظام
    const settings = JSON.parse(localStorage.getItem('bot_settings') || '{}');
    context += `حالة البوت: Messenger(${settings.messenger ? 'نشط' : 'مقفل'}), `;
    context += `Comments(${settings.comments ? 'نشط' : 'مقفل'}). `;
    
    // المنشورات النشطة
    const posts = JSON.parse(localStorage.getItem('monitored_posts') || '[]');
    if (posts.length > 0) {
        context += `المنشورات النشطة: ${posts.map(p => p.keyword).join(', ')}. `;
    }
    
    context += `\nيجب أن ترد بشكل مهني، قصير، ومفيد باللغة العربية.`;
    
    return context;
}

// إبلاغك (المشرف) مباشرة
async function notifyOwner(message) {
    const ownerId = assistantConfig.ownerId;
    
    // عبر WhatsApp
    if (whatsappReady) {
        await whatsapp.sendMessage(ownerId, `🤖 ${assistantConfig.name}: ${message}`);
    }
    
    // عبر System Log
    logInteraction('system', ownerId, 'NOTIFICATION', message);
    
    // عبر Gmail إذا مربوط
    sendEmailNotification(message);
}

// إحصائيات النظام
function getSystemStats() {
    const logs = JSON.parse(localStorage.getItem('bot_logs') || '[]');
    const lastHour = logs.filter(log => 
        new Date(log.timestamp) > new Date(Date.now() - 3600000)
    );
    
    return {
        unansweredMessages: lastHour.filter(log => log.type === 'unanswered').length,
        apiErrors: lastHour.filter(log => log.level === 'error').length,
        newLeads: lastHour.filter(log => log.type === 'new_lead').length,
        totalMessages: lastHour.length
    };
}

// تسجيل كل تفاعل
function logInteraction(channel, user, input, output) {
    const log = {
        timestamp: new Date().toISOString(),
        channel,
        user,
        input,
        output,
        success: !!output
    };
    
    const logs = JSON.parse(localStorage.getItem('bot_logs') || '[]');
    logs.unshift(log);
    localStorage.setItem('bot_logs', JSON.stringify(logs.slice(0, 500)));
    
    // تعلم آلياً
    learnFromInteraction(log);
}

// التعلم الآلي من التفاعلات
function learnFromInteraction(log) {
    const successfulResponses = JSON.parse(localStorage.getItem('successful_responses') || '[]');
    successfulResponses.push({
        input: log.input,
        output: log.output,
        channel: log.channel,
        timestamp: log.timestamp
    });
    
    // الاحتفاظ بأحدث 200
    localStorage.setItem('successful_responses', JSON.stringify(
        successfulResponses.slice(-200)
    ));
}

// ردود بديلة عند خطأ
function fallbackResponse(channel, message) {
    const responses = {
        whatsapp: 'عذراً، حدث خطأ. برجاء إعادة المحاولة أو التواصل مع الدعم.',
        facebook: 'Sorry, an error occurred. Please try again later.',
        system: '🔴 خطأ في النظام: ' + message
    };
    
    return responses[channel] || 'حدث خطأ غير متوقع.';
}

// إرسال إشعار عبر Gmail
async function sendEmailNotification(message) {
    const gmailSettings = JSON.parse(localStorage.getItem('api_gmail') || '{}');
    if (!gmailSettings.token) return;
    
    // محاكاة إرسال بريد
    console.log(`📧 Email notification: ${message}`);
}

// ** API endpoints للتحكم **
app.post('/api/message', async (req, res) => {
    const { channel, user, message } = req.body;
    const response = await processMessage(channel, user, message);
    res.json({ response });
});

app.get('/api/stats', (req, res) => {
    res.json(getSystemStats());
});

app.post('/api/settings/update', (req, res) => {
    const { setting, value } = req.body;
    assistantConfig[setting] = value;
    res.json({ success: true });
});

app.get('/api/assistant/status', (req, res) => {
    res.json({
        name: assistantConfig.name,
        status: 'active',
        channels: assistantConfig.activeChannels,
        stats: getSystemStats()
    });
});

// بدء الخادم
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Assistant Server running on port ${PORT}`);
    console.log(`🤖 AI Supervisor is monitoring the system`);
});

// تصدير للاستخدام الخارجي
module.exports = { BotServer: app, assistantConfig };