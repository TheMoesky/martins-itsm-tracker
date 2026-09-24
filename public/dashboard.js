const form = document.getElementById('ticket-form');
const formTitle = document.getElementById('form-title');
const formSubmit = document.getElementById('form-submit');
const formCancel = document.getElementById('form-cancel');
const formError = document.getElementById('form-error');

const ticketIdField = document.getElementById('ticket-id');
const titleField = document.getElementById('field-title');
const descriptionField = document.getElementById('field-description');
const priorityField = document.getElementById('field-priority');
const categoryField = document.getElementById('field-category');
const assigneeField = document.getElementById('field-assignee');
const slaDueAtField = document.getElementById('field-sla-due-at');

// Convert a stored SLA datetime (e.g. "2026-09-25 10:00:00" or ISO) into the
// "YYYY-MM-DDTHH:mm" shape <input type="datetime-local"> requires.
function toDatetimeLocalValue(value) {
    if (!value) return '';
    const isoLike = value.includes('T') ? value : value.replace(' ', 'T');
    return isoLike.slice(0, 16);
}

function resetForm() {
    form.reset();
    ticketIdField.value = '';
    priorityField.value = 'medium';
    formTitle.textContent = 'New Ticket';
    formSubmit.textContent = 'Create Ticket';
    formCancel.classList.add('hidden');
    formError.textContent = '';
}

function startEdit(ticket) {
    ticketIdField.value = ticket.id;
    titleField.value = ticket.title ?? '';
    descriptionField.value = ticket.description ?? '';
    priorityField.value = ticket.priority ?? 'medium';
    categoryField.value = ticket.category ?? '';
    assigneeField.value = ticket.assignee ?? '';
    slaDueAtField.value = toDatetimeLocalValue(ticket.sla_due_at);

    formTitle.textContent = `Edit Ticket #${ticket.id}`;
    formSubmit.textContent = 'Save Changes';
    formCancel.classList.remove('hidden');
    formError.textContent = '';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

formCancel.addEventListener('click', resetForm);

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.textContent = '';

    const payload = {
        title: titleField.value.trim(),
        description: descriptionField.value.trim() || null,
        priority: priorityField.value,
        category: categoryField.value.trim() || null,
        assignee: assigneeField.value.trim() || null,
        sla_due_at: slaDueAtField.value || null,
    };

    const editingId = ticketIdField.value;
    const url = editingId ? `/tickets/${editingId}` : '/tickets';
    const method = editingId ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `Request failed (${res.status})`);
        }
        resetForm();
        loadTickets();
    } catch (err) {
        formError.textContent = err.message;
    }
});

async function closeTicket(id) {
    try {
        const res = await fetch(`/tickets/${id}/close`, { method: 'POST' });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        loadTickets();
    } catch (err) {
        alert(`Failed to close ticket: ${err.message}`);
    }
}

async function deleteTicket(id) {
    if (!confirm(`Delete ticket #${id}? This cannot be undone.`)) return;
    try {
        const res = await fetch(`/tickets/${id}`, { method: 'DELETE' });
        if (!res.ok && res.status !== 204) throw new Error(`Request failed (${res.status})`);
        loadTickets();
    } catch (err) {
        alert(`Failed to delete ticket: ${err.message}`);
    }
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

async function loadTickets() {
    const res = await fetch('/tickets');
    const tickets = await res.json();

    const breachedCount = tickets.filter(t => t.sla_status === 'breached').length;
    document.getElementById('summary').textContent =
        `${tickets.length} total tickets — ${breachedCount} breaching SLA`;

    const tbody = document.getElementById('ticket-body');
    tbody.innerHTML = '';

    tickets.forEach(t => {
        const row = document.createElement('tr');
        if (t.sla_status === 'breached') row.classList.add('breached');

        const badgeClass = t.sla_status === 'breached' ? 'badge-breached'
            : t.sla_status === 'on_track' ? 'badge-on_track'
                : 'badge-na';

        row.innerHTML = `
      <td>${t.id}</td>
      <td>${escapeHtml(t.title)}</td>
      <td>${escapeHtml(t.status)}</td>
      <td>${escapeHtml(t.priority)}</td>
      <td>${escapeHtml(t.sla_due_at) || '—'}</td>
      <td><span class="badge ${badgeClass}">${escapeHtml(t.sla_status)}</span></td>
      <td class="actions-cell">
        <button type="button" class="edit-btn">Edit</button>
        <button type="button" class="close-btn" ${t.status === 'closed' ? 'disabled' : ''}>Close</button>
        <button type="button" class="danger delete-btn">Delete</button>
      </td>
    `;

        row.querySelector('.edit-btn').addEventListener('click', () => startEdit(t));
        row.querySelector('.close-btn').addEventListener('click', () => closeTicket(t.id));
        row.querySelector('.delete-btn').addEventListener('click', () => deleteTicket(t.id));

        tbody.appendChild(row);
    });
}

loadTickets();
