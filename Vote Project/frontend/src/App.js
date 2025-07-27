import React from "react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import ElectionList from "./ElectionList";
import ElectionDetail from "./ElectionDetail";
import AdminElectionList from "./pages/AdminElectionList";
import AdminManageUser  from "./pages/AdminManageUser";



function App() {
  return (
      
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />

      <Routes>
        {/* Redirect / ไป /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* หน้า Login */}
        <Route path="/login" element={<Login />} />

        {/* หน้าเลือกตั้ง */}
        <Route path="/elections" element={<ElectionList />} />
        <Route path="/election/:id" element={<ElectionDetail />} />
        <Route path="/admin/elections" element={<AdminElectionList />} />
        <Route path="/admin/manage-users" element={<AdminManageUser />} />
      </Routes>
    </Router>
  );
}

export default App;


