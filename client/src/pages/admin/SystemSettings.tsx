import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Settings, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

interface SystemConfig {
  workingHours: {
    startTime: string;
    endTime: string;
    workDaysPerWeek: number;
    overtimeThreshold: number;
  };
  timesheetRules: {
    submissionDeadline: number; // days after period end
    approvalDeadline: number; // days after submission
    requireProjectCodes: boolean;
    allowFutureEntries: boolean;
    minimumHoursPerDay: number;
    maximumHoursPerDay: number;
  };
  holidays: Array<{
    id: string;
    name: string;
    date: string;
    type: 'public' | 'company';
    recurring: boolean;
  }>;
}

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('working-hours');
  const [isDirty, setIsDirty] = useState(false);

  // Mock system configuration - in real app would come from API
  const [config, setConfig] = useState<SystemConfig>({
    workingHours: {
      startTime: '09:00',
      endTime: '17:00',
      workDaysPerWeek: 5,
      overtimeThreshold: 8
    },
    timesheetRules: {
      submissionDeadline: 7,
      approvalDeadline: 3,
      requireProjectCodes: true,
      allowFutureEntries: false,
      minimumHoursPerDay: 0,
      maximumHoursPerDay: 12
    },
    holidays: [
      { id: '1', name: 'New Year\'s Day', date: '2024-01-01', type: 'public', recurring: true },
      { id: '2', name: 'Independence Day', date: '2024-07-04', type: 'public', recurring: true },
      { id: '3', name: 'Christmas Day', date: '2024-12-25', type: 'public', recurring: true },
      { id: '4', name: 'Company Retreat', date: '2024-06-15', type: 'company', recurring: false }
    ]
  });

  const handleSave = async () => {
    try {
      // In real app, would save to API
      toast.success('System settings saved successfully');
      setIsDirty(false);
    } catch (error) {
      toast.error('Failed to save system settings');
    }
  };

  const updateConfig = (section: keyof SystemConfig, updates: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }));
    setIsDirty(true);
  };

  const addHoliday = () => {
    const newHoliday = {
      id: Date.now().toString(),
      name: 'New Holiday',
      date: new Date().toISOString().split('T')[0],
      type: 'company' as const,
      recurring: false
    };
    setConfig(prev => ({
      ...prev,
      holidays: [...prev.holidays, newHoliday]
    }));
    setIsDirty(true);
  };

  const removeHoliday = (holidayId: string) => {
    setConfig(prev => ({
      ...prev,
      holidays: prev.holidays.filter(h => h.id !== holidayId)
    }));
    setIsDirty(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure system-wide policies and rules</p>
        </div>
        <div className="flex gap-2">
          {isDirty && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Unsaved Changes
            </Badge>
          )}
          <Button onClick={handleSave} disabled={!isDirty}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="working-hours">Working Hours</TabsTrigger>
          <TabsTrigger value="timesheet-rules">Timesheet Rules</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
        </TabsList>

        {/* Working Hours Settings */}
        <TabsContent value="working-hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Working Hours Configuration
              </CardTitle>
              <CardDescription>Set default working hours and overtime policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    type="time"
                    id="startTime"
                    value={config.workingHours.startTime}
                    onChange={(e) => updateConfig('workingHours', { startTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    type="time"
                    id="endTime"
                    value={config.workingHours.endTime}
                    onChange={(e) => updateConfig('workingHours', { endTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="workDays">Work Days Per Week</Label>
                  <Input
                    type="number"
                    id="workDays"
                    min="1"
                    max="7"
                    value={config.workingHours.workDaysPerWeek}
                    onChange={(e) => updateConfig('workingHours', { workDaysPerWeek: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="overtimeThreshold">Overtime Threshold (hours)</Label>
                  <Input
                    type="number"
                    id="overtimeThreshold"
                    min="1"
                    max="24"
                    value={config.workingHours.overtimeThreshold}
                    onChange={(e) => updateConfig('workingHours', { overtimeThreshold: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timesheet Rules Settings */}
        <TabsContent value="timesheet-rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Timesheet Rules & Policies
              </CardTitle>
              <CardDescription>Configure submission deadlines and validation rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="submissionDeadline">Submission Deadline (days)</Label>
                  <Input
                    type="number"
                    id="submissionDeadline"
                    min="1"
                    max="30"
                    value={config.timesheetRules.submissionDeadline}
                    onChange={(e) => updateConfig('timesheetRules', { submissionDeadline: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Days after period end to submit</p>
                </div>
                <div>
                  <Label htmlFor="approvalDeadline">Approval Deadline (days)</Label>
                  <Input
                    type="number"
                    id="approvalDeadline"
                    min="1"
                    max="14"
                    value={config.timesheetRules.approvalDeadline}
                    onChange={(e) => updateConfig('timesheetRules', { approvalDeadline: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Days after submission to approve</p>
                </div>
                <div>
                  <Label htmlFor="minHours">Minimum Hours Per Day</Label>
                  <Input
                    type="number"
                    id="minHours"
                    min="0"
                    max="24"
                    step="0.5"
                    value={config.timesheetRules.minimumHoursPerDay}
                    onChange={(e) => updateConfig('timesheetRules', { minimumHoursPerDay: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxHours">Maximum Hours Per Day</Label>
                  <Input
                    type="number"
                    id="maxHours"
                    min="1"
                    max="24"
                    step="0.5"
                    value={config.timesheetRules.maximumHoursPerDay}
                    onChange={(e) => updateConfig('timesheetRules', { maximumHoursPerDay: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireProjectCodes">Require Project Codes</Label>
                    <p className="text-xs text-gray-500">Force users to select project codes for all entries</p>
                  </div>
                  <input
                    type="checkbox"
                    id="requireProjectCodes"
                    checked={config.timesheetRules.requireProjectCodes}
                    onChange={(e) => updateConfig('timesheetRules', { requireProjectCodes: e.target.checked })}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allowFutureEntries">Allow Future Entries</Label>
                    <p className="text-xs text-gray-500">Allow users to log time for future dates</p>
                  </div>
                  <input
                    type="checkbox"
                    id="allowFutureEntries"
                    checked={config.timesheetRules.allowFutureEntries}
                    onChange={(e) => updateConfig('timesheetRules', { allowFutureEntries: e.target.checked })}
                    className="rounded"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Holidays Settings */}
        <TabsContent value="holidays" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Holiday Calendar
                  </CardTitle>
                  <CardDescription>Manage public and company holidays</CardDescription>
                </div>
                <Button onClick={addHoliday} size="sm">
                  Add Holiday
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {config.holidays.map((holiday) => (
                  <div key={holiday.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>
                        <Input
                          value={holiday.name}
                          onChange={(e) => {
                            const updatedHolidays = config.holidays.map(h => 
                              h.id === holiday.id ? { ...h, name: e.target.value } : h
                            );
                            setConfig(prev => ({ ...prev, holidays: updatedHolidays }));
                            setIsDirty(true);
                          }}
                          className="font-medium"
                        />
                      </div>
                      <div>
                        <Input
                          type="date"
                          value={holiday.date}
                          onChange={(e) => {
                            const updatedHolidays = config.holidays.map(h => 
                              h.id === holiday.id ? { ...h, date: e.target.value } : h
                            );
                            setConfig(prev => ({ ...prev, holidays: updatedHolidays }));
                            setIsDirty(true);
                          }}
                        />
                      </div>
                      <Badge variant={holiday.type === 'public' ? 'default' : 'secondary'}>
                        {holiday.type}
                      </Badge>
                      {holiday.recurring && (
                        <Badge variant="outline">Recurring</Badge>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeHoliday(holiday.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemSettings;