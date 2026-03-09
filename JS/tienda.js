const API_URL = 'http://localhost:3000'; // Creación de una constante llamada API_URL que hace referencia de forma local al servidor local
// su objetivo es hacer peticiones HTTP al servidor que se ejecuta en server.js
let catalogoProductos = []; // Guardar los productos en esta variable que empieza vacía y cuando se vayan guardando productos, estos
// se van a guardar en dicha variable (catalogoProductos) es un array vacío.

document.addEventListener('DOMContentLoaded', async () => { // Escucha el evento  "DOMContentLoaded" para ejecutar este código
// solo cuando el HTML de la página ya se ha cargado completamente.
// La función es "async" para poder usar "await" dentro y esperar
// a que se completen tareas como cargar datos desde un servidor.
    

    await cargarUsuarios();     // Relación con DOMContentLoaded: Cuando la página ya está cargada, se ejecuta esta línea y se espera a que los usuarios se carguen completamente antes de continuar.
    // Llama a la función que carga los usuarios y espera a que termine
    // antes de continuar con el resto del código
    
    await cargarProductos();    // Esta línea llama a la función cargarProductos, con el objetivo 
    // de que hasta que no carguen los productos no se puede ejecutar nada más.
    // Una vez cargados los productos se puede seguir ejecutando el código que venga despues de dicha función.
});

// Función asíncrona que se encarga de cargar a los usuarios  desde la API y rellena el <select id="usuario-select">

async function cargarUsuarios() {
    const res = await fetch(`${API_URL}/usuarios`); // Pide la lista de usuarios al servidor (pausa aquí hasta que llegue la respuesta)
    
    const usuarios = await res.json(); // onvierte la respuesta JSON a un array/objeto de JavaScript (pausa hasta que lo convierta).
    
    const select = document.getElementById('usuario-select'); // Busca el <select> en el DOM donde se van a poner las opciones.
    
    select.innerHTML = '<option value="">-- Seleccione un cliente --</option>'; // Pon una opción inicial guía y limpia lo anterior
    
    usuarios.forEach(u => { // Por cada usuario que haya en la base de datos
        // se crear una opción en el html y la añade al apartado en el que se selecciona el usuario.
        const option = document.createElement('option'); // Crea la opción en el HTML.
        option.value = u.id; // Identificador del usuario.
        option.textContent = u.nombre; // Añade el nombre del usuario a partir de la base de datos.
        select.appendChild(option); // lo añade al DOM.
    });
}                                   // Fin de la función.

/* Declaración de la función asíncrona cargarProductos
esta cargará todos los productos que se hayan añadido a la base de datos.
*/
async function cargarProductos() { // Función asíncrona que se encarga de pedir los productos al servidor
// "async" indica que la función puede usar "await" para esperar resultados.
    const res = await fetch(`${API_URL}/productos`); // Hace una petición al servidor a la ruta /productos usando la URL base de la API.
    // "await" hace que el programa espere a que el servidor responda.
    catalogoProductos = await res.json();  // Convierte la respuesta del servidor (en formato JSON) a un array de JavaScript.
    //  El resultado se guarda en la variable global "catalogoProductos".
    renderizarProductos(catalogoProductos);  //  Llama a la función que se encarga de mostrar los productos en la página,
    // pasándole como argumento el catálogo de productos ya cargado.
}

// --- RENDERIZADO ---

function renderizarProductos(productos) { // Definimos la función que recibe la lista de datos (array de objetos 'productos').
    // Además, también se define el parámetro productos al que se le asignaran valores posteriormente.
    const grid = document.getElementById('grid-productos'); // Buscamos en el HTML el elemento contenedor (div) donde vamos a "pintar" los productos.
    grid.innerHTML = '';  // Borramos todo el contenido previo del contenedor para no duplicar productos al recargar

    productos.forEach(prod => { // Recorremos el array de productos uno por uno (la variable 'prod' representa el producto actual)
        // Pre-cálculo de precios
        const descuento = prod.descuento || 0; // Si el producto tiene descuento lo usamos, si es null o undefined asumimos que es 0.
        const precioFinal = prod.precio * (1 - descuento / 100); // Calculamos el precio restando el porcentaje. Ejemplo: 100 * (1 - 0.20) = 80.
        prod.precioFinalCalculado = precioFinal; // Lo guardamos en el objeto para usarlo luego

        // Lógica de visualización

        // Operador ternario: ¿Existe prod.imagen? 
        // SÍ: Construye la ruta completa con la API. 
        // NO: Usa una imagen genérica (placeholder) para que no se vea roto.
                                        // En caso de que se cumpla ⬇️       en caso de que no se cumpla ⬇️
        const imagen = prod.imagen ? `${API_URL}/imagenes/${prod.imagen}` : 'https://via.placeholder.com/150';
        
        // Si el stock es 0 o menor, asignamos la clase CSS 'sin-stock' para ponerlo en gris/opaco

        const stockClass = prod.stock <= 0 ? 'sin-stock' : '';

        // (Variable auxiliar) Si no hay stock diría 'Agotado', si hay diría 'Añadir' 
        // (Nota: esta variable se define pero no se está usando en el HTML de abajo, que usa un input numérico)

        const textoBoton = prod.stock <= 0 ? 'Agotado' : 'Añadir';

        // Si no hay stock, creamos el atributo 'disabled' para bloquear el input numérico.

        const disabled = prod.stock <= 0 ? 'disabled' : '';

        // HTML de la tarjeta
        const card = document.createElement('div');  // Creamos un nuevo elemento <div> en memoria (todavía no está en la pantalla).
        card.className = `card ${stockClass}`;   // Le asignamos la clase base 'card' y la clase dinámica de stock (ej: "card sin-stock")
        // Definimos el contenido HTML interno de esa tarjeta usando "template literals" (las comillas invertidas `)
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
        // Finalmente, insertamos la tarjeta recién creada dentro del grid principal.
        grid.appendChild(card);
    });
}

// --- LÓGICA DE CARRITO ---

function actualizarTotal() { // Definimos la función. Esta es la que se ejecuta cada vez que alguien cambia un número en los inputs.
    let total = 0; // Creamos una variable "caja fuerte" que empieza en 0. Aquí iremos acumulando el dinero de cada producto.
    
    // ¡OJO! Aquí usamos 'catalogoProductos'. Esta variable NO está dentro de la función, 
    // es una variable GLOBAL (definida fuera) que contiene la lista maestra de todos tus datos.
    // El 'forEach' significa: "Voy a repasar esa lista producto por producto".

    catalogoProductos.forEach(prod => {

        const input = document.getElementById(`input-${prod.id}`); // Buscamos en el HTML el cuadradito (input) específico de ESTE producto.
        // Usamos el ID único (ej: 'input-1', 'input-2') para no confundirnos de producto.
        if (input) {  // Verificación de seguridad: ¿Existe realmente ese input en la pantalla?
            // Si por lo que sea el producto está en la lista de datos pero no se pintó en el HTML, esto evita errores.
            
            // Leemos lo que el usuario escribió en el input (.value).
            // 'parseInt': Convierte el texto "3" en el número 3.
            // '|| 0': Es un truco. Significa: "Si el campo está vacío o no es un número, trata esto como un 0".
            
            let cantidad = parseInt(input.value) || 0;  
            
            // Validación de seguridad (no vender más de lo que hay)
            if (cantidad > prod.stock) { // Comprobamos si el usuario intenta comprar más unidades de las que hay en el almacén (stock).
                cantidad = prod.stock;  // Si se pasa, forzamos que la cantidad interna sea igual al máximo de stock disponible.
                input.value = prod.stock; // // También cambiamos lo que se ve en la pantalla para corregir al usuario visualmente.
                alert(`Solo quedan ${prod.stock} unidades de ${prod.nombre}`);  // Le lanzamos un aviso molesto (popup) para explicarle por qué le hemos cambiado el número.
            } // Cierre del if de stock máximo.
            
            
            // Comprobamos si el usuario intenta poner números negativos (ej: -5) 
            // para intentar que le paguemos nosotros.
            if (cantidad < 0) { 
                cantidad = 0; // Si es negativo, forzamos la cantidad interna a 0.
                input.value = 0;  // Corregimos el número en la pantalla para que muestre un 0.
            } // Cierre del if de negativos

            // --- CÁLCULO FINAL DE ESTE PRODUCTO ---

            // Multiplicamos la cantidad (ya validada/corregida) por el precio (que guardamos antes en el objeto).
            // 'total +=' significa: "Lo que ya tenías en la variable total, SÚMALE esto nuevo".

            total += cantidad * prod.precioFinalCalculado;  
        } // Cierre del if (input).
    });     // Cierre del bucle forEach (aquí termina de revisar todos los productos).
    
    // --- ACTUALIZACIÓN VISUAL DEL TOTAL ---

    // Buscar el elemento donde mostrar el total (asegúrate de que exista en tu HTML).

    const display = document.querySelector('.total-display');

    // Si encontramos ese sitio en el HTML...

    if (display) {
        // ...cambiamos su texto.
        // `toFixed(2)` es VITAL: obliga a que el número tenga siempre 2 decimales (ej: 10.50 en vez de 10.5).

    display.textContent = `Total: ${total.toFixed(2)} €`;
    }
} // fin de la función.

// Esta función es asíncrona (async), lo que significa que JavaScript sabe que en algún momento tendrá
// que "pausarse" para esperar una respuesta de internet (el servidor) antes de continuar.

async function realizarPedido() { // Definimos la función con 'async'. 
// Esto habilita el uso de 'await' dentro para esperar respuestas de red.
    

    // Vamos al HTML y buscamos el desplegable (select) donde se elige al cliente.
    // .value: Nos da el ID del cliente seleccionado (ej: "5").
    const usuarioId = document.getElementById('usuario-select').value; 

    // Validación: Si el valor está vacío (nadie seleccionó nada), cortamos la ejecución.
    // 'return' hace que la función se detenga aquí mismo.
    if (!usuarioId) return alert("⚠️ ¡Selecciona un cliente!");
    
    // Creamos un array vacío. 
    // Será nuestra "cesta de la compra" virtual que llenaremos ahora.
    const carrito = []; 

    // Recorremos el catálogo para ver qué inputs tienen valor > 0.
    // Necesitamos ver uno por uno si el usuario puso algún número en su input.
    catalogoProductos.forEach(prod => {
        const input = document.getElementById(`input-${prod.id}`);  // Con la declaración de esta constante se está buscando el producto buscando en el HTML específico.
        
        // Lógica condensada (Ternaria): 
        // 1. ¿Existe el input? 
        //    SÍ -> Intenta convertir su valor a número (parseInt). Si está vacío o es texto raro, usa 0.
        //    NO -> Usa 0 directamente (por seguridad).
        
        const cantidad = input ? (parseInt(input.value) || 0) : 0;  

        if (cantidad > 0) { // Si la cantidad es mayor que 0, significa que el usuario quiere comprar el producto.
            carrito.push({  // Meter .push al objeto con los detalles de la compra en la cesta.
                producto_id: prod.id,   // indica quien es.
                cantidad: cantidad,     // cuanto quiere el usuario.
                total: cantidad * prod.precioFinalCalculado     // calcula cuanto cuesta multiplicando la cantidad por el precio.
            }); // cierre del objeto
        } // cierre de la condición.
    }); // cierre del array.

    // --- VALIDACIÓN DEL CARRITO ---

    // Si después de revisar todo, el array sigue vacío (length === 0), es que no eligió nada.
    // Cortamos la ejecución y avisamos.

    if (carrito.length === 0) return alert("El carrito está vacío.");

    // --- COMUNICACIÓN CON EL SERVIDOR (La parte delicada) ---

    // Iniciamos un bloque 'try'. Significa: "Intenta hacer esto, y si explota (error), vete al 'catch' del final".

    try {

        const res = await fetch(`${API_URL}/checkout`, {    // ¡MOMENTO CLAVE! Lanzamos la petición al servidor (fetch).
        // 'await': Le dice al código "PARATE AQUÍ y no sigas hasta que el servidor responda".
            method: 'POST', // Método POST porque estamos ENVIANDO datos para crear una venta.
            headers: { 'Content-Type': 'application/json' }, // Avisamos al servidor que le mandamos datos JSON.
            
            // Convertimos nuestro objeto de datos (usuario + cesta) a un String de texto JSON para enviarlo.

            body: JSON.stringify({ usuario_id: usuarioId, pedidos: carrito }) 
        });

        // Cuando el servidor responde hay que leer su respuesta.
        // 'await': Esperamos a que la respuesta se traduzca de texto a objeto JavaScript usable.
        const data = await res.json();

        // --- GESTIÓN DE LA RESPUESTA ---
        
        if (res.ok) {   // 'res.ok' es true si el código HTTP es exitoso (200-299). O sea, si todo salió bien.
            
            // Mostramos mensaje de éxito con el número de ticket que nos devolvió el servidor (data.grupoId).
            alert(`✅ Venta registrada con éxito.\nTicket #${data.grupoId}`); 
            // Recargamos la página completa.
            // Esto es CRUCIAL para que el stock se actualice visualmente (se resetee la web).
            window.location.reload();

        } else {
            // Si 'res.ok' es false (ej: error 400 o 500), mostramos el error que nos mandó el servidor.
            // Ejemplo: "No hay suficiente stock".
            alert(`❌ Error: ${data.error}`);
        }
    } catch (e) {
        // --- GESTIÓN DE ERRORES CATASTRÓFICOS ---
        // Si entra aquí es porque falló la red (internet caído) o el servidor ni siquiera respondió.
        console.error(e);   // Lo mostramos en la consola para el programador.
        alert("Error de conexión con el servidor"); // Avisamos al usuario.
    }
} // Fin de la función.