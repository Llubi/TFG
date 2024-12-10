const USER_API_URL = 'http://localhost:3001/login';
const API_URL = 'http://localhost:3001/camiones';

document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname;

  if (currentPage.endsWith('index.html')) {
    // gestiona login y registro
    manejarLoginYRegistro(); 
  }

  // Si estamos en la página de tabla de camiones
  if (currentPage.endsWith('table.html')) {
    manejarCamiones();
  }
});

// login y registro
function manejarLoginYRegistro() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  // Manejo del evento de envío del formulario de login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const correo = document.getElementById('correo-login').value.trim();
    const pswd = document.getElementById('pswd-login').value.trim();

    try {
      const response = await fetch(USER_API_URL); // Hace una solicitud GET al endpoint de login
      if (!response.ok) throw new Error('Error al obtener usuarios.');

      const usuarios = await response.json();
      // Busca un usuario que coincida con las credenciales proporcionadas dentro de nuestra base de datos
      const usuario = usuarios.find((u) => u.correo === correo && u.pswd === pswd);

      if (usuario) {
        // Guarda los datos del usuario
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
        body: JSON.stringify(nuevoUsuario),
      });

      if (!response.ok) throw new Error('Error al registrar usuario.');

      mostrarMensaje('register-success', 'Usuario registrado exitosamente.');
      registerForm.reset();
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      mostrarError('register-error', 'No se pudo registrar el usuario.');
    }
  });
}

// CAMIONES
function manejarCamiones() {
  const nombreUsuario = document.getElementById('nombre-usuario');
  const tarjetasContainer = document.getElementById('tarjetas-container');
  const camionForm = document.getElementById('camion-form');
  const logoutBtn = document.getElementById('logout-btn');
  const busquedaInput = document.getElementById('busqueda');

  // Obtiene el nombre y rol del usuario
  const usuarioNombre = localStorage.getItem('usuarioNombre');
  const usuarioRol = JSON.parse(localStorage.getItem('authToken'))?.rol;

  if (!usuarioNombre) {
    alert('Debes iniciar sesión.');
    window.location.href = 'index.html';
  }

  nombreUsuario.textContent = `Usuario: ${usuarioNombre}`; // Muestra el nombre del usuario

  // Si el usuario no es admin, oculta el formulario de agregar camiones
  if (usuarioRol !== 'admin') {
    camionForm.style.display = 'none';
  }

  obtenerCamiones();

  // Agregar camión
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

  // botón de logout
  logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
  });

  // Mostrar los camiones que tenemos
  async function obtenerCamiones() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Error al obtener camiones.');

      const camiones = await response.json(); 
      mostrarCamiones(camiones);

      // Filtrado en base de como lo buscamos
      busquedaInput.addEventListener('input', (e) => {
        const terminoBusqueda = e.target.value.toLowerCase();
        const camionesFiltrados = camiones.filter((camion) =>
          camion.matricula.toLowerCase().includes(terminoBusqueda) ||
          camion.modelo.toLowerCase().includes(terminoBusqueda) ||
          camion.tipo.toLowerCase().includes(terminoBusqueda)
        );
        mostrarCamiones(camionesFiltrados); // Muestra los camiones que tenga lo que hayamos buscado
      });
    } catch (error) {
      console.error('Error al obtener camiones:', error); 
    }
  }

  // Función para mostrar camiones
  function mostrarCamiones(camiones) {
    tarjetasContainer.innerHTML = '';

    camiones.forEach((camion) => {
      const tarjeta = document.createElement('div');
      tarjeta.classList.add('tarjeta');
      tarjeta.innerHTML = `
        <img src="${camion.imagen}" alt="${camion.modelo}">
        <h2>${camion.modelo}</h2>
        <p><strong>Matrícula:</strong> ${camion.matricula}</p>
        <p><strong>Tipo:</strong> ${camion.tipo}</p>
        ${usuarioRol === 'admin' ? `<button class="eliminar-btn" data-id="${camion.id}">Eliminar</button>` : ''}
      `;

      tarjetasContainer.appendChild(tarjeta); // Agrega la tarjeta en nuestro contenedor
    });

    // Si el usuario es admin, permite eliminar camiones
    if (usuarioRol === 'admin') {
      const botonesEliminar = document.querySelectorAll('.eliminar-btn');
      botonesEliminar.forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          const camionId = e.target.getAttribute('data-id');

          try {
            const response = await fetch(`${API_URL}/${camionId}`, {
              method: 'DELETE', // Borra los camiones
            });

            if (!response.ok) throw new Error('Error al eliminar el camión.');

            obtenerCamiones();
          } catch (error) {
            console.error('Error al eliminar camión:', error);
            alert('No se pudo eliminar el camión.');
          }
        });
      });
    }
  }
}

// errores en la interfaz
function mostrarError(id, mensaje) {
  const errorDiv = document.getElementById(id);
  errorDiv.textContent = mensaje;
  errorDiv.style.display = 'block';
}

// mensajes de exitosoo en la interfaz
function mostrarMensaje(id, mensaje) {
  const successDiv = document.getElementById(id);
  successDiv.textContent = mensaje;
  successDiv.style.display = 'block';
}
