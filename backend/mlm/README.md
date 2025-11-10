MLM plans directory

Place plan definition files under `backend/mlm/plans/<plan_name>/`.
Accepted formats: YAML (.yml/.yaml) or JSON (.json).

Each plan folder contains:
- plan_template.yml  (a template you can copy and fill)
- README.md (this file)

When you upload a plan file, name it clearly (e.g. `unilevel_v1.yml`).
A future import tool will read these files from `backend/mlm/plans/` and register the plan into the system.

If you want, I can add an import endpoint or a CLI that loads these files into the database and validates them.
