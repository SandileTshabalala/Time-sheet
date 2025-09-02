import type React from "react"

import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import AdminService from "../../services/admin.service"
import type { CreateUserDto, UpdateUserDto, RoleDto } from "../../services/admin.service"

interface UserFormProps {
  isEdit?: boolean
}

const UserForm = ({ isEdit = false }: UserFormProps) => {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(isEdit)
  const [roles, setRoles] = useState<RoleDto[]>([])
  const [error, setError] = useState<string | null>(null)
  const initialCreateState: CreateUserDto = {
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    roles: [],
  }

  const initialUpdateState: UpdateUserDto = {
    email: "",
    firstName: "",
    lastName: "",
    isActive: true,
    roles: [],
  }

  const [formData, setFormData] = useState<CreateUserDto | UpdateUserDto>({
    ...(isEdit ? initialUpdateState : initialCreateState),
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rolesResponse] = await Promise.all([
          AdminService.getRoles(),
          isEdit && id
            ? AdminService.getUser(id).then((res) => {
                const user = res.data
                setFormData({
                  ...initialUpdateState,
                  email: user.email,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  isActive: user.isActive,
                  roles: user.roles,
                })
              })
            : Promise.resolve(),
        ])

        setRoles(rolesResponse.data)
      } catch (error) {
        console.error("Error loading data:", error)
        const status = (error as any)?.response?.status
        if (status === 401 || status === 403) {
          setError("You are not authorized to view roles")
        } else {
          setError("Failed to load roles. Please try again later.")
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, isEdit])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    // basic validation for roles
    if (!formData.roles || formData.roles.length === 0) {
      setError("Please assign at least one role.")
      return
    }
    try {
      if (isEdit && id) {
        await AdminService.updateUser(id, formData as UpdateUserDto)
      } else {
        await AdminService.createUser(formData as CreateUserDto)
      }
      navigate("/admin")
    } catch (error) {
      console.error("Error saving user:", error)
      const err: any = error
      const data = err?.response?.data
      if (Array.isArray(data) && data.length) {
        setError(data.join("\n"))
      } else if (typeof data === "string") {
        setError(data)
      } else if (err?.response?.status === 400) {
        setError("Bad request. Please check the form fields and try again.")
      } else {
        setError("An unexpected error occurred.")
      }
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-card border border-border rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-2">
              {isEdit ? "Edit User" : "Create New User"}
            </h2>
            <p className="text-muted-foreground">
              {isEdit ? "Update user information and permissions" : "Add a new user to the system"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isEdit && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={(formData as CreateUserDto).email || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent transition-all duration-200"
                  placeholder="Enter email address"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent transition-all duration-200"
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent transition-all duration-200"
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            {!isEdit && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <input
                  type="password"
                  name="password"
                  value={(formData as CreateUserDto).password || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent transition-all duration-200"
                  placeholder="Enter secure password"
                  required={!isEdit}
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
              </div>
            )}

            {isEdit && (
              <div className="flex items-center space-x-3 p-4 bg-muted/20 rounded-lg border border-border">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={(formData as UpdateUserDto).isActive || false}
                  onChange={handleChange}
                  className="w-4 h-4 text-foreground bg-background border-border rounded focus:ring-2 focus:ring-foreground"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-foreground">
                  Active User
                </label>
                <span className="text-xs text-muted-foreground">User can access the system</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">User Role</label>
              <select
                value={(formData.roles && formData.roles[0]) || ""}
                onChange={(e) => {
                  const value = e.target.value
                  setFormData((prev) => ({ ...prev, roles: value ? [value] : [] }))
                }}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent transition-all duration-200"
                required={roles.length > 0}
                disabled={roles.length === 0}
              >
                <option value="" disabled className="text-muted-foreground">
                  {roles.length === 0 ? "Loading roles..." : "Choose a role..."}
                </option>
                {roles.map((role) => (
                  <option key={role.id} value={role.name} className="text-foreground">
                    {role.name} {role.description ? `- ${role.description}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive whitespace-pre-line">{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-border">
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="px-6 py-3 border border-border rounded-lg text-sm font-medium text-foreground bg-background hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 transition-all duration-200"
              >
                {isEdit ? "Update User" : "Create User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UserForm
