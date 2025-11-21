import os

def create_frontend_structure():
    root = "cost-estimator-frontend"
    
    # Directories
    folders = [
        f"{root}/public",
        f"{root}/src",
        f"{root}/src/assets",
        f"{root}/src/components/auth",
        f"{root}/src/components/common",
        f"{root}/src/components/dashboard",
        f"{root}/src/components/project",
        f"{root}/src/context",
        f"{root}/src/hooks",
        f"{root}/src/pages",
        f"{root}/src/services",
        f"{root}/src/utils",
    ]

    # Files with initial content
    files = {
        # Configuration Files
        f"{root}/package.json": """{
  "name": "cost-estimator-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.6.7",
    "clsx": "^2.1.0",
    "jwt-decode": "^4.0.0",
    "lucide-react": "^0.344.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-dropzone": "^14.2.3",
    "react-router-dom": "^6.22.2",
    "react-toastify": "^10.0.4",
    "tailwind-merge": "^2.2.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "vite": "^5.1.4"
  }
}""",
        f"{root}/vite.config.js": """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true
    }
  }
})""",
        f"{root}/tailwind.config.js": """/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}""",
        f"{root}/postcss.config.js": """export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}""",
        f"{root}/Dockerfile": """FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]""",
        
        # Root HTML
        f"{root}/index.html": """<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cost Estimator</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>""",

        # Main React Files
        f"{root}/src/main.jsx": """import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)""",
        f"{root}/src/App.jsx": """import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Placeholder Components
const Login = () => <div className="flex h-screen items-center justify-center"><h1>Login Page</h1></div>;
const Dashboard = () => <div><h1>Dashboard</h1></div>;
const ProjectPage = () => <div><h1>Project Page</h1></div>;

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/project/:id" element={<ProjectPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;""",
        f"{root}/src/index.css": """@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom scrollbar for split view */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
}
::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
""",
        
        # Empty Service/Context Placeholders
        f"{root}/src/context/AuthContext.jsx": "// Auth Context Provider",
        f"{root}/src/services/api.js": "// Axios Instance Configuration",
        f"{root}/.env": "VITE_API_URL=http://localhost:8000"
    }

    # Create Folders
    for folder in folders:
        os.makedirs(folder, exist_ok=True)
        print(f"Created Directory: {folder}")

    # Create Files
    for file_path, content in files.items():
        with open(file_path, "w") as f:
            f.write(content)
        print(f"Created File: {file_path}")

    print("\n✅ Frontend Structure Created Successfully.")

if __name__ == "__main__":
    create_frontend_structure()