import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath('backend')))
from backend.database.connection import SessionLocal
from backend.routers.auth import forgot_password, ForgotPasswordData
from fastapi import BackgroundTasks

db = SessionLocal()
bg_tasks = BackgroundTasks()
data = ForgotPasswordData(email="gerbraja@gmail.com")

print("Ejecutando forgot_password localmente pero contra prod DB...")
try:
    res = forgot_password(data, bg_tasks, db)
    print("Respuesta:", res)
    print("Tareas en background planificadas:", len(bg_tasks.tasks))
    for task in bg_tasks.tasks:
        print(" -> Ejecutando tarea manualmente:", task.func.__name__)
        task.func(*task.args, **task.kwargs)
        print(" -> Ejecucion exitosa.")
except Exception as e:
    import traceback
    print("ERROR CAPTURADO:")
    traceback.print_exc()
finally:
    db.close()
