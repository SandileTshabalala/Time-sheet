import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import timesheetService, { 
  type CreateTimesheetDto, 
  type UpdateTimesheetDto, 
  type TimesheetDto, 
  TimesheetPeriod,
  TimesheetStatus 
} from '../../services/timesheet.service';

interface TimesheetFormProps {
  isEdit?: boolean;
}

const TimesheetForm: React.FC<TimesheetFormProps> = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timesheet, setTimesheet] = useState<TimesheetDto | null>(null);

  const [formData, setFormData] = useState<CreateTimesheetDto>({
    date: new Date().toISOString().split('T')[0],
    hoursWorked: 8,
    overtimeHours: 0,
    breakHours: 1,
    projectName: '',
    taskDescription: '',
    comments: '',
    period: TimesheetPeriod.Daily,
    weekStartDate: undefined,
    weekEndDate: undefined
  });

  useEffect(() => {
    if (isEdit && id) {
      loadTimesheet();
    }
  }, [isEdit, id]);

  const loadTimesheet = async () => {
    try {
      setLoading(true);
      const data = await timesheetService.getTimesheet(parseInt(id!));
      setTimesheet(data);
      setFormData({
        date: data.date.split('T')[0],
        hoursWorked: data.hoursWorked,
        overtimeHours: data.overtimeHours || 0,
        breakHours: data.breakHours || 0,
        projectName: data.projectName || '',
        taskDescription: data.taskDescription || '',
        comments: data.comments || '',
        period: data.period,
        weekStartDate: data.weekStartDate?.split('T')[0],
        weekEndDate: data.weekEndDate?.split('T')[0]
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load timesheet');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEdit && id) {
        await timesheetService.updateTimesheet(parseInt(id), formData as UpdateTimesheetDto);
        toast.success('Timesheet updated successfully');
      } else {
        await timesheetService.createTimesheet(formData);
        toast.success('Timesheet created successfully');
      }
      navigate('/employee/timesheets');
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to save timesheet';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Hours') || name === 'period' ? 
        (value === '' ? 0 : Number(value)) : value
    }));
  };

  const canEdit = !timesheet || 
    timesheet.status === TimesheetStatus.Draft || 
    timesheet.status === TimesheetStatus.Rejected;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-xl transition-transform duration-300 ease-out hover:shadow-xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Timesheet' : 'Create New Timesheet'}
          </h2>
          {timesheet && (
            <div className="mt-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${timesheetService.getStatusColor(timesheet.status)}`}>
                {timesheetService.getStatusText(timesheet.status)}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                disabled={!canEdit}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            {/* Period */}
            <div>
              <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-2">
                Period *
              </label>
              <select
                id="period"
                name="period"
                value={formData.period}
                onChange={handleInputChange}
                disabled={!canEdit}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value={TimesheetPeriod.Daily}>Daily</option>
                <option value={TimesheetPeriod.Weekly}>Weekly</option>
                <option value={TimesheetPeriod.Monthly}>Monthly</option>
              </select>
            </div>

            {/* Hours Worked */}
            <div>
              <label htmlFor="hoursWorked" className="block text-sm font-medium text-gray-700 mb-2">
                Hours Worked *
              </label>
              <input
                type="number"
                id="hoursWorked"
                name="hoursWorked"
                value={formData.hoursWorked}
                onChange={handleInputChange}
                disabled={!canEdit}
                min={0}
                step="0.5"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            {/* Overtime Hours */}
            <div>
              <label htmlFor="overtimeHours" className="block text-sm font-medium text-gray-700 mb-2">
                Overtime Hours
              </label>
              <input
                type="number"
                id="overtimeHours"
                name="overtimeHours"
                value={formData.overtimeHours}
                onChange={handleInputChange}
                disabled={!canEdit}
                min={0}
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            {/* Break Hours */}
            <div>
              <label htmlFor="breakHours" className="block text-sm font-medium text-gray-700 mb-2">
                Break Hours
              </label>
              <input
                type="number"
                id="breakHours"
                name="breakHours"
                value={formData.breakHours}
                onChange={handleInputChange}
                disabled={!canEdit}
                min={0}
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            {/* Project Name */}
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                id="projectName"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
                disabled={!canEdit}
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Task Description */}
          <div>
            <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Task Description
            </label>
            <input
              type="text"
              id="taskDescription"
              name="taskDescription"
              value={formData.taskDescription}
              onChange={handleInputChange}
              disabled={!canEdit}
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          {/* Comments */}
          <div>
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
              Comments
            </label>
            <textarea
              id="comments"
              name="comments"
              value={formData.comments}
              onChange={handleInputChange}
              disabled={!canEdit}
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          {/* Week dates for weekly period */}
          {formData.period === TimesheetPeriod.Weekly && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="weekStartDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Week Start Date
                </label>
                <input
                  type="date"
                  id="weekStartDate"
                  name="weekStartDate"
                  value={formData.weekStartDate || ''}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label htmlFor="weekEndDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Week End Date
                </label>
                <input
                  type="date"
                  id="weekEndDate"
                  name="weekEndDate"
                  value={formData.weekEndDate || ''}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          )}

          {/* Rejection Reason (if rejected) */}
          {timesheet?.status === TimesheetStatus.Rejected && timesheet.rejectionReason && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <h4 className="font-medium text-red-800 mb-2">Rejection Reason:</h4>
              <p className="text-red-700">{timesheet.rejectionReason}</p>
            </div>
          )}

          {/* Form Actions */}
          {canEdit && (
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/employee/timesheets')}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-transform duration-200 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-transform duration-200 active:scale-95 shadow-sm"
              >
                {loading ? 'Saving...' : (isEdit ? 'Update' : 'Create')} Timesheet
              </button>
            </div>
          )}

          {!canEdit && (
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/employee/timesheets')}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Back to Timesheets
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default TimesheetForm;
