const API_URL = 'http://localhost:3000';
let productos = [];

window.onload = async () => {
    await Promise.all([cargarUsuarios(), cargarProductos()]);
};

// 1. CARGAR USUARIOS
async function cargarUsuarios() {
    try {
        const res = await fetch(`${API_URL}/usuarios`);
        const users = await res.json();
        
        // Creamos las opciones del select
        const options = users.map(u => `<option value="${u.id}">${u.nombre}</option>`).join('');
        document.getElementById('select-usuario').innerHTML = '<option value="">Selecciona quién eres...</option>' + options;
    } catch (e) { 
        console.error("Error cargando usuarios", e);
        document.getElementById('select-usuario').innerHTML = '<option>Error al cargar</option>';
    }
}

// 2. CARGAR PRODUCTOS Y PINTAR TABLA
async function cargarProductos() {
    try {
        const res = await fetch(`${API_URL}/productos`);
        productos = await res.json();

        const tbody = document.querySelector('#tabla-productos tbody');

        if (!productos.length) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">No hay productos disponibles.</td></tr>';
            return;
        }

        // Generamos las filas de la tabla
        const filasHTML = productos.map(p => {
            // Calcular precio con descuento si lo hay
            const descuento = p.descuento || 0;
            p.precioFinal = p.precio * (1 - descuento / 100);
            
            const precioHTML = descuento > 0 
                ? `<div style="line-height:1.2"><s style="color:#777; font-size:0.8em">${p.precio}€</s><br><b style="color:#e74c3c">${p.precioFinal.toFixed(2)}€</b></div>`
                : `<b>${p.precio}€</b>`;

            if (p.stock <= 0) {
                accionHTML = '<span style="color:#e74c3c; font-weight:bold; font-size:0.9em;">AGOTADO</span>';
            } else {
                // AQUÍ ESTABA EL ERROR: Faltaba class="cant-input"
                accionHTML = `
                <div class="stepper">
                    <button class="btn-step" onclick="cambiarCant(${p.id}, -1)">−</button>
                    <input type="number" class="cant-input" id="cant-${p.id}" value="0" readonly>
                    <button class="btn-step" onclick="cambiarCant(${p.id}, 1)">+</button>
                </div>`;
            }

// ...
            // Aquí asignamos las clases que el CSS está buscando (.col-info, .col-precio, etc.)
            return `
            <tr>
                <td class="col-info">
                    <div style="font-weight:600;">${p.nombre}</div>
                </td>
                <td class="col-precio">${precioHTML}</td>
                <td class="col-stock">${p.stock}</td>
                <td class="col-accion">${accionHTML}</td>
            </tr>`;
        }).join('');

        tbody.innerHTML = filasHTML;

    } catch (error) {
        console.error("Error cargando productos:", error);
    }
}

// 3. FUNCIONES DE LOS BOTONES (+ / -)
window.cambiarCant = function(id, delta) {
    const input = document.getElementById(`cant-${id}`);
    const producto = productos.find(p => p.id === id);
    
    if (!input || !producto) return;

    let valorActual = parseInt(input.value) || 0;
    let nuevoValor = valorActual + delta;

    // Límites: No bajar de 0 y no subir más que el stock
    if (nuevoValor >= 0 && nuevoValor <= producto.stock) {
        input.value = nuevoValor;
        calcularTotal();
    }
};

// 4. CALCULAR TOTAL EN TIEMPO REAL
function calcularTotal() {
    let total = 0;
    productos.forEach(p => {
        const input = document.getElementById(`cant-${p.id}`);
        if (input) {
            const cantidad = parseInt(input.value) || 0;
            total += cantidad * p.precioFinal;
        }
    });
    document.getElementById('total-display').innerText = total.toFixed(2) + ' €';
}

// 5. ENVIAR PEDIDO AL SERVIDOR (CHECKOUT)
window.realizarPedido = async function() {
    const usuarioId = document.getElementById('select-usuario').value;
    
    if (!usuarioId) {
        alert("⚠️ Por favor, selecciona un cliente antes de pedir.");
        return;
    }

    // Recopilar qué se ha pedido
    const pedidos = productos
        .map(p => {
            const input = document.getElementById(`cant-${p.id}`);
            const cantidad = input ? (parseInt(input.value) || 0) : 0;
            return { 
                producto_id: p.id, 
                cantidad: cantidad, 
                total: cantidad * p.precioFinal 
            };
        })
        .filter(item => item.cantidad > 0); // Solo enviamos lo que tenga cantidad > 0

    if (pedidos.length === 0) {
        alert("El carrito está vacío. Añade algún producto.");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: usuarioId, pedidos })
        });

        const data = await res.json();

        if (res.ok) {
            alert(`✅ ¡Pedido realizado! Ticket #${data.grupoId}`);
            window.location.reload(); // Recargar para actualizar stock
        } else {
            alert("❌ Error: " + (data.error || "No se pudo procesar"));
        }

    } catch (error) {
        console.error("Error checkout:", error);
        alert("❌ Error de conexión con el servidor");
    }
};