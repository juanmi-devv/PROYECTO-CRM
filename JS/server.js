// Importa Express, el framework para crear el servidor web.
const express = require('express');

// Importa mysql2 para conectarse a bases de datos MySQL (en este caso mi DB se llama tienda).
const mysql = require('mysql2');

// Importa cors para permitir peticiones desde otros orígenes (frontend).
const cors = require('cors');

// Importa path para trabajar con rutas del sistema de archivos.
const path = require('path');

// Creación de la aplicación Express
const app = express();

// Activación de CORS para aceptar peticiones externas desde otros clientes.
app.use(cors());
// Permite recibir datos en formato 
// JSON en las peticiones.
app.use(express.json());


// ---------------------------------------------------------
// 1. ZONA DE IMÁGENES
// ---------------------------------------------------------

// Ruta ABSOLUTA del sistema donde se guardan las imágenes de cada producto.
const RUTA_FOTOS = '/Users/juanmi_.sct/FINAL-SMR/PROYECTO-CRM/Imagenes';

// Exponer dicha carpeta como recurso público en /imagenes.
// Ejemplo: http://localhost:3000/imagenes/foto.jpg
app.use('/imagenes', express.static(RUTA_FOTOS)); // se le está indicando la ruta con la constante de donde se encuentran las fotos.


// ---------------------------------------------------------
// 2. BASE DE DATOS
// ---------------------------------------------------------

// Creación de un pool de conexiones a la base de datos MySQL
const pool = mysql.createPool({
    host: 'localhost',          // Servidor de la BD.
    user: 'root',               // Usuario MySQL.
    password: '',               // Contraseña (vacía)
    database: 'tienda',         // Nombre de la base de datos usada
    waitForConnections: true,   // Espera si no hay conexiones libres
    connectionLimit: 10,        // Límite de conexiones, 10 conexiones simultáneas
    queueLimit: 0               // Cola ilimitada, pueden estar a la espera un número ilimitado de usuarios
}).promise();                   // Permite usar async/await


// ---------------------------------------------------------
// 3. RUTAS GET (LECTURA DE DATOS)
// ---------------------------------------------------------

// Devuelve todos los usuarios
app.get('/usuarios', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM usuarios');
        res.json(rows); // Envía los usuarios en formato JSON
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Devuelve todos los productos
app.get('/productos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM productos');
        res.json(rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Devuelve los pedidos con datos del cliente y producto
app.get('/deudas', async (req, res) => {
    try {
        const sql = `
            SELECT p.id, p.grupo_id,
                   u.nombre AS cliente,
                   prod.nombre AS producto,
                   p.cantidad, p.total, p.estado
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
            JOIN productos prod ON p.producto_id = prod.id
            ORDER BY p.id DESC
        `;
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// ---------------------------------------------------------
// 4. RUTAS POST / PUT (ESCRITURA)
// ---------------------------------------------------------

// Registra una venta completa (checkout)
app.post('/checkout', async (req, res) => {

    // Extrae el usuario y los pedidos enviados desde el frontend
    const { usuario_id, pedidos } = req.body;

    // Comprueba que el carrito no esté vacío
    if (!pedidos || !pedidos.length) {
        return res.status(400).json({ error: "Carrito vacío" });
    }

    // Obtiene una conexión del pool
    const connection = await pool.getConnection();

    try {
        // Inicia una transacción
        await connection.beginTransaction();

        // Genera un identificador único para la venta
        const grupoId = Date.now().toString();

        // Recorre cada producto del carrito
        for (const item of pedidos) {

            // Comprueba stock y precio del producto
            const [prod] = await connection.query(
                'SELECT stock, precio FROM productos WHERE id = ?',
                [item.producto_id]
            );

            // Si no existe el producto
            if (prod.length === 0)
                throw new Error(`Producto ID ${item.producto_id} no existe`);

            // Si no hay stock suficiente
            if (prod[0].stock < item.cantidad)
                throw new Error(`Stock insuficiente`);

            // Resta el stock del producto
            await connection.query(
                'UPDATE productos SET stock = stock - ? WHERE id = ?',
                [item.cantidad, item.producto_id]
            );

            // Inserta el pedido en la tabla pedidos
            await connection.query(
                `INSERT INTO pedidos
                (usuario_id, producto_id, cantidad, total, fecha, estado, grupo_id)
                VALUES (?, ?, ?, ?, NOW(), "pendiente", ?)`,
                [usuario_id, item.producto_id, item.cantidad, item.total, grupoId]
            );
        }

        // Confirma la transacción
        await connection.commit();

        // Respuesta correcta
        res.json({ mensaje: "Venta registrada", grupoId });

    } catch (error) {
        // Si hay error, revierte todos los cambios
        await connection.rollback();
        res.status(400).json({ error: error.message });

    } finally {
        // Libera la conexión
        connection.release();
    }
});

// Marca todos los pedidos de un grupo como pagados
app.put('/pagar-grupo/:grupoId', async (req, res) => {
    try {
        await pool.query(
            'UPDATE pedidos SET estado = "pagado" WHERE grupo_id = ?',
            [req.params.grupoId]
        );
        res.send('Pagado');
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// ---------------------------------------------------------
// 5. ARRANQUE DEL SERVIDOR
// ---------------------------------------------------------

// Puerto del servidor
const PORT = 3000;

// Inicio del servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
