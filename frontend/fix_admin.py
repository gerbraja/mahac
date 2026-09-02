import os

file_path = "src/pages/admin/AdminUsers.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_content = "".join(lines[:709])

ending = """                            {/* Admin Role Section - only visible to superadmin */}
                            {isSuperAdmin && (
                                <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem', border: '1px solid #fcd34d' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: '#92400e' }}>
                                        👑 Rol de Administrador
                                    </label>
                                    <select
                                        value={formData.admin_role}
                                        onChange={(e) => setFormData({ ...formData, admin_role: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid #fcd34d',
                                            borderRadius: '0.5rem',
                                            background: 'white',
                                            marginBottom: '0.75rem'
                                        }}
                                    >
                                        <option value="user">👤 Usuario Normal (sin rol admin)</option>
                                        <option value="superadmin">🌟 Super Admin (acceso global)</option>
                                        <option value="country_admin">🗺️ Admin por País (acceso restringido)</option>
                                    </select>

                                    {formData.admin_role === 'country_admin' && (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#92400e' }}>
                                                📍 País Asignado
                                            </label>
                                            <select
                                                value={formData.admin_country}
                                                onChange={(e) => setFormData({ ...formData, admin_country: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    border: '1px solid #fcd34d',
                                                    borderRadius: '0.5rem',
                                                    background: 'white'
                                                }}
                                            >
                                                <option value="">-- Seleccionar País --</option>
                                                {countries.filter(c => c !== 'Todos').map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <p style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.5rem' }}>
                                        ⚠️ Cambiar el rol también requiere marcar <strong>is_admin = true</strong> manualmente en la base de datos si el usuario aún no lo es.
                                    </p>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        background: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                >
                                    Guardar Cambios
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        background: '#6b7280',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
export default AdminUsers;
"""

new_content += ending

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("File AdminUsers.jsx successfully rewritten.")
