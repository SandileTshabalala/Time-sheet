import type React from "react"
import { useEffect, useState } from "react"
import leaveService, { type LeaveRequestDto } from "../../services/leave.service"


const TeamLeaveCalendar: React.FC = () => {
  const [items, setItems] = useState<LeaveRequestDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await leaveService.pendingApprovals()
      setItems(data)
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load team leaves")
    } finally {
      setLoading(false)
    }
  }

  const groups = items.reduce<Record<string, LeaveRequestDto[]>>((acc, it) => {
    const m = new Date(it.startDate).toLocaleString(undefined, { month: "long", year: "numeric" })
    acc[m] = acc[m] || []
    acc[m].push(it)
    return acc
  }, {})

  const months = Object.keys(groups)

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Team Leave Calendar</h2>
          <p className="text-gray-600 mt-1">Overview of all team member leave requests</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-gray-900 rounded-full mr-3"></div>
                <span className="text-gray-900 font-medium">{error}</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Loading team calendar...</p>
            </div>
          ) : months.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Leave Requests</h3>
              <p className="text-gray-600">There are currently no team leave requests to display.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {months.map((m) => (
                <div key={m} className="group">
                  <div className="flex items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">{m}</h3>
                    <div className="ml-4 flex-1 h-px bg-gray-200"></div>
                    <span className="ml-4 text-sm text-gray-500 font-medium">
                      {groups[m].length} {groups[m].length === 1 ? "request" : "requests"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {groups[m].map((item) => (
                      <div
                        key={item.id}
                        className="bg-gray-50 hover:bg-gray-100 transition-colors duration-200 rounded-lg border border-gray-200 p-5"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
                              <span className="font-semibold text-gray-900">{item.employeeName}</span>
                              <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700">
                                {item.type}
                              </span>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <span className="font-medium">
                                  {new Date(item.startDate).toLocaleDateString()} -{" "}
                                  {new Date(item.endDate).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span className="font-medium">
                                  {item.days} {item.days === 1 ? "day" : "days"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded border border-gray-200">
                              #{item.id}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TeamLeaveCalendar
