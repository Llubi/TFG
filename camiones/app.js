const USER_API_URL = 'http://localhost:3001/login'; // URL corregida para login
const API_URL = 'http://localhost:3001/camiones'; // URL para camiones

document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname;

  if (currentPage.endsWith('index.html')) {
    manejarLoginYRegistro();
  }

  if (currentPage.endsWith('table.html')) {
    manejarCamiones();
  }
});

// Manejo de Login y Registro
function manejarLoginYRegistro() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  // Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const correo = document.getElementById('correo-login').value.trim();
    const pswd = document.getElementById('pswd-login').value.trim();

    try {
      const response = await fetch(USER_API_URL); // Aquí apunta a /login
      if (!response.ok) throw new Error('Error al obtener usuarios.');

      const usuarios = await response.json();
      const usuario = usuarios.find((u) => u.correo === correo && u.pswd === pswd);

      if (usuario) {
        localStorage.setItem('authToken', JSON.stringify({ correo, id: usuario.id, rol: usuario.rol }));
        localStorage.setItem('usuarioNombre', usuario.correo);
        window.location.href = 'table.html';
      } else {
        mostrarError('login-error', 'Correo o contraseña incorrectos.');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      mostrarError('login-error', 'Ocurrió un error al iniciar sesión.');
    }
  });

  // Registro
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nuevoUsuario = {
      id: Date.now().toString(), // Generar un ID único basado en el tiempo
      correo: document.getElementById('correo-register').value.trim(),
      pswd: document.getElementById('pswd-register').value.trim(),
      rol: 'usuario', // Se puede asignar un rol por defecto al registrar usuarios
    };

    try {
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

// Manejo de Camiones
function manejarCamiones() {
  const nombreUsuario = document.getElementById('nombre-usuario');
  const tarjetasContainer = document.getElementById('tarjetas-container');
  const camionForm = document.getElementById('camion-form');
  const logoutBtn = document.getElementById('logout-btn');
  const busquedaInput = document.getElementById('busqueda'); // Campo de búsqueda

  const usuarioNombre = localStorage.getItem('usuarioNombre');
  const usuarioRol = JSON.parse(localStorage.getItem('authToken'))?.rol; // Obtener rol del usuario desde el localStorage
  if (!usuarioNombre) {
    alert('Debes iniciar sesión.');
    window.location.href = 'index.html';
  }

  nombreUsuario.textContent = `Usuario: ${usuarioNombre}`;

  // Solo permitir agregar camión si el usuario es admin
  if (usuarioRol !== 'admin') {
    camionForm.style.display = 'none'; // Ocultar formulario de agregar camión para usuarios no admins
  }

  obtenerCamiones();

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

  logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
  });

  async function obtenerCamiones() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Error al obtener camiones.');

      const camiones = await response.json();
      mostrarCamiones(camiones);

      // Agregar evento para realizar búsqueda cuando el usuario escriba en el campo de búsqueda
      busquedaInput.addEventListener('input', (e) => {
        const terminoBusqueda = e.target.value.toLowerCase();
        const camionesFiltrados = camiones.filter((camion) =>
          camion.matricula.toLowerCase().includes(terminoBusqueda) ||
          camion.modelo.toLowerCase().includes(terminoBusqueda) ||
          camion.tipo.toLowerCase().includes(terminoBusqueda)
        );
        mostrarCamiones(camionesFiltrados); // Mostrar camiones filtrados
      });
    } catch (error) {
      console.error('Error al obtener camiones:', error);
    }
  }

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

      tarjetasContainer.appendChild(tarjeta);
    });

    // Agregar eventos a los botones de eliminar, solo si el usuario es admin
    if (usuarioRol === 'admin') {
      const botonesEliminar = document.querySelectorAll('.eliminar-btn');
      botonesEliminar.forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          const camionId = e.target.getAttribute('data-id');

          try {
            const response = await fetch(`${API_URL}/${camionId}`, {
              method: 'DELETE',
            });

            if (!response.ok) throw new Error('Error al eliminar el camión.');

            obtenerCamiones(); // Recargar la lista después de eliminar
          } catch (error) {
            console.error('Error al eliminar camión:', error);
            alert('No se pudo eliminar el camión.');
          }
        });
      });
    }
  }
}

// Utilidades
function mostrarError(id, mensaje) {
  const errorDiv = document.getElementById(id);
  errorDiv.textContent = mensaje;
  errorDiv.style.display = 'block';
}

function mostrarMensaje(id, mensaje) {
  const successDiv = document.getElementById(id);
  successDiv.textContent = mensaje;
  successDiv.style.display = 'block';
}
