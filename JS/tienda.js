const API_URL = 'http://localhost:3000';
let catalogoProductos = []; // Guardamos aquí los productos para no pedirlos todo el rato

document.addEventListener('DOMContentLoaded', async () => { 
    await cargarUsuarios(); 
    await cargarProductos(); 
});

// --- CARGA DE DATOS ---

async function cargarUsuarios() {
    const res = await fetch(`${API_URL}/usuarios`);
    const usuarios = await res.json();
    const select = document.getElementById('usuario-select');
    
    select.innerHTML = '<option value="">-- Seleccione un cliente --</option>';
    usuarios.forEach(u => {
        const option = document.createElement('option');
        option.value = u.id;
        option.textContent = u.nombre;
        select.appendChild(option);
    });
}

async function cargarProductos() {
    const res = await fetch(`${API_URL}/productos`);
    catalogoProductos = await res.json();
    renderizarProductos(catalogoProductos);
}

// --- RENDERIZADO (VISTA) ---

function renderizarProductos(productos) {
    const grid = document.getElementById('grid-productos');
    grid.innerHTML = '';

    productos.forEach(prod => {
        // Pre-cálculo de precios
        const descuento = prod.descuento || 0;
        const precioFinal = prod.precio * (1 - descuento / 100);
        prod.precioFinalCalculado = precioFinal; // Lo guardamos en el objeto para usarlo luego

        // Lógica de visualización
        const imagen = prod.imagen ? `${API_URL}/imagenes/${prod.imagen}` : 'https://via.placeholder.com/150';
        const stockClass = prod.stock <= 0 ? 'sin-stock' : '';
        const textoBoton = prod.stock <= 0 ? 'Agotado' : 'Añadir';
        const disabled = prod.stock <= 0 ? 'disabled' : '';

        // HTML de la tarjeta
        const card = document.createElement('div');
        card.className = `card ${stockClass}`;
        card.innerHTML = `
            <img src="${imagen}" alt="${prod.nombre}">
            <h3>${prod.nombre}</h3>
            
            <div class="precio-wrapper">
                ${descuento > 0 ? `<span class="precio-original">${prod.precio}€</span>` : ''}
                <span class="precio-final">${precioFinal.toFixed(2)}€</span>
                ${descuento > 0 ? `<span class="oferta-badge">-${descuento}%</span>` : ''}
            </div>

            <p style="font-size: 0.8em; color: #666;">Stock: ${prod.stock}</p>

            <div class="input-group">
                <input type="number" id="input-${prod.id}" 
                       min="0" max="${prod.stock}" value="0" 
                       class="cant-input" ${disabled} 
                       onchange="actualizarTotal()">
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- LÓGICA DE CARRITO ---

function actualizarTotal() {
    let total = 0;
    catalogoProductos.forEach(prod => {
        const input = document.getElementById(`input-${prod.id}`);
        if (input) {
            let cantidad = parseInt(input.value) || 0;
            
            // Validación de seguridad (no vender más de lo que hay)
            if (cantidad > prod.stock) {
                cantidad = prod.stock;
                input.value = prod.stock;
                alert(`Solo quedan ${prod.stock} unidades de ${prod.nombre}`);
            }
            if (cantidad < 0) {
                cantidad = 0;
                input.value = 0;
            }

            total += cantidad * prod.precioFinalCalculado;
        }
    });
    
    // Buscar el elemento donde mostrar el total (asegúrate de que exista en tu HTML)
    const display = document.querySelector('.total-display');
    if(display) display.textContent = `Total: ${total.toFixed(2)} €`;
}

async function realizarPedido() {
    const usuarioId = document.getElementById('usuario-select').value;
    if (!usuarioId) return alert("⚠️ ¡Selecciona un cliente!");

    const carrito = [];

    // Recorremos el catálogo para ver qué inputs tienen valor > 0
    catalogoProductos.forEach(prod => {
        const input = document.getElementById(`input-${prod.id}`);
        const cantidad = input ? (parseInt(input.value) || 0) : 0;

        if (cantidad > 0) {
            carrito.push({
                producto_id: prod.id,
                cantidad: cantidad,
                total: cantidad * prod.precioFinalCalculado
            });
        }
    });

    if (carrito.length === 0) return alert("El carrito está vacío.");

    try {
        const res = await fetch(`${API_URL}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: usuarioId, pedidos: carrito })
        });

        const data = await res.json();

        if (res.ok) {
            alert(`✅ Venta registrada con éxito.\nTicket #${data.grupoId}`);
            window.location.reload(); // Recargar para actualizar stock
        } else {
            alert(`❌ Error: ${data.error}`);
        }
    } catch (e) {
        console.error(e);
        alert("Error de conexión con el servidor");
    }
}