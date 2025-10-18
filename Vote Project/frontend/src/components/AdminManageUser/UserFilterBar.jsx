// src/components/AdminManageUser/UserFilterBar.jsx
export default function UserFilterBar({
    search, setSearch,
    selectedDept, setSelectedDept,
    selectedYear, setSelectedYear,
    selectedLevel, setSelectedLevel,
    rowsPerPage, setRowsPerPage,
    departments, years, levels,
    onAddUserClick
}) {
    return (
        <div className="flex flex-wrap gap-4 mb-4 items-center">
            <select value={rowsPerPage} onChange={e => setRowsPerPage(parseInt(e.target.value))}
                className="border p-2 rounded bg-violet-50 border-violet-300">
                {[5, 10, 20, 50].map(n => 
                    <option key={n} 
                        value={n}>{n} 
                        แถว
                    </option>)}
            </select>

            <select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)}
                className="border p-2 rounded bg-violet-50 border-violet-300">
                <option value="">เลือกระดับการศึกษา</option>
                {levels.map(l => 
                    <option 
                        key={l.level_id} 
                        value={l.level_id}>
                            {l.level_name}
                    </option>)}
            </select>

            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                className="border p-2 rounded bg-violet-50 border-violet-300">
          
                <option value="">เลือกชั้นปี</option>
                {years.filter(y => !selectedLevel || y.level_id === parseInt(selectedLevel))
                    .map(y => 
                    <option 
                        key={y.year_id} 
                        value={y.year_id}>
                            {y.year_name}
                </option>)}
            </select>

            <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)}
                className="border p-2 rounded bg-violet-50 border-violet-300">
                <option value="">เลือกแผนก</option>
                {departments.map(d => 
                    <option key={d.department_id} 
                            value={d.department_id}>
                                {d.department_name}
                    </option>)}
            </select>

            <input type="text" placeholder="ค้นหาชื่อหรือรหัส"
                value={search} 
                onChange={e => 
                    setSearch(e.target.value)}
                className="p-2 rounded flex-1 bg-violet-50 border border-violet-300" />

            <button onClick={onAddUserClick}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 font-semibold">
                + เพิ่มผู้ใช้งาน
            </button>
        </div>
    );
}



