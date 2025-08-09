import { toast } from "react-toastify";

export const confirmToast = (message, onConfirm) => {
    const id = toast(
        ({ closeToast }) => (
            <div>
                <p>{message}</p>
                <div className="mt-2 flex gap-2 justify-end">
                    <button
                        className="px-3 py-1 bg-red-500 text-white rounded"
                        onClick={() => {
                            onConfirm();       // ✅ ทำงาน callback
                            toast.dismiss(id); // ✅ ปิด toast นี้
                        }}
                    >
                        ยืนยัน
                    </button>
                    <button
                        className="px-3 py-1 bg-gray-300 text-gray-800 rounded"
                        onClick={() => toast.dismiss(id)}
                    >
                        ยกเลิก
                    </button>
                </div>
            </div>
        ),
        {
            autoClose: false,
            closeOnClick: false
        }
    );
};
