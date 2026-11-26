# Experiment 12: Task Manager (MERN Stack)

A simple full-stack Task Manager application built with MongoDB, Express, React, and Node.js, configured for cloud deployment.

## Live Demo
- **GitHub Pages**: [https://harshil-gupta-178.github.io/Experiment_12/](https://harshil-gupta-178.github.io/Experiment_12/)

## Project Structure

```
Experiment_12/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                 # Node.js & Express backend
│   ├── models/
│   │   └── Task.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── assets/                 # Production frontend assets (GitHub Pages)
├── index.html              # Production entry point (GitHub Pages)
├── Procfile                # Heroku / Render start command
├── package.json            # Root build and start scripts
└── README.md
```

## Run Locally

1. **Install dependencies and build client:**
   ```bash
   npm run build
   ```

2. **Configure environment variables:**
   Create `server/.env` based on `server/.env.example`:
   ```env
   PORT=5000
   NODE_ENV=production
   MONGO_URI=your_mongodb_atlas_connection_string
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   Open `http://localhost:5000` in your browser.

## Cloud Deployment

- **Database**: Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), allow network access (`0.0.0.0/0`), and copy the `MONGO_URI`.
- **Heroku / Render**: Connect this repository, set `NODE_ENV=production` and `MONGO_URI` in environment variables, then use `npm run build` as the build command and `npm start` as the start command.
- **AWS EC2**: Clone the repo on an Ubuntu instance, run `npm run build`, configure `server/.env`, and start the server with `npm start` (or PM2).
