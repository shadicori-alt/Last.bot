import asyncio
import logging
from typing import Dict, Any
from datetime import datetime
import json
import os

class LastBotCore:
    def __init__(self, config_path: str = "config.json"):
        self.config = self.load_config(config_path)
        self.logger = self.setup_logging()
        self.is_running = False
        
    def load_config(self, path: str) -> Dict[str, Any]:
        """تحميل إعدادات البوت"""
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            raise FileNotFoundError(f"لم يتم العثور على ملف الإعدادات: {path}")
        except json.JSONDecodeError as e:
            raise ValueError(f"خطأ في صيغة JSON: {e}")
    
    def setup_logging(self) -> logging.Logger:
        """إعداد نظام التسجيل"""
        logger = logging.getLogger("LastBot")
        logger.setLevel(logging.INFO)
        
        # ملف السجلات
        handler = logging.FileHandler('bot.log', encoding='utf-8')
        handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
        
        logger.addHandler(handler)
        return logger
    
    async def start(self):
        """بدء تشغيل البوت"""
        self.logger.info("🚀 بدء تشغيل Last.bot")
        self.is_running = True
        
        try:
            # هنا سيتم تهيئة جميع الوحدات
            self.logger.info("✅ تم تهيئة البوت بنجاح")
            
            # إبقاء البوت قيد التشغيل
            while self.is_running:
                await asyncio.sleep(1)
                
        except Exception as e:
            self.logger.error(f"❌ خطأ في تشغيل البوت: {e}")
            raise
    
    def stop(self):
        """إيقاف البوت بأمان"""
        self.logger.info("⏹️ إيقاف البوت...")
        self.is_running = False