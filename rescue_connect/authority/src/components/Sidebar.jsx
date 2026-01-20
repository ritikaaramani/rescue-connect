import { LayoutDashboard, FileText, MapPin, Settings, LogOut } from 'lucide-react'

export default function Sidebar({ currentPage, onNavigate, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'posts', label: 'All Reports', icon: FileText },
    { id: 'map', label: 'Map View', icon: MapPin },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="sidebar">
      <div className="mb-8">
        <h1 className="text-xl font-bold">🚨 RescueConnect</h1>
        <p className="text-sm text-gray-400 mt-1">Authority Dashboard</p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto pt-8">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded text-gray-300 hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
