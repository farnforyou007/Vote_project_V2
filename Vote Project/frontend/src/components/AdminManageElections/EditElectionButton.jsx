// src/components/elections/EditElectionButton.jsx
import { FaEdit } from "react-icons/fa";

export default function EditElectionButton({ onClick }) {
    return (
        <button
            onClick={onClick}
            className="bg-yellow-500 text-white px-2 py-1 rounded  hover:bg-yellow-600"
            
        >
            <FaEdit className="inline" size={13}/> แก้ไข
        </button>
    );
}
