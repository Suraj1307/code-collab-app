# 🚀 Real-Time Code Collaboration Platform

A full-stack real-time collaborative code editor that allows multiple users to edit and sync code simultaneously using WebSockets and CRDT (Yjs).

---

## 🌐 Live Demo
👉 http://docker-aws-alb-1031415497.eu-north-1.elb.amazonaws.com

---

## 🧠 Features

- 👥 Real-time multi-user code collaboration
- ⚡ Low-latency updates using WebSockets (Socket.IO)
- 🔄 Conflict-free editing using CRDT (Yjs)
- 🏠 Room-based collaboration (guest room support)
- 🌍 Full-stack deployment on AWS ECS (Fargate)
- 🐳 Dockerized application for consistent environments
- 🔗 REST API + WebSocket integrated backend
- 🧩 Frontend served directly from backend container

---

## 🏗️ Architecture

```
User (Browser)
     │
     ▼
AWS Application Load Balancer (ALB)
     │
     ▼
ECS Fargate (Docker Container)
     │
     ├── Express.js API
     ├── Socket.IO Server
     ├── Yjs (CRDT sync)
     └── Static Frontend (Vite build)
```

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite

### Backend
- Node.js
- Express.js
- Socket.IO
- Yjs (CRDT)

### DevOps / Cloud
- Docker
- AWS ECS (Fargate)
- AWS ECR
- AWS Application Load Balancer (ALB)

---

## ⚙️ Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/Suraj1307/code-collab-app.git
cd code-collab-app
```

### 2. Build frontend
```bash
cd Frontend
npm install
npm run build
```

### 3. Run backend
```bash
cd ../Backend
npm install
node server.js
```

### 4. Open in browser
```
http://localhost:3000
```

---

## 🐳 Run with Docker

```bash
docker build -t server .
docker run -d -p 3000:3000 server
```

---

## 🔥 Deployment (AWS)

- Built Docker image
- Pushed to AWS ECR
- Deployed using ECS (Fargate)
- Exposed via Application Load Balancer

---

## ⚠️ Limitations

- Uses in-memory room state (Map)
- Works reliably with a single ECS task
- Multi-instance scaling requires Redis (future improvement)

---

## 🚀 Future Improvements

- 🔴 Redis integration for distributed real-time state
- 🔐 Authentication system (JWT / OAuth)
- 🌐 HTTPS + custom domain
- 🤖 CI/CD pipeline (GitHub Actions)
- 👨‍💻 Cursor tracking & presence indicators

---

## 👨‍💻 Author

**Suraj Kumar**  
GitHub: https://github.com/Suraj1307

---

## ⭐ If you like this project

Give it a ⭐ on GitHub!
