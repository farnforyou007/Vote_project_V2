// src/components/elections/EditElectionButton.jsx
export default function EditElectionButton({ onClick }) {
    return (
        <button
            onClick={onClick}
            className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
        >
            แก้ไข
        </button>
    );
}
