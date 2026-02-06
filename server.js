const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // Importamos esto para comprobar si la carpeta existe

const app = express();
app.use(cors());
app.use(express.json());

// --- ZONA DE DIAGNÓSTICO DE IMÁGENES ---
// 1. Definimos la ruta donde creemos que están las fotos
const rutaImagenes = path.join(__dirname, 'Imagenes');

// 4. Configuramos la ruta estática
app.use('/imagenes', express.static(rutaImagenes));


// --- RESTO DE TU SERVIDOR (BASE DE DATOS Y RUTAS) ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tienda'
});

db.connect(err => {
    if (err) console.error('Error DB:', err);
    else console.log('✅ Conectado a MySQL');
});

app.get('/usuarios', (req, res) => {
    db.query('SELECT * FROM usuarios', (err, results) => res.json(err ? [] : results));
});

app.get('/productos', (req, res) => {
    db.query('SELECT * FROM productos', (err, results) => res.json(err ? [] : results));
});

// --- server.js ---

// 1. MODIFICAMOS EL CHECKOUT PARA GUARDAR CON GRUPO
app.post('/checkout', (req, res) => {
    const { usuario_id, pedidos } = req.body;
    if (!pedidos || pedidos.length === 0) return res.status(400).send("Carrito vacío");

    // GENERAMOS UN ID ÚNICO PARA ESTE TICKET (usamos la fecha exacta en milisegundos)
    const grupoId = Date.now().toString(); 

    let procesados = 0;

    pedidos.forEach(item => {
        db.query('SELECT stock FROM productos WHERE id = ?', [item.producto_id], (err, results) => {
            if (err || results.length === 0 || results[0].stock < item.cantidad) {
                // Si falla uno, en la vida real haríamos rollback, aquí simplificamos
                checkFin();
            } else {
                db.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [item.cantidad, item.producto_id], (err) => {
                    if (!err) {
                        // AQUÍ ESTÁ LA CLAVE: Guardamos el 'grupoId'
                        db.query(
                            'INSERT INTO pedidos (usuario_id, producto_id, cantidad, total, fecha, estado, grupo_id) VALUES (?, ?, ?, ?, NOW(), "pendiente", ?)', 
                            [usuario_id, item.producto_id, item.cantidad, item.total, grupoId], 
                            () => checkFin()
                        );
                    } else checkFin();
                });
            }
        });
    });

    function checkFin() {
        procesados++;
        if (procesados === pedidos.length) res.json({ mensaje: "Venta registrada" });
    }
});

// 2. NUEVA RUTA: PAGAR TODO EL GRUPO DE GOLPE
app.put('/pagar-grupo/:grupoId', (req, res) => {
    const grupoId = req.params.grupoId;
    // Actualizamos TODAS las filas que tengan ese ID de grupo
    db.query('UPDATE pedidos SET estado = "pagado" WHERE grupo_id = ?', [grupoId], (err, result) => {
        if (err) {
            res.status(500).send('Error al pagar');
        } else {
            res.send('Pedido completo pagado');
        }
    });
});

// 3. ACTUALIZAR LA CONSULTA GET /DEUDAS (Añadir grupo_id)
app.get('/deudas', (req, res) => {
    const sql = `
        SELECT 
            p.id, 
            p.grupo_id,   /* Importante traer esto */
            u.nombre AS cliente, 
            prod.nombre AS producto, 
            p.cantidad,
            p.total, 
            p.estado 
        FROM pedidos p
        JOIN usuarios u ON p.usuario_id = u.id
        JOIN productos prod ON p.producto_id = prod.id
        ORDER BY p.id DESC
    `;
    db.query(sql, (err, results) => res.json(err ? [] : results));
});

// Nueva ruta para deudas (que te faltaba antes)
// En server.js, busca app.get('/deudas'...) y deja la SQL así (SIN EL WHERE):

app.get('/deudas', (req, res) => {
    const sql = `
        SELECT 
            p.id, 
            u.nombre AS cliente, 
            prod.nombre AS producto, 
            p.cantidad,
            p.total, 
            p.estado 
        FROM pedidos p
        JOIN usuarios u ON p.usuario_id = u.id
        JOIN productos prod ON p.producto_id = prod.id
        ORDER BY p.id DESC
    `;
    // He añadido ORDER BY p.id DESC para que salgan los últimos arriba

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send("Error");
        } else {
            res.json(results);
        }
    });
});
// ... código anterior ...

// RUTA PARA MARCAR UN PEDIDO COMO PAGADO
app.put('/pedidos/:id/pagar', (req, res) => {
    const idPedido = req.params.id;
    const sql = 'UPDATE pedidos SET estado = "pagado" WHERE id = ?';
    
    db.query(sql, [idPedido], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error al actualizar el pedido');
        } else {
            res.send('Pedido actualizado a pagado');
        }
    });
});
// ... app.listen ...
app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));

