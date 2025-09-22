# DriveTest

DriveTest is a backend application that automates the process of finding and booking driving test appointments in the UK (DVSA).  
It monitors available dates and attempts to reserve slots as soon as they become free.

https://apps.apple.com/gb/app/drive-test-uk/id6738711049?platform=iphone

## 🚀 Features
- Monitor available DVSA driving test slots.  
- Select preferred exam date and time.  
- Automatic booking using headless browser bots.  
- Proxy rotation (dynamic IPs) to bypass anti-bot systems.  
- User panel with booking history and status tracking.  
- Email/SMS notifications when slots are available.  
![230x0w](https://github.com/user-attachments/assets/128183b0-f4c0-41f4-996a-5d3d68f5f845)
![230x0w (1)](https://github.com/user-attachments/assets/5895f607-85a2-4645-a3a1-d9e1a96e2046)
![230x0w (2)](https://github.com/user-attachments/assets/828296fe-4ff6-47df-947a-6ddddb683e52)

## 🛠️ Tech Stack
- **Backend:** Node.js, Express  
- **Database:** MongoDB  
- **Automation:** Puppeteer (headless browser), Proxy rotation  
- **Other:** Twilio (SMS), Nodemailer (Email)  

## ⚡ Installation
```bash
git clone https://github.com/YourAccount/DriveTest.git
cd DriveTest
npm install
npm start
