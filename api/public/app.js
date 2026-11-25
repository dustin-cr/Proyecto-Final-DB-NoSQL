// public/app.js – Lógica del front-end: consume la API con fetch()
const API_URL = '/api/negocios';

// Elementos de la página
const form = document.getElementById('formNegocio');
const tabla = document.getElementById('tablaNegocios');
const titulo = document.getElementById('tituloFormulario');
const btnGuardar = document.getElementById('btnGuardar');
const btnCancelar = document.getElementById('btnCancelar');
const campos = {
  id: document.getElementById('negocioId'),
  nombre: document.getElementById('nombre'),
  googleId: document.getElementById('googleId'),
  direccion: document.getElementById('direccion'),
  activo: document.getElementById('activo'),
};

let negocios = [];   // copia local de la lista para poder editar

// ---------- Utilidades ----------

// Muestra un mensaje de Bootstrap (verde = éxito, rojo = error)
function mostrarMensaje(texto, tipo = 'success') {
  const div = document.getElementById('mensaje');
  div.innerHTML = '';
  const alerta = document.createElement('div');
  alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
  alerta.textContent = texto;
  const cerrar = document.createElement('button');
  cerrar.type = 'button';
  cerrar.className = 'btn-close';
  cerrar.setAttribute('data-bs-dismiss', 'alert');
  alerta.appendChild(cerrar);
  div.appendChild(alerta);
}

// Crea una celda de tabla con texto. Se usa textContent (no innerHTML)
// para que un dato con código HTML no se ejecute (protección contra XSS).
function celda(texto, clase = '') {
  const td = document.createElement('td');
  td.textContent = texto;
  if (clase) td.className = clase;
  return td;
}

// Hace la petición y convierte los errores de la API en mensajes legibles
async function pedir(url, opciones = {}) {
  const resp = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones,
  });
  const datos = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(datos.error || `Error ${resp.status}`);
  return datos;
}

// ---------- Leer (GET) y dibujar la tabla ----------

async function cargarNegocios() {
  try {
    negocios = await pedir(API_URL);
    dibujarTabla();
    actualizarSelectReportes(); //reportes
  } catch (err) {
    tabla.innerHTML = '';
    const tr = document.createElement('tr');
    tr.appendChild(celda('No se pudo cargar la lista: ' + err.message, 'text-danger text-center py-4'));
    tr.firstChild.colSpan = 6;
    tabla.appendChild(tr);
  }
}

function dibujarTabla() {
  tabla.innerHTML = '';
  if (negocios.length === 0) {
    const tr = document.createElement('tr');
    tr.appendChild(celda('No hay negocios registrados', 'text-center text-muted py-4'));
    tr.firstChild.colSpan = 6;
    tabla.appendChild(tr);
    return;
  }

  for (const n of negocios) {
    const tr = document.createElement('tr');
    tr.appendChild(celda(n.nombre, 'fw-semibold'));
    tr.appendChild(celda(n.direccion || '—'));
    tr.appendChild(celda(n.total_resenas ?? 0, 'text-center'));
    tr.appendChild(celda(n.calificacion_promedio != null ? `★ ${n.calificacion_promedio}` : '—', 'text-center'));

    const tdEstado = document.createElement('td');
    tdEstado.className = 'text-center';
    const badge = document.createElement('span');
    badge.className = n.activo ? 'badge text-bg-success' : 'badge text-bg-secondary';
    badge.textContent = n.activo ? 'Activo' : 'Inactivo';
    tdEstado.appendChild(badge);
    tr.appendChild(tdEstado);

    // Botones de acción
    const tdAcciones = document.createElement('td');
    tdAcciones.className = 'text-end text-nowrap';
    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn btn-sm btn-outline-primary me-1';
    btnEditar.textContent = 'Editar';
    btnEditar.addEventListener('click', () => editarNegocio(n._id));
    const btnEliminar = document.createElement('button');
    btnEliminar.className = 'btn btn-sm btn-outline-danger';
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.addEventListener('click', () => eliminarNegocio(n._id, n.nombre, n.total_resenas));
    //tdAcciones.append(btnEditar, btnEliminar);
    const btnReporte = document.createElement('button');
    btnReporte.className = 'btn btn-sm btn-outline-success ms-1';
    btnReporte.textContent = 'Reporte';
    btnReporte.addEventListener('click', () => verReporte(n._id));
    tdAcciones.append(btnEditar, btnEliminar, btnReporte);
    tr.appendChild(tdAcciones);

    tabla.appendChild(tr);
  }
}

// ---------- Crear (POST) y Actualizar (PUT) ----------

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const datos = {
    nombre: campos.nombre.value.trim(),
    google_location_id: campos.googleId.value.trim(),
    direccion: campos.direccion.value.trim() || null,
    activo: campos.activo.checked,
  };
  const id = campos.id.value;

  btnGuardar.disabled = true;
  try {
    if (id) {
      await pedir(`${API_URL}/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
      mostrarMensaje(`Negocio "${datos.nombre}" actualizado.`);
    } else {
      await pedir(API_URL, { method: 'POST', body: JSON.stringify(datos) });
      mostrarMensaje(`Negocio "${datos.nombre}" agregado.`);
    }
    limpiarFormulario();
    await cargarNegocios();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  } finally {
    btnGuardar.disabled = false;
  }
});

// Pasa los datos de la fila al formulario para editarlos
function editarNegocio(id) {
  const n = negocios.find((x) => x._id === id);
  if (!n) return;
  campos.id.value = n._id;
  campos.nombre.value = n.nombre;
  campos.googleId.value = n.google_location_id;
  campos.direccion.value = n.direccion || '';
  campos.activo.checked = n.activo;
  titulo.textContent = 'Editar negocio';
  btnGuardar.textContent = 'Actualizar';
  btnCancelar.classList.remove('d-none');
  campos.nombre.focus();
}

function limpiarFormulario() {
  form.reset();
  campos.id.value = '';
  campos.activo.checked = true;
  titulo.textContent = 'Agregar negocio';
  btnGuardar.textContent = 'Guardar';
  btnCancelar.classList.add('d-none');
}

btnCancelar.addEventListener('click', limpiarFormulario);

// ---------- Eliminar (DELETE) ----------

async function eliminarNegocio(id, nombre, totalResenas) {
  let aviso = `¿Eliminar el negocio "${nombre}"?`;
  if (totalResenas > 0) {
    aviso += `\n\nATENCIÓN: tiene ${totalResenas} reseñas cargadas, que quedarían sin negocio.`;
  }
  if (!confirm(aviso)) return;

  try {
    await pedir(`${API_URL}/${id}`, { method: 'DELETE' });
    mostrarMensaje(`Negocio "${nombre}" eliminado.`);
    if (campos.id.value === id) limpiarFormulario();
    await cargarNegocios();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

// =====================================================================
// REPORTES – muestra el último reporte del análisis NLP de un negocio
// =====================================================================
const selectNegocio = document.getElementById('selectNegocio');
const contenidoReporte = document.getElementById('contenidoReporte');

// Llena la lista desplegable con los negocios (se llama al cargar la tabla)
function actualizarSelectReportes() {
  const seleccionado = selectNegocio.value;
  selectNegocio.length = 1;                       // deja solo "Seleccione…"
  for (const n of negocios) {
    const op = document.createElement('option');
    op.value = n._id;
    op.textContent = n.nombre;
    selectNegocio.appendChild(op);
  }
  selectNegocio.value = negocios.some((n) => n._id === seleccionado) ? seleccionado : '';
}

// Botón "Reporte" de la tabla: selecciona el negocio y baja hasta el reporte
function verReporte(id) {
  selectNegocio.value = id;
  cargarReporte(id);
  document.getElementById('seccionReportes').scrollIntoView({ behavior: 'smooth' });
}

selectNegocio.addEventListener('change', () => cargarReporte(selectNegocio.value));

const fecha = (f) => (f ? new Date(f).toLocaleDateString('es-CR', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

function textoSentimiento(v) {
  if (v == null) return ['Sin datos', 'secondary'];
  if (v >= 0.5) return ['Muy positivo', 'success'];
  if (v >= 0.1) return ['Positivo', 'success'];
  if (v > -0.1) return ['Neutral', 'warning'];
  return ['Negativo', 'danger'];
}

// Crea un elemento con clase y texto (siempre con textContent: protección XSS)
function el(etiqueta, clase = '', texto = '') {
  const e = document.createElement(etiqueta);
  if (clase) e.className = clase;
  if (texto !== '') e.textContent = texto;
  return e;
}

// Tarjeta pequeña con un indicador (número grande + descripción)
function indicador(valor, descripcion, color = 'dark') {
  const col = el('div', 'col-6 col-md-3');
  const caja = el('div', 'border rounded p-3 h-100 text-center bg-white');
  caja.append(el('div', `fs-4 fw-bold text-${color}`, valor), el('div', 'small text-muted', descripcion));
  col.appendChild(caja);
  return col;
}

async function cargarReporte(id) {
  contenidoReporte.innerHTML = '';
  if (!id) {
    contenidoReporte.appendChild(el('p', 'text-muted mb-0', 'Seleccione un negocio para ver su último reporte.'));
    return;
  }
  contenidoReporte.appendChild(el('p', 'text-muted mb-0', 'Cargando reporte…'));

  try {
    const r = await pedir(`/api/negocios/${id}/reporte`);
    dibujarReporte(r);
  } catch (err) {
    contenidoReporte.innerHTML = '';
    contenidoReporte.appendChild(el('div', 'alert alert-warning mb-0', err.message));
  }
}

function dibujarReporte(r) {
  contenidoReporte.innerHTML = '';
  const [etiqueta, color] = textoSentimiento(r.sentimiento_promedio);

  // 1) Encabezado con el periodo analizado
  contenidoReporte.appendChild(el('p', 'small text-muted',
    `Periodo: ${fecha(r.periodo_inicio)} – ${fecha(r.periodo_fin)} · Generado: ${fecha(r.generado_en)}`));

  // 2) Indicadores principales
  const fila = el('div', 'row g-3 mb-4');
  fila.append(
    indicador(r.total_resenas ?? 0, 'Reseñas totales'),
    indicador(r.total_analizadas ?? 0, 'Con texto (analizadas)'),
    indicador(r.sentimiento_promedio != null ? r.sentimiento_promedio.toFixed(2) : '—', 'Sentimiento promedio (-1 a 1)', color),
    indicador(etiqueta, 'Percepción general', color),
  );
  contenidoReporte.appendChild(fila);

  // 3) Distribución del sentimiento (barra apilada)
  const d = r.distribucion_sentimiento || {};
  const total = (d.positivo || 0) + (d.neutral || 0) + (d.negativo || 0);
  contenidoReporte.appendChild(el('h6', 'fw-semibold', 'Distribución del sentimiento'));
  if (total === 0) {
    contenidoReporte.appendChild(el('p', 'text-muted', 'No hay reseñas analizadas.'));
  } else {
    const barra = el('div', 'progress-stacked mb-2');
    barra.style.height = '26px';
    for (const [clave, clase] of [['positivo', 'bg-success'], ['neutral', 'bg-warning'], ['negativo', 'bg-danger']]) {
      const n = d[clave] || 0;
      if (!n) continue;
      const pct = Math.round((n / total) * 100);
      const seg = el('div', 'progress');
      seg.style.width = `${pct}%`;
      seg.style.height = '26px';
      seg.setAttribute('role', 'progressbar');
      seg.setAttribute('aria-label', clave);
      seg.appendChild(el('div', `progress-bar ${clase}`, `${pct}%`));
      barra.appendChild(seg);
    }
    contenidoReporte.appendChild(barra);
    contenidoReporte.appendChild(el('p', 'small text-muted mb-4',
      `Positivas: ${d.positivo || 0} · Neutrales: ${d.neutral || 0} · Negativas: ${d.negativo || 0}`));
  }

  // 4) Principales problemas detectados
  contenidoReporte.appendChild(el('h6', 'fw-semibold', 'Principales problemas detectados'));
  const problemas = r.principales_problemas || [];
  if (problemas.length === 0) {
    contenidoReporte.appendChild(el('div', 'alert alert-success mb-0', 'No se detectaron problemas en las reseñas. 🎉'));
    return;
  }
  const max = Math.max(...problemas.map((p) => p.cantidad));
  const lista = el('ul', 'list-group');
  for (const p of problemas) {
    const li = el('li', 'list-group-item');
    const arriba = el('div', 'd-flex justify-content-between mb-1');
    arriba.append(el('span', '', p.tema), el('span', 'badge text-bg-danger', `${p.cantidad} mención(es)`));
    const prog = el('div', 'progress');
    prog.style.height = '6px';
    const bar = el('div', 'progress-bar bg-danger');
    bar.style.width = `${Math.round((p.cantidad / max) * 100)}%`;
    prog.appendChild(bar);
    li.append(arriba, prog);
    lista.appendChild(li);
  }
  contenidoReporte.appendChild(lista);
}

// Al abrir la página, cargar la tabla
cargarNegocios();