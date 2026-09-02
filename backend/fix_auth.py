import os

file_path = "routers/auth.py"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# End of forgot_password is around 641
# "    # Always return the same message"
# Let's find exactly where "def forgot_password" ends
# Actually, I know line 641 is:
# "641: "
# "642:     # Always return the same message"
# "643:         if not user:" (broken part starts here)

# Find the line that says "    # Always return the same message"
always_return_idx = -1
for i, line in enumerate(lines):
    if "Always return the same message" in line:
        always_return_idx = i
        break

new_content = "".join(lines[:always_return_idx])

new_content += """    # Always return the same message
    return {"message": "Si el correo existe en nuestro sistema, recibirás un enlace de recuperación en breve."}


@router.post("/reset-password")
def reset_password(data: ResetPasswordData, db: Session = Depends(get_db)):
    \"\"\"Reset password using a valid, non-expired token.\"\"\"
    # Find user by token
    user = db.query(UserModel).filter(UserModel.reset_token == data.token).first()

    if not user:
        raise HTTPException(status_code=400, detail="Token inválido o expirado.")
        
    try:
        # Hash new password
        user.password = pwd_context.hash(data.new_password)
        user.reset_token = None
        db.commit()
        return {"message": "Contraseña actualizada exitosamente."}
    except Exception as e:
        db.rollback()
        print(f"Error resetting password: {e}")
        raise HTTPException(status_code=500, detail="Error al restablecer la contraseña.")
"""

# Find where to resume (line 692 is '# NOTE: The second @router.get("/me") that was here has been REMOVED.')
resume_idx = -1
for i, line in enumerate(lines):
    if "The second @router.get(\"/me\") that was here has been REMOVED" in line:
        resume_idx = i - 1 # Include the empty line before it
        break

new_content += "".join(lines[resume_idx:])

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("File auth.py successfully fixed.")
