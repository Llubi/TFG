const USER_API_URL = 'http://localhost:3001/login';
const API_URL = 'http://localhost:3001/camiones';

document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname;

  if (currentPage.endsWith('index.html')) {
    // Llama a la función para gestionar login y registro
    manejarLoginYRegistro(); 
  }

  // Si estamos en la página de tabla de camiones
  if (currentPage.endsWith('table.html')) {
    manejarCamiones(); // Llama a la función para gestionar los camiones
  }
});

// Función para manejar el login y registro
function manejarLoginYRegistro() {
  const loginForm = document.getElementById('login-form');       // login
  const registerForm = document.getElementById('register-form'); // registro

  // Manejo del evento de envío del formulario de login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Previene el envío por defecto del formulario

    const correo = document.getElementById('correo-login').value.trim();
    const pswd = document.getElementById('pswd-login').value.trim();

    try {
      const response = await fetch(USER_API_URL); // Hace una solicitud GET al endpoint de login
      if (!response.ok) throw new Error('Error al obtener usuarios.'); // Maneja errores en la respuesta

      const usuarios = await response.json(); // Convierte la respuesta a JSON
      // Busca un usuario que coincida con las credenciales proporcionadas
      const usuario = usuarios.find((u) => u.correo === correo && u.pswd === pswd);

      if (usuario) {
        // Guarda los datos del usuario en el localStorage
        localStorage.setItem('authToken', JSON.stringify({ correo, id: usuario.id, rol: usuario.rol }));
        localStorage.setItem('usuarioNombre', usuario.correo);

        // Redirige al usuario a la página de tabla
        window.location.href = 'table.html';
      } else {
        mostrarError('login-error', 'Correo o contraseña incorrectos.'); // Muestra error si no hay coincidencia
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error); // Log del error
      mostrarError('login-error', 'Ocurrió un error al iniciar sesión.');
    }
  });

  // Manejo del evento de envío del formulario de registro
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Previene el envío por defecto del formulario

    const nuevoUsuario = {
      id: Date.now().toString(), // Genera un ID único
      correo: document.getElementById('correo-register').value.trim(),
      pswd: document.getElementById('pswd-register').value.trim(),
      rol: 'usuario', // Asigna un rol por defecto
    };

    try {
      // Envía una solicitud POST para registrar el nuevo usuario
      const response = await fetch(USER_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoUsuario), // Envia el nuevo usuario como JSON
      });

      if (!response.ok) throw new Error('Error al registrar usuario.'); // Maneja errores en la respuesta

      mostrarMensaje('register-success', 'Usuario registrado exitosamente.'); // Mensaje de éxito
      registerForm.reset(); // Limpia el formulario
    } catch (error) {
      console.error('Error al registrar usuario:', error); // Log del error
      mostrarError('register-error', 'No se pudo registrar el usuario.'); // Muestra error genérico
    }
  });
}

// Función para manejar camiones
function manejarCamiones() {
  const nombreUsuario = document.getElementById('nombre-usuario');
  const tarjetasContainer = document.getElementById('tarjetas-container');
  const camionForm = document.getElementById('camion-form');
  const logoutBtn = document.getElementById('logout-btn');
  const busquedaInput = document.getElementById('busqueda');

  // Obtiene el nombre y rol del usuario del localStorage
  const usuarioNombre = localStorage.getItem('usuarioNombre');
  const usuarioRol = JSON.parse(localStorage.getItem('authToken'))?.rol;

  if (!usuarioNombre) {
    // Si no hay usuario autenticado, redirige al login
    alert('Debes iniciar sesión.');
    window.location.href = 'index.html';
  }

  nombreUsuario.textContent = `Usuario: ${usuarioNombre}`; // Muestra el nombre del usuario

  // Si el usuario no es admin, oculta el formulario de agregar camiones
  if (usuarioRol !== 'admin') {
    camionForm.style.display = 'none';
  }

  obtenerCamiones();

  // Manejo del formulario de agregar camión
  camionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nuevoCamion = {
      matricula: document.getElementById('matricula').value.trim(),
      modelo: document.getElementById('modelo').value.trim(),
      tipo: document.getElementById('tipo').value,
      imagen: document.getElementById('imagen').value.trim(),
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoCamion),
      });

      if (!response.ok) throw new Error('Error al agregar camión.');

      camionForm.reset();
      obtenerCamiones();
    } catch (error) {
      console.error('Error al agregar camión:', error);
      alert('No se pudo agregar el camión.');
    }
  });

  // Manejo del botón de logout
  logoutBtn.addEventListener('click', () => {
    localStorage.clear(); // Limpia el localStorage
    window.location.href = 'index.html'; // Redirige al login
  });

  // Función para obtener los camiones
  async function obtenerCamiones() {
    try {
      const response = await fetch(API_URL); // Hace una solicitud GET al endpoint de camiones
      if (!response.ok) throw new Error('Error al obtener camiones.');

      const camiones = await response.json(); // Convierte la respuesta a JSON
      mostrarCamiones(camiones); // Muestra los camiones en la interfaz

      // Filtra los camiones en base al término de búsqueda
      busquedaInput.addEventListener('input', (e) => {
        const terminoBusqueda = e.target.value.toLowerCase();
        const camionesFiltrados = camiones.filter((camion) =>
          camion.matricula.toLowerCase().includes(terminoBusqueda) ||
          camion.modelo.toLowerCase().includes(terminoBusqueda) ||
          camion.tipo.toLowerCase().includes(terminoBusqueda)
        );
        mostrarCamiones(camionesFiltrados); // Muestra los camiones filtrados
      });
    } catch (error) {
      console.error('Error al obtener camiones:', error); // Log del error
    }
  }

  // Función para mostrar los camiones en la interfaz
  function mostrarCamiones(camiones) {
    tarjetasContainer.innerHTML = ''; // Limpia el contenedor

    camiones.forEach((camion) => {
      const tarjeta = document.createElement('div'); // Crea una tarjeta para cada camión
      tarjeta.classList.add('tarjeta');
      tarjeta.innerHTML = `
        <img src="${camion.imagen}" alt="${camion.modelo}">
        <h2>${camion.modelo}</h2>
        <p><strong>Matrícula:</strong> ${camion.matricula}</p>
        <p><strong>Tipo:</strong> ${camion.tipo}</p>
        ${usuarioRol === 'admin' ? `<button class="eliminar-btn" data-id="${camion.id}">Eliminar</button>` : ''}
      `;

      tarjetasContainer.appendChild(tarjeta); // Agrega la tarjeta al contenedor
    });

    // Si el usuario es admin, permite eliminar camiones
    if (usuarioRol === 'admin') {
      const botonesEliminar = document.querySelectorAll('.eliminar-btn');
      botonesEliminar.forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          const camionId = e.target.getAttribute('data-id'); // Obtiene el ID del camión a eliminar

          try {
            const response = await fetch(`${API_URL}/${camionId}`, {
              method: 'DELETE', // Realiza una solicitud DELETE al endpoint correspondiente
            });

            if (!response.ok) throw new Error('Error al eliminar el camión.');

            obtenerCamiones(); // Recarga los camiones después de eliminar
          } catch (error) {
            console.error('Error al eliminar camión:', error); // Log del error
            alert('No se pudo eliminar el camión.'); // Muestra mensaje de error
          }
        });
      });
    }
  }
}

// Función para mostrar errores en la interfaz
function mostrarError(id, mensaje) {
  const errorDiv = document.getElementById(id); // Elemento donde se muestra el error
  errorDiv.textContent = mensaje; // Establece el mensaje de error
  errorDiv.style.display = 'block'; // Muestra el error
}

// Función para mostrar mensajes de éxito en la interfaz
function mostrarMensaje(id, mensaje) {
  const successDiv = document.getElementById(id); // Elemento donde se muestra el mensaje
  successDiv.textContent = mensaje; // Establece el mensaje de éxito
  successDiv.style.display = 'block'; // Muestra el mensaje
}
