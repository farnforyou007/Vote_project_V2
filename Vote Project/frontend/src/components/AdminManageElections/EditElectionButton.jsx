// src/components/elections/EditElectionButton.jsx
import { FaEdit } from "react-icons/fa";

export default function EditElectionButton({ onClick }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1 bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
        >
            <FaEdit size={14} />
            แก้ไข
        </button>

    );
}
