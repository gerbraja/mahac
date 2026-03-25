import os

file_path = r"c:\Users\mahac\multinivel\tiendavirtual\miweb\CentroComercialTEI\frontend\src\pages\SupplierInventory.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update fetchInventory
old_fetch = "            setProducts(res.data.products);"
new_fetch = """            const loadedProducts = res.data.products.map(p => {
                let parsedOptions = null;
                let variant_stock = {};
                if (p.options) {
                    try {
                        const optObj = JSON.parse(p.options);
                        const key = Object.keys(optObj)[0];
                        if (key && optObj[key].length > 0) {
                            parsedOptions = { name: key, values: optObj[key] };
                            if (p.variant_stock) {
                                variant_stock = JSON.parse(p.variant_stock);
                            } else {
                                optObj[key].forEach(v => { variant_stock[v] = 0; });
                            }
                        }
                    } catch(e) {}
                }
                return { ...p, parsedOptions, variant_stock };
            });
            setProducts(loadedProducts);"""
content = content.replace(old_fetch, new_fetch)

# 2. Add handleVariantStockChange
old_handler = """    const handleStockChange = (productId, newStock) => {
        setProducts(products.map(p => 
            p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p
        ));
    };"""
new_handler = old_handler + """

    const handleVariantStockChange = (productId, variant, newStock) => {
        setProducts(products.map(p => {
            if (p.id === productId) {
                const maxStock = Math.max(0, newStock);
                const updatedVariantStock = { ...p.variant_stock, [variant]: maxStock };
                const totalStock = Object.values(updatedVariantStock).reduce((sum, qty) => sum + (parseInt(qty) || 0), 0);
                return { ...p, variant_stock: updatedVariantStock, stock: totalStock };
            }
            return p;
        }));
    };"""
content = content.replace(old_handler, new_handler)

# 3. Update handleSave
old_save = """            const updates = products.map(p => ({
                product_id: p.id,
                stock: p.stock
            }));"""
new_save = """            const updates = products.map(p => ({
                product_id: p.id,
                stock: p.stock,
                variant_stock: p.parsedOptions ? p.variant_stock : null
            }));"""
content = content.replace(old_save, new_save)

# 4. Update the render UI
old_render = """                                {/* Stock Control */}
                                <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: '0.5rem', padding: '0.25rem', border: '1px solid #e2e8f0' }}>"""
# Ensure we only replace what we want cleanly by using a marker
target_index = content.find(old_render)
if target_index != -1:
    end_render = content.find("</div>\n                            </div>\n                        ))\n                    )}", target_index)
    if end_render != -1:
        # Reconstruct exactly what we want
        new_ui = """                                {/* Stock Control */}
                                {product.parsedOptions ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '220px' }}>
                                        {product.parsedOptions.values.map(variant => (
                                            <div key={variant} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: '0.5rem', padding: '0.25rem 0.5rem', border: '1px solid #e2e8f0' }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>{product.parsedOptions.name}: {variant}</span>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <button onClick={() => handleVariantStockChange(product.id, variant, (product.variant_stock[variant] || 0) - 1)} style={{ width: '30px', height: '30px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid #cbd5e1', borderRadius: '0.375rem', cursor: 'pointer', color: '#0f172a' }}>-</button>
                                                    <input type="number" value={product.variant_stock[variant] || 0} onChange={(e) => handleVariantStockChange(product.id, variant, parseInt(e.target.value) || 0)} style={{ width: '40px', height: '30px', textAlign: 'center', fontSize: '1rem', fontWeight: 'bold', border: 'none', background: 'transparent', color: '#0f172a' }} />
                                                    <button onClick={() => handleVariantStockChange(product.id, variant, (product.variant_stock[variant] || 0) + 1)} style={{ width: '30px', height: '30px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid #cbd5e1', borderRadius: '0.375rem', cursor: 'pointer', color: '#0f172a' }}>+</button>
                                                </div>
                                            </div>
                                        ))}
                                        <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>Stock Multi-Talla Global: {product.stock}</div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: '0.5rem', padding: '0.25rem', border: '1px solid #e2e8f0' }}>
                                        <button 
                                            onClick={() => handleStockChange(product.id, product.stock - 1)}
                                            style={{ width: '40px', height: '40px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid #cbd5e1', borderRadius: '0.375rem', cursor: 'pointer', color: '#0f172a' }}
                                        >
                                            -
                                        </button>
                                        <input 
                                            type="number"
                                            value={product.stock}
                                            onChange={(e) => handleStockChange(product.id, parseInt(e.target.value) || 0)}
                                            style={{ width: '60px', height: '40px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold', border: 'none', background: 'transparent', color: '#0f172a' }}
                                        />
                                        <button 
                                            onClick={() => handleStockChange(product.id, product.stock + 1)}
                                            style={{ width: '40px', height: '40px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid #cbd5e1', borderRadius: '0.375rem', cursor: 'pointer', color: '#0f172a' }}
                                        >
                                            +
                                        </button>
                                    </div>
                                )}"""
        # Exclude the exact </div> at the end to match string
        content = content[:target_index] + new_ui + content[end_render:]
        print("UI Replacement successful.")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
