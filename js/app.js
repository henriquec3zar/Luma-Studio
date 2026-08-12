/**
 * LUMA STUDIO - SISTEMA DE GESTAO INTELIGENTE PARA SALAO
 * Arquivo: app.js
 * Descricao: Contem toda a logica JavaScript do sistema.
 * Este codigo faz parte do front-end e consome a API REST do backend.
 */

(function () {
  "use strict";

  // IIFE encapsula a aplicacao em escopo privado para evitar conflitos com outras bibliotecas.

  // Horario inicial do expediente em minutos (08:00).
  var BUSINESS_START = 8 * 60;
  // Horario final do expediente em minutos (20:00).
  var BUSINESS_END = 20 * 60;
  // Altura visual de cada hora no calendario em pixels.
  var HOUR_HEIGHT = 60;
  // Data inicial exibida quando a aplicacao carrega.
  var INITIAL_DATE = "2026-07-31";
  // Chave de armazenamento para agendamentos no localStorage.
  var STORAGE_KEY = "luma-studio-agenda-v1";
  // Chave de armazenamento para cadastros de clientes.
  var CLIENTS_STORAGE_KEY = "luma-studio-clients-v1";
  // Chave de armazenamento para servicos oferecidos.
  var SERVICES_STORAGE_KEY = "luma-studio-services-v1";

  // Lista de profissionais disponiveis para receber agendamentos.
  var professionals = [];
  var clients = [];
  var services = [];

  // Estado reativo da aplicacao: data atual, visualizacao, filtros e estado de arraste.
  var state = {
    appointments: [],
    currentDate: INITIAL_DATE,
    calendarView: "day",
    filters: { professional: "all", status: "all" },
    activeDragId: null,
    draggedOverColumn: null,
    clientSearch: "",
    serviceSearch: ""
  };

  // Referencias rapidas aos elementos HTML para evitar consultas repetidas ao DOM.
  var dom = {
    body: document.body,
    dashboardView: document.getElementById("dashboard-view"),
    agendaView: document.getElementById("agenda-view"),
    clientesView: document.getElementById("clientes-view"),
    servicosView: document.getElementById("servicos-view"),
    navItems: Array.prototype.slice.call(document.querySelectorAll("[data-view-target]")),
    topbarContext: document.getElementById("topbar-context"),
    calendarGrid: document.getElementById("calendar-grid"),
    calendarScroll: document.getElementById("calendar-scroll"),
    dayView: document.getElementById("calendar-day-view"),
    weekView: document.getElementById("calendar-week-view"),
    monthView: document.getElementById("calendar-month-view"),
    dateLabel: document.getElementById("agenda-date-label"),
    dateSubtitle: document.getElementById("agenda-date-subtitle"),
    filterButton: document.getElementById("filters-button"),
    filterPopover: document.getElementById("filters-popover"),
    filterCount: document.getElementById("filter-count"),
    professionalFilter: document.getElementById("professional-filter"),
    statusFilter: document.getElementById("status-filter"),
    modalBackdrop: document.getElementById("modal-backdrop"),
    appointmentModal: document.getElementById("appointment-modal"),
    blockModal: document.getElementById("block-modal"),
    clientModal: document.getElementById("client-modal"),
    serviceModal: document.getElementById("service-modal"),
    appointmentForm: document.getElementById("appointment-form"),
    blockForm: document.getElementById("block-form"),
    clientForm: document.getElementById("client-form"),
    serviceForm: document.getElementById("service-form"),
    appointmentId: document.getElementById("appointment-id"),
    clientInput: document.getElementById("client-input"),
    serviceInput: document.getElementById("service-input"),
    professionalInput: document.getElementById("professional-input"),
    dateInput: document.getElementById("date-input"),
    timeInput: document.getElementById("time-input"),
    durationInput: document.getElementById("duration-input"),
    statusInput: document.getElementById("status-input"),
    notesInput: document.getElementById("notes-input"),
    conflictBox: document.getElementById("conflict-box"),
    conflictMessage: document.getElementById("conflict-message"),
    conflictSuggestions: document.getElementById("conflict-suggestions"),
    saveAppointment: document.getElementById("save-appointment"),
    blockProfessionalInput: document.getElementById("block-professional-input"),
    blockDateInput: document.getElementById("block-date-input"),
    blockTimeInput: document.getElementById("block-time-input"),
    blockDurationInput: document.getElementById("block-duration-input"),
    blockTypeInput: document.getElementById("block-type-input"),
    drawer: document.getElementById("appointment-drawer"),
    drawerContent: document.getElementById("drawer-content"),
    toastRegion: document.getElementById("toast-region"),
    dashboardNextList: document.getElementById("dashboard-next-list"),
    clientesGrid: document.getElementById("clientes-grid"),
    servicosGrid: document.getElementById("servicos-grid"),
    clientSearch: document.getElementById("client-search"),
    serviceSearch: document.getElementById("service-search")
  };

  // Cria copia profunda de objetos/arrays usando JSON para evitar mutacao acidental.
  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  // Protege a renderizacao de texto no HTML para evitar injecao de codigo malicioso.
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/\x26/g, "\x26amp;")
      .replace(/</g, "\x26lt;")
      .replace(/>/g, "\x26gt;")
      .replace(/"/g, "\x26quot;")
      .replace(/'/g, "\x26#039;");
  }

  // Gera as iniciais de um nome para montar avatares simplificados.
  function initials(name) {
    return String(name || "?").split(/\s+/).slice(0, 2).map(function (part) {
      return part.charAt(0);
    }).join("").toUpperCase();
  }

  /** Busca metadados de uma cliente pelo nome. */
  function clientMeta(name) {
    var found = clients.filter(function (client) { return client.name === name; })[0];
    return found || { name: name, initials: initials(name), avatar: "avatar-bia" };
  }

  /** Gera o HTML do avatar (circulo colorido com iniciais). */
  function avatarHtml(name, extraClass) {
    var meta = clientMeta(name);
    return '<span class="person-avatar ' + escapeHtml(meta.avatar) + ' ' + (extraClass || "") + '">' + escapeHtml(meta.initials) + "</span>";
  }

  /** Busca um profissional pelo ID. */
  function professionalById(id) {
    return professionals.filter(function (professional) { return professional.id === id; })[0] || professionals[0];
  }

  /** Busca um servico pelo nome. */
  function serviceByName(name) {
    return services.filter(function (service) { return service.name === name; })[0] || { name: name, duration: 60, price: 0 };
  }

  /** Converte horario "HH:MM" para minutos. Ex: "08:30" -> 510 */
  function toMinutes(time) { var parts = String(time).split(":"); return Number(parts[0]) * 60 + Number(parts[1]); }
  /** Converte minutos para horario "HH:MM". Ex: 510 -> "08:30" */
  function toTime(minutes) {
    var bounded = Math.max(0, Math.min(23 * 60 + 59, minutes));
    return String(Math.floor(bounded / 60)).padStart(2, "0") + ":" + String(bounded % 60).padStart(2, "0");
  }
  /** Formata intervalo de tempo. Ex: "08:00 - 10:00" */
  function formatTimeRange(item) { return item.time + " — " + toTime(toMinutes(item.time) + Number(item.duration)); }
  /** Cria objeto Date a partir de data ISO. Usa T12:00:00 para evitar fuso. */
  function dateObject(iso) { return new Date(iso + "T12:00:00"); }
  /** Converte objeto Date para string ISO (YYYY-MM-DD). */
  function isoDate(date) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }
  /** Adiciona dias a uma data ISO. */
  function addDays(iso, days) { var d = dateObject(iso); d.setDate(d.getDate() + days); return isoDate(d); }
  /** Adiciona meses a uma data ISO. */
  function addMonths(iso, months) { var d = dateObject(iso); d.setMonth(d.getMonth() + months); return isoDate(d); }
  /** Formata data por extenso em portugues. Ex: "31 de julho" */
  function dateLong(iso) { return dateObject(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long" }); }
  /** Retorna nome do dia da semana em portugues. */
  function weekdayName(iso) { return dateObject(iso).toLocaleDateString("pt-BR", { weekday: "long" }); }
  /** Retorna abreviacao do dia da semana. Ex: "sex" */
  function shortWeekday(iso) { return dateObject(iso).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""); }
  /** Formata valor como moeda brasileira (R$). Ex: 460 -> "R$ 460,00" */
  function formatCurrency(value) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value); }
  /** Retorna titulo do evento (nome da cliente ou titulo do bloqueio). */
  function eventTitle(item) { return item.status === "blocked" ? item.title : item.client; }

  /** Retorna rotulo legivel de um status. Ex: "scheduled" -> "Agendado" */
  function statusLabel(status) {
    var labels = { scheduled: "Agendado", confirmed: "Confirmado", progress: "Em atendimento", finished: "Finalizado", cancelled: "Cancelado", "no-show": "Não compareceu", blocked: "Bloqueio" };
    return labels[status] || "Agendado";
  }

  /** Verifica se agendamento bloqueia a agenda (cancelados e no-show nao bloqueiam). */
  function isBlocking(item) { return item.status !== "cancelled" && item.status !== "no-show"; }

  /** Verifica se agendamento deve ser exibido (passa pelos filtros). */
  function isVisible(item) {
    var professionalPasses = state.filters.professional === "all" || item.professionalId === state.filters.professional;
    var statusPasses = state.filters.status === "all" || item.status === state.filters.status;
    return professionalPasses && statusPasses;
  }

  /** Retorna agendamentos de uma data especifica. */
  function getDateItems(iso) { return state.appointments.filter(function (item) { return item.date === iso; }); }
  /** Retorna agendamentos de uma data, ordenados por horario. */
  function getSortedItems(iso) { return getDateItems(iso).slice().sort(function (a, b) { return toMinutes(a.time) - toMinutes(b.time); }); }

  // Verifica se um novo agendamento coincide com outro ja existente no mesmo horario e profissional.
  function hasConflict(candidate, excludeId) {
    var start = toMinutes(candidate.time), end = start + Number(candidate.duration);
    return state.appointments.some(function (item) {
      if (item.id === excludeId || item.date !== candidate.date || item.professionalId !== candidate.professionalId || !isBlocking(item)) return false;
      var itemStart = toMinutes(item.time), itemEnd = itemStart + Number(item.duration);
      return start < itemEnd && end > itemStart;
    });
  }

  /** Encontra o agendamento que conflita com o candidato. */
  function findConflictingItem(candidate, excludeId) {
    var start = toMinutes(candidate.time), end = start + Number(candidate.duration);
    return state.appointments.filter(function (item) {
      if (item.id === excludeId || item.date !== candidate.date || item.professionalId !== candidate.professionalId || !isBlocking(item)) return false;
      var itemStart = toMinutes(item.time), itemEnd = itemStart + Number(item.duration);
      return start < itemEnd && end > itemStart;
    })[0];
  }

  /** Encontra 3 horarios mais proximos disponiveis (sem conflito). */
  function nearestAvailableSlots(candidate, excludeId) {
    var base = toMinutes(candidate.time), options = [];
    var offsets = [30, -30, 60, -60, 90, -90, 120, -120, 150, -150, 180, -180];
    offsets.forEach(function (offset) {
      if (options.length >= 3) return;
      var minutes = base + offset;
      if (minutes < BUSINESS_START || minutes + Number(candidate.duration) > BUSINESS_END) return;
      var proposed = { date: candidate.date, professionalId: candidate.professionalId, time: toTime(minutes), duration: candidate.duration };
      if (!hasConflict(proposed, excludeId) && options.indexOf(proposed.time) === -1) options.push(proposed.time);
    });
    return options.sort(function (a, b) { return Math.abs(toMinutes(a) - base) - Math.abs(toMinutes(b) - base); });
  }

  /** Preenche os elementos <select> com clientes, servicos, profissionais e horarios. */
  function populateSelects() {
    dom.clientInput.innerHTML = '<option value="">Selecione uma cliente</option>' + clients.map(function (client) {
      return '<option value="' + escapeHtml(client.name) + '">' + escapeHtml(client.name) + "</option>";
    }).join("");
    dom.serviceInput.innerHTML = services.map(function (service) {
      return '<option value="' + escapeHtml(service.name) + '">' + escapeHtml(service.name) + " · " + formatCurrency(service.price) + "</option>";
    }).join("");
    var professionalOptions = professionals.map(function (professional) {
      return '<option value="' + professional.id + '">' + escapeHtml(professional.name) + " · " + escapeHtml(professional.role) + "</option>";
    }).join("");
    dom.professionalInput.innerHTML = professionalOptions;
    dom.blockProfessionalInput.innerHTML = professionalOptions;
    dom.professionalFilter.innerHTML = '<option value="all">Todos os profissionais</option>' + professionals.map(function (professional) {
      return '<option value="' + professional.id + '">' + escapeHtml(professional.name) + "</option>";
    }).join("");
    var timeOptions = "";
    for (var minute = BUSINESS_START; minute < BUSINESS_END; minute += 30) {
      timeOptions += '<option value="' + toTime(minute) + '">' + toTime(minute) + "</option>";
    }
    dom.timeInput.innerHTML = timeOptions;
    dom.blockTimeInput.innerHTML = timeOptions;
  }

  /** Gera HTML de um card de agendamento no calendario (vista de dia). */
  function itemCardHtml(item) {
    var top = toMinutes(item.time) - BUSINESS_START;
    var height = Math.max(Number(item.duration) - 2, 25);
    var compact = Number(item.duration) <= 45 ? " compact-card" : "";
    var service = item.status === "blocked" ? "Horário indisponível" : item.service;
    var eventTime = item.status === "blocked" ? formatTimeRange(item) : item.time + " · " + toTime(toMinutes(item.time) + Number(item.duration));
    var draggable = item.status === "blocked" ? "false" : "true";
    return '<button type="button" draggable="' + draggable + '" class="appointment-card status-' + escapeHtml(item.status) + compact + '" data-appointment-id="' + escapeHtml(item.id) + '" style="top:' + top + "px;height:" + height + 'px">' +
      '<span class="event-time">' + escapeHtml(eventTime) + "</span>" +
      '<span class="event-client">' + escapeHtml(eventTitle(item)) + "</span>" +
      '<span class="event-service">' + escapeHtml(service) + "</span></button>";
  }

  /** Renderiza calendario na vista de dia. Cria cabecalhos, eixo, slots e cards. */
  function renderDayCalendar() {
    var html = '<div class="calendar-corner"></div>';
    professionals.forEach(function (professional) {
      html += '<div class="professional-header" data-professional-header="' + professional.id + '"><span class="person-avatar ' + professional.avatar + '">' + professional.initials + "</span><div><strong>" + escapeHtml(professional.name) + "</strong><small>" + escapeHtml(professional.role) + "</small></div></div>";
    });
    html += '<div class="time-axis" style="height:' + (BUSINESS_END - BUSINESS_START) + 'px">';
    for (var minute = BUSINESS_START; minute <= BUSINESS_END; minute += 60) {
      html += '<span class="time-label" style="top:' + (minute - BUSINESS_START) + 'px">' + toTime(minute) + "</span>";
    }
    html += "</div>";
    professionals.forEach(function (professional) {
      html += '<div class="professional-column" data-professional-id="' + professional.id + '">';
      for (var slot = BUSINESS_START; slot < BUSINESS_END; slot += 30) {
        html += '<button class="time-slot" aria-label="Adicionar horário às ' + toTime(slot) + ' para ' + escapeHtml(professional.name) + '" data-slot-time="' + toTime(slot) + '" data-slot-professional="' + professional.id + '" style="top:' + (slot - BUSINESS_START) + 'px"></button>';
      }
      getSortedItems(state.currentDate).filter(function (item) { return item.professionalId === professional.id && isVisible(item); }).forEach(function (item) { html += itemCardHtml(item); });
      html += "</div>";
    });
    dom.calendarGrid.innerHTML = html;
  }

  /** Retorna a data ISO da segunda-feira da semana. */
  function mondayOf(iso) { var date = dateObject(iso); var day = date.getDay(); var diff = day === 0 ? -6 : 1 - day; date.setDate(date.getDate() + diff); return isoDate(date); }

  /** Gera HTML de um evento na vista de semana. */
  function weekEventHtml(item) {
    return '<button type="button" class="week-event status-' + escapeHtml(item.status) + '" data-appointment-id="' + escapeHtml(item.id) + '"><time>' + escapeHtml(item.time) + "</time><strong>" + escapeHtml(eventTitle(item)) + "</strong><span>" + escapeHtml(item.status === "blocked" ? "Horário indisponível" : item.service) + "</span></button>";
  }

  /** Renderiza calendario na vista de semana (7 dias). */
  function renderWeekCalendar() {
    var start = mondayOf(state.currentDate), html = '<div class="week-grid">';
    for (var index = 0; index < 7; index += 1) {
      var date = addDays(start, index), items = getSortedItems(date).filter(isVisible);
      html += '<section class="week-day ' + (date === INITIAL_DATE ? "today" : "") + '"><div class="week-head"><span>' + shortWeekday(date) + '</span><strong>' + dateObject(date).getDate() + "</strong></div><div class=\"week-event-list\">" + (items.length ? items.map(weekEventHtml).join("") : '<p class="week-empty">Sem horários</p>') + "</div></section>";
    }
    html += "</div>";
    dom.weekView.innerHTML = html;
  }

  /** Gera HTML de um evento na vista de mes. */
  function monthEventHtml(item) {
    return '<button type="button" class="month-event status-' + escapeHtml(item.status) + '" data-appointment-id="' + escapeHtml(item.id) + '">' + escapeHtml(item.time + " " + eventTitle(item)) + "</button>";
  }

  /** Renderiza calendario na vista de mes (grade 6x7 = 42 dias). */
  function renderMonthCalendar() {
    var activeDate = dateObject(state.currentDate);
    var first = new Date(activeDate.getFullYear(), activeDate.getMonth(), 1, 12);
    var startOffset = first.getDay(), start = new Date(first);
    start.setDate(first.getDate() - startOffset);
    var html = '<div class="month-weekdays"><span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span></div><div class="month-grid">';
    for (var index = 0; index < 42; index += 1) {
      var day = new Date(start); day.setDate(start.getDate() + index);
      var iso = isoDate(day), items = getSortedItems(iso).filter(isVisible);
      var inCurrentMonth = day.getMonth() === activeDate.getMonth();
      html += '<section class="month-day ' + (!inCurrentMonth ? "muted " : "") + (iso === INITIAL_DATE ? "today" : "") + '"><button type="button" data-month-day="' + iso + '" aria-label="Abrir dia ' + day.getDate() + '">' + day.getDate() + "</button>";
      items.slice(0, 3).forEach(function (item) { html += monthEventHtml(item); });
      if (items.length > 3) html += '<p class="month-more">+' + (items.length - 3) + " horários</p>";
      html += "</section>";
    }
    html += "</div>";
    dom.monthView.innerHTML = html;
  }

  /** Atualiza label de data e subtitulo (dia da semana). */
  function updateAgendaDateLabel() {
    dom.dateLabel.textContent = state.currentDate === INITIAL_DATE ? "Hoje, " + dateLong(state.currentDate) : dateLong(state.currentDate);
    dom.dateSubtitle.textContent = weekdayName(state.currentDate);
  }

  /** Mostra/oculta vistas do calendario conforme a vista ativa. */
  function updateCalendarVisibility() {
    dom.dayView.hidden = state.calendarView !== "day";
    dom.weekView.hidden = state.calendarView !== "week";
    dom.monthView.hidden = state.calendarView !== "month";
    Array.prototype.slice.call(document.querySelectorAll("[data-calendar-view]")).forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-calendar-view") === state.calendarView);
    });
  }

  // Reconstrói a interface da agenda inteira apos qualquer alteracao de data, filtro ou agendamento.
  function renderAgenda() {
    updateAgendaDateLabel();
    renderDayCalendar();
    renderWeekCalendar();
    renderMonthCalendar();
    updateCalendarVisibility();
    updateFilterState();
  }

  /** Atualiza estado visual dos filtros (contador, classe ativa, valores). */
  function updateFilterState() {
    var amount = (state.filters.professional !== "all" ? 1 : 0) + (state.filters.status !== "all" ? 1 : 0);
    dom.filterCount.textContent = amount ? String(amount) : "";
    dom.filterButton.classList.toggle("is-active", amount > 0);
    dom.professionalFilter.value = state.filters.professional;
    dom.statusFilter.value = state.filters.status;
  }

  /** Retorna agendamentos do dia inicial que nao sao bloqueios. */
  function activeAppointmentsOnDashboard() {
    return getSortedItems(INITIAL_DATE).filter(function (item) { return item.status !== "blocked"; });
  }

  // Recalcula metricas de faturamento e status do dia para mostrar no painel principal.
  function updateDashboard() {
    var dateAppointments = activeAppointmentsOnDashboard();
    var revenueItems = dateAppointments.filter(function (item) { return isBlocking(item); });
    var revenue = revenueItems.reduce(function (total, item) { return total + Number(serviceByName(item.service).price); }, 0);
    var ticket = revenueItems.length ? revenue / revenueItems.length : 0;
    var metricCards = document.querySelectorAll(".metric-card");
    if (metricCards[0]) metricCards[0].querySelector(".metric-value").innerHTML = currencyHtml(revenue);
    if (metricCards[2]) metricCards[2].querySelector(".metric-value").innerHTML = currencyHtml(ticket);
    var countOrbs = document.querySelectorAll(".now-status .status-orb");
    var waiting = dateAppointments.filter(function (item) { return item.status === "confirmed"; }).length;
    var progress = dateAppointments.filter(function (item) { return item.status === "progress"; }).length;
    var upcoming = dateAppointments.filter(function (item) { return item.status === "scheduled"; }).length;
    if (countOrbs[0]) countOrbs[0].textContent = String(waiting);
    if (countOrbs[1]) countOrbs[1].textContent = String(progress);
    if (countOrbs[2]) countOrbs[2].textContent = String(upcoming);
    var next = dateAppointments.filter(function (item) { return item.status === "scheduled" || item.status === "confirmed" || item.status === "progress"; }).slice(0, 4);
    dom.dashboardNextList.innerHTML = next.length ? next.map(function (item) {
      return '<article class="next-appointment"><time class="next-time">' + escapeHtml(item.time) + "</time>" + avatarHtml(item.client, "") + "<div><strong>" + escapeHtml(item.client) + "</strong><small>" + escapeHtml(item.service) + " · " + escapeHtml(professionalById(item.professionalId).name.split(" ")[0]) + "</small></div><button type=\"button\" data-dashboard-appointment=\"" + escapeHtml(item.id) + '" aria-label="Ver ' + escapeHtml(item.client) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button></article>';
    }).join("") : '<p class="week-empty">Nenhum próximo horário.</p>';

    // Faturamento semanal: soma dos agendamentos da semana atual.
    var weekStart = mondayOf(INITIAL_DATE);
    var weeklyRevenue = 0;
    for (var w = 0; w < 7; w += 1) {
      var wDate = addDays(weekStart, w);
      getSortedItems(wDate).filter(function (item) { return isBlocking(item) && item.status !== "blocked"; }).forEach(function (item) { weeklyRevenue += Number(serviceByName(item.service).price); });
    }
    var elWeekly = document.getElementById("finance-weekly");
    if (elWeekly) elWeekly.textContent = formatCurrency(weeklyRevenue);

    // Faturamento mensal: soma dos agendamentos do mes atual.
    var activeDate = dateObject(INITIAL_DATE);
    var monthEnd = new Date(activeDate.getFullYear(), activeDate.getMonth() + 1, 0, 12);
    var monthlyRevenue = 0;
    for (var mDay = 1; mDay <= monthEnd.getDate(); mDay += 1) {
      var mDate = isoDate(new Date(activeDate.getFullYear(), activeDate.getMonth(), mDay, 12));
      getSortedItems(mDate).filter(function (item) { return isBlocking(item) && item.status !== "blocked"; }).forEach(function (item) { monthlyRevenue += Number(serviceByName(item.service).price); });
    }
    var elMonthly = document.getElementById("finance-monthly");
    if (elMonthly) elMonthly.textContent = formatCurrency(monthlyRevenue);

    // Lucro liquido: estimativa de ~37% de margem sobre o faturamento mensal.
    var profit = Math.round(monthlyRevenue * 0.367);
    var elProfit = document.getElementById("finance-profit");
    if (elProfit) elProfit.textContent = formatCurrency(profit);

    // Contas a pagar: estimativa fixa mensal.
    var payable = 1120;
    var elPayable = document.getElementById("finance-payable");
    if (elPayable) elPayable.textContent = formatCurrency(payable);
  }

  /** Formata valor como HTML de moeda com parte decimal destacada. */
  function currencyHtml(value) {
    var formatted = formatCurrency(value).replace("R$", "").trim().replace(",", "<span>,").concat("</span>");
    return "R$ " + formatted;
  }

  /** Alterna entre telas (Dashboard, Agenda, Clientes, Servicos). Atualiza topbar. */
  function showView(view) {
    var views = { dashboard: dom.dashboardView, agenda: dom.agendaView, clientes: dom.clientesView, servicos: dom.servicosView };
    Object.keys(views).forEach(function (key) { views[key].classList.toggle("active-view", key === view); });
    dom.navItems.forEach(function (item) { item.classList.toggle("active", item.getAttribute("data-view-target") === view); });
    if (view === "dashboard") {
      dom.topbarContext.innerHTML = "<p>sexta-feira, 31 de julho</p><h1>Bom dia, equipe <span aria-hidden=\"true\">✦</span></h1>";
    } else if (view === "agenda") {
      dom.topbarContext.innerHTML = '<p>' + escapeHtml(weekdayName(state.currentDate) + ", " + dateLong(state.currentDate)) + "</p><h1>Organize seu dia com leveza</h1>";
    } else if (view === "clientes") {
      dom.topbarContext.innerHTML = "<p>Cadastros</p><h1>Clientes do salão</h1>";
    } else if (view === "servicos") {
      dom.topbarContext.innerHTML = "<p>Cadastros</p><h1>Catálogo de serviços</h1>";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Abre um modal: fecha drawer, mostra backdrop, foca no primeiro campo. */
  function openModal(modal) {
    closeDrawer();
    dom.modalBackdrop.hidden = false;
    modal.hidden = false;
    window.setTimeout(function () {
      var focusable = modal.querySelector("select, input, textarea, button");
      if (focusable) focusable.focus();
    }, 0);
  }

  /** Fecha todos os modais e o backdrop. */
  function closeModals() {
    dom.modalBackdrop.hidden = true;
    dom.appointmentModal.hidden = true;
    dom.blockModal.hidden = true;
    dom.clientModal.hidden = true;
    dom.serviceModal.hidden = true;
    dom.conflictBox.hidden = true;
  }

  /** Coleta dados do formulario de agendamento e retorna como objeto. */
  function selectedAppointmentDraft() {
    return {
      id: dom.appointmentId.value, client: dom.clientInput.value, service: dom.serviceInput.value,
      professionalId: dom.professionalInput.value, date: dom.dateInput.value, time: dom.timeInput.value,
      duration: Number(dom.durationInput.value), status: dom.statusInput.value, notes: dom.notesInput.value.trim()
    };
  }

  /** Abre modal de agendamento (novo, editar ou duplicar). */
  function openAppointmentModal(options) {
    var source = options || {};
    var existing = source.id ? state.appointments.filter(function (item) { return item.id === source.id; })[0] : null;
    var duplicate = source.duplicateFrom || null;
    var base = existing || duplicate;
    var initialTime = source.time || (base ? base.time : "10:00");
    var initialProfessional = source.professionalId || (base ? base.professionalId : professionals[0].id);
    var initialDate = source.date || (base ? base.date : state.currentDate);
    var initialService = base && base.service ? base.service : services[0].name;
    var initialDuration = base && base.duration ? base.duration : serviceByName(initialService).duration;
    dom.appointmentId.value = existing ? existing.id : "";
    dom.clientInput.value = base && base.client ? base.client : "";
    dom.serviceInput.value = initialService;
    dom.professionalInput.value = initialProfessional;
    dom.dateInput.value = initialDate;
    dom.timeInput.value = initialTime;
    dom.durationInput.value = String(initialDuration);
    dom.statusInput.value = duplicate ? "scheduled" : (base && base.status && base.status !== "blocked" ? base.status : "scheduled");
    dom.notesInput.value = base && base.notes ? base.notes : "";
    document.getElementById("modal-kicker").textContent = existing ? "EDITAR HORÁRIO" : (duplicate ? "DUPLICAR HORÁRIO" : "NOVO HORÁRIO");
    document.getElementById("appointment-modal-title").textContent = existing ? "Editar agendamento" : (duplicate ? "Duplicar agendamento" : "Novo agendamento");
    document.getElementById("save-appointment").textContent = existing ? "Salvar alterações" : (duplicate ? "Criar cópia" : "Salvar agendamento");
    validateDraft();
    openModal(dom.appointmentModal);
  }

  /** Abre modal de bloqueio de horario (Almoco, Intervalo, etc.). */
  function openBlockModal() {
    dom.blockProfessionalInput.value = professionals[0].id;
    dom.blockDateInput.value = state.currentDate;
    dom.blockTimeInput.value = "12:00";
    dom.blockDurationInput.value = "60";
    dom.blockTypeInput.value = "Intervalo";
    openModal(dom.blockModal);
  }

  /** Valida formulario verificando conflitos. Mostra sugestoes se houver conflito. */
  function validateDraft() {
    var draft = selectedAppointmentDraft();
    if (!draft.date || !draft.time || !draft.professionalId || !draft.duration) {
      dom.conflictBox.hidden = true; dom.saveAppointment.disabled = false; return false;
    }
    var conflict = findConflictingItem(draft, draft.id);
    if (!conflict) { dom.conflictBox.hidden = true; dom.saveAppointment.disabled = false; return false; }
    var conflictName = conflict.status === "blocked" ? conflict.title.toLowerCase() : conflict.client;
    dom.conflictMessage.textContent = "Conflito com " + conflictName + " às " + conflict.time + ". Escolha um horário livre.";
    var suggestions = nearestAvailableSlots(draft, draft.id);
    dom.conflictSuggestions.innerHTML = suggestions.map(function (time) { return '<button type="button" data-suggested-time="' + time + '">' + time + "</button>"; }).join("");
    dom.conflictBox.hidden = false; dom.saveAppointment.disabled = true; return true;
  }

  // Processa o envio do formulario de agendamento, criando ou atualizando registros.
  async function submitAppointment(event) {
    event.preventDefault();
    if (validateDraft()) { showToast("Há um conflito de horário. Use uma das sugestões antes de salvar.", "warning"); return; }
    var draft = selectedAppointmentDraft();
    if (!draft.client) { showToast("Escolha uma cliente para continuar.", "warning"); return; }
    
    // Converte dados do formulario para payload da API.
    var clientId = "";
    var clientObj = clients.find(c => c.name === draft.client);
    if (clientObj) clientId = clientObj.id;
    var serviceId = "";
    var serviceObj = services.find(s => s.name === draft.service);
    if (serviceObj) serviceId = serviceObj.id;

    var payload = {
      id: draft.id,
      client: draft.client,
      clientId: clientId,
      service: draft.service,
      serviceId: serviceId,
      professionalId: draft.professionalId,
      date: draft.date,
      time: draft.time,
      duration: draft.duration,
      status: draft.status,
      notes: draft.notes
    };

    try {
      if (draft.id) {
        await AppAgendaAPI.updateAppointment(draft.id, payload);
        showToast("Agendamento atualizado com sucesso.");
      } else {
        await AppAgendaAPI.createAppointment(payload);
        showToast("Agendamento criado e adicionado à agenda.");
      }
      state.currentDate = draft.date;
      state.appointments = await AppAgendaAPI.getAppointments();
      closeModals(); renderAgenda(); updateDashboard();
    } catch (err) {
      showToast(err.message || "Erro ao salvar agendamento.", "warning");
    }
  }

  /** Processa envio do formulario de bloqueio de horario. */
  async function submitBlock(event) {
    event.preventDefault();
    var block = {
      title: dom.blockTypeInput.value,
      professionalId: dom.blockProfessionalInput.value,
      date: dom.blockDateInput.value,
      time: dom.blockTimeInput.value,
      duration: Number(dom.blockDurationInput.value),
      status: "blocked"
    };

    if (hasConflict(block, "")) { showToast("Não foi possível bloquear: já existe um compromisso neste intervalo.", "warning"); return; }

    try {
      await AppAgendaAPI.createAppointment(block);
      showToast(block.title + " bloqueado na agenda.");
      state.currentDate = block.date;
      state.appointments = await AppAgendaAPI.getAppointments();
      closeModals(); renderAgenda(); updateDashboard();
    } catch (err) {
      showToast(err.message || "Erro ao bloquear horário.", "warning");
    }
  }

  /** Abre drawer (painel lateral) com detalhes do agendamento. */
  function openDrawer(id) {
    var item = state.appointments.filter(function (appointment) { return appointment.id === id; })[0];
    if (!item) return;
    if (item.status === "blocked") { renderBlockDrawer(item); } else { renderAppointmentDrawer(item); }
    dom.drawer.hidden = false;
  }

  /** Gera HTML de uma linha de informacao no drawer. */
  function drawerInfoRow(icon, label, content) {
    return '<div class="drawer-info-row">' + icon + "<div><strong>" + escapeHtml(label) + "</strong><span>" + escapeHtml(content) + "</span></div></div>";
  }

  /** Renderiza conteudo do drawer para um agendamento. */
  function renderAppointmentDrawer(item) {
    var professional = professionalById(item.professionalId);
    var statusClass = "status-pill " + item.status;
    var actions = "";
    if (item.status === "scheduled") {
      actions += '<button class="button primary" data-drawer-action="confirm" data-id="' + item.id + '">Confirmar</button><button class="button secondary" data-drawer-action="start" data-id="' + item.id + '">Iniciar atendimento</button>';
    } else if (item.status === "confirmed") {
      actions += '<button class="button primary" data-drawer-action="start" data-id="' + item.id + '">Iniciar atendimento</button><button class="button secondary" data-drawer-action="edit" data-id="' + item.id + '">Editar horário</button>';
    } else if (item.status === "progress") {
      actions += '<button class="button primary" data-drawer-action="finish" data-id="' + item.id + '">Finalizar atendimento</button><button class="button secondary" data-drawer-action="edit" data-id="' + item.id + '">Editar horário</button>';
    } else {
      actions += '<button class="button secondary" data-drawer-action="edit" data-id="' + item.id + '">Editar horário</button>';
      if (item.status === "cancelled" || item.status === "no-show") actions += '<button class="button primary" data-drawer-action="duplicate" data-id="' + item.id + '">Agendar novamente</button>';
    }
    actions += '<button class="button secondary" data-drawer-action="duplicate" data-id="' + item.id + '">Duplicar</button>';
    if (item.status !== "cancelled") actions += '<button class="button warning" data-drawer-action="no-show" data-id="' + item.id + '">Não compareceu</button>';
    if (item.status !== "cancelled" && item.status !== "finished") actions += '<button class="button danger wide" data-drawer-action="cancel" data-id="' + item.id + '">Cancelar agendamento</button>';
    dom.drawerContent.innerHTML = '<div class="drawer-main"><div class="drawer-client">' + avatarHtml(item.client, "") + "<div><h3>" + escapeHtml(item.client) + "</h3><p>Cliente recorrente · 8 visitas</p></div></div><div class=\"drawer-status\"><span>Status do atendimento</span><span class=\"" + statusClass + '">' + escapeHtml(statusLabel(item.status)) + "</span></div><div class=\"drawer-info\">" + drawerInfoRow('<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>', "Quando", weekdayName(item.date) + ", " + dateLong(item.date) + " · " + formatTimeRange(item)) + drawerInfoRow('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5M8 16v-5M13 16V8M18 16V4"/></svg>', "Serviço", item.service + " · " + Number(item.duration) + " min") + drawerInfoRow('<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c.7-4 3.3-6 8-6s7.3 2 8 6"/></svg>', "Profissional", professional.name + " · " + professional.role) + "</div>" + (item.notes ? '<div class="drawer-observation"><strong>Observações</strong><p>' + escapeHtml(item.notes) + "</p></div>" : "") + '<div class="drawer-actions">' + actions + "</div></div>";
  }

  /** Renderiza conteudo do drawer para um bloqueio. */
  function renderBlockDrawer(item) {
    var professional = professionalById(item.professionalId);
    dom.drawerContent.innerHTML = '<div class="drawer-main"><div class="drawer-client"><span class="person-avatar avatar-carol">✦</span><div><h3>' + escapeHtml(item.title) + "</h3><p>Horário indisponível para atendimento</p></div></div><div class=\"drawer-status\"><span>Status</span><span class=\"status-pill scheduled\">Bloqueado</span></div><div class=\"drawer-info\">" + drawerInfoRow('<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>', "Quando", weekdayName(item.date) + ", " + dateLong(item.date) + " · " + formatTimeRange(item)) + drawerInfoRow('<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c.7-4 3.3-6 8-6s7.3 2 8 6"/></svg>', "Profissional", professional.name + " · " + professional.role) + "</div><div class=\"drawer-actions\"><button class=\"button danger wide\" data-drawer-action=\"delete-block\" data-id=\"" + item.id + '">Remover bloqueio</button></div></div>';
  }

  /** Fecha o drawer e limpa seu conteudo. */
  function closeDrawer() { dom.drawer.hidden = true; dom.drawerContent.innerHTML = ""; }

  /** Atualiza status de um agendamento e mostra toast. */
  async function updateStatus(id, status, message) {
    try {
      await AppAgendaAPI.updateAppointmentStatus(id, status);
      state.appointments = await AppAgendaAPI.getAppointments();
      renderAgenda(); updateDashboard(); openDrawer(id);
      showToast(message);
    } catch (err) {
      showToast(err.message || "Erro ao atualizar status.", "warning");
    }
  }

  /** Duplica um agendamento: sugere horario alternativo e abre modal. */
  async function duplicateAppointment(id) {
    var item = state.appointments.filter(function (appointment) { return appointment.id === id; })[0];
    if (!item) return;
    try {
      var res = await AppAgendaAPI.duplicateAppointment(id, { date: item.date, professionalId: item.professionalId });
      closeDrawer();
      openAppointmentModal({ duplicateFrom: item, time: res.suggestedTime, date: item.date, professionalId: item.professionalId });
    } catch (err) {
      showToast(err.message || "Erro ao duplicar.", "warning");
    }
  }

  /** Processa acoes do drawer (editar, duplicar, confirmar, cancelar, etc.). */
  async function handleDrawerAction(action, id) {
    if (action === "edit") { closeDrawer(); openAppointmentModal({ id: id }); }
    else if (action === "duplicate") { duplicateAppointment(id); }
    else if (action === "confirm") { updateStatus(id, "confirmed", "Atendimento confirmado."); }
    else if (action === "start") { updateStatus(id, "progress", "Atendimento iniciado."); }
    else if (action === "finish") { updateStatus(id, "finished", "Atendimento finalizado."); }
    else if (action === "cancel") { updateStatus(id, "cancelled", "Agendamento cancelado. O horário foi liberado."); }
    else if (action === "no-show") { updateStatus(id, "no-show", "Marcado como não compareceu. O horário foi liberado."); }
    else if (action === "delete-block") {
      try {
        await AppAgendaAPI.deleteAppointment(id);
        state.appointments = await AppAgendaAPI.getAppointments();
        closeDrawer(); renderAgenda(); updateDashboard();
        showToast("Bloqueio removido. O horário voltou a ficar disponível.");
      } catch (err) {
        showToast(err.message || "Erro ao remover bloqueio.", "warning");
      }
    }
  }

  /** Exibe notificacao toast (mensagem temporaria no canto inferior). */
  function showToast(message, type) {
    var toast = document.createElement("div");
    toast.className = "toast" + (type === "warning" ? " warning-toast" : "");
    toast.innerHTML = '<span class="toast-mark">' + (type === "warning" ? "!" : "✓") + "</span><span>" + escapeHtml(message) + "</span>";
    dom.toastRegion.appendChild(toast);
    window.setTimeout(function () {
      toast.style.opacity = "0"; toast.style.transform = "translateY(8px)"; toast.style.transition = ".2s ease";
      window.setTimeout(function () { toast.remove(); }, 220);
    }, 3600);
  }

  /** Calcula alvo de soltura (drop target) a partir de evento de drag. */
  function dropTargetFromEvent(event) {
    var column = event.target.closest(".professional-column");
    if (!column) return null;
    var rect = column.getBoundingClientRect();
    var y = event.clientY - rect.top;
    var rounded = Math.round(y / 30) * 30;
    var max = BUSINESS_END - BUSINESS_START - 30;
    var top = Math.max(0, Math.min(max, rounded));
    return { column: column, professionalId: column.getAttribute("data-professional-id"), time: toTime(BUSINESS_START + top), top: top };
  }

  /** Remove o indicador visual de drop (linha verde). */
  function clearDropIndicator() { var indicator = document.querySelector(".drop-indicator"); if (indicator) indicator.remove(); state.draggedOverColumn = null; }

  /** Mostra indicador visual de drop na posicao alvo. */
  function showDropIndicator(target) {
    clearDropIndicator();
    if (!target) return;
    var indicator = document.createElement("i");
    indicator.className = "drop-indicator";
    indicator.style.top = target.top + "px";
    target.column.appendChild(indicator);
    state.draggedOverColumn = target.column;
  }

  /** Manipula inicio do arraste de um card. Registra ID e adiciona classe dragging. */
  function handleDragStart(event) {
    var card = event.target.closest(".appointment-card");
    if (!card || card.getAttribute("draggable") !== "true") return;
    state.activeDragId = card.getAttribute("data-appointment-id");
    card.classList.add("dragging");
    if (event.dataTransfer) { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", state.activeDragId); }
  }

  /** Manipula arraste sobre o calendario. Mostra indicador de drop. */
  function handleDragOver(event) {
    if (!state.activeDragId) return;
    var target = dropTargetFromEvent(event);
    if (!target) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    showDropIndicator(target);
  }

  /** Manipula soltura (drop) do card. Verifica conflitos e reagenda. */
  async function handleDrop(event) {
    if (!state.activeDragId) return;
    var target = dropTargetFromEvent(event);
    event.preventDefault();
    clearDropIndicator();
    var id = state.activeDragId;
    state.activeDragId = null;
    if (!target) return;
    var item = state.appointments.filter(function (appointment) { return appointment.id === id; })[0];
    if (!item) return;
    var proposed = { date: state.currentDate, professionalId: target.professionalId, time: target.time, duration: item.duration };
    if (toMinutes(proposed.time) + Number(proposed.duration) > BUSINESS_END) { showToast("Não há tempo suficiente antes do encerramento do salão.", "warning"); return; }
    if (hasConflict(proposed, id)) { showToast("Não foi possível reagendar: esse horário já está ocupado.", "warning"); return; }
    
    try {
      await AppAgendaAPI.rescheduleAppointment(id, { date: proposed.date, time: proposed.time, professionalId: proposed.professionalId });
      state.appointments = await AppAgendaAPI.getAppointments();
      renderAgenda(); updateDashboard();
      showToast("Agendamento reagendado para " + target.time + ".");
    } catch (err) {
      showToast(err.message || "Erro ao reagendar.", "warning");
    }
  }

  /** Manipula fim do arraste. Limpa estado e remove classe dragging. */
  function handleDragEnd() {
    state.activeDragId = null;
    clearDropIndicator();
    Array.prototype.slice.call(document.querySelectorAll(".appointment-card.dragging")).forEach(function (card) { card.classList.remove("dragging"); });
  }

  /** Manipula cliques no calendario: abrir drawer ou criar agendamento. */
  function handleCalendarClick(event) {
    var card = event.target.closest("[data-appointment-id]");
    if (card) { openDrawer(card.getAttribute("data-appointment-id")); return; }
    var slot = event.target.closest("[data-slot-time]");
    if (slot) { openAppointmentModal({ date: state.currentDate, time: slot.getAttribute("data-slot-time"), professionalId: slot.getAttribute("data-slot-professional") }); }
  }

  /** Manipula clique em horario sugerido (botao de sugestao de conflito). */
  function selectSuggestedTime(event) {
    var button = event.target.closest("[data-suggested-time]");
    if (!button) return;
    dom.timeInput.value = button.getAttribute("data-suggested-time");
    validateDraft();
  }

  /** Navega para data anterior/posterior (dia, semana ou mes). */
  function moveDate(direction) {
    if (state.calendarView === "week") state.currentDate = addDays(state.currentDate, direction * 7);
    else if (state.calendarView === "month") state.currentDate = addMonths(state.currentDate, direction);
    else state.currentDate = addDays(state.currentDate, direction);
    renderAgenda();
    showView("agenda");
  }

  /* ===== Clientes CRUD ===== */

  /** Renderiza lista de clientes na tela de Clientes. Filtra pela busca. */
  function renderClientes() {
    var query = state.clientSearch.toLowerCase();
    var filtered = clients.filter(function (client) {
      if (!query) return true;
      return (client.name && client.name.toLowerCase().indexOf(query) !== -1) ||
             (client.phone && client.phone.toLowerCase().indexOf(query) !== -1) ||
             (client.whatsapp && client.whatsapp.toLowerCase().indexOf(query) !== -1);
    });
    dom.clientesGrid.innerHTML = filtered.length ? filtered.map(clientCardHtml).join("") : '<p class="week-empty" style="grid-column:1/-1;padding:40px">Nenhuma cliente encontrada.</p>';
    updateClienteStats();
  }

  /** Gera HTML de um card de cliente. Inclui PONTOS DE FIDELIDADE (R$10 = 1 ponto). */
  function clientCardHtml(client) {
    var lgpdBadge = client.lgpd ? '<span class="lgpd-badge lgpd-ok">LGPD ✓</span>' : '<span class="lgpd-badge lgpd-pending">LGPD pendente</span>';
    var lastVisit = client.lastVisit ? dateObject(client.lastVisit).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "—";
    return '<article class="client-card" data-client-card="' + escapeHtml(client.id) + '">' +
      '<div class="client-card-header">' +
        '<span class="person-avatar ' + escapeHtml(client.avatar) + '">' + escapeHtml(client.initials) + '</span>' +
        '<div><strong>' + escapeHtml(client.name) + '</strong><small>' + escapeHtml(client.visits + ' visitas') + '</small></div>' +
        '<button class="more-button" data-client-action="edit" data-id="' + escapeHtml(client.id) + '" aria-label="Editar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>' +
      '</div>' +
      '<div class="client-card-body">' +
        '<div class="client-info"><span>Contato</span><strong>' + escapeHtml(client.phone || '—') + '</strong></div>' +
        '<div class="client-info"><span>WhatsApp</span><strong>' + escapeHtml(client.whatsapp || '—') + '</strong></div>' +
      '</div>' +
      '<div class="client-card-stats">' +
        '<div><strong>' + formatCurrency(client.totalSpent) + '</strong><small>Total gasto</small></div>' +
        '<div><strong>' + escapeHtml(String(client.visits)) + '</strong><small>Visitas</small></div>' +
        '<div><strong>' + Math.floor(client.totalSpent / 10) + '</strong><small>Pontos</small></div>' +
        '<div><strong>' + escapeHtml(lastVisit) + '</strong><small>Última visita</small></div>' +
      '</div>' +
      '<div class="client-card-footer">' + lgpdBadge +
        '<button class="button danger" data-client-action="delete" data-id="' + escapeHtml(client.id) + '">Excluir</button>' +
      '</div>' +
    '</article>';
  }

  /** Atualiza estatisticas: total, aniversarios, LGPD, receita e PONTOS totais. */
  function updateClienteStats() {
    var total = clients.length;
    var currentMonth = dateObject(INITIAL_DATE).getMonth();
    var birthdays = clients.filter(function (client) {
      if (!client.birth) return false;
      return dateObject(client.birth).getMonth() === currentMonth;
    }).length;
    var lgpdPending = clients.filter(function (client) { return !client.lgpd; }).length;
    var revenue = clients.reduce(function (sum, client) { return sum + Number(client.totalSpent || 0); }, 0);
    var statTotal = document.getElementById("stat-total");
    var statBirthdays = document.getElementById("stat-birthdays");
    var statLgpd = document.getElementById("stat-lgpd");
    var statRevenue = document.getElementById("stat-revenue");
    var statPoints = document.getElementById("stat-points");
    if (statTotal) statTotal.textContent = String(total);
    if (statBirthdays) statBirthdays.textContent = String(birthdays);
    if (statLgpd) statLgpd.textContent = String(lgpdPending);
    if (statRevenue) statRevenue.textContent = formatCurrency(revenue);
    var totalPoints = clients.reduce(function (sum, client) { return sum + Math.floor(Number(client.totalSpent || 0) / 10); }, 0);
    if (statPoints) statPoints.textContent = String(totalPoints);
  }

  /** Abre modal de cliente (novo ou editar). Preenche todos os campos. */
  function openClientModal(id) {
    var existing = id ? clients.filter(function (client) { return client.id === id; })[0] : null;
    document.getElementById("client-id").value = existing ? existing.id : "";
    document.getElementById("client-name-input").value = existing ? existing.name : "";
    document.getElementById("client-cpf-input").value = existing ? existing.cpf || "" : "";
    document.getElementById("client-birth-input").value = existing ? existing.birth || "" : "";
    document.getElementById("client-gender-input").value = existing ? existing.gender || "" : "";
    document.getElementById("client-phone-input").value = existing ? existing.phone || "" : "";
    document.getElementById("client-whatsapp-input").value = existing ? existing.whatsapp || "" : "";
    document.getElementById("client-cep-input").value = existing ? existing.cep || "" : "";
    document.getElementById("client-street-input").value = existing ? existing.street || "" : "";
    document.getElementById("client-number-input").value = existing ? existing.number || "" : "";
    document.getElementById("client-neighborhood-input").value = existing ? existing.neighborhood || "" : "";
    document.getElementById("client-city-input").value = existing ? existing.city || "" : "";
    document.getElementById("client-state-input").value = existing ? existing.state || "" : "";
    document.getElementById("client-notes-input").value = existing ? existing.notes || "" : "";
    document.getElementById("client-preferences-input").value = existing ? existing.preferences || "" : "";
    document.getElementById("client-allergies-input").value = existing ? existing.allergies || "" : "";
    document.getElementById("client-products-input").value = existing ? existing.products || "" : "";
    document.getElementById("client-lgpd-input").checked = existing ? !!existing.lgpd : false;
    document.getElementById("client-modal-kicker").textContent = existing ? "EDITAR CLIENTE" : "NOVO CLIENTE";
    document.getElementById("client-modal-title").textContent = existing ? "Editar cliente" : "Cadastrar cliente";
    document.getElementById("save-client").textContent = existing ? "Salvar alterações" : "Salvar cliente";
    openModal(dom.clientModal);
  }

  // Recebe os dados do formulario de cadastro de clientes e salva as informacoes no estado atual.
  async function submitClient(event) {
    event.preventDefault();
    var id = document.getElementById("client-id").value;
    var name = document.getElementById("client-name-input").value.trim();
    if (!name) { showToast("Informe o nome da cliente.", "warning"); return; }
    
    var data = {
      name: name,
      avatar: id ? (clients.filter(function (c) { return c.id === id; })[0] || {}).avatar || "avatar-bia" : "avatar-" + ["ana", "julia", "marina", "carol", "nati", "bia"][Math.floor(Math.random() * 6)],
      cpf: document.getElementById("client-cpf-input").value.trim(),
      birth: document.getElementById("client-birth-input").value,
      gender: document.getElementById("client-gender-input").value,
      phone: document.getElementById("client-phone-input").value.trim(),
      whatsapp: document.getElementById("client-whatsapp-input").value.trim(),
      cep: document.getElementById("client-cep-input").value.trim(),
      street: document.getElementById("client-street-input").value.trim(),
      number: document.getElementById("client-number-input").value.trim(),
      neighborhood: document.getElementById("client-neighborhood-input").value.trim(),
      city: document.getElementById("client-city-input").value.trim(),
      state: document.getElementById("client-state-input").value,
      notes: document.getElementById("client-notes-input").value.trim(),
      preferences: document.getElementById("client-preferences-input").value.trim(),
      allergies: document.getElementById("client-allergies-input").value.trim(),
      products: document.getElementById("client-products-input").value.trim(),
      lgpd: document.getElementById("client-lgpd-input").checked
    };

    try {
      if (id) {
        await AppAgendaAPI.updateClient(id, data);
        showToast("Cliente atualizada com sucesso.");
      } else {
        await AppAgendaAPI.createClient(data);
        showToast("Cliente cadastrada com sucesso.");
      }
      clients = await AppAgendaAPI.getClients();
      populateSelects(); renderClientes(); closeModals();
    } catch (err) {
      showToast(err.message || "Erro ao salvar cliente.", "warning");
    }
  }

  /** Exclui uma cliente pelo ID. */
  async function deleteClient(id) {
    try {
      await AppAgendaAPI.deleteClient(id);
      clients = await AppAgendaAPI.getClients();
      populateSelects(); renderClientes();
      showToast("Cliente excluída.");
    } catch (err) {
      showToast(err.message || "Erro ao excluir cliente.", "warning");
    }
  }

  /* ===== Serviços CRUD ===== */

  /** Renderiza lista de servicos na tela de Servicos. Filtra pela busca. */
  function renderServicos() {
    var query = state.serviceSearch.toLowerCase();
    var filtered = services.filter(function (service) {
      if (!query) return true;
      return (service.name && service.name.toLowerCase().indexOf(query) !== -1) ||
             (service.category && service.category.toLowerCase().indexOf(query) !== -1);
    });
    dom.servicosGrid.innerHTML = filtered.length ? filtered.map(serviceCardHtml).join("") : '<p class="week-empty" style="grid-column:1/-1;padding:40px">Nenhum serviço encontrado.</p>';
  }

  /** Gera HTML de um card de servico. */
  function serviceCardHtml(service) {
    var durationLabel = service.duration >= 60 ? (service.duration / 60) + "h" : service.duration + "min";
    var promoHtml = service.promoPrice > 0 ? '<span class="service-promo">' + formatCurrency(service.promoPrice) + '</span>' : '';
    return '<article class="service-card" data-service-card="' + escapeHtml(service.id) + '">' +
      '<div class="service-card-header">' +
        '<span class="service-category-badge">' + escapeHtml(service.category) + '</span>' +
        '<button class="more-button" data-service-action="edit" data-id="' + escapeHtml(service.id) + '" aria-label="Editar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>' +
      '</div>' +
      '<strong class="service-name">' + escapeHtml(service.name) + '</strong>' +
      (service.description ? '<p class="service-description">' + escapeHtml(service.description) + '</p>' : '') +
      '<div class="service-card-stats">' +
        '<div><strong>' + formatCurrency(service.price) + '</strong><small>Valor' + (promoHtml ? ' / ' : '') + '</small></div>' +
        (promoHtml ? '<div><strong>' + formatCurrency(service.promoPrice) + '</strong><small>Promocional</small></div>' : '') +
        '<div><strong>' + escapeHtml(durationLabel) + '</strong><small>Duração</small></div>' +
        '<div><strong>' + escapeHtml(String(service.commission)) + '%</strong><small>Comissão</small></div>' +
      '</div>' +
      (service.materials ? '<div class="service-materials"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2-2 2.3-2.3Z"/></svg><span>' + escapeHtml(service.materials) + '</span></div>' : '') +
      '<div class="service-card-footer"><button class="button danger" data-service-action="delete" data-id="' + escapeHtml(service.id) + '">Excluir</button></div>' +
    '</article>';
  }

  /** Abre modal de servico (novo ou editar). */
  function openServiceModal(id) {
    var existing = id ? services.filter(function (service) { return service.id === id; })[0] : null;
    document.getElementById("service-id").value = existing ? existing.id : "";
    document.getElementById("service-name-input").value = existing ? existing.name : "";
    document.getElementById("service-category-input").value = existing ? existing.category : "Cabelos";
    document.getElementById("service-duration-input").value = existing ? String(existing.duration) : "60";
    document.getElementById("service-price-input").value = existing ? String(existing.price) : "";
    document.getElementById("service-promo-input").value = existing && existing.promoPrice ? String(existing.promoPrice) : "";
    document.getElementById("service-commission-input").value = existing ? String(existing.commission || "") : "";
    document.getElementById("service-description-input").value = existing ? existing.description || "" : "";
    document.getElementById("service-materials-input").value = existing ? existing.materials || "" : "";
    document.getElementById("service-modal-kicker").textContent = existing ? "EDITAR SERVIÇO" : "NOVO SERVIÇO";
    document.getElementById("service-modal-title").textContent = existing ? "Editar serviço" : "Cadastrar serviço";
    document.getElementById("save-service").textContent = existing ? "Salvar alterações" : "Salvar serviço";
    openModal(dom.serviceModal);
  }

  /** Processa envio do formulario de servico. Cria ou atualiza. */
  async function submitService(event) {
    event.preventDefault();
    var id = document.getElementById("service-id").value;
    var name = document.getElementById("service-name-input").value.trim();
    var price = parseFloat(document.getElementById("service-price-input").value);
    if (!name) { showToast("Informe o nome do serviço.", "warning"); return; }
    if (isNaN(price) || price < 0) { showToast("Informe um valor válido.", "warning"); return; }
    
    var data = {
      name: name,
      category: document.getElementById("service-category-input").value,
      duration: Number(document.getElementById("service-duration-input").value),
      price: price,
      promoPrice: parseFloat(document.getElementById("service-promo-input").value) || 0,
      commission: parseFloat(document.getElementById("service-commission-input").value) || 0,
      description: document.getElementById("service-description-input").value.trim(),
      materials: document.getElementById("service-materials-input").value.trim()
    };

    try {
      if (id) {
        await AppAgendaAPI.updateService(id, data);
        showToast("Serviço atualizado com sucesso.");
      } else {
        await AppAgendaAPI.createService(data);
        showToast("Serviço cadastrado com sucesso.");
      }
      services = await AppAgendaAPI.getServices();
      populateSelects(); renderServicos(); closeModals();
    } catch (err) {
      showToast(err.message || "Erro ao salvar serviço.", "warning");
    }
  }

  /** Exclui um servico pelo ID. */
  async function deleteService(id) {
    try {
      await AppAgendaAPI.deleteService(id);
      services = await AppAgendaAPI.getServices();
      populateSelects(); renderServicos();
      showToast("Serviço excluído.");
    } catch (err) {
      showToast(err.message || "Erro ao excluir serviço.", "warning");
    }
  }

  /* ===== Events ===== */

  // Registra os ouvintes de eventos da interface, conectando elementos HTML as acoes JavaScript.
  function initEvents() {
    dom.navItems.forEach(function (item) {
      item.addEventListener("click", function () { showView(item.getAttribute("data-view-target")); });
    });
    Array.prototype.slice.call(document.querySelectorAll("[data-toast]")).forEach(function (button) {
      button.addEventListener("click", function () { showToast(button.getAttribute("data-toast")); });
    });
    Array.prototype.slice.call(document.querySelectorAll("[data-open-new-appointment]")).forEach(function (button) {
      button.addEventListener("click", function () { showView("agenda"); openAppointmentModal(); });
    });
    Array.prototype.slice.call(document.querySelectorAll("[data-open-client-modal]")).forEach(function (button) {
      button.addEventListener("click", function () { openClientModal(); });
    });
    Array.prototype.slice.call(document.querySelectorAll("[data-open-service-modal]")).forEach(function (button) {
      button.addEventListener("click", function () { openServiceModal(); });
    });
    document.getElementById("go-to-agenda").addEventListener("click", function () { showView("agenda"); });
    document.getElementById("go-to-agenda-link").addEventListener("click", function () { showView("agenda"); });
    document.getElementById("go-to-agenda-more").addEventListener("click", function () { showView("agenda"); });
    document.getElementById("previous-date").addEventListener("click", function () { moveDate(-1); });
    document.getElementById("next-date").addEventListener("click", function () { moveDate(1); });
    document.getElementById("today-button").addEventListener("click", function () { state.currentDate = INITIAL_DATE; renderAgenda(); showView("agenda"); });
    document.getElementById("agenda-date-button").addEventListener("click", function () { showToast("Use as setas para navegar entre os dias."); });
    document.getElementById("block-time-button").addEventListener("click", openBlockModal);
    Array.prototype.slice.call(document.querySelectorAll("[data-calendar-view]")).forEach(function (button) {
      button.addEventListener("click", function () { state.calendarView = button.getAttribute("data-calendar-view"); renderAgenda(); });
    });
    dom.filterButton.addEventListener("click", function () {
      var willOpen = dom.filterPopover.hidden;
      dom.filterPopover.hidden = !willOpen;
      dom.filterButton.setAttribute("aria-expanded", String(willOpen));
    });
    document.getElementById("clear-filters").addEventListener("click", function () { state.filters = { professional: "all", status: "all" }; renderAgenda(); });
    dom.professionalFilter.addEventListener("change", function () { state.filters.professional = dom.professionalFilter.value; renderAgenda(); });
    dom.statusFilter.addEventListener("change", function () { state.filters.status = dom.statusFilter.value; renderAgenda(); });
    dom.calendarGrid.addEventListener("click", handleCalendarClick);
    dom.calendarGrid.addEventListener("dragstart", handleDragStart);
    dom.calendarGrid.addEventListener("dragover", handleDragOver);
    dom.calendarGrid.addEventListener("drop", handleDrop);
    dom.calendarGrid.addEventListener("dragend", handleDragEnd);
    dom.weekView.addEventListener("click", function (event) { var card = event.target.closest("[data-appointment-id]"); if (card) openDrawer(card.getAttribute("data-appointment-id")); });
    dom.monthView.addEventListener("click", function (event) {
      var card = event.target.closest("[data-appointment-id]");
      if (card) { openDrawer(card.getAttribute("data-appointment-id")); return; }
      var day = event.target.closest("[data-month-day]");
      if (day) { state.currentDate = day.getAttribute("data-month-day"); state.calendarView = "day"; renderAgenda(); }
    });
    dom.appointmentForm.addEventListener("submit", submitAppointment);
    dom.blockForm.addEventListener("submit", submitBlock);
    dom.clientForm.addEventListener("submit", submitClient);
    dom.serviceForm.addEventListener("submit", submitService);
    [dom.professionalInput, dom.dateInput, dom.timeInput, dom.durationInput].forEach(function (input) { input.addEventListener("change", validateDraft); });
    dom.serviceInput.addEventListener("change", function () { if (!dom.appointmentId.value) dom.durationInput.value = String(serviceByName(dom.serviceInput.value).duration); validateDraft(); });
    dom.conflictSuggestions.addEventListener("click", selectSuggestedTime);
    Array.prototype.slice.call(document.querySelectorAll(".close-modal")).forEach(function (button) { button.addEventListener("click", closeModals); });
    dom.modalBackdrop.addEventListener("click", closeModals);
    document.getElementById("close-drawer").addEventListener("click", closeDrawer);
    dom.drawerContent.addEventListener("click", function (event) {
      var action = event.target.closest("[data-drawer-action]");
      if (action) handleDrawerAction(action.getAttribute("data-drawer-action"), action.getAttribute("data-id"));
    });
    dom.dashboardNextList.addEventListener("click", function (event) {
      var button = event.target.closest("[data-dashboard-appointment]");
      if (button) openDrawer(button.getAttribute("data-dashboard-appointment"));
    });
    document.getElementById("mobile-menu-button").addEventListener("click", function () { dom.body.classList.toggle("menu-open"); });
    document.addEventListener("click", function (event) {
      if (!dom.filterPopover.hidden && !event.target.closest("#filters-popover") && !event.target.closest("#filters-button")) {
        dom.filterPopover.hidden = true;
        dom.filterButton.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") { closeModals(); closeDrawer(); dom.filterPopover.hidden = true; dom.body.classList.remove("menu-open"); }
    });
    Array.prototype.slice.call(document.querySelectorAll("[data-revenue-period]")).forEach(function (button) {
      button.addEventListener("click", function () {
        Array.prototype.slice.call(document.querySelectorAll("[data-revenue-period]")).forEach(function (period) { period.classList.toggle("active", period === button); });
        var isMonth = button.getAttribute("data-revenue-period") === "month";
        document.getElementById("revenue-total").textContent = isMonth ? "R$ 23.480,00" : "R$ 15.780,00";
        document.getElementById("chart-tooltip").innerHTML = isMonth ? "<span>Julho</span><strong>R$ 23.480</strong>" : "<span>Qui, 30 Jul</span><strong>R$ 2.840</strong>";
      });
    });
    dom.clientSearch.addEventListener("input", function () { state.clientSearch = dom.clientSearch.value; renderClientes(); });
    dom.serviceSearch.addEventListener("input", function () { state.serviceSearch = dom.serviceSearch.value; renderServicos(); });
    dom.clientesGrid.addEventListener("click", function (event) {
      var button = event.target.closest("[data-client-action]");
      if (!button) return;
      var action = button.getAttribute("data-client-action");
      var id = button.getAttribute("data-id");
      if (action === "edit") { openClientModal(id); }
      else if (action === "delete") { deleteClient(id); }
    });
    dom.servicosGrid.addEventListener("click", function (event) {
      var button = event.target.closest("[data-service-action]");
      if (!button) return;
      var action = button.getAttribute("data-service-action");
      var id = button.getAttribute("data-id");
      if (action === "edit") { openServiceModal(id); }
      else if (action === "delete") { deleteService(id); }
    });
  }

  // Inicializa a aplicacao: carrega dados da API e renderiza a interface.
  async function init() {
    try {
      professionals = await AppAgendaAPI.getProfessionals();
      clients = await AppAgendaAPI.getClients();
      services = await AppAgendaAPI.getServices();
      state.appointments = await AppAgendaAPI.getAppointments();

      populateSelects();
      renderAgenda();
      updateDashboard();
      renderClientes();
      renderServicos();
      initEvents();
    } catch (err) {
      console.error(err);
      showToast("Erro ao conectar com o servidor.", "warning");
    }
  }

  init();
}());