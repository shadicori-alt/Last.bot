from flask import Flask, request, render_template_string, session, redirect
import os

app = Flask(__name__)
app.secret_key = 'simple-key-change-if-you-want'

@app.route('/')
def index():
    if 'logged_in' in session:
        return redirect('/dashboard')
    
    return render_template_string("""
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head><meta charset="UTF-8"><title>Login</title></head>
    <body style="display:flex;justify-content:center;align-items:center;height:100vh;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div style="background:white;padding:40px;border-radius:15px;width:400px;">
            <h2>🤖 Last.bot</h2>
            <form method="POST" action="/login">
                <input type="text" name="u
