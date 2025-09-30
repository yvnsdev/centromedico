import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuración de Supabase
const SUPABASE_URL = 'https://azmmpswnkxddperngabj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bW1wc3dua3hkZHBlcm5nYWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODk5MDksImV4cCI6MjA3NDc2NTkwOX0.kUBrVIERxZf1UAAW9HNj8KBgm2qKkKflc0WG4lvWCTA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Estado de la aplicación
let currentUser = null;
let userRole = null;

// Elementos del DOM
const publicView = document.getElementById('publicView');
const patientView = document.getElementById('patientView');
const adminView = document.getElementById('adminView');

const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const publicLoginBtn = document.getElementById('publicLoginBtn');

const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const appointmentModal = document.getElementById('appointmentModal');
const exceptionModal = document.getElementById('exceptionModal');
const confirmationModal = document.getElementById('confirmationModal');

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const appointmentForm = document.getElementById('appointmentForm');
const exceptionForm = document.getElementById('exceptionForm');

const newAppointmentBtn = document.getElementById('newAppointmentBtn');
const addExceptionBtn = document.getElementById('addExceptionBtn');

const patientAppointments = document.getElementById('patientAppointments');
const adminAppointments = document.getElementById('adminAppointments');
const weeklySchedule = document.getElementById('weeklySchedule');
const exceptionsList = document.getElementById('exceptionsList');

const appointmentDate = document.getElementById('appointmentDate');
const appointmentTime = document.getElementById('appointmentTime');
const sessionDuration = document.getElementById('sessionDuration');
const saveDurationBtn = document.getElementById('saveDurationBtn');

const exceptionType = document.getElementById('exceptionType');
const modifiedHours = document.getElementById('modifiedHours');

const confirmationMessage = document.getElementById('confirmationMessage');
const confirmationOk = document.getElementById('confirmationOk');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    checkAuthState();
    setupDateRestrictions();
});

// Configuración de event listeners
function initEventListeners() {
    // Botones de autenticación
    loginBtn.addEventListener('click', () => openModal(loginModal));
    registerBtn.addEventListener('click', () => openModal(registerModal));
    logoutBtn.addEventListener('click', handleLogout);
    publicLoginBtn.addEventListener('click', () => openModal(loginModal));
    
    // Formularios
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    appointmentForm.addEventListener('submit', handleAppointmentSubmit);
    exceptionForm.addEventListener('submit', handleExceptionSubmit);
    
    // Botones de acción
    newAppointmentBtn.addEventListener('click', () => openModal(appointmentModal));
    addExceptionBtn.addEventListener('click', () => openModal(exceptionModal));
    saveDurationBtn.addEventListener('click', saveSessionDuration);
    
    // Tabs de administración
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });
    
    // Cerrar modales
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => closeAllModals());
    });
    
    // Cerrar modal al hacer clic fuera
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });
    
    // Cambio de tipo de excepción
    exceptionType.addEventListener('change', toggleModifiedHours);
    
    // Cambio de fecha en formulario de cita
    appointmentDate.addEventListener('change', loadAvailableTimes);
    
    // Confirmación modal
    confirmationOk.addEventListener('click', () => closeModal(confirmationModal));
}

// Verificar estado de autenticación
async function checkAuthState() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        await getUserRole();
        showUserView();
    } else {
        showPublicView();
    }
}

// Obtener rol del usuario
async function getUserRole() {
    const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();
    
    if (error) {
        console.error('Error al obtener rol:', error);
        userRole = 'patient'; // Por defecto
    } else {
        userRole = data.role;
    }
}

// Mostrar vista pública
function showPublicView() {
    publicView.classList.remove('hidden');
    patientView.classList.add('hidden');
    adminView.classList.add('hidden');
    logoutBtn.classList.add('hidden');
    loginBtn.classList.remove('hidden');
    registerBtn.classList.remove('hidden');
}

// Mostrar vista según el rol del usuario
function showUserView() {
    publicView.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    loginBtn.classList.add('hidden');
    registerBtn.classList.add('hidden');
    
    if (userRole === 'admin') {
        patientView.classList.add('hidden');
        adminView.classList.remove('hidden');
        loadAdminData();
    } else {
        patientView.classList.remove('hidden');
        adminView.classList.add('hidden');
        loadPatientAppointments();
    }
}

// Manejo de login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const message = document.getElementById('loginMessage');
    
    // Mostrar estado de carga
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
    submitBtn.disabled = true;
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    
    if (error) {
        message.textContent = error.message;
        message.className = 'message error';
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    } else {
        currentUser = data.user;
        await getUserRole();
        closeAllModals();
        showUserView();
    }
}

// Manejo de registro
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const message = document.getElementById('registerMessage');
    
    // Mostrar estado de carga
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
    submitBtn.disabled = true;
    
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: name
            }
        }
    });
    
    if (error) {
        message.textContent = error.message;
        message.className = 'message error';
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    } else {
        message.textContent = 'Registro exitoso. Por favor, verifica tu correo electrónico.';
        message.className = 'message success';
        
        // Crear perfil de usuario
        if (data.user) {
            await supabase
                .from('profiles')
                .insert([
                    { id: data.user.id, name: name, role: 'patient' }
                ]);
        }
        
        setTimeout(() => {
            closeAllModals();
        }, 2000);
    }
}

// Manejo de logout
async function handleLogout() {
    await supabase.auth.signOut();
    currentUser = null;
    userRole = null;
    showPublicView();
    showConfirmation('Sesión cerrada correctamente');
}

// Cargar citas del paciente
async function loadPatientAppointments() {
    // Mostrar estado de carga
    patientAppointments.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Cargando tus citas...</p>
        </div>
    `;
    
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', currentUser.id)
        .order('appointment_date', { ascending: true });
    
    if (error) {
        console.error('Error al cargar citas:', error);
        patientAppointments.innerHTML = '<p class="message error">Error al cargar las citas. Intenta nuevamente.</p>';
        return;
    }
    
    patientAppointments.innerHTML = '';
    
    if (data.length === 0) {
        patientAppointments.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No tienes citas programadas</h3>
                <p>¡Programa tu primera cita con la nutricionista!</p>
            </div>
        `;
        return;
    }
    
    data.forEach(appointment => {
        const appointmentCard = createAppointmentCard(appointment, false);
        patientAppointments.appendChild(appointmentCard);
    });
}

// Cargar datos de administración
async function loadAdminData() {
    await loadAllAppointments();
    await loadWeeklySchedule();
    await loadSessionDuration();
    await loadExceptions();
}

// Cargar todas las citas (admin)
async function loadAllAppointments() {
    // Mostrar estado de carga
    adminAppointments.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Cargando reservas...</p>
        </div>
    `;
    
    const { data, error } = await supabase
        .from('appointments')
        .select(`
            *,
            profiles:patient_id (name, email)
        `)
        .order('appointment_date', { ascending: true });
    
    if (error) {
        console.error('Error al cargar citas:', error);
        adminAppointments.innerHTML = '<p class="message error">Error al cargar las reservas. Intenta nuevamente.</p>';
        return;
    }
    
    adminAppointments.innerHTML = '';
    
    if (data.length === 0) {
        adminAppointments.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No hay citas programadas</h3>
                <p>Las reservas de los pacientes aparecerán aquí</p>
            </div>
        `;
        return;
    }
    
    data.forEach(appointment => {
        const appointmentCard = createAppointmentCard(appointment, true);
        adminAppointments.appendChild(appointmentCard);
    });
}

// Crear tarjeta de cita
function createAppointmentCard(appointment, isAdmin) {
  const card = document.createElement('div');
  card.className = 'appointment-card';

  const date = new Date(appointment.appointment_date);
  const formattedDate = date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formattedTime = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  let statusIcon = '';
  if (appointment.status === 'pending') statusIcon = '<i class="fas fa-clock"></i>';
  if (appointment.status === 'confirmed') statusIcon = '<i class="fas fa-check-circle"></i>';
  if (appointment.status === 'cancelled') statusIcon = '<i class="fas fa-times-circle"></i>';

  const showConfirm = isAdmin && appointment.status !== 'confirmed';

  card.innerHTML = `
    <div class="appointment-info">
      <h4><i class="fas fa-user"></i> Cita con ${isAdmin ? appointment.profiles.name : 'Nutricionista'}</h4>
      <p><i class="fas fa-calendar-day"></i> ${formattedDate}</p>
      <p><i class="fas fa-clock"></i> ${formattedTime}</p>
      <p class="status-${appointment.status}">${statusIcon} Estado: ${getStatusText(appointment.status)}</p>
      ${appointment.notes ? `<p><i class="fas fa-sticky-note"></i> ${appointment.notes}</p>` : ''}
    </div>
    <div class="appointment-actions">
      ${isAdmin ? `
        ${showConfirm ? `
          <button class="btn btn-primary" onclick="updateAppointmentStatus('${appointment.id}', 'confirmed')">
            <i class="fas fa-check"></i> Confirmar
          </button>` : ``}
        <button class="btn btn-secondary" onclick="updateAppointmentStatus('${appointment.id}', 'cancelled')">
          <i class="fas fa-times"></i> Cancelar
        </button>
      ` : `
        <button class="btn btn-secondary" onclick="cancelAppointment('${appointment.id}')">
          <i class="fas fa-times"></i> Cancelar Cita
        </button>
      `}
    </div>
  `;

  return card;
}

// Cargar horario semanal
async function loadWeeklySchedule() {
    // Mostrar estado de carga
    weeklySchedule.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Cargando horarios...</p>
        </div>
    `;
    
    const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .order('day_of_week');
    
    if (error) {
        console.error('Error al cargar horario:', error);
        weeklySchedule.innerHTML = '<p class="message error">Error al cargar el horario. Intenta nuevamente.</p>';
        return;
    }
    
    weeklySchedule.innerHTML = '';
    
    const days = [
        'Domingo', 'Lunes', 'Martes', 'Miércoles', 
        'Jueves', 'Viernes', 'Sábado'
    ];
    
    days.forEach((day, index) => {
        const daySchedule = data.find(schedule => schedule.day_of_week === index);
        
        const dayCard = document.createElement('div');
        dayCard.className = 'day-schedule';
        
        // Icono según si está activo o no
        const statusIcon = daySchedule && daySchedule.active ? 
            '<i class="fas fa-check-circle" style="color: var(--success);"></i>' : 
            '<i class="fas fa-times-circle" style="color: var(--error);"></i>';
        
        dayCard.innerHTML = `
            <div class="day-info">
                <h4>${day}</h4>
                <p>${daySchedule && daySchedule.active ? 
                    `Horario: ${formatTime(daySchedule.start_time)} - ${formatTime(daySchedule.end_time)}` : 
                    'Sin atención'}</p>
            </div>
            <div class="day-actions">
                <span>${statusIcon}</span>
                <button class="btn btn-primary" onclick="editDaySchedule(${index})">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </div>
        `;
        
        weeklySchedule.appendChild(dayCard);
    });
}

// Cargar duración de sesión
async function loadSessionDuration() {
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'session_duration')
        .single();
    
    if (!error && data) {
        sessionDuration.value = data.value;
    }
}

// Guardar duración de sesión
async function saveSessionDuration() {
    const duration = parseInt(sessionDuration.value);
    
    // Validar duración
    if (duration < 15 || duration > 180) {
        showConfirmation('La duración debe estar entre 15 y 180 minutos', 'error');
        return;
    }
    
    const { error } = await supabase
        .from('settings')
        .upsert([
            { key: 'session_duration', value: duration }
        ]);
    
    if (error) {
        console.error('Error al guardar duración:', error);
        showConfirmation('Error al guardar la duración de sesión', 'error');
    } else {
        showConfirmation('Duración de sesión guardada correctamente');
    }
}

// Cargar excepciones
async function loadExceptions() {
    // Mostrar estado de carga
    exceptionsList.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Cargando excepciones...</p>
        </div>
    `;
    
    const { data, error } = await supabase
        .from('schedule_exceptions')
        .select('*')
        .order('exception_date', { ascending: true });
    
    if (error) {
        console.error('Error al cargar excepciones:', error);
        exceptionsList.innerHTML = '<p class="message error">Error al cargar las excepciones. Intenta nuevamente.</p>';
        return;
    }
    
    exceptionsList.innerHTML = '';
    
    if (data.length === 0) {
        exceptionsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-check"></i>
                <h3>No hay excepciones configuradas</h3>
                <p>Todas las fechas siguen el horario regular</p>
            </div>
        `;
        return;
    }
    
    data.forEach(exception => {
        const exceptionCard = document.createElement('div');
        exceptionCard.className = 'exception-card';
        
        const date = new Date(exception.exception_date);
        const formattedDate = date.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Icono según tipo
        const typeIcon = exception.exception_type === 'closed' ? 
            '<i class="fas fa-ban"></i>' : 
            '<i class="fas fa-clock"></i>';
        
        exceptionCard.innerHTML = `
            <div class="exception-info">
                <h4>${typeIcon} ${formattedDate}</h4>
                <p><i class="fas fa-comment"></i> ${exception.reason}</p>
                <p>${exception.exception_type === 'closed' ? 
                    '<i class="fas fa-times"></i> Día sin atención' : 
                    `<i class="fas fa-clock"></i> Horario modificado: ${formatTime(exception.start_time)} - ${formatTime(exception.end_time)}`}</p>
            </div>
            <div class="exception-actions">
                <button class="btn btn-secondary" onclick="deleteException('${exception.id}')">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        
        exceptionsList.appendChild(exceptionCard);
    });
}

// Manejar envío de formulario de cita
async function handleAppointmentSubmit(e) {
    e.preventDefault();
    
    const date = appointmentDate.value;
    const time = appointmentTime.value;
    const notes = document.getElementById('appointmentNotes').value;
    
    if (!date || !time) {
        showAppointmentMessage('Por favor, selecciona fecha y hora', 'error');
        return;
    }
    
    const appointmentDateTime = new Date(`${date}T${time}`);
    
    // Mostrar estado de carga
    const submitBtn = appointmentForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Programando cita...';
    submitBtn.disabled = true;
    
    const { error } = await supabase
        .from('appointments')
        .insert([
            {
                patient_id: currentUser.id,
                appointment_date: appointmentDateTime.toISOString(),
                notes: notes,
                status: 'pending'
            }
        ]);
    
    if (error) {
        console.error('Error al crear cita:', error);
        showAppointmentMessage('Error al crear la cita', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    } else {
        showAppointmentMessage('Cita solicitada correctamente. Te notificaremos por correo cuando sea confirmada.', 'success');
        
        // Enviar correo de confirmación (simulado)
        sendConfirmationEmail(currentUser.email, appointmentDateTime);
        
        setTimeout(() => {
            closeModal(appointmentModal);
            if (userRole === 'admin') {
                loadAllAppointments();
            } else {
                loadPatientAppointments();
            }
        }, 2000);
    }
}

// Manejar envío de formulario de excepción
async function handleExceptionSubmit(e) {
    e.preventDefault();
    
    const date = document.getElementById('exceptionDate').value;
    const type = exceptionType.value;
    const reason = document.getElementById('exceptionReason').value;
    
    let startTime = null;
    let endTime = null;
    
    if (type === 'modified') {
        startTime = document.getElementById('exceptionStartTime').value;
        endTime = document.getElementById('exceptionEndTime').value;
        
        if (!startTime || !endTime) {
            showExceptionMessage('Por favor, ingresa horario de inicio y fin', 'error');
            return;
        }
    }
    
    // Mostrar estado de carga
    const submitBtn = exceptionForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agregando excepción...';
    submitBtn.disabled = true;
    
    const { error } = await supabase
        .from('schedule_exceptions')
        .insert([
            {
                exception_date: date,
                exception_type: type,
                reason: reason,
                start_time: startTime,
                end_time: endTime
            }
        ]);
    
    if (error) {
        console.error('Error al crear excepción:', error);
        showExceptionMessage('Error al crear la excepción', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    } else {
        showExceptionMessage('Excepción agregada correctamente', 'success');
        
        setTimeout(() => {
            closeModal(exceptionModal);
            loadExceptions();
        }, 2000);
    }
}

// Cargar horarios disponibles
async function loadAvailableTimes() {
    const date = appointmentDate.value;
    
    if (!date) return;
    
    // Mostrar estado de carga
    appointmentTime.innerHTML = '<option value="">Cargando horarios disponibles...</option>';
    
    // Obtener duración de sesión
    const { data: settings } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'session_duration')
        .single();
    
    const sessionDuration = settings ? parseInt(settings.value) : 60;
    
    // Obtener horario del día
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    
    const { data: businessHours } = await supabase
        .from('business_hours')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .eq('active', true)
        .single();
    
    if (!businessHours) {
        appointmentTime.innerHTML = '<option value="">No hay horarios disponibles este día</option>';
        return;
    }
    
    // Obtener excepciones
    const { data: exceptions } = await supabase
        .from('schedule_exceptions')
        .select('*')
        .eq('exception_date', date);
    
    // Obtener citas existentes
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const { data: existingAppointments } = await supabase
        .from('appointments')
        .select('appointment_date')
        .gte('appointment_date', startOfDay.toISOString())
        .lte('appointment_date', endOfDay.toISOString())
        .neq('status', 'cancelled');
    
    // Generar horarios disponibles
    appointmentTime.innerHTML = '';
    
    let startTime = businessHours.start_time;
    let endTime = businessHours.end_time;
    
    // Verificar si hay excepción
    if (exceptions && exceptions.length > 0) {
        const exception = exceptions[0];
        
        if (exception.exception_type === 'closed') {
            appointmentTime.innerHTML = '<option value="">No hay atención este día</option>';
            return;
        } else if (exception.exception_type === 'modified') {
            startTime = exception.start_time;
            endTime = exception.end_time;
        }
    }
    
    // Convertir tiempos a minutos
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    // Generar slots
    let availableSlots = 0;
    for (let time = startMinutes; time <= endMinutes - sessionDuration; time += sessionDuration) {
        const timeString = minutesToTime(time);
        const slotDateTime = new Date(`${date}T${timeString}`);
        
        // Verificar si el slot está ocupado
        const isOccupied = existingAppointments && existingAppointments.some(apt => {
            const aptTime = new Date(apt.appointment_date).getTime();
            return Math.abs(aptTime - slotDateTime.getTime()) < sessionDuration * 60 * 1000;
        });
        
        if (!isOccupied) {
            const option = document.createElement('option');
            option.value = timeString;
            option.textContent = timeString;
            appointmentTime.appendChild(option);
            availableSlots++;
        }
    }
    
    if (availableSlots === 0) {
        appointmentTime.innerHTML = '<option value="">No hay horarios disponibles</option>';
    }
}

// Actualizar estado de cita (admin)
async function updateAppointmentStatus(appointmentId, status) {
    const { error } = await supabase
        .from('appointments')
        .update({ status: status })
        .eq('id', appointmentId);
    
    if (error) {
        console.error('Error al actualizar cita:', error);
        showConfirmation('Error al actualizar la cita', 'error');
    } else {
        const statusText = getStatusText(status);
        showConfirmation(`Cita ${statusText.toLowerCase()} correctamente`);
        
        // Enviar correo de notificación (simulado)
        const { data: appointment } = await supabase
            .from('appointments')
            .select('profiles:patient_id (email), appointment_date')
            .eq('id', appointmentId)
            .single();
        
        if (appointment && appointment.profiles) {
            sendStatusEmail(appointment.profiles.email, status, new Date(appointment.appointment_date));
        }
        
        loadAllAppointments();
    }
}

// Cancelar cita (paciente)
async function cancelAppointment(appointmentId) {
    const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)
        .eq('patient_id', currentUser.id);
    
    if (error) {
        console.error('Error al cancelar cita:', error);
        showConfirmation('Error al cancelar la cita', 'error');
    } else {
        showConfirmation('Cita cancelada correctamente');
        loadPatientAppointments();
    }
}

// Eliminar excepción
async function deleteException(exceptionId) {
    const { error } = await supabase
        .from('schedule_exceptions')
        .delete()
        .eq('id', exceptionId);
    
    if (error) {
        console.error('Error al eliminar excepción:', error);
        showConfirmation('Error al eliminar la excepción', 'error');
    } else {
        showConfirmation('Excepción eliminada correctamente');
        loadExceptions();
    }
}

// Funciones auxiliares
function openModal(modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevenir scroll del body
}

function closeModal(modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto'; // Restaurar scroll del body
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        closeModal(modal);
    });
}

function switchTab(tabName) {
    // Actualizar botones de tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Actualizar contenido de tabs
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

function toggleModifiedHours() {
    if (exceptionType.value === 'modified') {
        modifiedHours.classList.remove('hidden');
    } else {
        modifiedHours.classList.add('hidden');
    }
}

function setupDateRestrictions() {
    const today = new Date();
    const minDate = today.toISOString().split('T')[0];
    appointmentDate.min = minDate;
    
    const maxDate = new Date();
    maxDate.setMonth(today.getMonth() + 3);
    appointmentDate.max = maxDate.toISOString().split('T')[0];
    
    document.getElementById('exceptionDate').min = minDate;
}

function showAppointmentMessage(message, type = 'success') {
    const messageEl = document.getElementById('appointmentMessage');
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
}

function showExceptionMessage(message, type = 'success') {
    const messageEl = document.getElementById('exceptionMessage');
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
}

function showConfirmation(message, type = 'success') {
    confirmationMessage.textContent = message;
    confirmationMessage.className = `message ${type}`;
    openModal(confirmationModal);
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pendiente',
        'confirmed': 'Confirmada',
        'cancelled': 'Cancelada'
    };
    return statusMap[status] || status;
}

function formatTime(timeString) {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
}

function timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Funciones simuladas para envío de correos
function sendConfirmationEmail(email, appointmentDate) {
    console.log(`Correo de confirmación enviado a ${email} para la cita del ${appointmentDate}`);
    // En una implementación real, aquí se integraría con un servicio de correo
}

function sendStatusEmail(email, status, appointmentDate) {
    console.log(`Notificación de estado ${status} enviada a ${email} para la cita del ${appointmentDate}`);
    // En una implementación real, aquí se integraría con un servicio de correo
}

// Funciones para editar horario (placeholder)
function editDaySchedule(dayOfWeek) {
    showConfirmation('Funcionalidad de edición de horario en desarrollo');
}

// Inicializar Supabase con los datos necesarios
async function initializeDatabase() {
    // Verificar si ya existen los datos iniciales
    const { data: existingHours } = await supabase
        .from('business_hours')
        .select('*');
    
    if (!existingHours || existingHours.length === 0) {
        // Crear horario por defecto (Lunes a Viernes, 9:00-18:00)
        const defaultHours = [];
        for (let i = 1; i <= 5; i++) { // Lunes a Viernes
            defaultHours.push({
                day_of_week: i,
                start_time: '09:00',
                end_time: '18:00',
                active: true
            });
        }
        
        await supabase
            .from('business_hours')
            .insert(defaultHours);
    }
    
    // Verificar configuración de duración de sesión
    const { data: existingDuration } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'session_duration');
    
    if (!existingDuration || existingDuration.length === 0) {
        await supabase
            .from('settings')
            .insert([
                { key: 'session_duration', value: 60 }
            ]);
    }
}

// Ejecutar inicialización al cargar
initializeDatabase();

// Añadir estilos para estados vacíos
const style = document.createElement('style');
style.textContent = `
    .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-gray);
    }
    
    .empty-state i {
        font-size: 50px;
        margin-bottom: 15px;
        color: var(--light-blue);
    }
    
    .empty-state h3 {
        margin-bottom: 10px;
        color: var(--dark-gray);
    }
`;
document.head.appendChild(style);

// Añadir al final del archivo app.js, después de la función initializeDatabase()

// Funcionalidad para el formulario de contacto
document.addEventListener('DOMContentLoaded', () => {
    // Añadir este código dentro de initEventListeners()
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
    
    // Añadir funcionalidad de filtros para citas del paciente
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filterAppointments(e.target.dataset.filter);
        });
    });
});

// Manejar envío de formulario de contacto
async function handleContactSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value;
    
    // Mostrar estado de carga
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    submitBtn.disabled = true;
    
    // Simular envío de formulario (en un caso real, aquí se conectaría a un servicio de correo)
    setTimeout(() => {
        showConfirmation('Mensaje enviado correctamente. Nos pondremos en contacto contigo pronto.');
        contactForm.reset();
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 1500);
}

// Filtrar citas del paciente
function filterAppointments(filter) {
    const appointments = document.querySelectorAll('#patientAppointments .appointment-card');
    
    appointments.forEach(card => {
        const status = card.querySelector('.status-pending, .status-confirmed, .status-cancelled');
        if (!status) return;
        
        const statusText = status.textContent.toLowerCase();
        
        if (filter === 'all') {
            card.style.display = 'flex';
        } else if (filter === 'pending' && statusText.includes('pendiente')) {
            card.style.display = 'flex';
        } else if (filter === 'confirmed' && statusText.includes('confirmada')) {
            card.style.display = 'flex';
        } else if (filter === 'cancelled' && statusText.includes('cancelada')) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Mostrar mensaje si no hay citas que coincidan con el filtro
    const visibleAppointments = Array.from(appointments).filter(card => card.style.display !== 'none');
    const emptyState = document.querySelector('#patientAppointments .empty-state');
    
    if (visibleAppointments.length === 0 && emptyState) {
        emptyState.style.display = 'block';
    } else if (emptyState) {
        emptyState.style.display = 'none';
    }
}

// Exponer funciones al scope global para los onclick inline del HTML
if (typeof window !== 'undefined') {
  window.updateAppointmentStatus = updateAppointmentStatus;
  window.cancelAppointment = cancelAppointment;
  window.deleteException = deleteException;
  window.editDaySchedule = editDaySchedule;
}