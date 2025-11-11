// البرنامج الرئيسي لمنصة التكامل الذكية
const MainSystem = {
    // تهيئة النظام
    init() {
        this.setupEventListeners();
        this.checkStorage();
        console.log('🚀 Main system initialized');
    },
    
    // إعدادات المستمعين (Event Listeners)
    setupEventListeners() {
        // تسجيل الخروج من أي صفحة
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('logout-btn')) {
                this.logout();
            }
        });
        
        // التحقق من حالة الاتصال
        window.addEventListener('online', () => {
            this.showNotification('✅ تم استعادة الاتصال بالإنترنت', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showNotification('❌ فقدان الاتصال بالإنترنت', 'error');
        });
    },
    
    // التحقق من مساحة التخزين
    checkStorage() {
        try {
            const used = JSON.stringify(localStorage).length;
            const limit = 5 * 1024 * 1024; // 5MB limit
            
            if (used > limit * 0.8) {
                this.showNotification('⚠️ مساحة التخزين شارفت على الامتلاء', 'warning');
            }
        } catch (e) {
            console.warn('Storage check failed:', e);
        }
    },
    
    // تسجيل الخروج
    logout() {
        if (confirm('هل أنت متأكد من تسجيل الخروج؟ سيتم مسح جميع البيانات المحلية.')) {
            localStorage.clear();
            window.location.href = '/index.html';
        }
    },
    
    // إنشاء إشعار عالمي
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            padding: 15px;
            border-radius: 10px;
            color: white;
            z-index: 9999;
            animation: slideIn 0.5s;
            max-width: 300px;
            background: ${type === 'success' ? 'rgba(76, 175, 80, 0.9)' : 
                        type === 'error' ? 'rgba(244, 67, 54, 0.9)' : 
                        'rgba(255, 152, 0, 0.9)'};
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    },
    
    // حفظ بيانات مؤمنة
    saveSecure(key, data) {
        try {
            const encrypted = btoa(JSON.stringify(data));
            localStorage.setItem(key, encrypted);
        } catch (e) {
            localStorage.setItem(key, JSON.stringify(data));
        }
    },
    
    // قراءة بيانات مؤمنة
    loadSecure(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(atob(data)) : null;
        } catch (e) {
            return localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)) : null;
        }
    },
    
    // نسخ احتياطي للبيانات
    backupData() {
        const data = {
            orders: JSON.parse(localStorage.getItem('orders') || '[]'),
            delegates: JSON.parse(localStorage.getItem('delegates') || '[]'),
            templates: JSON.parse(localStorage.getItem('reply_templates') || '{}'),
            settings: JSON.parse(localStorage.getItem('api_settings') || '{}'),
            logs: JSON.parse(localStorage.getItem('bot_logs') || '[]'),
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('✅ تم إنشاء نسخة احتياطية بنجاح', 'success');
    },
    
    // استعادة البيانات
    restoreData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                localStorage.setItem('orders', JSON.stringify(data.orders || []));
                localStorage.setItem('delegates', JSON.stringify(data.delegates || []));
                localStorage.setItem('reply_templates', JSON.stringify(data.templates || {}));
                localStorage.setItem('api_settings', JSON.stringify(data.settings || {}));
                localStorage.setItem('bot_logs', JSON.stringify(data.logs || []));
                
                this.showNotification('✅ تم استعادة البيانات بنجاح', 'success');
                setTimeout(() => window.location.reload(), 2000);
            } catch (err) {
                this.showNotification('❌ فشل في استعادة البيانات', 'error');
            }
        };
        reader.readAsText(file);
    }
};

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    MainSystem.init();
});