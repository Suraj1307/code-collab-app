<<<<<<< HEAD
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
=======
# Code Collaborator

Code Collaborator is a real-time collaborative coding app with a React + Monaco frontend and a Node.js + Socket.IO backend. Users can create protected rooms, join existing rooms with a room ID and password, or enter a shared guest room for quick collaboration.

## Features

- Real-time collaborative editing with Monaco Editor and Yjs
- Private rooms with room ID and password protection
- Shared guest room for instant access
- Live collaborator presence list
- Single-container Docker workflow for deployment

## Tech Stack

- Frontend: React, Vite, Monaco Editor, Yjs
- Backend: Node.js, Express, Socket.IO, y-socket.io
- Deployment: Docker

## Project Structure

```text
.
|-- Backend/
|   |-- package.json
|   `-- server.js
|-- Frontend/
|   |-- package.json
|   `-- src/
|-- dockerfile
`-- run.sh
```

## How It Works

The frontend is built into `Backend/public`, and the backend serves both the API and the compiled frontend. Real-time synchronization is powered by Yjs over Socket.IO.

Available backend endpoints:

- `POST /api/rooms/create` to create a private room
- `POST /api/rooms/join` to join a private room
- `POST /api/rooms/guest` to enter the guest room
- `GET /health` for a simple health check

## Local Development

### 1. Install dependencies

```bash
cd Frontend && npm install
cd ../Backend && npm install
```

### 2. Run the frontend

```bash
cd Frontend
npm run dev
```

### 3. Run the backend

```bash
cd Backend
npm run dev
```

By default:

- Frontend runs with Vite
- Backend serves on `http://localhost:3000`

If needed, you can configure:

- `VITE_API_BASE_URL`
- `VITE_SOCKET_SERVER_URL`

## Docker

Build and run with Docker manually:

```bash
docker build -t code-collaborator -f dockerfile .
docker run -d --name code-collaborator -p 3000:3000 code-collaborator
```

Or use the helper script:

```bash
./run.sh
```

The script:

1. Builds the frontend
2. Builds the Docker image
3. Stops and removes the old container if it exists
4. Starts a new container on port `3000`

## Notes

- Room data and sessions are currently stored in memory.
- Restarting the server clears active rooms and tokens.
- The Docker image serves the production frontend from the backend container.
>>>>>>> 778a422 (Add project README)
