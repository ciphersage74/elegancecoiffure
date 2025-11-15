import axios from 'axios';

// Configuration de l'URL de base de l'API
// Utiliser une URL relative simple
const API_BASE_URL = '/api';

// Créer une instance axios avec la configuration de base
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Intercepteur pour ajouter le token JWT aux requêtes
api.interceptors.request.use(
  (config) => {
    const headers = config.headers ?? {};

    const normalizeKey = (key) =>
      Object.keys(headers).find((existingKey) => existingKey.toLowerCase() === key.toLowerCase()) || key;

    const setHeader = (key, value) => {
      if (typeof headers.set === 'function') {
        headers.set(key, value);
      } else {
        headers[normalizeKey(key)] = value;
      }
    };

    const hasHeader = (key) => {
      if (typeof headers.has === 'function') {
        return headers.has(key);
      }
      return Object.keys(headers).some((existingKey) => existingKey.toLowerCase() === key.toLowerCase());
    };

    const getHeader = (key) => {
      if (typeof headers.get === 'function') {
        return headers.get(key);
      }
      const normalizedKey = normalizeKey(key);
      return headers[normalizedKey];
    };

    const removeHeader = (key) => {
      if (typeof headers.delete === 'function') {
        headers.delete(key);
      } else {
        const normalizedKey = normalizeKey(key);
        if (normalizedKey in headers) {
          delete headers[normalizedKey];
        }
      }
    };

    const token = localStorage.getItem('token');
    if (token) {
      setHeader('Authorization', `Bearer ${token}`);
    }

    const method = config.method?.toLowerCase();
    const isFormData = config.data instanceof FormData;

    if (isFormData) {
      const contentType = getHeader('Content-Type');
      if (!contentType || contentType.toLowerCase().includes('application/json')) {
        removeHeader('Content-Type');
      }
    } else if (method && method !== 'get') {
      if (!hasHeader('Content-Type')) {
        setHeader('Content-Type', 'application/json');
      }
    }

    config.headers = headers;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ===== AUTHENTIFICATION =====

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/update-profile', userData),
};

// ===== SERVICES =====

export const servicesAPI = {
  getAll: () => api.get('/services'),
  getById: (id) => api.get(`/services/${id}`),
  getCategories: () => api.get('/services/categories'),
};

// ===== EMPLOYÉS =====

export const employeesAPI = {
  getAll: () => api.get('/employees'),
  getById: (id) => api.get(`/employees/${id}`),
  getByService: (serviceId) => api.get(`/employees/by-service/${serviceId}`),
};

// ===== RENDEZ-VOUS =====

export const appointmentsAPI = {
  create: (appointmentData) => api.post('/appointments', appointmentData),
  getMy: (status) => api.get('/appointments/my', { params: { status } }),
  getById: (id) => api.get(`/appointments/${id}`),
  update: (id, appointmentData) => api.put(`/appointments/${id}`, appointmentData),
  cancel: (id) => api.post(`/appointments/${id}/cancel`),
  getAvailability: (serviceId, employeeId, date) =>
    api.get('/appointments/availability', {
      params: { service_id: serviceId, employee_id: employeeId, date }
    }),
 getAvailabilityByService: (serviceId, startDate, endDate) =>
   api.get('/appointments/availability-by-service', {
     params: { service_id: serviceId, start_date: startDate, end_date: endDate }
   }),
};

// ===== SALON =====

export const salonAPI = {
  getInfo: () => api.get('/salon/info'),
  getGallery: () => api.get('/salon/gallery'),
  getHours: () => api.get('/salon/hours'),
};

export const adminSalonAPI = {
  updateInfo: (salonData) => api.put('/admin/salon-info', salonData),
};

// ===== ADMIN - SERVICES =====

export const adminServicesAPI = {
  getAll: () => api.get('/admin/services'),
  create: (serviceData) => api.post('/admin/services', serviceData),
  update: (id, serviceData) => api.put(`/admin/services/${id}`, serviceData),
  delete: (id) => api.delete(`/admin/services/${id}`),
};

// ===== ADMIN - EMPLOYÉS =====

export const adminEmployeesAPI = {
  getAll: () => api.get('/admin/employees'),
  getById: (id) => api.get(`/admin/employees/${id}`),
  create: (employeeData) => api.post('/admin/employees', employeeData),
  update: (id, employeeData) => api.put(`/admin/employees/${id}`, employeeData),
  delete: (id) => api.delete(`/admin/employees/${id}`),
  getEmployeeHours: (employeeId) => api.get(`/admin/employees/${employeeId}/hours`),
  updateEmployeeHours: (employeeId, hoursData) =>
    api.put(`/admin/employees/${employeeId}/hours`, hoursData),
  getEmployeeAvailability: (employeeId) =>
    api.get(`/admin/employees/${employeeId}/availability`),
  addEmployeeAvailability: (employeeId, availabilityData) =>
    api.post(`/admin/employees/${employeeId}/availability`, availabilityData),
  deleteEmployeeAvailability: (availabilityId) =>
    api.delete(`/admin/availability/${availabilityId}`),
  uploadEmployeePhoto: (employeeId, photoFile) => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    return api.post(`/admin/employees/${employeeId}/upload-photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// ===== ADMIN - CLIENTS =====

export const adminClientsAPI = {
  getAll: () => api.get('/admin/clients'),
  create: (clientData) => api.post('/admin/clients', clientData),
  update: (id, clientData) => api.put(`/admin/clients/${id}`, clientData),
  delete: (id) => api.delete(`/admin/clients/${id}`),
};

// ===== ADMIN - RENDEZ-VOUS =====

export const adminAppointmentsAPI = {
  getAll: (filters) => api.get('/admin/appointments', { params: filters }),
  create: (appointmentData) => api.post('/admin/appointments', appointmentData), // Nouvelle fonction pour l'admin
  updateStatus: (id, status) => api.put(`/admin/appointments/${id}/status`, { status }),
  delete: (id) => api.delete(`/admin/appointments/${id}`), // Nouvelle fonction de suppression
  getEmployeeAppointments: (employeeId, startDate, endDate) =>
    api.get(`/admin/employee-appointments/${employeeId}`, { params: { start_date: startDate, end_date: endDate } }),
  getAvailability: (serviceId, employeeId, date) =>
    api.get('/admin/appointments/availability', {
      params: { service_id: serviceId, employee_id: employeeId, date }
    }),
};

// ===== ADMIN - HORAIRES =====

export const adminHoursAPI = {
  getBusinessHours: () => api.get('/admin/business-hours'),
  updateBusinessHours: (hoursData) => api.put('/admin/business-hours', hoursData),
  getClosedDates: () => api.get('/admin/closed-dates'),
  addClosedDate: (dateData) => api.post('/admin/closed-dates', dateData),
  deleteClosedDate: (id) => api.delete(`/admin/closed-dates/${id}`),
};

// ===== ADMIN - GALERIE =====

export const adminGalleryAPI = {
  getGallery: () => api.get('/admin/gallery'),
  deleteImage: (id) => api.delete(`/admin/gallery/${id}`),
  uploadGalleryPhoto: (photoFile, title) => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    if (title) {
      formData.append('title', title);
    }
    return api.post('/admin/gallery/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// ===== ADMIN - STATISTIQUES =====

export const adminStatsAPI = {
  getStats: () => api.get('/admin/stats'),
};

export default api;

