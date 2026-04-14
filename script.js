/* ===== APP START FEELING ===== */

window.addEventListener("load", () => {
  const splash = document.getElementById("splash-screen");

  // Haupt-App verstecken bis Splash weg ist
  document.body.style.overflow = "hidden";

  setTimeout(() => {
    splash.style.opacity = "0";
    splash.style.transition = "0.4s ease";

    setTimeout(() => {
      splash.remove();
      document.body.style.overflow = "auto";
    }, 400);

  }, 900);
});
/* --------- VIEW HANDLING --------- */
const views = {
  login: document.getElementById("login-view"),
  dash: document.getElementById("dashboard-view"),
  cust: document.getElementById("customers-view"),
  cal: document.getElementById("calendar-view"),
  sess: document.getElementById("session-view")
};

const header = document.getElementById("main-header");

function show(v) {
  Object.values(views).forEach(x => x.classList.add("hidden"));
  v.classList.remove("hidden");
  if (v === views.login) header.classList.add("hidden");
  else header.classList.remove("hidden");
}
show(views.login);

// Logo-Klick → Dashboard
document.getElementById("logo-dashboard").onclick = () => show(views.dash);

/* --------- LOGIN --------- */
const DEMO = { username: "trainer", password: "1234" };
document.getElementById("login-btn").onclick = () => {
  const u = document.getElementById("login-username").value;
  const p = document.getElementById("login-password").value;
  const err = document.getElementById("login-error");
  if (u === DEMO.username && p === DEMO.password) {
    err.classList.add("hidden");
    show(views.dash);
    updateBirthday();
  } else {
    err.textContent = "Benutzername oder Passwort ist falsch.";
    err.classList.remove("hidden");
  }
};

document.getElementById("logout-btn").onclick = () => { show(views.login); };

/* --------- STORAGE --------- */
const KEY = "EP_DATA_V1";
const state = {
  data: JSON.parse(localStorage.getItem(KEY) || `{"customers":[],"appointments":[]}`),
  selectedCustomer: null,
  directMode: false,
  newSessionCustomer: null,
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  calSelected: null,
  editing: null
};
function save() {
  localStorage.setItem(KEY, JSON.stringify(state.data));
  updateBirthday();
}

/* --------- NAVIGATION BUTTONS --------- */
document.querySelectorAll('.back-btn').forEach(btn => {
  btn.onclick = () => show(views.dash);
});
document.getElementById("btn-customers").onclick = () => {
  state.directMode = false;
  document.getElementById("customers-hint").classList.add("hidden");
  show(views.cust);
  renderCustomers();
  renderCustomerDetail();
};
document.getElementById("btn-calendar").onclick = () => {
  show(views.cal);
  renderCalendar();
  fillApptSelect();
  renderDayAppointments();
};

/* --------- DASHBOARD: NEUE EINHEIT MIT DROPDOWN --------- */
const sessionCustomerBlock = document.getElementById("session-customer-block");
const sessionCustomerDropdown = document.getElementById("session-customer-dropdown");
const sessionForm = document.getElementById("session-form");
document.getElementById("btn-new-session").onclick = () => {
  state.directMode = true;
  show(views.sess);
  sessionCustomerBlock.classList.remove("hidden");
  sessionCustomerDropdown.innerHTML = "";
  state.data.customers.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${c.first} ${c.last}`;
    sessionCustomerDropdown.appendChild(opt);
  });
  sessionForm.reset();
  document.getElementById("session-date").value = new Date().toISOString().slice(0, 10);
  document.getElementById("session-view-title").textContent = "Neue Trainingseinheit";
};

/* --------- KUNDENLISTE/DETAIL --------- */
const custList = document.getElementById("customer-list");
const custSearch = document.getElementById("customer-search");
custSearch.oninput = renderCustomers;

function renderCustomers() {
  const s = custSearch.value.toLowerCase();
  custList.innerHTML = "";
  state.data.customers
    .slice()
    .sort((a, b) => (a.last || "").localeCompare(b.last || ""))
    .forEach(c => {
      const name = `${c.first} ${c.last}`.trim();
      if (s && !name.toLowerCase().includes(s)) return;
      const li = document.createElement("li");
      li.textContent = name || "(ohne Namen)";
      if (c.id === Number(state.selectedCustomer)) li.classList.add("active");
      li.onclick = () => {
        state.selectedCustomer = c.id;
        if (state.directMode) return openNewSession(c);
        renderCustomers();
        renderCustomerDetail();
      };
      custList.appendChild(li);
    });
}

const custDetail = document.getElementById("customer-detail");
const custEmpty = document.getElementById("customer-empty");
const custFormWrap = document.getElementById("customer-form-wrapper");

// Klappfunktion für Stammdaten
let stammdatenOffen = false;
document.getElementById("detail-name").onclick = () => {
  stammdatenOffen = !stammdatenOffen;
  document.getElementById("customer-stammdaten").classList.toggle("hidden", !stammdatenOffen);
};

function renderCustomerDetail() {
  const c = state.data.customers.find(x => x.id === Number(state.selectedCustomer));
  if (!c) {
    custDetail.classList.add("hidden");
    custFormWrap.classList.add("hidden");
    custEmpty.classList.remove("hidden");
    return;
  }
  custEmpty.classList.add("hidden");
  custFormWrap.classList.add("hidden");
  custDetail.classList.remove("hidden");
  document.getElementById("customer-name-text").textContent = `${c.first} ${c.last}`;
  document.getElementById("detail-dob").textContent = c.dob || "-";
  const addrParts = [
    c.street,
    [c.zip, c.city].filter(Boolean).join(" ")
  ].filter(Boolean);
  document.getElementById("detail-address").textContent = addrParts.length ? addrParts.join(", ") : "-";
  document.getElementById("detail-phone").textContent = c.phone || "-";
  document.getElementById("detail-email").textContent = c.email || "-";
  document.getElementById("history-block").style.display = state.directMode ? "none" : "block";
  document.getElementById("customer-stammdaten").classList.add("hidden");
  stammdatenOffen = false;
  renderSessions(c);
}

const sessionList = document.getElementById("session-list");
function renderSessions(c) {
  sessionList.innerHTML = "";
  (c.sessions || [])
    .slice()
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
    .forEach((s, i) => {
      const li = document.createElement("li");
      li.className = "session-card";
      li.innerHTML = `
        <div class="session-dot">${i + 1}</div>
        <div>
          <div class="session-card-title">${s.date ? s.date.split("-").reverse().join(".") : "–"}</div>
          <div class="session-card-plan">${s.plan || ""}</div>
        </div>
      `;
      li.onclick = () => openEditSession(c, s);
      sessionList.appendChild(li);
    });
}

// Neue Kunden / Kundendaten bearbeiten
document.getElementById("new-customer-btn").onclick = () => {
  custDetail.classList.add("hidden");
  custEmpty.classList.add("hidden");
  custFormWrap.classList.remove("hidden");
  document.getElementById("customer-form-title").textContent = "Neue KundIn";
  document.getElementById("customer-form").reset();
  document.getElementById("cust-id").value = "";
};
document.getElementById("cancel-customer-form").onclick = () => {
  custFormWrap.classList.add("hidden");
  renderCustomerDetail();
};
document.getElementById("edit-customer-btn").onclick = () => {
  const c = state.data.customers.find(x => x.id === Number(state.selectedCustomer));
  if (!c) return;
  custDetail.classList.add("hidden");
  custEmpty.classList.add("hidden");
  custFormWrap.classList.remove("hidden");
  document.getElementById("customer-form-title").textContent = "KundIn bearbeiten";
  document.getElementById("cust-id").value = c.id;
  document.getElementById("cust-firstname").value = c.first;
  document.getElementById("cust-lastname").value = c.last;
  document.getElementById("cust-dob").value = c.dob || "";
  document.getElementById("cust-street").value = c.street || "";
  document.getElementById("cust-zip").value = c.zip || "";
  document.getElementById("cust-city").value = c.city || "";
  document.getElementById("cust-phone").value = c.phone || "";
  document.getElementById("cust-email").value = c.email || "";
};
document.getElementById("delete-customer-btn").onclick = () => {
  const c = state.data.customers.find(x => x.id === Number(state.selectedCustomer));
  if (!c) return;
  if (confirm(`KundIn "${c.first} ${c.last}" wirklich löschen?`)) {
    state.data.customers = state.data.customers.filter(x => x.id !== c.id);
    state.selectedCustomer = null;
    save();
    renderCustomers();
    renderCustomerDetail();
  }
};
document.getElementById("customer-form").onsubmit = e => {
  e.preventDefault();
  const id = document.getElementById("cust-id").value;
  const data = {
    first: document.getElementById("cust-firstname").value.trim(),
    last: document.getElementById("cust-lastname").value.trim(),
    dob: document.getElementById("cust-dob").value,
    street: document.getElementById("cust-street").value.trim(),
    zip: document.getElementById("cust-zip").value.trim(),
    city: document.getElementById("cust-city").value.trim(),
    phone: document.getElementById("cust-phone").value.trim(),
    email: document.getElementById("cust-email").value.trim()
  };
  if (!data.first && !data.last) {
    alert("Bitte mindestens Vor- oder Nachname eingeben.");
    return;
  }
  if (id) {
    const c = state.data.customers.find(x => x.id === Number(id));
    Object.assign(c, data);
    state.selectedCustomer = c.id;
  } else {
    const c = { id: Date.now(), ...data, sessions: [] };
    state.data.customers.push(c);
    state.selectedCustomer = c.id;
  }
  save();
  custFormWrap.classList.add("hidden");
  renderCustomers();
  renderCustomerDetail();
  fillApptSelect();
};

// --- NEUE EINHEIT AUCH ÜBER KUNDEN ---
function openNewSession(c) {
  state.newSessionCustomer = c.id;
  sessionForm.reset();
  document.getElementById("session-date").value =
    new Date().toISOString().slice(0, 10);
  document.getElementById("session-view-title").textContent =
    `Neue Trainingseinheit für ${c.first} ${c.last}`;
  sessionCustomerBlock.classList.add("hidden");
  show(views.sess);
}
document.getElementById("new-session-btn").onclick = () => {
  const c = state.data.customers.find(x => x.id === Number(state.selectedCustomer));
  if (c) openNewSession(c);
};
sessionForm.onsubmit = e => {
  e.preventDefault();
  const dateVal = document.getElementById("session-date").value;
  if (!dateVal) {
    alert("Bitte ein Datum für die Trainingseinheit angeben.");
    return;
  }
  let c = null;
  if (!sessionCustomerBlock.classList.contains("hidden")) {
    const selectedId = Number(sessionCustomerDropdown.value);
    c = state.data.customers.find(x => x.id === selectedId);
    if (!c) {
      alert("Bitte einen Kunden auswählen!");
      return;
    }
  } else {
    c = state.data.customers.find(x => x.id === state.newSessionCustomer);
    if (!c) return;
  }
  c.sessions.push({
    id: Date.now(),
    date: dateVal,
    notes: document.getElementById("session-notes").value.trim(),
    plan: document.getElementById("session-plan").value.trim()
  });
  save();
  state.directMode = false;
  sessionCustomerBlock.classList.add("hidden");
  show(views.cust);
  renderCustomers();
  renderCustomerDetail();
};

/* -------------------- SESSION MODAL (Bearbeiten) -------------------- */
const modal = document.getElementById("session-modal");
function openEditSession(c, s) {
  state.editing = { cid: c.id, sid: s.id };
  document.getElementById("edit-session-id").value = s.id;
  document.getElementById("edit-session-date").value = s.date;
  document.getElementById("edit-session-notes").value = s.notes || "";
  document.getElementById("edit-session-plan").value = s.plan || "";
  modal.classList.remove("hidden");
}
function closeModal() {
  modal.classList.add("hidden");
  state.editing = null;
}
document.getElementById("cancel-session-edit").onclick = closeModal;
modal.querySelector(".modal-backdrop").onclick = closeModal;
document.getElementById("session-edit-form").onsubmit = e => {
  e.preventDefault();
  const dateVal = document.getElementById("edit-session-date").value;
  if (!dateVal) {
    alert("Bitte ein Datum angeben.");
    return;
  }
  const { cid, sid } = state.editing;
  const c = state.data.customers.find(x => x.id === cid);
  const s = c.sessions.find(x => x.id === sid);
  s.date = dateVal;
  s.notes = document.getElementById("edit-session-notes").value.trim();
  s.plan = document.getElementById("edit-session-plan").value.trim();
  save();
  closeModal();
  renderCustomerDetail();
};
document.getElementById("delete-session-btn").onclick = () => {
  const { cid, sid } = state.editing;
  const c = state.data.customers.find(x => x.id === cid);
  c.sessions = c.sessions.filter(x => x.id !== sid);
  save();
  closeModal();
  renderCustomerDetail();
};

/* -------------------- KALENDER -------------------- */
const calLabel = document.getElementById("cal-label");
const calDays = document.getElementById("cal-days");

function renderCalendar() {
  const m = state.calMonth;
  const y = state.calYear;
  const names = [
    "Jänner","Februar","März","April","Mai","Juni",
    "Juli","August","September","Oktober","November","Dezember"
  ];
  calLabel.textContent = `${names[m]} ${y}`;
  const first = new Date(y, m, 1);
  const start = (first.getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  calDays.innerHTML = "";
  for (let i = 0; i < start; i++) {
    const b = document.createElement("button");
    b.disabled = true;
    b.style.opacity = "0";
    calDays.appendChild(b);
  }
  const today = new Date().toISOString().slice(0, 10);
  for (let d = 1; d <= days; d++) {
    const b = document.createElement("button");
    const ds = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    b.textContent = d;
    if (ds === today) b.classList.add("today");
    if (ds === state.calSelected) b.classList.add("selected");
    b.onclick = () => {
      state.calSelected = ds;
      renderCalendar();
      renderDayAppointments();
    };
    calDays.appendChild(b);
  }
}
document.getElementById("cal-prev").onclick = () => {
  if (state.calMonth === 0) {
    state.calMonth = 11;
    state.calYear--;
  } else {
    state.calMonth--;
  }
  renderCalendar();
  renderDayAppointments();
};
document.getElementById("cal-next").onclick = () => {
  if (state.calMonth === 11) {
    state.calMonth = 0;
    state.calYear++;
  } else {
    state.calMonth++;
  }
  renderCalendar();
  renderDayAppointments();
};

/* -------------------- TERMIN EINTRAGEN MODAL -------------------- */
const apptModal = document.getElementById('appt-modal');
const apptModalForm = document.getElementById('appt-modal-form');
const apptModalCustomer = document.getElementById('appt-modal-customer');
const apptModalStart = document.getElementById('appt-modal-start');
const apptModalEnd = document.getElementById('appt-modal-end');
const apptModalNote = document.getElementById('appt-modal-note');
const apptModalCancel = document.getElementById('appt-modal-cancel');

document.getElementById('add-appt-btn').onclick = () => {
  apptModal.classList.remove('hidden');
  apptModalCustomer.innerHTML = '';
  state.data.customers.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.first} ${c.last}`;
    apptModalCustomer.appendChild(opt);
  });
  // Aktuelle Zeit vorbelegen
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, '0');
  apptModalStart.value = `${hour}:00`;
  apptModalEnd.value   = `${hour}:30`;
  apptModalNote.value  = '';
};
apptModalCancel.onclick = () => apptModal.classList.add('hidden');
apptModal.querySelector('.modal-backdrop').onclick = () => apptModal.classList.add('hidden');
apptModalForm.onsubmit = e => {
  e.preventDefault();
  if (!state.calSelected) {
    alert("Bitte zuerst einen Tag auswählen.");
    return;
  }
  const cid = Number(apptModalCustomer.value);
  if (!cid) {
    alert("Bitte KundIn auswählen.");
    return;
  }
  const start = apptModalStart.value;
  const end   = apptModalEnd.value;
  if (!start || !end || start >= end) {
    alert("Ungültige Zeitangabe.");
    return;
  }
  state.data.appointments.push({
    id: Date.now(),
    date: state.calSelected,
    customerId: cid,
    start,
    end,
    note: apptModalNote.value.trim()
  });
  save();
  apptModal.classList.add('hidden');
  renderDayAppointments();
};
/* --------- TERMIN BEARBEITEN MODAL --------- */
const apptEditModal = document.createElement('div');
apptEditModal.id = 'appt-edit-modal';
apptEditModal.className = 'hidden';
apptEditModal.innerHTML = `
  <div class="modal-backdrop"></div>
  <div class="modal-content">
    <h3>Termin bearbeiten</h3>
    <form id="appt-edit-form">
      <input id="edit-appt-id" type="hidden">
      <label>Von:
        <input id="edit-appt-start" type="time" required>
      </label>
      <label>Bis:
        <input id="edit-appt-end" type="time" required>
      </label>
      <label>Notiz:
        <textarea id="edit-appt-note" rows="2"></textarea>
      </label>
      <div class="form-actions">
        <button type="submit" class="btn-primary">Speichern</button>
        <button type="button" id="delete-appt-btn" class="btn-danger">Löschen</button>
        <button type="button" id="cancel-appt-edit" class="btn-outline">Abbrechen</button>
      </div>
    </form>
  </div>
`;
document.querySelector('main').appendChild(apptEditModal);

function openEditAppointment(appt) {
  document.getElementById("edit-appt-id").value = appt.id;
  document.getElementById("edit-appt-start").value = appt.start;
  document.getElementById("edit-appt-end").value = appt.end;
  document.getElementById("edit-appt-note").value = appt.note || "";
  apptEditModal.classList.remove("hidden");
}

document.getElementById("cancel-appt-edit").onclick = () => {
  apptEditModal.classList.add("hidden");
};
apptEditModal.querySelector(".modal-backdrop").onclick = () => {
  apptEditModal.classList.add("hidden");
};

document.getElementById("appt-edit-form").onsubmit = e => {
  e.preventDefault();
  const apptId = Number(document.getElementById("edit-appt-id").value);
  const appt = state.data.appointments.find(a => a.id === apptId);
  if (!appt) return;
  const start = document.getElementById("edit-appt-start").value;
  const end = document.getElementById("edit-appt-end").value;
  if (start >= end) {
    alert("Endzeit muss nach Startzeit liegen.");
    return;
  }
  appt.start = start;
  appt.end = end;
  appt.note = document.getElementById("edit-appt-note").value.trim();
  save();
  apptEditModal.classList.add("hidden");
  renderDayAppointments();
};

document.getElementById("delete-appt-btn").onclick = () => {
  if (confirm("Termin wirklich löschen?")) {
    const apptId = Number(document.getElementById("edit-appt-id").value);
    state.data.appointments = state.data.appointments.filter(a => a.id !== apptId);
    save();
    apptEditModal.classList.add("hidden");
    renderDayAppointments();
  }
};

/* --------- TERMINE IM KALENDER ANZEIGEN --------- */
const apptCustomer = document.getElementById("appt-customer");
const dayTitle = document.getElementById("day-title");
const dayAppointments = document.getElementById("day-appointments");
function fillApptSelect() {
  if (!apptCustomer) return;
  apptCustomer.innerHTML = `<option value="">Bitte wählen</option>`;
  state.data.customers
    .slice()
    .sort((a, b) => (a.last || "").localeCompare(b.last || ""))
    .forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `${c.first} ${c.last}`;
      apptCustomer.appendChild(opt);
    });
}
function renderDayAppointments() {
  dayAppointments.innerHTML = "";

  if (!state.calSelected) {
    dayTitle.textContent = "Tag auswählen";
    return;
  }

  dayTitle.textContent =
    `Termine am ${state.calSelected.split("-").reverse().join(".")}`;

  const appts = state.data.appointments
    .filter(a => a.date === state.calSelected)
    .sort((a, b) => a.start.localeCompare(b.start));
    
  // Für jede Stunde
  for (let hour = 0; hour < 24; hour++) {
    let row = document.createElement("div");
    row.className = "time-row";
    let lbl = document.createElement("div");
    lbl.textContent = `${String(hour).padStart(2, "0")}:00`;
    let slot = document.createElement("div");
    slot.style.position = "relative";
    slot.style.height = "24px";

    // Termine, die in dieser Stunde liegen/ragen
    appts.forEach(a => {
      const [sh, sm] = a.start.split(":").map(Number);
      const [eh, em] = a.end.split(":").map(Number);
      const eventStartMin = sh * 60 + sm;
      const eventEndMin   = eh * 60 + em;
      const hourStart = hour * 60;
      const hourEnd = (hour + 1) * 60;

      // Prüfen ob der Termin in dieser Stunde liegt
      const overlaps = eventEndMin > hourStart && eventStartMin < hourEnd;
     if (overlaps) {
        // In welcher Minute in dieser Stunde startet/endet das Segment?
        const segStart = Math.max(eventStartMin, hourStart) - hourStart;
        const segEnd = Math.min(eventEndMin, hourEnd) - hourStart;
        const left = (segStart / 60) * 100;
        const width = Math.max((segEnd - segStart) / 60 * 100, 2);

        const c = state.data.customers.find(x => x.id === Number(a.customerId));
        const div = document.createElement("div");
        div.className = "appt-block";
        div.textContent = `${a.start}–${a.end} ${c ? (c.first + " " + c.last) : ""}`;
        div.style.left = left + "%";
        div.style.width = width + "%";
        div.style.position = "absolute";
        div.title = div.textContent;
        div.style.cursor = "pointer";
        div.onclick = (e) => {
          e.stopPropagation();
          openEditAppointment(a);
        };
        slot.appendChild(div);
      }
    });
    row.appendChild(lbl);
    row.appendChild(slot);
    dayAppointments.appendChild(row);
  }
}/* --------- GEBURTSTAG --------- */
const birthdayInfo = document.getElementById("birthday-info");
function updateBirthday() {
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const ty = today.getFullYear();
  const list = state.data.customers
    .filter(c => c.dob)
    .map(c => {
      const [y, m, d] = c.dob.split("-").map(Number);
      if (!y || !m || !d) return null;
      let next = new Date(ty, m - 1, d);
      if (next < todayMidnight) next = new Date(ty + 1, m - 1, d);
      const diff = Math.round((next - todayMidnight) / (1000 * 60 * 60 * 24));
      const age = next.getFullYear() - y;
      return { c, next, diff, age };
    })
    .filter(Boolean)
    .sort((a, b) => a.diff - b.diff);
  if (!list.length) {
    birthdayInfo.textContent = "Keine Geburtsdaten hinterlegt.";
    return;
  }
  const n = list[0];
  const dateStr = `${String(n.next.getDate()).padStart(2, "0")}.${String(n.next.getMonth() + 1).padStart(2, "0")}.`;
  const name = `${n.c.first} ${n.c.last}`.trim();
  const inText = n.diff === 0 ? "heute" : `in ${n.diff} Tag${n.diff === 1 ? "" : "en"}`;
  birthdayInfo.textContent = `🎂 ${name} – ${dateStr} (${inText}), wird ${n.age}`;
}

/* --------- INITIAL LADEN --------- */
function renderAll() {
  renderCustomers();
  renderCustomerDetail();
  renderCalendar();
  fillApptSelect();
  renderDayAppointments();
  updateBirthday();
}
