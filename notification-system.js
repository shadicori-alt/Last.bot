// نظام إشعارات WhatsApp لجميع الأحداث
const WhatsAppNotificationSystem = {
    // إعدادات النظام
    config: {
        autoNotify: true,
        notifyCustomer: true,
        notifyDelegate: true,
        notifyOwner: false,
        includeLocation: true,
        signature: '🤖 منصة التكامل الذكية'
    },
    
    // إنشاء رسالة لإشعار المندوب
    createDelegateMessage(order, type = 'new') {
        const messages = {
            new: `🛵 طلب جديد مُعين لك!
            
👤 العميل: ${order.customerName}
📱 الهاتف: ${order.customerPhone}
📍 المحافظة: ${this.getGovernorateName(order.governorate)}
🏠 العنوان: ${order.address}
💰 القيمة: ${order.value} ريال
📦 التفاصيل: ${order.details}

⚡ يرجى التواصل خلال 30 دقيقة.`,
            
            reminder: `⏰ تذكير: طلب قديم لم يُسلم بعد!
            
رقم الطلب: #${order.id}
العميل: ${order.customerName}
المحافظة: ${this.getGovernorateName(order.governorate)}
منذ: ${this.getTimeSince(order.assignedAt)}`,
            
            urgent: `🔴 طلب عاجل يتطلب متابعتك!
            
رقم الطلب: #${order.id}
العميل: ${order.customerName}
الهاتف: ${order.customerPhone}

⚠️ يرجى التصرف فوراً!`
        };
        
        return `${messages[type]}\n\n${this.config.signature}`;
    },
    
    // إنشاء رسالة للعميل
    createCustomerMessage(order, type = 'confirm') {
        const messages = {
            confirm: `✅ تم تأكيد طلبك!
            
رقم الطلب: #${order.id}
المندوب: ${order.delegate}
وقت التعيين: ${new Date(order.assignedAt).toLocaleString('ar-EG')}
📍 العنوان: ${order.address}
💰 القيمة: ${order.value} ريال

سيتواصل معك المندوب خلال ساعة.`,
            
            on_way: `🚚 المندوب في الطريق إليك!
            
المندوب: ${order.delegate}
رقم المندوب: ${order.delegatePhone || 'سيتم إرساله قريباً'}
وقت الوصول المتوقع: خلال 30 دقيقة`,
            
            delivered: `🎉 تم تسليم طلبك بنجاح!
            
رقم الطلب: #${order.id}
المندوب: ${order.delegate}
وقت التسليم: ${new Date().toLocaleString('ar-EG')}

شكراً لثقتك فينا! 🙏`
        };
        
        return `${messages[type]}\n\n${this.config.signature}`;
    },
    
    // إرسال إشعار لجميع الأطراف
    async sendOrderNotification(order, type = 'new') {
        if (!this.config.autoNotify) return;
        
        // إشعار المندوب
        if (this.config.notifyDelegate && order.delegate) {
            await this.sendToDelegate(order, type);
        }
        
        // إشعار العميل
        if (this.config.notifyCustomer && type !== 'reminder') {
            await this.sendToCustomer(order, type);
        }
        
        // إشعار المشرف
        if (this.config.notifyOwner) {
            await this.sendToOwner(order, type);
        }
        
        // تسجيل في السجل
        this.logNotification(order, type);
    },
    
    // إرسال للمندوب
    async sendToDelegate(order, type) {
        const delegates = JSON.parse(localStorage.getItem('delegates') || '[]');
        const delegate = delegates.find(d => d.name === order.delegate);
        
        if (!delegate) return;
        
        const message = this.createDelegateMessage(order, type);
        
        // محاكاة إرسال واتساب
        console.log(`📱 [WHATSAPP TO DELEGATE ${delegate.phone}]:\n${message}`);
        
        // في الواقع، هنا يتم الاتصال بـ WhatsApp Web API
        // if (WhatsAppBridge.isConnected()) {
        //     await WhatsAppBridge.sendMessage(delegate.phone, message);
        // }
    },
    
    // إرسال للعميل
    async sendToCustomer(order, type) {
        const message = this.createCustomerMessage(order, type);
        
        console.log(`📱 [WHATSAPP TO CUSTOMER ${order.customerPhone}]:\n${message}`);
        
        // تسجيل الإشعار
        const notifications = JSON.parse(localStorage.getItem('whatsapp_notifications') || '[]');
        notifications.push({
            type: 'customer',
            phone: order.customerPhone,
            orderId: order.id,
            message: message,
            timestamp: new Date().toISOString(),
            sent: true
        });
        localStorage.setItem('whatsapp_notifications', JSON.stringify(notifications));
    },
    
    // إرسال للمشرف
    async sendToOwner(order, type) {
        const message = `🔔 إشعار للمشرف:
        
نوع: ${type}
طلب: #${order.id}
مندوب: ${order.delegate || 'غير معين'}
حالة: ${order.status}`;
        
        console.log(`📱 [WHATSAPP TO OWNER]:\n${message}`);
    },
    
    // تذكير دوري للمناديب
    startReminderSystem() {
        setInterval(() => {
            this.checkForLateOrders();
        }, 60000); // كل دقيقة
    },
    
    // التحقق من الطلبات المتأخرة
    checkForLateOrders() {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const now = new Date();
        
        orders.forEach(order => {
            if (order.status === 'assigned' && order.assignedAt) {
                const assignedTime = new Date(order.assignedAt);
                const minutesPassed = (now - assignedTime) / (1000 * 60);
                
                // تذكير بعد 30 دقيقة
                if (minutesPassed > 30 && minutesPassed < 35) {
                    this.sendOrderNotification(order, 'reminder');
                    AIAssistant.remindDelegate(order);
                }
                
                // تذكير عاجل بعد 60 دقيقة
                if (minutesPassed > 60 && minutesPassed < 65) {
                    this.sendOrderNotification(order, 'urgent');
                    AIAssistant.urgentReminder(order);
                }
            }
        });
    },
    
    // تسجيل الإشعار في السجل
    logNotification(order, type) {
        const logs = JSON.parse(localStorage.getItem('notification_logs') || '[]');
        logs.push({
            orderId: order.id,
            type: type,
            delegate: order.delegate,
            customer: order.customerName,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('notification_logs', JSON.stringify(logs.slice(-200)));
    },
    
    // دوال مساعدة
    getGovernorateName(code) {
        const names = {
            cairo: 'القاهرة',
            alexandria: 'الإسكندرية',
            giza: 'الجيزة',
            mansoura: 'المنصورة',
            tanta: 'طنطا',
            other: 'أخرى'
        };
        return names[code] || code;
    },
    
    getTimeSince(timestamp) {
        const minutes = Math.floor((new Date() - new Date(timestamp)) / (1000 * 60));
        if (minutes < 60) return `${minutes} دقيقة`;
        const hours = Math.floor(minutes / 60);
        return `${hours} ساعة`;
    }
};

// تهيئة النظام عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    WhatsAppNotificationSystem.startReminderSystem();
});