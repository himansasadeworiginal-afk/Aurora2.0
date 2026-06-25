import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0a0a1a', color: '#e2e8f0', fontFamily: 'sans-serif', padding: 40, textAlign: 'center',
        }}>
          <div>
            <h2 style={{ color: '#ff6b9d', fontWeight: 300 }}>3D Render Error</h2>
            <p style={{ color: '#94a3b8', maxWidth: 500, lineHeight: 1.6, margin: '12px 0' }}>
              {this.state.error.message}
            </p>
            <button onClick={() => window.location.reload()} style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#e2e8f0', padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
            }}>
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
