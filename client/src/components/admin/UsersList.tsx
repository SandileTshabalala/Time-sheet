import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import adminService from "../../services/admin.service"
import { Link, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import type { UserDto } from "../../services/admin.service"

const UsersList: React.FC = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await adminService.getUsers()).data,
  })

  // UI state: filters, sorting, confirm dialog
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("") // '', 'active', 'disabled'
  const [sortKey, setSortKey] = useState<"name" | "email" | "status">("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [confirmUserId, setConfirmUserId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showAuditFor, setShowAuditFor] = useState<string | null>(null)
  const [auditLogs, setAuditLogs] = useState<
    { timestamp: string; actor: string; action: string; details?: string }[] | null
  >(null)
  const [auditLoading, setAuditLoading] = useState(false)
  // Set Password modal state
  const [setPwUser, setSetPwUser] = useState<UserDto | null>(null)
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [requireChange, setRequireChange] = useState(true)
  const [setPwSubmitting, setSetPwSubmitting] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: () => {
      toast.success("User deleted")
      qc.invalidateQueries({ queryKey: ["users"] })
      setConfirmUserId(null)
    },
    onError: () => toast.error("Failed to delete user"),
  })

  // Normalize data to a flat array of users regardless of pagination
  const users: UserDto[] = useMemo(() => {
    const d = data as any
    if (!d) return []
    return Array.isArray(d) ? (d as UserDto[]) : (d.items as UserDto[]) || []
  }, [data])

  const allRoles = useMemo(() => {
    const set = new Set<string>()
    users.forEach((u: UserDto) => u.roles.forEach((r: string) => set.add(r)))
    return Array.from(set)
  }, [users])

  const filteredSorted = useMemo(() => {
    let list: UserDto[] = users.slice()
    if (query)
      list = list.filter(
        (u: UserDto) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase()),
      )
    if (roleFilter) list = list.filter((u: UserDto) => u.roles.includes(roleFilter))
    if (statusFilter) list = list.filter((u: UserDto) => (statusFilter === "active" ? u.isActive : !u.isActive))
    list.sort((a: UserDto, b: UserDto) => {
      if (sortKey === "name") {
        const an = `${a.firstName} ${a.lastName}`.toLowerCase()
        const bn = `${b.firstName} ${b.lastName}`.toLowerCase()
        return sortDir === "asc" ? an.localeCompare(bn) : bn.localeCompare(an)
      }
      if (sortKey === "email") {
        return sortDir === "asc" ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email)
      }
      // status
      const av = a.isActive ? 1 : 0
      const bv = b.isActive ? 1 : 0
      return sortDir === "asc" ? av - bv : bv - av
    })
    return list
  }, [users, query, roleFilter, statusFilter, sortKey, sortDir])

  // Reset selection when data changes
  useEffect(() => {
    setSelected({})
    setPage(1)
  }, [users, query, roleFilter, statusFilter])

  const total = filteredSorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredSorted.slice(start, start + pageSize)
  }, [filteredSorted, page, pageSize])

  const toggleSort = (key: "name" | "email" | "status") => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
        <h2 className="text-3xl font-bold text-black">Users</h2>
        <div className="flex gap-3 items-center flex-wrap">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email"
            className="px-4 py-2 border-2 border-gray-300 rounded-lg min-w-[240px] focus:border-black focus:outline-none transition-colors"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none transition-colors"
          >
            <option value="">All roles</option>
            {allRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none transition-colors"
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
          <button
            onClick={() => navigate("/admin/users/new")}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            New User
          </button>
        </div>
      </div>

      {Object.values(selected).some(Boolean) && (
        <div className="flex gap-3 items-center p-4 bg-gray-50 border-2 border-gray-200 rounded-lg mb-6">
          <span className="font-semibold text-black">{Object.values(selected).filter(Boolean).length} selected</span>
          <span className="text-gray-400">|</span>
          <button
            onClick={async () => {
              const ids = Object.keys(selected).filter((id) => selected[id])
              await adminService.bulkActivate(ids)
              toast.success("Activated")
              qc.invalidateQueries({ queryKey: ["users"] })
            }}
            className="px-3 py-1.5 border-2 border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors"
          >
            Activate
          </button>
          <button
            onClick={async () => {
              const ids = Object.keys(selected).filter((id) => selected[id])
              await adminService.bulkDeactivate(ids)
              toast.success("Deactivated")
              qc.invalidateQueries({ queryKey: ["users"] })
            }}
            className="px-3 py-1.5 border-2 border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors"
          >
            Deactivate
          </button>
          <span className="text-gray-400">|</span>
          <RoleBulkAssign
            onAssign={async (role) => {
              const ids = Object.keys(selected).filter((id) => selected[id])
              await adminService.bulkAssignRole(ids, role)
              toast.success(`Assigned ${role}`)
              qc.invalidateQueries({ queryKey: ["users"] })
            }}
            onRemove={async (role) => {
              const ids = Object.keys(selected).filter((id) => selected[id])
              await adminService.bulkRemoveRole(ids, role)
              toast.success(`Removed ${role}`)
              qc.invalidateQueries({ queryKey: ["users"] })
            }}
            roles={allRoles}
          />
          <span className="text-gray-400">|</span>
          <button
            onClick={async () => {
              const ids = Object.keys(selected).filter((id) => selected[id])
              await adminService.bulkForcePasswordChange(ids)
              toast.success("Forced password change")
              qc.invalidateQueries({ queryKey: ["users"] })
            }}
            className="px-3 py-1.5 border-2 border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors"
          >
            Force PW Change
          </button>
          <button
            onClick={async () => {
              const ids = Object.keys(selected).filter((id) => selected[id])
              await adminService.bulkUnlock(ids)
              toast.success("Unlocked")
              qc.invalidateQueries({ queryKey: ["users"] })
            }}
            className="px-3 py-1.5 border-2 border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors"
          >
            Unlock
          </button>
        </div>
      )}

      {setPwUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[520px] shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-semibold text-black">Set Password</h3>
              <button
                onClick={() => { setSetPwUser(null); setNewPw(''); setConfirmPw(''); setRequireChange(true); }}
                className="text-gray-400 hover:text-black text-2xl transition-colors"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="text-gray-600 mb-4">For user: <span className="font-medium text-black">{setPwUser.email}</span></div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-black mb-1">New Password</label>
                <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Confirm Password</label>
                <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none" />
              </div>
              <label className="flex items-center gap-2 select-none">
                <input type="checkbox" checked={requireChange} onChange={(e) => setRequireChange(e.target.checked)} className="w-4 h-4 accent-black" />
                <span className="text-sm text-black">Require change on next login</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => { setSetPwUser(null); setNewPw(''); setConfirmPw(''); setRequireChange(true); }}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={setPwSubmitting}
                onClick={async () => {
                  if (!newPw || !confirmPw) { toast.error('Please fill both password fields'); return; }
                  if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
                  setSetPwSubmitting(true)
                  try {
                    await adminService.setPassword(setPwUser.id, newPw, requireChange)
                    toast.success(requireChange ? 'Password set. User must change on next login.' : 'Password set.')
                    setSetPwUser(null); setNewPw(''); setConfirmPw(''); setRequireChange(true)
                  } catch (err: any) {
                    const msg = err?.response?.data || 'Failed to set password'
                    toast.error(Array.isArray(msg) ? msg.join(', ') : (typeof msg === 'string' ? msg : 'Failed to set password'))
                  } finally {
                    setSetPwSubmitting(false)
                  }
                }}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {setPwSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && <div className="text-center py-8 text-gray-600">Loading...</div>}
      {isError && <div className="text-center py-8 text-red-600">Error loading users</div>}

      {data && (
        <div className="overflow-x-auto bg-white border-2 border-gray-200 rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="w-12 p-4 text-left">
                  <input
                    type="checkbox"
                    checked={paged.length > 0 && paged.every((u) => selected[u.id])}
                    onChange={(e) => {
                      const checked = e.target.checked
                      const s = { ...selected }
                      paged.forEach((u) => (s[u.id] = checked))
                      setSelected(s)
                    }}
                    className="w-4 h-4 accent-black"
                  />
                </th>
                <th
                  onClick={() => toggleSort("name")}
                  className="cursor-pointer text-left p-4 font-semibold text-black hover:bg-gray-100 transition-colors"
                >
                  Name {sortKey === "name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  onClick={() => toggleSort("email")}
                  className="cursor-pointer text-left p-4 font-semibold text-black hover:bg-gray-100 transition-colors"
                >
                  Email {sortKey === "email" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="text-left p-4 font-semibold text-black">Roles</th>
                <th
                  onClick={() => toggleSort("status")}
                  className="cursor-pointer text-left p-4 font-semibold text-black hover:bg-gray-100 transition-colors"
                >
                  Status {sortKey === "status" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="text-right p-4 font-semibold text-black">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={!!selected[u.id]}
                      onChange={(e) => setSelected((prev) => ({ ...prev, [u.id]: e.target.checked }))}
                      className="w-4 h-4 accent-black"
                    />
                  </td>
                  <td className="p-4 font-medium text-black">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="p-4 text-gray-700">{u.email}</td>
                  <td className="p-4 text-gray-700">{u.roles.join(", ")}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${u.isActive ? "bg-gray-100 text-black" : "bg-gray-200 text-gray-600"}`}
                    >
                      {u.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link to={`/admin/users/${u.id}/edit`} className="text-black hover:underline font-medium">
                        Edit
                      </Link>
                      {u.isActive ? (
                        <button
                          onClick={async () => {
                            await adminService.lockUser(u.id)
                            toast.success("Locked")
                            qc.invalidateQueries({ queryKey: ["users"] })
                          }}
                          className="text-gray-600 hover:text-black transition-colors"
                        >
                          Lock
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            await adminService.unlockUser(u.id)
                            toast.success("Unlocked")
                            qc.invalidateQueries({ queryKey: ["users"] })
                          }}
                          className="text-gray-600 hover:text-black transition-colors"
                        >
                          Unlock
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          await adminService.forcePasswordChange(u.id)
                          toast.success("Force PW change")
                        }}
                        className="text-gray-600 hover:text-black transition-colors"
                      >
                        Force PW
                      </button>
                      <button
                        onClick={() => setSetPwUser(u)}
                        className="text-gray-600 hover:text-black transition-colors"
                      >
                        Set PW
                      </button>
                      <button
                        onClick={async () => {
                          setAuditLoading(true)
                          setShowAuditFor(u.id)
                          try {
                            const res = await adminService.getUserAudit(u.id)
                            setAuditLogs(res.data)
                          } finally {
                            setAuditLoading(false)
                          }
                        }}
                        className="text-gray-600 hover:text-black transition-colors"
                      >
                        Audit
                      </button>
                      <button
                        onClick={() => setConfirmUserId(u.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <div className="text-gray-600">
          Showing {total === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
        </div>
        <div className="flex items-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 border-2 border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span className="text-gray-700">
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 border-2 border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number.parseInt(e.target.value))
              setPage(1)
            }}
            className="px-3 py-1.5 border-2 border-gray-300 rounded-md focus:border-black focus:outline-none transition-colors"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </select>
        </div>
      </div>

      {confirmUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
            <h3 className="text-xl font-semibold mb-2 text-black">Delete user?</h3>
            <p className="text-gray-600 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmUserId(null)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmUserId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuditFor && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[560px] max-h-[80vh] overflow-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-black">User Audit</h3>
              <button
                onClick={() => {
                  setShowAuditFor(null)
                  setAuditLogs(null)
                }}
                className="text-gray-400 hover:text-black text-2xl transition-colors"
              >
                ×
              </button>
            </div>
            {auditLoading ? (
              <div className="text-center py-8 text-gray-600">Loading...</div>
            ) : (
              <div>
                {!auditLogs || auditLogs.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">No audit entries.</div>
                ) : (
                  <ul className="space-y-3">
                    {auditLogs.map((l, idx) => (
                      <li key={idx} className="p-3 border-b border-gray-100 last:border-b-0">
                        <div className="text-sm text-gray-500 mb-1">
                          {new Date(l.timestamp).toLocaleString()} • {l.actor}
                        </div>
                        <div className="font-semibold text-black">{l.action}</div>
                        {l.details && <div className="text-gray-700 mt-1">{l.details}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersList

function RoleBulkAssign({
  roles,
  onAssign,
  onRemove,
}: { roles: string[]; onAssign: (role: string) => void; onRemove: (role: string) => void }) {
  const [role, setRole] = useState("")
  return (
    <div className="flex gap-2 items-center">
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="px-3 py-1.5 border-2 border-gray-300 rounded-md focus:border-black focus:outline-none transition-colors"
      >
        <option value="">Choose role</option>
        {roles.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <button
        disabled={!role}
        onClick={() => role && onAssign(role)}
        className="px-3 py-1.5 border-2 border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Assign
      </button>
      <button
        disabled={!role}
        onClick={() => role && onRemove(role)}
        className="px-3 py-1.5 border-2 border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Remove
      </button>
    </div>
  )
}
