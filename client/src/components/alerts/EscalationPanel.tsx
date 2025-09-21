import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationsContext';
import authService from '../../services/auth.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Clock4, AlertCircle, AlertTriangle, Filter, X, Bell, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import timesheetService from '../../services/timesheet.service';

interface EscalationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  payload: {
    timesheetId: string;
    employeeId?: string;
    employeeName?: string;
    daysPending?: number;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    status?: 'Pending' | 'In Review' | 'Approved' | 'Rejected';
  };
  createdAt: string;
  read: boolean;
}

export default function EscalationPanel() {
  const { items, markAllRead, clear, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priority: 'all',
    status: 'all',
    unreadOnly: true
  });

  const escalations = useMemo(() => {
    return items
      .filter((i: any) => i.type === 'TimesheetEscalation')
      .map((item: any) => ({
        ...item,
        payload: {
          ...item.payload,
          daysPending: item.payload?.daysPending || 0,
          priority: item.payload?.priority || 'medium',
          status: item.payload?.status || 'Pending'
        }
      })) as EscalationItem[];
  }, [items]);

  const filteredEscalations = useMemo(() => {
    return escalations.filter(escalation => {
      const matchesPriority = filters.priority === 'all' || 
        escalation.payload.priority === filters.priority;
      
      const matchesStatus = filters.status === 'all' || 
        escalation.payload.status === filters.status;
      
      const matchesUnread = !filters.unreadOnly || !escalation.read;
      
      return matchesPriority && matchesStatus && matchesUnread;
    });
  }, [escalations, filters]);

  const priorityCounts = useMemo(() => {
    return {
      critical: escalations.filter(e => e.payload.priority === 'critical').length,
      high: escalations.filter(e => e.payload.priority === 'high').length,
      medium: escalations.filter(e => e.payload.priority === 'medium').length,
      low: escalations.filter(e => e.payload.priority === 'low').length,
      total: escalations.length,
      unread: escalations.filter(e => !e.read).length
    };
  }, [escalations]);

  // Only visible for HRAdmin or SystemAdmin
  const canView = authService.hasRole('HRAdmin') || authService.hasRole('SystemAdmin');
  if (!canView) return null;

  if (escalations.length === 0 && !isExpanded) return null;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Critical
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> High
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 flex items-center gap-1">
            <Clock4 className="h-3 w-3" /> Medium
          </Badge>
        );
      case 'low':
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock4 className="h-3 w-3" /> Low
          </Badge>
        );
    }
  };

  const handleApprove = async (timesheetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsLoading(true);
      await timesheetService.approveTimesheet(parseInt(timesheetId), { isApproved: true });
      toast.success('Timesheet approved');
      // Mark as read after action
      markAsRead(timesheetId);
    } catch (error) {
      console.error('Failed to approve timesheet:', error);
      toast.error('Failed to approve timesheet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemind = async (timesheetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsLoading(true);
      await timesheetService.sendReminder(parseInt(timesheetId));
      toast.success('Reminder sent');
    } catch (error) {
      console.error('Failed to send reminder:', error);
      toast.error('Failed to send reminder');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[95vw] transition-all duration-300">
      <Card className={`shadow-xl border-gray-200 overflow-hidden transition-all duration-300 ${!isExpanded ? 'cursor-pointer hover:shadow-2xl' : ''}`}>
        <div 
          className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between"
          onClick={() => !isExpanded && setIsExpanded(true)}
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${priorityCounts.critical > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
            <h3 className="text-sm font-semibold text-gray-900">Timesheet Escalations</h3>
            <div className="flex gap-1">
              {priorityCounts.critical > 0 && (
                <span className="text-xs text-white bg-red-500 rounded-full px-2 py-0.5">
                  {priorityCounts.critical} Critical
                </span>
              )}
              <span className="text-xs text-white bg-gray-900 rounded-full px-2 py-0.5">
                {priorityCounts.unread} New
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-gray-500 hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFilters(!showFilters);
                  }}
                >
                  <Filter className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-gray-500 hover:bg-gray-100"
                  onClick={async (e) => {
                    e.stopPropagation();
                    setIsLoading(true);
                    try {
                      await markAllRead();
                      toast.success('All marked as read');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-gray-500 hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        {isExpanded && (
          <>
            {showFilters && (
              <div className="bg-gray-50 p-3 border-b border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilters({...filters, priority: e.target.value})}
                      className="w-full text-xs rounded border-gray-300 py-1.5 focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="all">All Priorities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                      className="w-full text-xs rounded border-gray-300 py-1.5 focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="In Review">In Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>
                <div className="mt-2 flex items-center">
                  <input
                    type="checkbox"
                    id="unreadOnly"
                    checked={filters.unreadOnly}
                    onChange={(e) => setFilters({...filters, unreadOnly: e.target.checked})}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="unreadOnly" className="ml-2 block text-xs text-gray-700">
                    Show unread only
                  </label>
                </div>
              </div>
            )}
            
            <div className="max-h-[60vh] overflow-y-auto">
              {filteredEscalations.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No escalations found matching your filters
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredEscalations.map((escalation) => (
                    <li 
                      key={escalation.id}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${!escalation.read ? 'bg-blue-50' : ''}`}
                      onClick={() => {
                        const tid = escalation.payload?.timesheetId;
                        markAsRead(escalation.id);
                        if (tid) navigate(`/manager/approvals?focus=${encodeURIComponent(tid)}`);
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`text-sm font-medium ${!escalation.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {escalation.payload.employeeName || 'Unknown Employee'}
                            </h3>
                            {getPriorityBadge(escalation.payload.priority || 'medium')}
                            {escalation.payload.status === 'Pending' && (
                              <Badge variant="outline" className="text-xs">
                                {escalation.payload.daysPending || 0}d pending
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {escalation.message}
                          </p>
                          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                            <span>#{escalation.payload.timesheetId}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(escalation.createdAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50"
                            onClick={(e) => handleApprove(escalation.payload.timesheetId, e)}
                            disabled={isLoading}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                            onClick={(e) => handleRemind(escalation.payload.timesheetId, e)}
                            disabled={isLoading}
                          >
                            <Bell className="h-3.5 w-3.5" />
                            Remind
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500">
                  {filteredEscalations.length} of {escalations.length} items
                </span>
                {filters.unreadOnly && (
                  <span className="text-xs text-blue-600">
                    {priorityCounts.unread} unread
                  </span>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-7"
                onClick={() => clear()}
                disabled={escalations.length === 0}
              >
                Clear all
              </Button>
            </div>
          </>
        )}
      </Card>
      
      {!isExpanded && (
        <div 
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold cursor-pointer shadow-lg hover:bg-red-600 transition-colors"
          onClick={() => setIsExpanded(true)}
        >
          {priorityCounts.unread > 0 ? priorityCounts.unread : null}
        </div>
      )}
    </div>
  );
}
