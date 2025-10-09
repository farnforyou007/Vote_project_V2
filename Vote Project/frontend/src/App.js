import React from "react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { BrowserRouter as Router, Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import Login from "./pages/Login";
import ElectionList from "./pages/ElectionList";
import ElectionDetail from "./pages/ElectionDetail";
import AdminElectionList from "./pages/AdminElectionList";
import AdminManageUser from "./pages/AdminManageUser";
import ManageEligibilityPage from "./pages/AdminEligibleVoters";
import StudentProfile from './components/Student/StudentProfile';
import CandidateList from './components/AdminManageCandidate/ManageCandidate'
import StudentApplicationPage from './components/Student/StudentApplicationPage'
import CheckEligibilityPage from './components/Student/CheckEligibilityPage'
import VotePage from './components/Student/VotePage'
import VoteHistory from './components/Student/VoteHistory'
import SessionGuard from "./components/SessionGuard";
// import { apiFetch } from "./utils/apiFetch";
import AdminDashboard from "./pages/AdminDashboard";
import ResultDetail from "./pages/ResultDetail";
import ElectionResultsPage  from "./pages/ElectionResultsPage"; 
// import RoleGuard from './components/RoleGuard';
function App() {
  return (
    <div className="min-h-screen bg-purple-100">
      <Router>
        <ToastContainer autoClose={3000} reverseOrder={true} />
        <SessionGuard />
        <Routes>
          {/* Redirect / ไป /login */}
          <Route path="/" element={<Navigate to="/elections" replace />} />
          {/* <Route path="/" element={<Navigate to="/login" replace />} /> */}
          {/* หน้า Login */}
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<StudentProfile />} />
          <Route path="/applicationPage" element={<StudentApplicationPage />} />
          <Route path="/check-eligibility" element={<CheckEligibilityPage />} />
          <Route path="/my-votes-history" element={<VoteHistory />} />

          {/* <Route
          path="/profile"
          element={
            <RoleGuard allowed={['นักศึกษา']}>
            <StudentProfile />
            </RoleGuard>
            }
            /> */}
          {/* <Route path="/results" element={<ResultsList />} /> */}
          <Route path="/results/:id" element={<ResultDetail />} /> 
          {/* <Route path="/results/:id" element={<ElectionResultsPage />} />  */}

          {/* หน้าเลือกตั้ง */}
          <Route path="/elections" element={<ElectionList />} />
          <Route path="/election/:id" element={<ElectionDetail />} />
          <Route path="/election/:election_id/vote" element={<VotePage />} />

          <Route path="/admin/elections" element={<AdminElectionList />} />
          <Route path="/admin/manage-users" element={<AdminManageUser />} />
          <Route path="/admin/election/:id/eligibility" element={<ManageEligibilityPage />} />
          <Route path="/admin/election/:id/candidate" element={<CandidateList />} />
          <Route path="/admin/dash-board" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;


