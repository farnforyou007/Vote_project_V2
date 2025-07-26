// import logo from './logo.svg';
// import Login from "./Login";


// // function App() {
// //   return (
// //     <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-indigo-500 to-pink-500">
// //       <h1 className="text-3xl font-bold underline">
// //         Hello Tailwind CSS!
// //       </h1>
// //     </div>
// //   );
// // }


// function App() {
//   return <Login />;
// }



// export default App;

// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Login from "./Login";
// import ElectionList from "./ElectionList";

// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Login />} />
//         <Route path="/elections" element={<ElectionList />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import ElectionList from "./ElectionList";
import ElectionDetail from "./ElectionDetail";
import AdminElectionList from "./pages/AdminElectionList";
import AdminManageUser  from "./pages/AdminManageUser";
function App() {
  return (
    
    <Router>
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


