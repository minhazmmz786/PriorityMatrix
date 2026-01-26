# Priority Matrix App

A task management tool based on the **Eisenhower Matrix**.  
It helps users prioritize tasks based on urgency and importance, with drag-and-drop support for easy organization.

---

## 🚀 Tech Stack

### Frontend
- **React.js (Vite)**
- **TypeScript**
- **Tailwind CSS**
- **React Router**
- **React DnD**
- **Zustand**

### Backend
- **Node.js**
- **Express.js**
- **TypeScript**
- **MongoDB**
- **Mongoose**
- **JWT Authentication**
- **Bcrypt**

### Dev Tools
- **ESLint**
- **Prettier**
- **Husky**
- **Lint-staged**
- **Postman**

---

## 🌟 Features

- User authentication (Sign up, Login)
- Create, edit, delete tasks
- Drag and drop tasks between quadrants
- Filter tasks by status and quadrant
- Search tasks
- Task due date reminder
- Persistent data with MongoDB
- Responsive UI

---

## 🧠 Eisenhower Matrix Quadrants

| Quadrant | Meaning | Example |
|---------|---------|---------|
| Q1 | Urgent & Important | Deadline tasks |
| Q2 | Important, Not Urgent | Planning |
| Q3 | Urgent, Not Important | Interruptions |
| Q4 | Not Urgent, Not Important | Time-wasters |

---

## 📦 Installation

### 1. Clone the repo

```bash
git clone https://github.com/your-username/priority-matrix-app.git
cd priority-matrix-app
```

---

## 🧩 Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment Variables

Create a `.env` file:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### 3. Run Backend

```bash
npm run dev
```

---

## 🧩 Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Run Frontend

```bash
npm run dev
```

---

## 🔥 Running Both Servers

Open two terminals:

**Terminal 1**

```bash
cd backend
npm run dev
```

**Terminal 2**

```bash
cd frontend
npm run dev
```

---

## 📌 API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

---

## 🧰 Folder Structure

```
priority-matrix-app/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── utils/
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

---

## 🧪 Testing

### Backend

```bash
npm test
```

### Frontend

```bash
npm test
```

---

## 🚀 Deployment

You can deploy using:

- **Vercel (Frontend)**
- **Render / Heroku (Backend)**
- **MongoDB Atlas (Database)**

---

## 📄 License

MIT License © 2026
