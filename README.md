Título: PROYECTO-CRM
Objetivo: El objetivo en este proyecto es crear una aplicación web en la que mediante JS y HTML se pueda hacer un CRM que permita gestionar de forma fácil los pedidos, facturas, stock, etc, para la tienda ScootCoín.

Instalación del entorno:
1. Instalación de MYSQL:

MACOS

brew install mysql
brew services start mysql

LINUX

sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
sudo mysql

Other distributions.
sudo dnf install mysql-server
sudo systemctl start mysqld
sudo mysql_secure_installation

WINDOWS

Acceder a la página oficial y seleccionar MySQL Installer for Windows, y descargar el ejecutable.
Ejecutar el Instalador:
Abra el archivo descargado (.msi).
Permita que la aplicación realice cambios en el dispositivo.
Configurar la Instalación:
Seleccionar tipo: Elija "Developer Default" (servidor + herramientas) o "Full".
Verificar requisitos: Si el instalador solicita instalar dependencias adicionales (ej. Visual C++), haga clic en "Execute".
Instalar: Haga clic en "Execute" para instalar los productos.
Configuración del Servidor (MySQL Configurator):
Tipo y redes: Deje las opciones predeterminadas (Puerto: 3306).
Autenticación: Use el método recomendado (Strong Password Encryption).
Usuario: Establezca una contraseña segura para el usuario root (administrador) y anótela.
Servicio de Windows: Confirme que se inicie como un servicio.
Finalizar:
Haga clic en "Execute" para aplicar la configuración.
Finalice el asistente. MySQL ya estará listo para usarse, generalmente junto con la herramienta gráfica MySQL Workbench. 

3. Instalación de node.js para correr el servidor:

MACOS

brew install node

LINUX

sudo apt update
sudo apt install nodejs npm

WINDOWS

Descarga el instalador:

Ve a la página oficial de Node.js: nodejs.org/es/download/.

Descarga el instalador para Windows (versión LTS recomendada).

Ejecuta el instalador:

Abre el archivo .msi que descargaste.

Haz clic en Next (Siguiente) en la pantalla de bienvenida.

Acepta los términos de la licencia y haz clic en Next.

Deja la ruta de instalación por defecto (normalmente `C:\Program Files\nodejs\`) y haz clic en Next.

En la pantalla de "Custom Setup", asegúrate de que la opción "Automatically install the necessary tools..." esté marcada para instalar las herramientas adicionales (como Python y Visual Studio Build Tools). Haz clic en Next.

Haz clic en Install y luego en Finish.
Verifica la instalación:

Abre el Símbolo del sistema (CMD) o PowerShell (presiona la tecla Windows, escribe cmd, y presiona Enter).

Escribe node -v y presiona Enter para ver la versión de Node.js.
Escribe npm -v y presiona Enter para ver la versión del gestor de paquetes npm.

Ejemplo de uso:

Una vez ubicados en la carpeta que contiene el servidor .js se debe de ejecutar el comando: node server.js

De esta forma se habrá arrancado el servidor .js que permite la comunicación con la DB.

Backend (Servidor y Lógica)
El "cerebro" de la aplicación que procesa las peticiones y conecta con los datos.

- Node.js: Entorno de ejecución para JavaScript fuera del navegador. Permite que el servidor funcione de manera asíncrona y eficiente.

- JavaScript (ES6+): Lenguaje de programación principal utilizado tanto en el servidor como en el cliente. Se emplean características modernas como const, let, arrow functions y async/await.

- Express.js: Framework web minimalista para Node.js. Se utiliza para estructurar la API, definir las rutas (app.get, app.post) y gestionar el servidor HTTP.

- NPM (Node Package Manager): Gestor de paquetes implícito utilizado para instalar las dependencias (package.json no visible, pero inferido por los require).

Librerías de Backend (Dependencias):
- mysql2: Driver (controlador) de alto rendimiento para conectar Node.js con la base de datos MySQL. Permite ejecutar consultas SQL y prevenir inyecciones básicas.

- cors: Middleware que habilita CORS (Cross-Origin Resource Sharing). Permite que tu frontend (cliente) se comunique con el servidor aunque estén en orígenes distintos o para cumplir con los estándares de seguridad modernos de los navegadores.

- path (Módulo Nativo): Utilidad interna de Node.js para trabajar con rutas de archivos y directorios de forma compatible entre sistemas operativos (Windows/Linux/Mac).

- fs (File System - Módulo Nativo): Módulo para interactuar con el sistema de archivos del servidor, utilizado para verificaciones de carpetas.

2. Frontend (Interfaz de Usuario)
La parte visual con la que interactúan los usuarios (Ventas y Gestión).

- HTML5: Estructura semántica de las páginas (tienda.html y deudas.html).

- CSS3: Hojas de estilo para el diseño visual.

Se utiliza Flexbox para la cabecera y alineaciones (display: flex).

Se utiliza CSS Grid para la disposición de productos en la tienda (display: grid).

Diseño Responsive básico mediante minmax en el grid.

- JavaScript (Vanilla JS): JavaScript puro sin frameworks pesados (como React o Angular). Manipula el DOM directamente (document.getElementById) y gestiona la lógica del carrito en el navegador.

- Fetch API: Estándar nativo del navegador utilizado para realizar peticiones HTTP asíncronas (fetch) al servidor para obtener productos o enviar ventas.

Librerías de Frontend:

- html2pdf.js: Librería externa cargada vía CDN. Se utiliza en deudas.html para convertir el HTML de la factura ("renderizado visual") en un archivo PDF descargable para el usuario (html2pdf().from(elemento).save(...)).

3. Persistencia de Datos (Base de Datos)
Donde se almacena la información de forma permanente.

- MySQL: Sistema de Gestión de Bases de Datos Relacional (RDBMS).

Se utiliza para almacenar las tablas de usuarios, productos y pedidos.

Soporta relaciones (JOINs) y transacciones para la gestión del stock y ventas.

4. Herramientas de Desarrollo (DevTools)
- Visual Studio Code (Inferido): Entorno de desarrollo recomendado.
- Postman / Navegador: Herramientas para probar las rutas de la API (GET /usuarios, POST /checkout) durante el desarrollo.
