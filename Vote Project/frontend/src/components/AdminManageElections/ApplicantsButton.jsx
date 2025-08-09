import { useNavigate } from "react-router-dom";

export default function ApplicantsButton({ electionId }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/admin/election/${electionId}/candidate`)}
      className="bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
    >
      ผู้สมัคร
    </button>
  );
}
