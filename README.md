# Experiment 12: Deploy a Full-Stack MERN Application on Cloud Platforms (AWS / Heroku)

## 1. Aim & Objective
To design, configure, and deploy a production-grade full-stack **MERN (MongoDB, Express, React, Node.js)** application on cloud infrastructure (such as **Amazon Web Services (AWS) EC2** and **Heroku / Render** PaaS), integrated with a cloud-managed database (**MongoDB Atlas**).

---

## 2. Architecture Overview

```
+-------------------------------------------------------------------------+
|                              End User Client                            |
|                  (Web Browser / Mobile / Postman API)                   |
+------------------------------------+------------------------------------+
                                     |
                                     | HTTP / HTTPS (Port 80 / 443)
                                     v
+-------------------------------------------------------------------------+
|                       AWS EC2 / Heroku Cloud Server                     |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | NGINX Reverse Proxy (Port 80 -> Port 5000) & SSL Termination      |  |
|  +---------------------------------+---------------------------------+  |
|                                    | Reverse Proxy Pass                 |
|                                    v                                    |
|  +-------------------------------------------------------------------+  |
|  | Node.js / Express Server (Port 5000) managed by PM2 Daemon        |  |
|  |                                                                   |  |
|  |  • Serves REST API endpoints (/api/tasks, /api/health)             |  |
|  |  • Serves compiled React SPA assets (client/dist) in production   |  |
|  +---------------------------------+---------------------------------+  |
+------------------------------------+------------------------------------+
                                     |
                                     | Encrypted TLS connection
                                     v
+-------------------------------------------------------------------------+
|                       MongoDB Atlas Cloud Cluster                       |
|           (M0 Multi-Region Replica Set with Auto-failover)              |
+-------------------------------------------------------------------------+
```

---

## 3. Project Structure

```
Experiment_12/
├── client/                     
│   ├── src/
│   │   ├── App.jsx             
│   │   ├── main.jsx           
│   │   └── index.css           
│   ├── index.html
│   ├── vite.config.js          
│   └── package.json
├── server/                     
│   ├── models/
│   │   └── Task.js             
│   ├── server.js               
│   ├── .env.example           
│   └── package.json
├── Dockerfile                  
├── docker-compose.yml          
├── ecosystem.config.js       
├── nginx.conf                  
├── Procfile                    
├── package.json               
└── README.md                   
``

---

## 4. Step-by-Step Deployment Procedure

### STEP 1: Provision Cloud Database (MongoDB Atlas)

1. **Sign Up / Login**: Navigate to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in.
2. **Create Cluster**:
   - Select **M0 (Free)** tier.
   - Choose a cloud provider and region closest to your server (e.g., AWS `us-east-1` or `ap-south-1`).
   - Cluster Name: `MernCluster`.
3. **Configure Database Access (User Authentication)**:
   - Navigate to **Security** > **Database Access**.
   - Click **Add New Database User**.
   - Method: Password Authentication.
   - Role: **Read and write to any database**.
   - Note down the `username` and `password`.
4. **Configure Network Access (Firewall Whitelist)**:
   - Navigate to **Security** > **Network Access**.
   - Click **Add IP Address**.
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`) so that your cloud instances can connect.
5. **Retrieve Connection String**:
   - Go to **Deployments** > **Database** > click **Connect**.
   - Select **Drivers** (Node.js).
   - Copy URI format:
     ```
     mongodb+srv://<db_user>:<db_password>@cluster0.abcde.mongodb.net/mern_deploy_db?retryWrites=true&w=majority
     ```

---

### STEP 2: Deployment Option A — AWS EC2 (IaaS Production Standard)

#### 2.1 Launch an EC2 Instance
1. Open the [AWS Management Console](https://console.aws.amazon.com/ec2).
2. Click **Launch Instances**:
   - **Name**: `mern-production-server`
   - **AMI**: Ubuntu Server 24.04 LTS (HVM), SSD Volume Type (Free Tier eligible)
   - **Instance Type**: `t2.micro` (or `t3.micro`)
   - **Key Pair**: Create or select an existing `.pem` key (e.g., `mern-key.pem`)
3. **Configure Security Group (Firewall Rules)**:
   - Allow **SSH (Port 22)** from `My IP` (or `0.0.0.0/0`)
   - Allow **HTTP (Port 80)** from `0.0.0.0/0`
   - Allow **HTTPS (Port 443)** from `0.0.0.0/0`
   - Allow **Custom TCP (Port 5000)** from `0.0.0.0/0` (for testing backend directly)
4. Click **Launch Instance** and copy the **Public IPv4 Address**.

#### 2.2 Connect to EC2 via SSH
Open your terminal (PowerShell, Bash, or PuTTY):
```bash
chmod 400 mern-key.pem
ssh -i "mern-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
```

#### 2.3 Install Node.js, Git, PM2 & NGINX on EC2
```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install Node.js (v20 LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx

# Verify versions
node -v
npm -v

# Install PM2 globally (Process Manager for 24/7 uptime)
sudo npm install -g pm2
```

#### 2.4 Clone Repository & Install Dependencies
```bash
# Clone project into home directory
git clone <YOUR_GITHUB_REPOSITORY_URL> mern-app
cd mern-app

# Install server & client dependencies and build the React frontend
npm run install:all
npm run build:client
```

#### 2.5 Configure Server Environment Variables
```bash
# Create .env file inside server folder
cd server
cat << 'EOF' > .env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/mern_deploy_db?retryWrites=true&w=majority
EOF
cd ..
```

#### 2.6 Start Application with PM2
```bash
# Start backend in production cluster mode
pm2 start ecosystem.config.js --env production

# Ensure PM2 restarts automatically on server reboot
pm2 save
pm2 startup
# (Run the generated sudo env command printed by pm2 startup)
```

#### 2.7 Configure NGINX Reverse Proxy
```bash
# Remove default Nginx welcome page
sudo rm /etc/nginx/sites-enabled/default

# Copy custom Nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/mern-app
sudo ln -s /etc/nginx/sites-available/mern-app /etc/nginx/sites-enabled/

# Test and reload Nginx
sudo nginx -t
sudo systemctl restart nginx
```

#### 2.8 Configure Free SSL with Certbot (Optional Domain Setup)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Now open `http://<YOUR_EC2_PUBLIC_IP>` in your browser to view the live running MERN application.

---

### STEP 3: Deployment Option B — Heroku / Render / Railway (PaaS)

#### 3.1 Deploying on Heroku CLI
```bash
# 1. Login to Heroku
heroku login

# 2. Create a Heroku App
heroku create mern-cloud-app-demo

# 3. Set Cloud Environment Variables
heroku config:set NODE_ENV=production
heroku config:set MONGO_URI="mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/mern_deploy_db?retryWrites=true&w=majority"

# 4. Deploy via Git
git add .
git commit -m "Deploy full-stack MERN app to Heroku"
git push heroku main

# 5. Open and inspect logs
heroku open
heroku logs --tail
```

#### 3.2 Deploying on Render (Free Alternative to Heroku)
1. Push your repository to GitHub.
2. Sign in to [Render](https://render.com/) and click **New Web Service**.
3. Connect your GitHub repository.
4. Set configurations:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `MONGO_URI` = `<YOUR_MONGODB_ATLAS_URI>`
6. Click **Create Web Service**. Render builds the React app and serves it via Express on a custom `onrender.com` HTTPS URL!

---

## 5. Verification & Testing

### 1. Health Check Endpoint
```bash
curl -X GET http://<YOUR_SERVER_IP_OR_DOMAIN>/api/health
```
**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-11-15T12:00:00.000Z",
  "database": "connected",
  "environment": "production"
}
```

### 2. Create Task (POST API)
```bash
curl -X POST http://<YOUR_SERVER_IP_OR_DOMAIN>/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Cloud Security Audit","description":"Verify SSL and IAM roles","status":"in-progress"}'
```

### 3. Retrieve Tasks (GET API)
```bash
curl -X GET http://<YOUR_SERVER_IP_OR_DOMAIN>/api/tasks
```

---

## 6. Troubleshooting Common Issues

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **502 Bad Gateway (Nginx)** | Node.js process is stopped or listening on another port. | Check `pm2 status` and `pm2 logs`. Verify `server.js` listens on port 5000. |
| **MongooseServerSelectionError** | MongoDB Atlas IP whitelist blocking server IP. | Go to Atlas Network Access -> Add `0.0.0.0/0` (Allow from anywhere). |
| **CORS Policy Error** | Frontend calling API from different origin without headers. | `cors()` middleware is configured in `server.js`. In production, Express serves frontend static files from the exact same origin, avoiding CORS issues entirely. |
| **Client-Side Routing 404** | Direct URL visits return 404 on page refresh. | Ensure `app.get('*', ...)` wildcard route points to `client/dist/index.html`. |
| **Port Collision Error `EADDRINUSE`** | Another background process running on port 5000. | Run `lsof -i :5000` or `netstat -ano` and kill the PID or restart PM2. |

---

## 7. Conclusion
The full-stack MERN application has been built and configured for cloud deployment. The database is decoupled and securely hosted on **MongoDB Atlas**, while the application server and frontend are unified and served with high availability, reverse proxy caching, and automatic process monitoring on **AWS EC2 / Heroku**.
