# Cómo Obtener la URL Correcta de Imgur

## ❌ Problema Común

Cuando subes una imagen a Imgur, te da una URL como esta:
```
https://imgur.com/pEJAsc7
```

Esta es la URL de la **PÁGINA**, no de la imagen directa. Por eso no funciona.

## ✅ Solución: Obtener la URL Directa

### Método 1: Hacer clic derecho en la imagen

1. Ve a la página de tu imagen en Imgur (ej: `https://imgur.com/pEJAsc7`)
2. **Haz clic derecho** sobre la imagen
3. Selecciona **"Copiar dirección de imagen"** o **"Copy image address"**
4. La URL correcta se verá así: `https://i.imgur.com/pEJAsc7.jpg`

### Método 2: Agregar "i." y la extensión manualmente

Si tienes esta URL:
```
https://imgur.com/pEJAsc7
```

Conviértela a:
```
https://i.imgur.com/pEJAsc7.jpg
```

**Cambios:**
1. Agrega `i.` antes de `imgur.com`
2. Agrega `.jpg` al final (o `.png` si es PNG)

### Método 3: Usar el botón "Get share links"

1. En la página de tu imagen en Imgur
2. Haz clic en el botón de compartir (share)
3. Busca "Direct Link" o "BBCode"
4. Copia esa URL

## 🔧 URLs Corregidas para tus Productos

### Producto 1: INFACTOR MELENA DE LEÓN
- ❌ URL incorrecta: `https://imgur.com/a/9sHHBU5`
- ✅ URL correcta: `https://i.imgur.com/9sHHBU5.jpg`

**NOTA:** Si es un álbum (`/a/`), necesitas la URL de UNA imagen específica del álbum.

### Producto 2: LIMPIAP BOLSA
- ❌ URL incorrecta: `https://imgur.com/pEJAsc7`
- ✅ URL correcta: `https://i.imgur.com/pEJAsc7.jpg`

## 📝 Cómo Actualizar tus Productos

1. Ve a `http://localhost:5173/admin`
2. Busca el producto "LIMPIAP BOLSA"
3. Haz clic en "✏️ Editar"
4. Cambia la URL de:
   - `https://imgur.com/pEJAsc7`
   - A: `https://i.imgur.com/pEJAsc7.jpg`
5. Guarda los cambios

Repite para el otro producto.

## ✅ Formato Correcto de URLs

```
✅ https://i.imgur.com/ABC123.jpg
✅ https://i.imgur.com/ABC123.png
✅ https://i.imgur.com/ABC123.gif

❌ https://imgur.com/ABC123
❌ https://imgur.com/a/ABC123
❌ https://imgur.com/gallery/ABC123
```

## 🎯 Prueba Rápida

Para verificar si tu URL es correcta:
1. Pégala en una nueva pestaña del navegador
2. Si ves SOLO la imagen (sin la interfaz de Imgur), ¡está correcta!
3. Si ves la página de Imgur con botones y menús, está incorrecta.
