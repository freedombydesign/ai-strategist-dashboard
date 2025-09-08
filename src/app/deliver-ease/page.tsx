'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

interface Project {
  id: string
  name: string
  client: string
  status: 'planning' | 'in-progress' | 'review' | 'delivered'
  deadline: string
  deliverables: Deliverable[]
  created_at: string
}

interface Deliverable {
  id: string
  name: string
  description: string
  status: 'pending' | 'in-progress' | 'completed'
  due_date: string
}

interface Client {
  id: string
  name: string
  email: string
  company: string
}

export default function DeliverEasePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('projects')
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [showAddProject, setShowAddProject] = useState(false)
  const [showAddClient, setShowAddClient] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load projects and clients from localStorage (in real app, this would be from API)
  useEffect(() => {
    const savedProjects = localStorage.getItem(`deliverease_projects_${user?.id}`)
    const savedClients = localStorage.getItem(`deliverease_clients_${user?.id}`)
    
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects))
    }
    if (savedClients) {
      setClients(JSON.parse(savedClients))
    }
    setLoading(false)
  }, [user?.id])

  const saveProjects = (newProjects: Project[]) => {
    setProjects(newProjects)
    localStorage.setItem(`deliverease_projects_${user?.id}`, JSON.stringify(newProjects))
  }

  const saveClients = (newClients: Client[]) => {
    setClients(newClients)
    localStorage.setItem(`deliverease_clients_${user?.id}`, JSON.stringify(newClients))
  }

  const addProject = (projectData: Omit<Project, 'id' | 'created_at'>) => {
    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    }
    saveProjects([...projects, newProject])
    setShowAddProject(false)
  }

  const addClient = (clientData: Omit<Client, 'id'>) => {
    const newClient: Client = {
      ...clientData,
      id: Date.now().toString()
    }
    saveClients([...clients, newClient])
    setShowAddClient(false)
  }

  const updateProjectStatus = (projectId: string, status: Project['status']) => {
    const updatedProjects = projects.map(p => 
      p.id === projectId ? { ...p, status } : p
    )
    saveProjects(updatedProjects)
  }

  const addDeliverable = (projectId: string, deliverable: Omit<Deliverable, 'id'>) => {
    const updatedProjects = projects.map(p => 
      p.id === projectId ? {
        ...p,
        deliverables: [...p.deliverables, { ...deliverable, id: Date.now().toString() }]
      } : p
    )
    saveProjects(updatedProjects)
  }

  const updateDeliverableStatus = (projectId: string, deliverableId: string, status: Deliverable['status']) => {
    const updatedProjects = projects.map(p => 
      p.id === projectId ? {
        ...p,
        deliverables: p.deliverables.map(d => 
          d.id === deliverableId ? { ...d, status } : d
        )
      } : p
    )
    saveProjects(updatedProjects)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading DeliverEase...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/freedom-suite"
                className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-2"
              >
                ← Back to Systems
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">DeliverEase</h1>
                <p className="text-gray-600">Client Delivery Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAddClient(true)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                + Add Client
              </button>
              <button
                onClick={() => setShowAddProject(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                + New Project
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500">Active Projects</h3>
            <p className="text-2xl font-semibold text-gray-900 mt-2">{projects.filter(p => p.status !== 'delivered').length}</p>
            <p className="text-sm text-gray-600 mt-1">Currently active</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Clients</h3>
            <p className="text-2xl font-semibold text-gray-900 mt-2">{clients.length}</p>
            <p className="text-sm text-gray-600 mt-1">Registered clients</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500">Completed Projects</h3>
            <p className="text-2xl font-semibold text-gray-900 mt-2">{projects.filter(p => p.status === 'delivered').length}</p>
            <p className="text-sm text-green-600 mt-1">Successfully delivered</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Deliverables</h3>
            <p className="text-2xl font-semibold text-gray-900 mt-2">{projects.reduce((acc, p) => acc + p.deliverables.length, 0)}</p>
            <p className="text-sm text-gray-600 mt-1">Across all projects</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'projects'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Projects ({projects.length})
              </button>
              <button
                onClick={() => setActiveTab('clients')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'clients'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Clients ({clients.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'projects' && (
              <ProjectsTab 
                projects={projects} 
                clients={clients}
                onUpdateStatus={updateProjectStatus}
                onAddDeliverable={addDeliverable}
                onUpdateDeliverableStatus={updateDeliverableStatus}
              />
            )}
            {activeTab === 'clients' && (
              <ClientsTab clients={clients} />
            )}
          </div>
        </div>
      </div>

      {/* Add Project Modal */}
      {showAddProject && (
        <AddProjectModal
          clients={clients}
          onClose={() => setShowAddProject(false)}
          onAdd={addProject}
        />
      )}

      {/* Add Client Modal */}
      {showAddClient && (
        <AddClientModal
          onClose={() => setShowAddClient(false)}
          onAdd={addClient}
        />
      )}
    </div>
  )
}

function ProjectsTab({ 
  projects, 
  clients, 
  onUpdateStatus, 
  onAddDeliverable, 
  onUpdateDeliverableStatus 
}: {
  projects: Project[]
  clients: Client[]
  onUpdateStatus: (id: string, status: Project['status']) => void
  onAddDeliverable: (projectId: string, deliverable: Omit<Deliverable, 'id'>) => void
  onUpdateDeliverableStatus: (projectId: string, deliverableId: string, status: Deliverable['status']) => void
}) {
  const [showAddDeliverable, setShowAddDeliverable] = useState<string | null>(null)

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
        <p className="text-gray-500 mb-4">Create your first project to start managing client deliverables</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {projects.map(project => (
        <div key={project.id} className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
              <p className="text-gray-600">Client: {project.client}</p>
              <p className="text-sm text-gray-500">Deadline: {new Date(project.deadline).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={project.status}
                onChange={(e) => onUpdateStatus(project.id, e.target.value as Project['status'])}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="planning">Planning</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="delivered">Delivered</option>
              </select>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                project.status === 'delivered' ? 'bg-green-100 text-green-800' :
                project.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                project.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {project.status}
              </span>
            </div>
          </div>

          {/* Deliverables */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Deliverables ({project.deliverables.length})</h4>
              <button
                onClick={() => setShowAddDeliverable(project.id)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Add Deliverable
              </button>
            </div>
            
            {project.deliverables.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No deliverables yet</p>
            ) : (
              <div className="space-y-2">
                {project.deliverables.map(deliverable => (
                  <div key={deliverable.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium text-gray-900">{deliverable.name}</p>
                      <p className="text-sm text-gray-600">{deliverable.description}</p>
                      <p className="text-xs text-gray-500">Due: {new Date(deliverable.due_date).toLocaleDateString()}</p>
                    </div>
                    <select
                      value={deliverable.status}
                      onChange={(e) => onUpdateDeliverableStatus(project.id, deliverable.id, e.target.value as Deliverable['status'])}
                      className="px-2 py-1 border border-gray-300 rounded text-xs"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {showAddDeliverable && (
        <AddDeliverableModal
          projectId={showAddDeliverable}
          onClose={() => setShowAddDeliverable(null)}
          onAdd={onAddDeliverable}
        />
      )}
    </div>
  )
}

function ClientsTab({ clients }: { clients: Client[] }) {
  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">👥</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
        <p className="text-gray-500 mb-4">Add your first client to start managing projects</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clients.map(client => (
        <div key={client.id} className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900">{client.name}</h3>
          <p className="text-gray-600">{client.company}</p>
          <p className="text-sm text-gray-500">{client.email}</p>
        </div>
      ))}
    </div>
  )
}

// Modal Components
function AddProjectModal({ 
  clients, 
  onClose, 
  onAdd 
}: {
  clients: Client[]
  onClose: () => void
  onAdd: (project: Omit<Project, 'id' | 'created_at'>) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    deadline: '',
    status: 'planning' as Project['status']
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.client && formData.deadline) {
      onAdd({
        ...formData,
        deliverables: []
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Add New Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select
              value={formData.client}
              onChange={(e) => setFormData({...formData, client: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select a client</option>
              {clients.map(client => (
                <option key={client.id} value={client.name}>{client.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddClientModal({ 
  onClose, 
  onAdd 
}: {
  onClose: () => void
  onAdd: (client: Omit<Client, 'id'>) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.email) {
      onAdd(formData)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Add New Client</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({...formData, company: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Client
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddDeliverableModal({
  projectId,
  onClose,
  onAdd
}: {
  projectId: string
  onClose: () => void
  onAdd: (projectId: string, deliverable: Omit<Deliverable, 'id'>) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    due_date: '',
    status: 'pending' as Deliverable['status']
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.due_date) {
      onAdd(projectId, formData)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Add Deliverable</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deliverable Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Deliverable
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}