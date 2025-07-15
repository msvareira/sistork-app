import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Appointment } from '../types';
import { 
  Plus, 
  Calendar, 
  Clock, 
  User,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

export default function Schedule() {
  const { appointments, clients, addAppointment, updateAppointment, deleteAppointment } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [formData, setFormData] = useState({
    clientId: '',
    service: '',
    date: new Date(),
    time: '',
    status: 'scheduled' as Appointment['status'],
    notes: ''
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(appointment => 
      isSameDay(new Date(appointment.date), date)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAppointment) {
      updateAppointment(editingAppointment.id, formData);
    } else {
      addAppointment(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      service: '',
      date: new Date(),
      time: '',
      status: 'scheduled',
      notes: ''
    });
    setEditingAppointment(null);
    setShowForm(false);
  };

  const handleEdit = (appointment: Appointment) => {
    setFormData({
      clientId: appointment.clientId,
      service: appointment.service,
      date: new Date(appointment.date),
      time: appointment.time,
      status: appointment.status,
      notes: appointment.notes || ''
    });
    setEditingAppointment(appointment);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      deleteAppointment(id);
    }
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'confirmed': return 'Confirmado';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const selectedDayAppointments = getAppointmentsForDay(selectedDate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Novo Agendamento</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(day => {
              const dayAppointments = getAppointmentsForDay(day);
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              
              return (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={`p-2 text-sm rounded-lg transition-colors ${
                    isSelected 
                      ? 'bg-blue-600 text-white' 
                      : isToday 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'hover:bg-gray-100'
                  } ${!isSameMonth(day, currentMonth) ? 'text-gray-400' : ''}`}
                >
                  <div>{format(day, 'd')}</div>
                  {dayAppointments.length > 0 && (
                    <div className="flex justify-center mt-1">
                      <div className={`w-1 h-1 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-blue-600'
                      }`} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Schedule */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">
            {format(selectedDate, 'dd/MM/yyyy')}
          </h3>
          
          <div className="space-y-3">
            {selectedDayAppointments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhum agendamento para esta data
              </p>
            ) : (
              selectedDayAppointments.map(appointment => {
                const client = clients.find(c => c.id === appointment.clientId);
                return (
                  <div key={appointment.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {appointment.time}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(appointment.status)}`}>
                        {getStatusText(appointment.status)}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        <span>{client?.name}</span>
                      </div>
                      <p className="font-medium">{appointment.service}</p>
                      {appointment.notes && (
                        <p className="text-xs text-gray-500">{appointment.notes}</p>
                      )}
                    </div>
                    
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        onClick={() => handleEdit(appointment)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(appointment.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Appointment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serviço
                </label>
                <input
                  type="text"
                  required
                  value={formData.service}
                  onChange={(e) => setFormData({...formData, service: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date.toISOString().split('T')[0]}
                    onChange={(e) => setFormData({...formData, date: new Date(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as Appointment['status']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="scheduled">Agendado</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="completed">Concluído</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  {editingAppointment ? 'Atualizar' : 'Agendar'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}