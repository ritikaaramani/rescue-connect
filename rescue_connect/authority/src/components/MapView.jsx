import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { supabase } from '../supabaseClient'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom marker icons by severity
const createIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const icons = {
  urgent: createIcon('red'),
  verified: createIcon('orange'),
  pending: createIcon('yellow'),
  default: createIcon('blue')
}

// Component to fit map bounds to markers
function FitBounds({ posts }) {
  const map = useMap()
  
  useEffect(() => {
    if (posts.length > 0) {
      const bounds = posts.map(p => [p.inferred_latitude, p.inferred_longitude])
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [posts, map])
  
  return null
}

export default function MapView() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  
  // Default center (Bangalore, India)
  const defaultCenter = [12.9716, 77.5946]
  const defaultZoom = 11
  
  useEffect(() => {
    fetchGeolocatedPosts()
  }, [filter])
  
  async function fetchGeolocatedPosts() {
    setLoading(true)
    try {
      let query = supabase
        .from('posts')
        .select('*')
        .not('inferred_latitude', 'is', null)
        .not('inferred_longitude', 'is', null)
        .order('created_at', { ascending: false })
      
      // Apply status filter
      if (filter !== 'all') {
        query = query.eq('status', filter)
      }
      
      const { data, error } = await query.limit(100)
      
      if (error) {
        console.error('Error fetching posts:', error)
      } else {
        setPosts(data || [])
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err)
    }
    setLoading(false)
  }
  
  function getIcon(status) {
    return icons[status] || icons.default
  }
  
  function formatDate(dateStr) {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleString()
  }
  
  function getSeverityBadge(severity) {
    const colors = {
      critical: 'bg-red-600',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    }
    return colors[severity?.toLowerCase()] || 'bg-gray-500'
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header with filters */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">🗺️ Disaster Map</h2>
          <p className="text-gray-400 text-sm">
            {loading ? 'Loading...' : `${posts.length} geolocated reports`}
          </p>
        </div>
        
        <div className="flex gap-2">
          {['all', 'urgent', 'verified', 'pending'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
          <button
            onClick={fetchGeolocatedPosts}
            className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600"
          >
            🔄 Refresh
          </button>
        </div>
      </div>
      
      {/* Map container */}
      <div className="flex-1 rounded-xl overflow-hidden border border-gray-700" style={{ minHeight: '500px' }}>
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {posts.length > 0 && <FitBounds posts={posts} />}
          
          {posts.map(post => (
            <Marker
              key={post.id}
              position={[post.inferred_latitude, post.inferred_longitude]}
              icon={getIcon(post.status)}
            >
              <Popup>
                <div className="max-w-xs">
                  {/* Image */}
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt="Disaster"
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />
                  )}
                  
                  {/* Disaster type and severity */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-gray-800">
                      {post.disaster_type || 'Unknown'}
                    </span>
                    {post.severity && (
                      <span className={`px-2 py-0.5 rounded text-xs text-white ${getSeverityBadge(post.severity)}`}>
                        {post.severity}
                      </span>
                    )}
                  </div>
                  
                  {/* Caption */}
                  {post.caption && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {post.caption}
                    </p>
                  )}
                  
                  {/* OCR Text */}
                  {post.ocr_text && (
                    <p className="text-xs text-gray-500 mb-2 italic">
                      📝 OCR: {post.ocr_text.substring(0, 50)}...
                    </p>
                  )}
                  
                  {/* Location confidence */}
                  {post.location_confidence && (
                    <p className="text-xs text-gray-500 mb-1">
                      📍 Confidence: {(post.location_confidence * 100).toFixed(0)}%
                      {post.location_method && ` (${post.location_method})`}
                    </p>
                  )}
                  
                  {/* Timestamp */}
                  <p className="text-xs text-gray-400">
                    {formatDate(post.created_at)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-sm text-gray-400">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500"></span> Urgent
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-orange-500"></span> Verified
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Pending
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span> Other
        </div>
      </div>
    </div>
  )
}
