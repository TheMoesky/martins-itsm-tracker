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
      <td>${t.title}</td>
      <td>${t.status}</td>
      <td>${t.priority}</td>
      <td>${t.sla_due_at ?? '—'}</td>
      <td><span class="badge ${badgeClass}">${t.sla_status}</span></td>
    `;
        tbody.appendChild(row);
    });
}

loadTickets();