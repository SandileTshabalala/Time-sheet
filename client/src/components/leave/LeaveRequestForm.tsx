import type React from "react"
import { useState } from "react"
import leaveService, { type CreateLeaveDto } from "../../services/leave.service"
import { toast } from "react-toastify"

const LeaveRequestForm: React.FC = () => {
  const [form, setForm] = useState<CreateLeaveDto>({ type: "Annual", startDate: "", endDate: "", reason: "" })
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    try {
      setSubmitting(true)
      // basic client-side validation
      const s = new Date(form.startDate as any)
      const e = new Date(form.endDate as any)
      if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        toast.error("Please select both start and end dates")
        return
      }
      if (s > e) {
        toast.error("Start date must be before or equal to end date")
        return
      }
      await leaveService.create(form)
      toast.success("Leave request submitted")
      setForm({ type: "Annual", startDate: "", endDate: "", reason: "" })
    } catch (e: any) {
      console.error("Create leave error", e?.response?.status, e?.response?.data)
      const msg = e?.response?.data?.message || e?.response?.data || "Failed to submit leave"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Request Leave</h2>
        <p className="text-gray-600">Submit your leave request for approval</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Leave Type</label>
          <select
            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-900 bg-white focus:border-gray-900 focus:ring-0 transition-colors duration-200"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as any })}
          >
            {["Annual", "Sick", "Unpaid", "Other"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Start Date</label>
            <input
              type="date"
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-900 bg-white focus:border-gray-900 focus:ring-0 transition-colors duration-200"
              value={String(form.startDate)}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">End Date</label>
            <input
              type="date"
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-900 bg-white focus:border-gray-900 focus:ring-0 transition-colors duration-200"
              value={String(form.endDate)}
              min={String(form.startDate) || undefined}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Reason <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <textarea
            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-900 bg-white focus:border-gray-900 focus:ring-0 transition-colors duration-200 resize-none"
            rows={4}
            placeholder="Provide additional details about your leave request..."
            value={form.reason || ""}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            disabled={submitting || !form.startDate || !form.endDate}
            onClick={submit}
            className="bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LeaveRequestForm
