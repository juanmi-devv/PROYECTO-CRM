/* =========================================
   CONFIGURACIÓN PRINCIPAL
   ========================================= */
const API_URL = 'http://localhost:3000';

// Cuando la página termine de cargar, ejecutamos la función "iniciar"
document.addEventListener('DOMContentLoaded', iniciarSistema);

async function iniciarSistema() {
    // 1. Pedimos los datos al servidor
    const listaDeudas = await obtenerDeudasDelServidor();
    
    // 2. Agrupamos las deudas sueltas por Ticket (Factura completa)
    const ticketsOrdenados = agruparPorTicket(listaDeudas);
    
    // 3. Pintamos la tabla en la pantalla
    dibujarTabla(ticketsOrdenados);
}

/* =========================================
   FUNCIONES DE LÓGICA (Cerebro)
   ========================================= */

// Función para pedir datos al servidor (API)
async function obtenerDeudasDelServidor() {
    try {
        const respuesta = await fetch(`${API_URL}/deudas`);
        const datos = await respuesta.json(); // Convertimos a JSON usable
        return datos;
    } catch (error) {
        alert("Error: No se pudo conectar con el servidor.");
        return []; // Devolvemos una lista vacía para que no falle nada más
    }
}

// Función para agrupar productos sueltos en Tickets/Facturas
function agruparPorTicket(listaSuelta) {
    const diccionarioTickets = {};

    // Recorremos cada deuda suelta
    listaSuelta.forEach(item => {
        // Usamos el ID del grupo como clave. Si no tiene, inventamos uno.
        const idTicket = item.grupo_id || 'sin_grupo_' + item.id;

        // Si este ticket no existe aún en nuestro diccionario, lo creamos
        if (!diccionarioTickets[idTicket]) {
            diccionarioTickets[idTicket] = {
                grupo_id: idTicket,
                cliente: item.cliente,
                estado: item.estado,
                total: 0,
                productos: [] // Aquí guardaremos los items
            };
        }

        // Añadimos el precio al total del ticket
        diccionarioTickets[idTicket].total += parseFloat(item.total);
        
        // Añadimos el producto a la lista del ticket
        diccionarioTickets[idTicket].productos.push(item);
    });

    // Devolvemos solo los valores (los tickets ya montados)
    return Object.values(diccionarioTickets);
}

/* =========================================
   FUNCIONES DE PANTALLA (Vista)
   ========================================= */

function dibujarTabla(listaTickets) {
    const tablaCuerpo = document.getElementById('lista-deudas');
    const tablaCompleta = document.getElementById('tabla-deudas');
    const mensajeVacio = document.getElementById('mensaje-vacio');

    // 1. Limpiamos la tabla por si había datos viejos
    tablaCuerpo.innerHTML = '';

    // 2. Filtramos: Solo queremos ver lo que NO está pagado
    const ticketsPendientes = listaTickets.filter(ticket => ticket.estado !== 'pagado');

    // 3. COMPROBACIÓN: ¿Hay deudas pendientes?
    if (ticketsPendientes.length === 0) {
        // Si NO hay deudas: Ocultamos tabla y mostramos mensaje de felicitación
        tablaCompleta.style.display = 'none';
        mensajeVacio.style.display = 'block';
        return; // Terminamos aquí, no hay nada que dibujar
    } else {
        // Si SÍ hay deudas: Mostramos tabla y ocultamos mensaje
        tablaCompleta.style.display = 'table';
        mensajeVacio.style.display = 'none';
    }

    // 4. Dibujamos cada fila
    ticketsPendientes.forEach(ticket => {
        // Creamos una fila nueva (tr)
        const fila = document.createElement('tr');
        
        // Preparamos el resumen de productos (ej: "3 artículos...")
        const cantidadArticulos = ticket.productos.length;
        // Cogemos los nombres de los productos y los unimos con comas
        const nombresProductos = ticket.productos.map(p => p.producto).join(', ');

        // Rellenamos el HTML de la fila
        fila.innerHTML = `
            <td>#${ticket.grupo_id}</td>
            
            <td style="text-align: left;"><strong>${ticket.cliente}</strong></td>
            
            <td style="text-align: left;">
                <div style="font-weight:bold; color:white;">${cantidadArticulos} artículos</div>
                <div style="font-size:0.85em; color:#999;">${nombresProductos}</div>
            </td>

            <td style="text-align: right; color:#10b981; font-weight:bold;">
                ${ticket.total.toFixed(2)} €
            </td>
            
            <td style="text-align: center;">
                <span class="badge-pendiente">${ticket.estado}</span>
            </td>
            
            <td style="text-align: right;">
                <button class="btn-pdf" onclick="crearPDF('${ticket.grupo_id}')">📄 PDF</button>
                <button class="btn-pagar" onclick="cobrarTicket('${ticket.grupo_id}')">💰 Pagar</button>
            </td>
        `;

        // Añadimos la fila a la tabla
        tablaCuerpo.appendChild(fila);

        // Guardamos los datos del ticket en la memoria del navegador 
        // para usarlos luego al crear el PDF
        window['ticket_guardado_' + ticket.grupo_id] = ticket;
    });
}

/* =========================================
   ACCIONES (Botones)
   ========================================= */

async function cobrarTicket(idTicket) {
    // Preguntamos confirmación
    const confirmado = confirm("¿Seguro que quieres marcar este ticket como PAGADO?");
    
    if (confirmado) {
        try {
            // Avisamos al servidor
            await fetch(`${API_URL}/pagar-grupo/${idTicket}`, { method: 'PUT' });
            // Si todo va bien, recargamos la pantalla
            iniciarSistema();
        } catch (error) {
            alert("Error al intentar cobrar.");
        }
    }
}

function crearPDF(idTicket) {
    // Recuperamos los datos que guardamos antes
    const ticket = window['ticket_guardado_' + idTicket];
    
    if (!ticket) return; // Si no hay datos, salimos

    // Rellenamos la plantilla oculta del PDF con los datos reales
    document.getElementById('pdf-id').textContent = '#' + ticket.grupo_id;
    document.getElementById('pdf-cliente').textContent = ticket.cliente;
    document.getElementById('pdf-fecha').textContent = new Date().toLocaleDateString();
    document.getElementById('pdf-total-final').textContent = ticket.total.toFixed(2) + ' €';

    // Rellenamos la tabla interior del PDF
    const cuerpoTablaPDF = document.querySelector('#invoice-template tbody');
    cuerpoTablaPDF.innerHTML = ticket.productos.map(item => `
        <tr>
            <td style="padding:10px; border-bottom:1px solid #ddd;">${item.producto}</td>
            <td style="text-align:center; border-bottom:1px solid #ddd;">${item.cantidad || 1}</td>
            <td style="text-align:right; border-bottom:1px solid #ddd;">${Number(item.total).toFixed(2)} €</td>
        </tr>
    `).join('');

    // Mostramos temporalmente la plantilla, generamos PDF y la ocultamos
    const elementoPDF = document.getElementById('invoice-template');
    elementoPDF.style.display = 'block';
    
    html2pdf().from(elementoPDF).save(`Factura_${idTicket}.pdf`).then(() => {
        elementoPDF.style.display = 'none'; // Volvemos a ocultar
    });
}