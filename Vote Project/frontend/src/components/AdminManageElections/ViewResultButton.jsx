import { useNavigate } from "react-router-dom";

export default function ViewResultButton({ electionId }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/election/${electionId}/result`)}
      className="bg-cyan-500 text-white px-2 py-1 rounded hover:bg-cyan-600"
    >
      ดูผล
    </button>
  );
}
