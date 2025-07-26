export default function ManageVoteButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-lime-500 text-white px-2 py-1 rounded text-xs hover:bg-lime-600"
    >
      สิทธิ์ลงคะแนน
    </button>
  );
}
