/**
 * ML Backend API client for Simulator
 */

const ML_BACKEND_URL = import.meta.env.VITE_ML_BACKEND_URL || 'http://localhost:8000'

export const mlApi = {
  /**
   * Analyze an image and check if it's flood-related
   */
  async analyzeImage(imageUrl) {
    try {
      const res = await fetch(`${ML_BACKEND_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Analysis failed')
      }
      return res.json()
    } catch (err) {
      console.error('ML API error:', err)
      // Return a default that allows posting (fail-open for now)
      return {
        is_disaster: true,
        disaster_type: 'unknown',
        error: err.message
      }
    }
  }
}

export default mlApi
