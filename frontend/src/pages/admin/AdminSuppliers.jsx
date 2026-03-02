import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';
import SupplierProductsModal from '../../components/suppliers/SupplierProductsModal';
import { useAdmin } from '../../context/AdminContext';

const AdminSuppliers = () => {
    const { globalCountry } = useAdmin();
    const [suppliers, setSuppliers] = useState([]);
    const [formData, setFormData] = useState({
        name: '', contact_name: '', email: '', phone: '', address: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState('');

    // Modal state
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        fetchSuppliers();
    }, [globalCountry]);

    const fetchSuppliers = async () => {
        try {
            const queryParams = new URLSearchParams();
            if (globalCountry && globalCountry !== 'Todos') queryParams.append('country', globalCountry);

            const res = await api.get(`/api/suppliers/?${queryParams.toString()}`);
            setSuppliers(res.data);
        } catch (error) {
            console.error("Error fetching suppliers", error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/api/suppliers/${editingId}`, formData);
                setMessage('Proveedor actualizado exitosamente');
            } else {
                await api.post('/api/suppliers/', formData);
                setMessage('Proveedor creado exitosamente');
            }
            setFormData({ name: '', contact_name: '', email: '', phone: '', address: '' });
            setEditingId(null);
            fetchSuppliers();
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Error al guardar proveedor');
        }
    };

    const handleEdit = (supplier) => {
        setFormData(supplier);
        setEditingId(supplier.id);
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Seguro de eliminar este proveedor?")) {
            try {
                await api.delete(`/api/suppliers/${id}`);
                fetchSuppliers();
                setMessage('Proveedor eliminado');
                setTimeout(() => setMessage(''), 3000);
            } catch (error) {
                setMessage('Error al eliminar');
            }
        }
    };

    const handleOpenProducts = (supplier) => {
        setSelectedSupplier(supplier);
        setModalOpen(true);
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1e3a8a' }}>
                Gestión de Proveedores
            </h2>

            {message && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    borderRadius: '0.5rem',
                    background: message.includes('Error') ? '#fee2e2' : '#d1fae5',
                    color: message.includes('Error') ? '#dc2626' : '#065f46'
                }}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{
                background: 'white', padding: '2rem', borderRadius: '0.5rem',
                marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem'
            }}>
                <div style={{ gridColumn: 'span 2', fontWeight: 'bold', color: '#1e3a8a' }}>
                    {editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </div>

                <input name="name" value={formData.name} onChange={handleChange} placeholder="Nombre Empresa" required style={inputStyle} />
                <input name="contact_name" value={formData.contact_name} onChange={handleChange} placeholder="Nombre Contacto" style={inputStyle} />
                <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" type="email" style={inputStyle} />
                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Teléfono" style={inputStyle} />
                <input name="address" value={formData.address} onChange={handleChange} placeholder="Dirección" style={{ ...inputStyle, gridColumn: 'span 2' }} />

                <button type="submit" style={buttonStyle}>
                    {editingId ? 'Actualizar' : 'Crear'}
                </button>
            </form>

            <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f3f4f6' }}>
                        <tr>
                            <th style={thStyle}>ID</th>
                            <th style={thStyle}>Empresa</th>
                            <th style={thStyle}>Contacto</th>
                            <th style={thStyle}>Email</th>
                            <th style={thStyle}>Teléfono</th>
                            <th style={thStyle}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.map(s => (
                            <tr key={s.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={tdStyle}>{s.id}</td>
                                <td style={tdStyle}>{s.name}</td>
                                <td style={tdStyle}>{s.contact_name}</td>
                                <td style={tdStyle}>{s.email}</td>
                                <td style={tdStyle}>{s.phone}</td>
                                <td style={tdStyle}>
                                    <button onClick={() => handleOpenProducts(s)} style={productsBtnStyle}>📦 Productos</button>
                                    <button onClick={() => handleEdit(s)} style={editBtnStyle}>Editar</button>
                                    <button onClick={() => handleDelete(s.id)} style={delBtnStyle}>Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modalOpen && selectedSupplier && (
                <SupplierProductsModal
                    supplier={selectedSupplier}
                    onClose={() => { setModalOpen(false); setSelectedSupplier(null); }}
                />
            )}
        </div>
    );
};

const inputStyle = { padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' };
const buttonStyle = { gridColumn: 'span 2', background: '#3b82f6', color: 'white', padding: '0.75rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' };
const thStyle = { padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' };
const tdStyle = { padding: '0.75rem' };
const productsBtnStyle = { marginRight: '0.5rem', background: '#8b5cf6', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' };
const editBtnStyle = { marginRight: '0.5rem', background: '#3b82f6', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' };
const delBtnStyle = { background: '#ef4444', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' };

export default AdminSuppliers;
