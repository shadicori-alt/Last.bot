// نظام الذكاء الاصطناعي المتقدم
const AIEngine = {
    // إعدادات OpenAI
    config: {
        apiKey: '',
        model: 'gpt-4',
        maxTokens: 500,
        temperature: 0.7,
        language: 'ar'
    },
    
    // تهيئة الذكاء
    init() {
        const savedKey = localStorage.getItem('api_openai');
        if (savedKey) {
            this.config.apiKey = savedKey;
            console.log('🧠 AI Engine initialized');
        }
    },
    
    // إرسال طلب إلى OpenAI
    async sendMessage(message, context = '') {
        if (!this.config.apiKey) {
            return '❌ OpenAI API غير متصل. يُرجى إدخال المفتاح في إعدادات APIs.';
        }
        
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: [
                        {
                            role: 'system',
                            content: `أنت مساعد ذكي لمنصة التكامل الذكية. تستطيع:
- إدارة الطلبات والمناديب
- إنشاء تقارير وتحليلات
- إجابة أسئلة العملاء بالعامية المصرية
- متابعة المناديب وتذكيرهم
- التحكم في البوتات والردود التلقائية

السياقة الحالية: ${context}`
                        },
                        {
                            role: 'user',
                            content: message
                        }
                    ],
                    max_tokens: this.config.maxTokens,
                    temperature: this.config.temperature
                })
            });
            
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('AI Error:', error);
            return '❌ حدث خطأ في الاتصال بـ AI. تحقق من المفتاح أو حاول لاحقاً.';
        }
    },
    
    // تحليل السؤال والتصرف بناءً عليه
    async processQuery(query) {
        const lowerQuery = query.toLowerCase();
        
        // أسئلة عن الطلبات
        if (lowerQuery.includes('طلب') || lowerQuery.includes('order')) {
            return await this.handleOrdersQuery(query);
        }
        
        // أسئلة عن المناديب
        if (lowerQuery.includes('مندوب') || lowerQuery.includes('delegate')) {
            return await this.handleDelegatesQuery(query);
        }
        
        // أسئلة عن الإحصائيات
        if (lowerQuery.includes('إحصائ') || lowerQuery.includes('stat')) {
            return await this.handleStatsQuery(query);
        }
        
        // أسئلة عامة
        return await this.sendMessage(query, 'رد على سؤال عام');
    },
    
    // معالجة أسئلة الطلبات
    async handleOrdersQuery(query) {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        
        if (query.includes('متأخر') || query.includes('late')) {
            const lateOrders = orders.filter(o => o.status === 'assigned' && 
                (new Date() - new Date(o.assignedAt)) / (1000 * 60) > 30);
            return `📦 عدد الطلبات المتأخرة (أكثر من 30 دقيقة): ${lateOrders.length} طلبات`;
        }
        
        if (query.includes('قيد الانتظار') || query.includes('pending')) {
            const pending = orders.filter(o => o.status === 'pending');
            return `⏳ عدد الطلبات قيد الانتظار: ${pending.length} طلبات`;
        }
        
        if (query.includes('تم التسليم') || query.includes('delivered')) {
            const delivered = orders.filter(o => o.status === 'delivered');
            return `✅ عدد الطلبات المُسلمة: ${delivered.length} طلبات`;
        }
        
        return `📊 إجمالي الطلبات: ${orders.length}`;
    },
    
    // معالجة أسئلة المناديب
    async handleDelegatesQuery(query) {
        const delegates = JSON.parse(localStorage.getItem('delegates') || '[]');
        
        if (query.includes('أفضل') || query.includes('best')) {
            const best = delegates.sort((a, b) => b.performance.rating - a.performance.rating)[0];
            return `⭐ أفضل مندوب: ${best.name} (تقييم ${best.performance.rating}/5)`;
        }
        
        if (query.includes('عدد المندوبين')) {
            return `👥 عدد المناديب المسجلين: ${delegates.length} مندوب`;
        }
        
        return `📋 المناديب المسجلين: ${delegates.map(d => d.name).join(', ')}`;
    },
    
    // معالجة أسئلة الإحصائيات
    async handleStatsQuery(query) {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const totalValue = orders.reduce((sum, o) => sum + parseFloat(o.value || 0), 0);
        
        return `📈 الإحصائيات السريعة:
        
- إجمالي الطلبات: ${orders.length}
- القيمة الإجمالية: ${totalValue.toFixed(2)} ريال
- معدل التسليم: ${orders.length > 0 ? (orders.filter(o => o.status === 'delivered').length / orders.length * 100).toFixed(1) : 0}%`;
    },
    
    // إنشاء تقرير كامل
    async generateReport() {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const delegates = JSON.parse(localStorage.getItem('delegates') || '[]');
        
        const report = `📊 التقرير الشامل لمنصة التكامل الذكية:
        
🛒 **الطلبات:**
- إجمالي الطلبات: ${orders.length}
- قيد الانتظار: ${orders.filter(o => o.status === 'pending').length}
- معينة: ${orders.filter(o => o.status === 'assigned').length}
- مُسلمة: ${orders.filter(o => o.status === 'delivered').length}
- متأخرة: ${orders.filter(o => o.status === 'assigned' && (new Date() - new Date(o.assignedAt)) / (1000 * 60) > 30).length}

👥 **المناديب:**
- عدد المناديب: ${delegates.length}
- نشط: ${delegates.filter(d => d.active).length}
- أفضل تقييم: ${delegates.length > 0 ? Math.max(...delegates.map(d => d.performance.rating)) : 0}/5

💰 **الإيرادات:**
- إجمالي القيمة: ${orders.reduce((sum, o) => sum + parseFloat(o.value || 0), 0).toFixed(2)} ريال`;
        
        return report;
    }
};

// تهيئة الذكاء عند التحميل
AIEngine.init();