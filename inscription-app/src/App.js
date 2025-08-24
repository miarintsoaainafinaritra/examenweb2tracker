import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './login/login';
import Home from './signup/home';
import Dashboard from './Dashboard/dashboard';
import Date from "./date/date";
import './App.css'; 
import './login/login.css'
import  './signup/home.css';
import './Dashboard/dashboard.css'; 
import './date/date.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/Date" element={<Date />} />
        

        {/* Removed the /app route since it was pointing to a CSS file */}
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;