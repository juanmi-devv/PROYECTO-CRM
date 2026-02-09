const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------
// 1. ZONA DE IMÁGENES (CONFIGURACIÓN EXACTA)

// Aquí se están cogiendo las imágenes.
// ---------------------------------------------------------

// Ruta absoluta a la carpeta de imágenes
const RUTA_FOTOS = '/Users/juanmi_.sct/FINAL-SMR/PROYECTO-CRM/Imagenes';

// Servimos la carpeta en la dirección web
app.use('/imagenes', express.static(RUTA_FOTOS));


// ---------------------------------------------------------
// 2. BASE DE DATOS
// ---------------------------------------------------------

// Aquí se está arrancando la base de datos.


const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',   // usuario
    password: '',   // contraseña no tiene por defecto.
    database: 'tienda',     // nombre de la base de datos.
    waitForConnections: true,
    connectionLimit: 10,  // se indica un límite de conexiones.
    queueLimit: 0
}).promise();

// ---------------------------------------------------------
// 3. RUTAS DE LECTURA (GET)
// ---------------------------------------------------------

app.get('/usuarios', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM usuarios');
        res.json(rows);
    } catch (err) { res.status(500).send(err.message); }
});

app.get('/productos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM productos');
        res.json(rows);
    } catch (err) { res.status(500).send(err.message); }
});

app.get('/deudas', async (req, res) => {
    try {
        const sql = `
            SELECT p.id, p.grupo_id, u.nombre AS cliente, prod.nombre AS producto, 
            p.cantidad, p.total, p.estado 
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
            JOIN productos prod ON p.producto_id = prod.id
            ORDER BY p.id DESC`;
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (err) { res.status(500).send(err.message); }
});

// ---------------------------------------------------------
// 4. RUTAS DE ESCRITURA (POST / PUT)
// ---------------------------------------------------------

app.post('/checkout', async (req, res) => {
    const { usuario_id, pedidos } = req.body;
    
    if (!pedidos || !pedidos.length) return res.status(400).json({ error: "Carrito vacío" });

    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        const grupoId = Date.now().toString();

        for (const item of pedidos) {
            // Verificar Stock
            const [prod] = await connection.query('SELECT stock, precio FROM productos WHERE id = ?', [item.producto_id]);
            
            if (prod.length === 0) throw new Error(`Producto ID ${item.producto_id} no existe`);
            if (prod[0].stock < item.cantidad) throw new Error(`Stock insuficiente.`);

            // Restar Stock
            await connection.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [item.cantidad, item.producto_id]);

            // Guardar Pedido
            await connection.query(
                'INSERT INTO pedidos (usuario_id, producto_id, cantidad, total, fecha, estado, grupo_id) VALUES (?, ?, ?, ?, NOW(), "pendiente", ?)',
                [usuario_id, item.producto_id, item.cantidad, item.total, grupoId]
            );
        }

        await connection.commit();
        res.json({ mensaje: "Venta registrada", grupoId });

    } catch (error) {
        await connection.rollback();
        console.error("Error checkout:", error.message);
        res.status(400).json({ error: error.message });
    } finally {
        connection.release();
    }
});

app.put('/pagar-grupo/:grupoId', async (req, res) => {
    try {
        await pool.query('UPDATE pedidos SET estado = "pagado" WHERE grupo_id = ?', [req.params.grupoId]);
        res.send('Pagado');
    } catch (err) { res.status(500).send(err.message); }
});

// ---------------------------------------------------------
// 5. Arranque del servidor.
// ---------------------------------------------------------
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});

