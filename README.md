# Digital Notice Board System

A production-ready web application for creating, managing, and displaying notices in real time. The platform includes an admin authentication system, a full notice management dashboard, and a public-facing notice board with live updates.

## Features

- Admin authentication with JWT and bcrypt password hashing
- Admin dashboard to create, edit, and delete notices
- Notice fields: title, description, category, priority, and expiry date
- Public notice board (no login required)
- Auto-refresh on public board every 10 seconds
- High-priority notice highlighting
- Scrolling ticker for latest notice
- Full-screen display mode for board view
- Search by keyword and category filter
- Real-time updates using Socket.io

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Realtime: Socket.io
- Authentication: JWT, bcryptjs

## Installation Steps

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd digital-notice-board-system
   ```

2. Setup backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your MongoDB URI and secure JWT secret.

## How to Run Project

1. Start MongoDB locally (or use MongoDB Atlas).
   - Local MongoDB quick start:
     ```bash
     mongod --dbpath /tmp/mongodb-data
     ```
2. Run backend server:
   ```bash
   cd backend
   npm run dev
   ```
3. Open the app in your browser:
   - Public Board: `http://localhost:5000/`
   - Admin Login: `http://localhost:5000/login.html`
   - Dashboard: `http://localhost:5000/dashboard.html`

### Default Admin Login (Local Development)

- Email: value of `ADMIN_EMAIL` in `.env`
- Password: value of `ADMIN_PASSWORD` in `.env`

## Deployment

### Frontend (Vercel)

- Deploy `frontend/` as static files on Vercel.
- Set `API_BASE_URL` in `app.js` to your deployed backend URL.

### Backend (Render)

- Create a new Web Service on Render.
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Add environment variables from `.env.example`.

### Database (MongoDB Atlas)

- Create a MongoDB Atlas cluster.
- Whitelist your deployment IP or allow trusted access.
- Use Atlas connection string as `MONGODB_URI`.

## Screenshots

> Add screenshots of:
> - Public board page
> - Admin login page
> - Admin dashboard page
