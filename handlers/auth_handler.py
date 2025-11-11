import jwt
import bcrypt
import json
from datetime import datetime, timedelta
from typing import Dict, Any
import os

class AuthManager:
    def __init__(self, secret_key: str = None):
        self.secret_key = secret_key or os.getenv("JWT_SECRET_KEY")
        if not self.secret_key:
            raise ValueError("❌ JWT_SECRET_KEY غير موجود!")
        
        self.users_file = "data/users.json"
        os.makedirs(os.path.dirname(self.users_file), exist_ok=True)
    
    def create_default_admin(self):
        """إنشاء مستخدم مدير افتراضي"""
        if os.path.exists(self.users_file):
            return
        
        default_user = {
            "id": "admin_001",
            "username": "admin",
            "email": "admin@lastbot.com",
            "password_hash": bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode(),
            "role": "admin",
            "platform": "all",
            "created_at": datetime.now().isoformat()
        }
        
        with open(self.users_file, 'w') as f:
            json.dump({"users": [default_user]}, f, indent=2)
    
    def verify_user(self, username: str, password: str) -> Dict[str, Any]:
        """التحقق من بيانات المستخدم"""
        try:
            if not os.path.exists(self.users_file):
                self.create_default_admin()
            
            with open(self.users_file, 'r') as f:
                data = json.load(f)
            
            for user in data.get("users", []):
                if user["username"] == username:
                    if bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
                        return user
            
            return None
            
        except Exception as e:
            print(f"خطأ في التحقق: {e}")
            return None
    
    def create_token(self, user_data: Dict) -> str:
        """إنشاء توكين JWT"""
        payload = {
            "user_id": user_data["id"],
            "username": user_data["username"],
            "role": user_data["role"],
            "exp": datetime.utcnow() + timedelta(hours=24),
            "iat": datetime.utcnow()
        }
        return jwt.encode(payload, self.secret_key, algorithm="HS256")
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """التحقق من صحة التوكين"""
        try:
            return jwt.decode(token, self.secret_key, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return {"error": "انتهت صلاحية التوكين"}
        except jwt.InvalidTokenError:
            return {"error": "توكين غير صالح"}