import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { RefreshCw, MapPin, Clock, User, CheckCircle, XCircle, Zap, Brain, AlertTriangle } from 'lucide-react'
import mlApi from '../lib/mlApi'

export default function PostsTable() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState({}) // Track processing state per post
  const [batchProcessing, setBatchProcessing] = useState(false)
  const [filter, setFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  async function fetchPosts() {
    setLoading(true)
    try {
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      // Filter by status
      if (filter === 'manual_review') {
        query = query.eq('status', 'rejected')
      } else if (filter === 'urgent') {
        query = query.eq('status', 'urgent')
      } else if (filter === 'unprocessed') {
        query = query.eq('ai_processed', false)
      } else if (filter === 'filtered') {
        query = query.neq('status', 'rejected')
      } else if (filter === 'dispatched') {
        query = query.in('dispatch_status', ['assigned', 'in-progress'])
      } else if (filter === 'resolved') {
        query = query.eq('dispatch_status', 'resolved')
      } else if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      // Apply date filters
      if (startDate) {
        query = query.gte('created_at', startDate + 'T00:00:00')
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59')
      }

      // Note: Flood filtering is disabled temporarily
      // When OpenAI quota is available, uncomment this to filter non-flood images:
      // if (filter !== 'unprocessed' && filter !== 'all' && filter !== 'manual_review') {
      //   query = query.or('ai_processed.eq.false,disaster_type.eq.flood,disaster_type.is.null')
      // }

      const { data, error } = await query
      if (error) throw error
      setPosts(data ?? [])
    } catch (err) {
      console.error('Error fetching posts', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Default to 'filtered' instead of 'all'
    if (filter === 'all') setFilter('filtered')
    else fetchPosts()
  }, [filter])

  async function updateStatus(id, newStatus) {
    try {
      // Use ML backend API to bypass RLS restrictions
      await mlApi.updateStatus(id, newStatus)
      fetchPosts()
    } catch (err) {
      console.error('Error updating status', err)
      alert('Failed to update status: ' + err.message)
    }
  }

  async function processWithAI(postId) {
    setProcessing(prev => ({ ...prev, [postId]: true }))
    try {
      const result = await mlApi.processPost(postId)
      console.log('AI Processing result:', result)
      fetchPosts() // Refresh to show updated data
    } catch (err) {
      console.error('AI Processing failed:', err)
      alert('AI Processing failed: ' + err.message)
    } finally {
      setProcessing(prev => ({ ...prev, [postId]: false }))
    }
  }

  async function processAllWithAI() {
    setBatchProcessing(true)
    try {
      const result = await mlApi.processAllPending()
      console.log('Batch processing result:', result)
      alert(`Processed ${result.total_processed} posts`)
      fetchPosts()
    } catch (err) {
      console.error('Batch processing failed:', err)
      alert('Batch processing failed: ' + err.message)
    } finally {
      setBatchProcessing(false)
    }
  }

  function getBadgeClass(status) {
    switch (status) {
      case 'verified':
        return 'badge-verified'
      case 'rejected':
        return 'badge-rejected'
      case 'urgent':
        return 'bg-red-600 text-white'
      default:
        return 'badge-pending'
    }
  }

  function getSeverityColor(severity) {
    switch (severity) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-500'
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Disaster Reports</h1>
        <div className="flex gap-2">
          <button
            onClick={processAllWithAI}
            disabled={batchProcessing}
            className="px-4 py-2 bg-purple-600 text-white rounded flex items-center gap-2 hover:bg-purple-700 disabled:opacity-60"
          >
            <Brain className={`w-4 h-4 ${batchProcessing ? 'animate-pulse' : ''}`} />
            {batchProcessing ? 'Processing...' : 'AI Process All Pending'}
          </button>
          <button
            onClick={fetchPosts}
            disabled={loading}
            className="btn btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { id: 'filtered', label: 'Filtered Reports' },
          { id: 'urgent', label: 'Urgent' },
          { id: 'verified', label: 'Verified' },
          { id: 'pending', label: 'Pending' },
          { id: 'unprocessed', label: 'Unprocessed' },
          { id: 'dispatched', label: 'Dispatched' },
          { id: 'resolved', label: 'Resolved' },
          { id: 'manual_review', label: 'Manual Review' }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1 rounded text-sm font-medium ${filter === f.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Date Filter */}
      <div className="flex gap-4 mb-4 items-center bg-gray-50 p-3 rounded-lg">
        <span className="text-sm font-medium text-gray-600">Date Filter:</span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          />
        </div>
        <button
          onClick={() => { setStartDate(''); setEndDate(''); }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
        <button
          onClick={fetchPosts}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Apply
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">{posts.length}</div>
          <div className="text-sm text-gray-500">Visible Posts</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-yellow-600">
            {posts.filter((p) => p.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-red-600">
            {posts.filter((p) => p.status === 'urgent').length}
          </div>
          <div className="text-sm text-gray-500">Urgent</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">
            {posts.filter((p) => p.status === 'verified').length}
          </div>
          <div className="text-sm text-gray-500">Verified</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-gray-600">
            {posts.filter((p) => p.status === 'rejected').length}
          </div>
          <div className="text-sm text-gray-500">Manual Review</div>
        </div>
      </div>

      {/* Loading */}
      {loading && <div className="text-center text-gray-500 py-8">Loading posts...</div>}

      {/* Posts Grid */}
      {!loading && posts.length === 0 && (
        <div className="text-center text-gray-500 py-8">No posts found</div>
      )}

      <div className="grid gap-4">
        {posts.map((post) => (
          <div key={post.id} className={`card flex gap-4 ${post.status === 'urgent' ? 'border-2 border-red-500' : ''}`}>
            {/* Image */}
            {post.image_url && (
              <div className="flex-shrink-0">
                <img
                  src={post.image_url}
                  alt="Report"
                  className="w-32 h-32 object-cover rounded"
                />
              </div>
            )}

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className={`badge ${getBadgeClass(post.status)}`}>
                    {post.status}
                  </span>
                  {post.disaster_type && post.disaster_type !== 'unknown' && (
                    <span className="badge bg-blue-100 text-blue-800">
                      {post.disaster_type}
                    </span>
                  )}
                  {post.severity && (
                    <span className={`text-xs font-medium ${getSeverityColor(post.severity)}`}>
                      {post.severity}
                    </span>
                  )}
                  {post.urgency_score > 0 && (
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      Urgency: {post.urgency_score}/10
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(post.created_at).toLocaleString()}
                </div>
              </div>

              <p className="mt-2 text-gray-700">{post.caption || 'No caption'}</p>

              {/* Resolution Notes - show when resolved */}
              {post.dispatch_status === 'resolved' && post.resolution_notes && (
                <div className="mt-2 p-2 bg-green-50 rounded text-sm border border-green-200">
                  <div className="flex items-center gap-1 text-green-700 font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Resolution Notes
                  </div>
                  <p className="text-gray-700 mt-1">{post.resolution_notes}</p>
                </div>
              )}

              {/* AI Analysis Results */}
              {post.ai_processed && (
                <div className="mt-2 p-2 bg-purple-50 rounded text-sm">
                  <div className="flex items-center gap-1 text-purple-700 font-medium">
                    <Brain className="w-3 h-3" />
                    AI Analysis
                  </div>
                  {post.ai_description && (
                    <p className="text-gray-600 mt-1">{post.ai_description}</p>
                  )}
                  {post.detected_elements && post.detected_elements.length > 0 && (
                    <p className="text-gray-500 text-xs mt-1">
                      Detected: {post.detected_elements.join(', ')}
                    </p>
                  )}
                  {post.location_hints && (
                    <p className="text-gray-500 text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {post.location_hints}
                    </p>
                  )}

                  {/* OCR Extracted Text */}
                  {post.ocr_text && (
                    <div className="mt-2 p-2 bg-blue-50 rounded">
                      <span className="text-xs font-medium text-blue-700">📝 OCR Text:</span>
                      <p className="text-gray-600 text-xs mt-1">{post.ocr_text}</p>
                    </div>
                  )}

                  {/* Geolocation Info */}
                  {post.inferred_latitude && post.inferred_longitude && (
                    <div className="mt-2 p-2 bg-green-50 rounded">
                      <span className="text-xs font-medium text-green-700">📍 Inferred Location:</span>
                      <div className="text-xs text-gray-600 mt-1">
                        <p>Coordinates: ({post.inferred_latitude.toFixed(4)}, {post.inferred_longitude.toFixed(4)})</p>
                        {post.location_confidence && (
                          <p>Confidence: {(post.location_confidence * 100).toFixed(0)}%</p>
                        )}
                        {post.location_method && (
                          <p>Method: {post.location_method}</p>
                        )}
                        {post.scene_type && (
                          <p>Scene: {post.scene_type}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Extracted Locations */}
                  {post.extracted_locations && post.extracted_locations.length > 0 && (
                    <p className="text-gray-500 text-xs mt-1">
                      Locations mentioned: {post.extracted_locations.join(', ')}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <User className="w-3 h-3" />
                {post.user_id ?? 'Anonymous'}
              </div>

              {/* Actions */}
              <div className="mt-3 flex flex-wrap gap-2">
                {/* AI Process Buttons */}
                {!post.ai_processed && (
                  <>
                    <button
                      onClick={() => processWithAI(post.id)}
                      disabled={processing[post.id]}
                      className="px-3 py-1 bg-purple-600 text-white rounded text-sm flex items-center gap-1 hover:bg-purple-700 disabled:opacity-60"
                    >
                      <Zap className={`w-4 h-4 ${processing[post.id] ? 'animate-pulse' : ''}`} />
                      {processing[post.id] ? 'Analyzing...' : 'AI Analyze'}
                    </button>
                    <button
                      onClick={async () => {
                        setProcessing(prev => ({ ...prev, [post.id]: true }))
                        try {
                          await mlApi.processPostFull(post.id)
                          fetchPosts()
                        } catch (err) {
                          alert('Full processing failed: ' + err.message)
                        }
                        setProcessing(prev => ({ ...prev, [post.id]: false }))
                      }}
                      disabled={processing[post.id]}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm flex items-center gap-1 hover:bg-green-700 disabled:opacity-60"
                    >
                      <MapPin className={`w-4 h-4 ${processing[post.id] ? 'animate-pulse' : ''}`} />
                      {processing[post.id] ? 'Processing...' : 'Full AI + Geo'}
                    </button>
                  </>
                )}

                {post.status !== 'verified' && (
                  <button
                    onClick={() => updateStatus(post.id, 'verified')}
                    className="btn btn-success text-sm flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Verify
                  </button>
                )}
                {post.status !== 'rejected' && (
                  <button
                    onClick={() => updateStatus(post.id, 'rejected')}
                    className="btn btn-danger text-sm flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                )}
                {post.status !== 'pending' && (
                  <button
                    onClick={async () => {
                      await updateStatus(post.id, 'pending')
                      await mlApi.resetAI(post.id)
                      fetchPosts()
                    }}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                  >
                    Reset to Pending
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
