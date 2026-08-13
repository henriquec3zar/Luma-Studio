/**
 * Cliente HTTP para a API Luma Studio.
 * Todas as requisições usam UTF-8 (JSON).
 */
(function (global) {
  "use strict";

  var API_BASE = global.APP_AGENDA_API_BASE || "/api";

  function request(method, path, body) {
    var options = {
      method: method,
      headers: { "Content-Type": "application/json; charset=utf-8", Accept: "application/json" }
    };
    if (body !== undefined) options.body = JSON.stringify(body);
    return fetch(API_BASE + path, options).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) {
          var error = new Error(data.error || "Erro na requisição.");
          error.status = response.status;
          error.data = data;
          throw error;
        }
        return data;
      });
    });
  }

  global.AppAgendaAPI = {
    health: function () { return request("GET", "/health"); },
    getProfessionals: function () { return request("GET", "/professionals"); },
    getClients: function (q) { return request("GET", "/clients" + (q ? "?q=" + encodeURIComponent(q) : "")); },
    getClient: function (id) { return request("GET", "/clients/" + encodeURIComponent(id)); },
    createClient: function (data) { return request("POST", "/clients", data); },
    updateClient: function (id, data) { return request("PUT", "/clients/" + encodeURIComponent(id), data); },
    deleteClient: function (id) { return request("DELETE", "/clients/" + encodeURIComponent(id)); },
    getServices: function (q) { return request("GET", "/services" + (q ? "?q=" + encodeURIComponent(q) : "")); },
    createService: function (data) { return request("POST", "/services", data); },
    updateService: function (id, data) { return request("PUT", "/services/" + encodeURIComponent(id), data); },
    deleteService: function (id) { return request("DELETE", "/services/" + encodeURIComponent(id)); },
    getAppointments: function (params) {
      var query = [];
      if (params) {
        Object.keys(params).forEach(function (key) {
          if (params[key] != null && params[key] !== "" && params[key] !== "all") {
            query.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
          }
        });
      }
      return request("GET", "/appointments" + (query.length ? "?" + query.join("&") : ""));
    },
    getAppointment: function (id) { return request("GET", "/appointments/" + encodeURIComponent(id)); },
    createAppointment: function (data) { return request("POST", "/appointments", data); },
    updateAppointment: function (id, data) { return request("PUT", "/appointments/" + encodeURIComponent(id), data); },
    updateAppointmentStatus: function (id, status) { return request("PATCH", "/appointments/" + encodeURIComponent(id) + "/status", { status: status }); },
    rescheduleAppointment: function (id, data) { return request("PATCH", "/appointments/" + encodeURIComponent(id) + "/reschedule", data); },
    duplicateAppointment: function (id, data) { return request("POST", "/appointments/" + encodeURIComponent(id) + "/duplicate", data || {}); },
    deleteAppointment: function (id) { return request("DELETE", "/appointments/" + encodeURIComponent(id)); },
    checkConflict: function (data) { return request("POST", "/appointments/check-conflict", data); }
  };
}(window));
