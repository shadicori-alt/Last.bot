// الذكاء المساعد يتابع المناديب وينبههم
const AIAssistant = {
    // تذكير المندوب بالطلب المتأخر
    remindDelegate(order) {
        const message = `⏰ تذكير آلي من المساعد الذكي:
        
طلبك رقم #${order.id} للعميل ${order.customerName} في ${order.governorate} لم يُسلم بعد.
وقت مُنذ تعيينه: 30 دقيقة.

⚠️ يرجى التواصل مع العميل أو تحديث الحالة.`;
        
        console.log(`🤖 [AI REMINDER]:\n${message}`);
        
        // إرسال إشعار للمندوب عبر WhatsApp
        WhatsAppNotificationSystem.sendOrderNotification(order, 'reminder');
        
        // حفظ في سجل الذكاء
        this.logReminder(order, 'late');
    },
    
    // تذكير عاجل
    urgentReminder(order) {
        const message = `🔴 تذكير عاجل - 60 دقيقة مرت!
        
طلب #${order.id} للعميل ${order.customerName} في ${order.governorate}
لم يتم تسليمه بعد. هذا تأخير غير مقبول!
        
⚠️ يجب اتخاذ إجراء فوري.`;
        
        console.log(`🤖 [AI URGENT REMINDER]:\n${message}`);
        
        // إشعار المندوب
        WhatsAppNotificationSystem.sendOrderNotification(order, 'urgent');
        
        // إشعار المشرف
        this.notifyOwner(`طلب عاجل غير مُسلم لمدة ساعة: #${order.id}`);
        
        this.logReminder(order, 'urgent');
    },
    
    // إشعار بتعيين طلب جديد
    notifyDelegate(delegate, order) {
        const message = `✅ تم تعيين طلب جديد لك!
        
العميل: ${order.customerName}
المحافظة: ${order.governorate}
العنوان: ${order.address}
القيمة: ${order.value} ريال
        
يرجى التواصل خلال 30 دقيقة.`;
        
        console.log(`🤖 [AI ASSIGNMENT]:\n${message}`);
        
        // تسجيل في السجل
        this.logAssignment(delegate, order);
    },
    
    // إشعار المشرف بمشكلة
    notifyOwner(message) {
        console.log(`🤖 [AI TO OWNER]: ${message}`);
        
        // في الواقع، هنا يتم إرسال واتساب للمشرف
        // WhatsAppNotificationSystem.sendToOwner({ message });
    },
    
    // إشعار بإضافة مندوب جديد
    notifyNewDelegate(delegate) {
        const message = `👥 تم إضافة مندوب جديد!
        
الاسم: ${delegate.name}
المحافظة: ${delegate.governorate}
الهاتف: ${delegate.phone}
المناطق: ${delegate.areas.join(', ')}
        
PIN: ${delegate.pin}
        
يرجى إبلاغه بكود الدخول.`;
        
        console.log(`🤖 [AI NEW DELEGATE]: ${message}`);
        this.logNewDelegate(delegate);
    },
    
    // إشعار بإتمام الطلب
    notifyOrderCompleted(order) {
        const message = `🎉 تم إتمام طلب بنجاح!
        
رقم الطلب: #${order.id}
المندوب: ${order.delegate}
العميل: ${order.customerName}
المحافظة: ${order.governorate}
القيمة: ${order.value} ريال
        
وقت التسليم: ${new Date().toLocaleString('ar-EG')}`;
        
        console.log(`🤖 [AI COMPLETED]: ${message}`);
        
        // تحديث أداء المندوب
        this.updateDelegatePerformance(order.delegate);
        
        // إشعار العميل بالشكر
        WhatsAppNotificationSystem.sendOrderNotification(order, 'thank_you');
    },
    
    // تحديث أداء المندوب
    updateDelegatePerformance(delegateName) {
        const delegates = JSON.parse(localStorage.getItem('delegates') || '[]');
        const delegate = delegates.find(d => d.name === delegateName);
        
        if (delegate) {
            delegate.performance.totalOrders++;
            delegate.performance.deliveredOrders++;
            
            // حساب التقييم
            const deliveryRate = delegate.performance.deliveredOrders / delegate.performance.totalOrders;
            delegate.performance.rating = Math.min(5, (deliveryRate * 5).toFixed(1));
            
            localStorage.setItem('delegates', JSON.stringify(delegates));
        }
    },
    
    // تسجيل التذكيرات في السجل
    logReminder(order, type) {
        const logs = JSON.parse(localStorage.getItem('ai_logs') || '[]');
        logs.push({
            type: 'reminder',
            subtype: type,
            orderId: order.id,
            delegate: order.delegate,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('ai_logs', JSON.stringify(logs.slice(-500)));
    },
    
    // تسجيل التعيينات
    logAssignment(delegate, order) {
        const logs = JSON.parse(localStorage.getItem('ai_logs') || '[]');
        logs.push({
            type: 'assignment',
            delegate: delegate.name,
            orderId: order.id,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('ai_logs', JSON.stringify(logs.slice(-500)));
    },
    
    // تسجيل مناديب جدد
    logNewDelegate(delegate) {
        const logs = JSON.parse(localStorage.getItem('ai_logs') || '[]');
        logs.push({
            type: 'new_delegate',
            delegate: delegate.name,
            governorate: delegate.governorate,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('ai_logs', JSON.stringify(logs.slice(-500)));
    },
    
    // جدولة تذكيرات مستقبلية
    scheduleFollowUps() {
        // تذكير كل صباح الساعة 9 صباحاً
        setInterval(() => {
            const now = new Date();
            if (now.getHours() === 9 && now.getMinutes() === 0) {
                this.sendMorningReport();
            }
        }, 60000); // التحقق كل دقيقة
        
        console.log('🤖 AI Follow-up system initialized');
    },
    
    // إرسال تقرير صباحي
    sendMorningReport() {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const pending = orders.filter(o => o.status === 'pending').length;
        const assigned = orders.filter(o => o.status === 'assigned').length;
        
        const report = `📊 تقرير الصباح:
        
طلبات قيد الانتظار: ${pending}
طلبات معينة: ${assigned}
        
⚡ ابدأ يومك بنشاط!`;
        
        console.log(`🤖 [AI MORNING REPORT]:\n${report}`);
    }
};

// تهيئة عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    AIAssistant.scheduleFollowUps();
});