# Proyek-Tugas-Besar-IMPAL_MoneyTime

**Note for developers : fork the repo first before edit or commit.**

## Description
MoneyTime adalah aplikasi manajemen waktu dan keuangan. Dalam aplikasi ini pengguna dapat memanajemen waktu mereka
seperti, penjadwalan, hingga perhitungan waktu. Pengguna juga dapat memanajemen keuangan mereka, seperti mencatat pemasukkan atau pengeluaran sehari-hari dan perhitungan budget keuangan.

## 🧑‍💻 Team

|          **Name**          |      **NIM**        |                 **Role**              |
|----------------------------|---------------------|---------------------------------------|
| Ghanif Hadiyana Akbar      | 103012300018        | Full Stack Programmer                 |
| Taraka Yumna Sarwoko       | 103012300242        | Back-End Programmer                   |
| Muhammad Zaini             | 103012300313        | Full Stack Programmer                 |
| Muhammad Alvin Ababil      | 103012330064        | Project Manager & Back-End Programmer |
| Alif Ihsan                 | 103012330079        | UI/UX Designer & Front-End Programmer |

## 🚀 Features
- **📆 Manajemen Waktu**                   : Pengguna dapat melakukan manajemen waktu kesehariannya.

- **💵 Manajemen Keuangan**                : Pengguna dapat melakukan manajemen keuangan.

- **🧠 AI Asistant**                       : Asisten AI yang dapat membantu pengguna mengelola keuangan dan aktivitasnya.   

## 🛠 Tech Stack

**Frontend:**
- HTML
- CSS
- JavaScript

**Backend:**
- Supabase
- Python (Flask)
- Groq

## 🚀 How to Run the Project

### Step 1. Clone the Repository
```bash
https://github.com/NeoRyumasil/Proyek-Tugas-Besar-IMPAL_MoneyTime.git
cd Proyek-Tugas-Besar-IMPAL_MoneyTime/MoneyTime
```

### Step 2. Install Depedencies
```bash
pip install flask
pip install requests
pip install python-dotenv
pip install groq
pip install supabase
```

### Step 3 Setup Environtment
- Make .env file
- Add this code on .env
  ```bash
  FLASK_APP=main.py
  FLASK_DEBUG=1
  FLASK_ENV=development
  FLASK_RUN_PORT=8080

  SUPABASE_URL = YOUR_SUPABASE_URL
  SUPABASE_ANON_KEY = YOUR_SUPABASE_ANON_KEY
  
  EMAIL_SENDER=your_email@gmail.com
  EMAIL_PASSWORD=your_app_password

  SECRET_KEY = YOUR_SECRET_KEY
  
  GROQ_API_KEY = INSERT_YOUR_KEY_HERE
  ```
  
### Step 4 Access Supabase Database
- Make the PosGreSQL Database in Supabase
- Make the database
- Access it with supabase

### Step 5 Run the Project
```bash
  python -m flask run
```

### Step 6 
- Ctrl + Click localhost link on the terminal to access the website.

## 📋 Requirements
- Python Flask Framework
- Supabase
- Groq API Key
