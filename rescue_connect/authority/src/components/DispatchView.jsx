import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Truck, Check, Save } from 'lucide-react'
import mlApi from '../lib/mlApi'

export default function DispatchView() {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(false)

    // Local state for edits before saving
    const [edits, setEdits] = useState({})

    useEffect(() => {
        fetchDispatchablePosts()
    }, [])

    async function fetchDispatchablePosts() {
        setLoading(true)
        try {
            // Fetch urgent and verified posts
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .in('status', ['urgent', 'verified'])
                .neq('status', 'rejected')
                .order('created_at', { ascending: false })

            if (error) throw error
            setPosts(data || [])
        } catch (err) {
            console.error('Error fetching dispatch posts:', err)
        }
        setLoading(false)
    }

    const handleEditChange = (id, field, value) => {
        setEdits(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }))
    }

    const saveDispatchUpdate = async (post) => {
        const changes = edits[post.id]
        if (!changes) return

        try {
            const newStatus = changes.dispatch_status || post.dispatch_status || 'pending'
            const newTeam = changes.assigned_team !== undefined ? changes.assigned_team : post.assigned_team

            await mlApi.updateDispatch(post.id, newStatus, newTeam)

            // Clear edits and refresh
            setEdits(prev => {
                const next = { ...prev }
                delete next[post.id]
                return next
            })
            fetchDispatchablePosts()
            alert('Dispatch updated successfully!')
        } catch (err) {
            alert('Failed to update: ' + err.message)
        }
    }

    const getDispatchColor = (status) => {
        switch (status) {
            case 'dispatched': return 'bg-blue-100 text-blue-800'
            case 'on_scene': return 'bg-yellow-100 text-yellow-800'
            case 'resolved': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Truck className="w-8 h-8 text-blue-600" />
                        Dispatch Operations
                    </h1>
                    <p className="text-gray-500">Assign teams and track response status.</p>
                </div>
                <button
                    onClick={fetchDispatchablePosts}
                    className="btn btn-secondary"
                >
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading operations...</div>
            ) : (
                <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disaster Info</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Team</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {posts.map((post) => {
                                const draft = edits[post.id] || {}
                                const currentDispatchStatus = draft.dispatch_status || post.dispatch_status || 'pending'
                                const currentTeam = draft.assigned_team !== undefined ? draft.assigned_team : (post.assigned_team || '')
                                const hasChanges = Object.keys(draft).length > 0

                                return (
                                    <tr key={post.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                {post.image_url && (
                                                    <img className="h-10 w-10 rounded object-cover mr-3" src={post.image_url} alt="" />
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 capitalize">{post.disaster_type || 'Unknown'}</div>
                                                    <div className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate">
                                                {post.extracted_locations?.[0] || 'Unknown Location'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {post.inferred_latitude ? 'Has Coordinates' : 'No GPS'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${post.status === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                {post.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={currentDispatchStatus}
                                                onChange={(e) => handleEditChange(post.id, 'dispatch_status', e.target.value)}
                                                className={`block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md capitalize ${getDispatchColor(currentDispatchStatus)}`}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="dispatched">Dispatched</option>
                                                <option value="on_scene">On Scene</option>
                                                <option value="resolved">Resolved</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="text"
                                                value={currentTeam}
                                                onChange={(e) => handleEditChange(post.id, 'assigned_team', e.target.value)}
                                                placeholder="Assign Team..."
                                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {hasChanges && (
                                                <button
                                                    onClick={() => saveDispatchUpdate(post)}
                                                    className="text-blue-600 hover:text-blue-900 flex items-center gap-1 bg-blue-50 px-3 py-1 rounded"
                                                >
                                                    <Save className="w-4 h-4" /> Save
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
