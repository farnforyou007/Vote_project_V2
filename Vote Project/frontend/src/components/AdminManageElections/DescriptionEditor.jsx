import React, { useRef } from "react";

export default function DescriptionEditor({
    label = "รายละเอียด",
    value,
    onChange,
    required = false,
    error = "",
}) {
    const descRef = useRef(null);

    const setValue = (v) => onChange?.(v);

    const wrapSelection = (before, after = "") => {
        const el = descRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const text = value || "";
        const selected = text.slice(start, end);
        const next = text.slice(0, start) + before + selected + after + text.slice(end);
        setValue(next);
        const pos = start + before.length + selected.length + after.length;
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(pos, pos);
        });
    };

    const makeList = () => {
        const el = descRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const text = value || "";
        const before = text.slice(0, start);
        const selected = text.slice(start, end) || "รายการที่ 1\nรายการที่ 2";
        const after = text.slice(end);
        const transformed = selected
            .split(/\r?\n/)
            .map((line) => (line.trim() ? `- ${line}` : ""))
            .join("\n");
        const next = before + transformed + after;
        setValue(next);
        requestAnimationFrame(() => {
            el.focus();
            const pos = before.length + transformed.length;
            el.setSelectionRange(pos, pos);
        });
    };

    const previewHtml = (value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/_(.+?)_/g, "<em>$1</em>")
        .replace(/^## (.+)$/gm, "<span class='font-semibold text-gray-900'>$1</span>")
        .replace(/^- (.+)$/gm, "• $1");

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            <div className="flex flex-wrap items-center gap-2 mb-2">
                <button type="button" onClick={() => wrapSelection("**", "**")}
                    className="px-2 py-1 text-xs rounded border border-purple-300 hover:bg-purple-50">B</button>
                <button type="button" onClick={() => wrapSelection("_", "_")}
                    className="px-2 py-1 text-xs rounded border border-purple-300 hover:bg-purple-50">I</button>
                <button type="button" onClick={() => wrapSelection("## ")}
                    className="px-2 py-1 text-xs rounded border border-purple-300 hover:bg-purple-50">H2</button>
                <button type="button" onClick={makeList}
                    className="px-2 py-1 text-xs rounded border border-purple-300 hover:bg-purple-50">• List</button>
                <span className="ml-auto text-xs text-gray-500">ขึ้นบรรทัดใหม่/ย่อหน้ารักษาไว้</span>
            </div>

            <textarea
                ref={descRef}
                value={value || ""}
                onChange={(e) => setValue(e.target.value)}
                rows={5}
                placeholder="พิมพ์รายละเอียด เช่น จุดประสงค์ กติกา ช่องทางติดต่อ ฯลฯ"
                className="w-full border border-purple-300 p-3 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                style={{ resize: "vertical" }}
            />
            {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}

            <div className="mt-2 p-3 bg-purple-50 border border-purple-100 rounded">
                <div className="text-xs font-semibold text-purple-700 mb-1">ตัวอย่างการแสดงผล</div>
                <div className="text-sm text-gray-800 whitespace-pre-line leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
        </div>
    );
}
