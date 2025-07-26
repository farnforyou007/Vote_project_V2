export default function VoteButton({ electionId, candidateId }) {
    const handleVote = async () => {
        const res = await fetch(`/api/vote`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("token"),
            },
            body: JSON.stringify({ election_id: electionId, candidate_id: candidateId }),
        });

        const data = await res.json();
        alert(data.message || (data.success ? "ลงคะแนนแล้ว!" : "เกิดข้อผิดพลาด"));
    };

    return <button onClick={handleVote}>🗳 ลงคะแนน</button>;
}
