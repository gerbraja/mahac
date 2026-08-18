from backend.database.connection import SessionLocal
from backend.database.models.qualified_rank import QualifiedRank

db = SessionLocal()
ranks = db.query(QualifiedRank).order_by(QualifiedRank.id).all()

output = []
for r in ranks:
    line = f"ID: {r.id} | Name: {r.name} | MatrixIDRequired: {r.matrix_id_required} | Reward: {r.reward_amount} | Monthly: {r.monthly_limit} | Semester: {r.semester_limit} | Yearly: {r.yearly_limit}"
    print(line, flush=True)
    output.append(line)

with open("backend/ranks_output.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(output))

if not ranks:
    print("NO RANKS FOUND IN DATABASE", flush=True)
    with open("backend/ranks_output.txt", "w", encoding="utf-8") as f:
        f.write("NO RANKS FOUND")

db.close()
