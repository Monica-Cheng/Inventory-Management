# Inventory-Management

# Node.js Project Setup Guide

This document explains how to install Node.js, initialize this project, install dependencies, resolve common PowerShell/npm issues, and run the development server.  
It includes the exact problems encountered during setup and how to fix them.

---

## 🔧 1. Install Node.js (LTS Version)

Download the official installer from:  
👉 https://nodejs.org/

Choose **LTS → Windows Installer (.msi)**  
During installation, make sure **“Add to PATH” is checked** (checked by default).

After installation, verify:

```bash
node -v
npm -v
If both commands show version numbers, Node.js is installed correctly.

📁 2. Project Setup
Open the project folder in VSCode:

makefile
Copy code
D:\SiaoHackaton
Initialize the project:

bash
Copy code
npm init -y
This creates a package.json file.

📦 3. Install Dependencies
This project requires Express:

bash
Copy code
npm install express
After installation, you will see:

node_modules/ folder

package-lock.json

These files are generated automatically by npm.

🚫 4. Prevent node_modules From Being Committed
Create a .gitignore file in the root of the project and add:

Copy code
node_modules/
This prevents thousands of auto-generated files from being pushed to GitHub.

⚠️ 5. Common Problems & Solutions
❗ Problem 1: npm init / npm install blocked in PowerShell
You may see this error:

csharp
Copy code
npm.ps1 cannot be loaded because running scripts is disabled on this system.
✅ Solution A (Recommended): Use Command Prompt (CMD)
Open CMD instead of PowerShell, then run:

cmd
Copy code
npm init -y
npm install express
Solution B (Allow PowerShell Temporary Execution)
Run in PowerShell:

powershell
Copy code
Set-ExecutionPolicy Bypass -Scope Process
Then run npm commands normally.

❗ Problem 2: Server cannot start
When running:

bash
Copy code
node server.js
You may see:

javascript
Copy code
Error: Cannot find module 'express'
✅ Solution:
Make sure you installed express in the correct folder:

bash
Copy code
npm install express
Make sure your terminal’s working directory is the same as your project:

makefile
Copy code
D:\SiaoHackaton
❗ Problem 3: Browser shows ERR_CONNECTION_REFUSED
This happens when the Node.js server is not running.

✅ Solution:
Start the server:

bash
Copy code
node server.js
Then open:

👉 http://localhost:3000/

Make sure the terminal shows:

arduino
Copy code
Server running at http://localhost:3000
Do not close the terminal while the server is running.

🚀 6. Running the Server
Create a file named server.js:

javascript
Copy code
const express = require("express");
const app = express();

app.use(express.static("public")); // Serve index.html

app.get("/api", (req, res) => {
    res.send("API is working!");
});

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
Start the server:

bash
Copy code
node server.js
Open in browser:

👉 http://localhost:3000
woooooo
```
