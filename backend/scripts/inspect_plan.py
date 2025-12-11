import sys
p = 'backend/mlm/plans/matriz_forzada/plan_template.yml'
with open(p, 'r', encoding='utf-8') as f:
    for i, l in enumerate(f, start=1):
        print(f"{i:03}: {l.rstrip().replace(' ','.').replace('\t','\\t')}")
