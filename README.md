# Proyek-Tugas-Besar-IMPAL_MoneyTime

**Note for developers : fork the repo first before edit or commit.**

## Description
MoneyTime adalah aplikasi manajemen waktu dan keuangan. Dalam aplikasi ini pengguna dapat memanajemen waktu mereka
seperti, penjadwalan, hingga perhitungan waktu. Pengguna juga dapat memanajemen keuangan mereka, seperti mencatat pemasukkan atau pengeluaran sehari-hari dan perhitungan budget keuangan.

## 🧑‍💻 Team

|          **Name**          |      **NIM**        |
|----------------------------|---------------------|
| Ghanif Hadiyana Akbar      | 103012300018        |
| Taraka Yumna Sarwoko       | 103012300242        |
| Muhammad Zaini             | 103012300313        |
| Muhammad Alvin Ababil      | 103012330064        |
| Alif Ihsan                 | 103012330079        |

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
- Microsoft Azure Database
- Python (Flask)
- groq

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
pip install pyodbc
```

### Step 3 Setup Environtment
- Make .env file
- Add this code on .env
  ```bash
  FLASK_APP=main.py
  FLASK_DEBUG=1
  FLASK_ENV=development
  FLASK_RUN_PORT=8080

  GROQ__API__KEY = INSERT YOUR KEY HERE
  ```
  
### Step 4 Access Azure Database
- Donwload Azure ODBC driver

### Step 5 Run the Project
```bash
  python -m flask run
```

### Step 6 
- Ctrl + Click localhost link on the terminal to access the website.

## 📋 Requirements
- Python Flask Framework
- Microsoft Azure Database
- Groq API Key