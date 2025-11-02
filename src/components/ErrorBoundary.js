// ✅ src/components/ErrorBoundary.js
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error ไปยังบริการ tracking (optional)
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: "40px 20px",
          background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Prompt', sans-serif",
          color: "white"
        }}>
          <div style={{
            textAlign: "center",
            maxWidth: "500px"
          }}>
            <div style={{ fontSize: "4rem", marginBottom: "20px" }}>⚠️</div>
            <h1 style={{ marginBottom: "15px", fontSize: "1.8rem" }}>
              เกิดข้อผิดพลาดในระบบ
            </h1>
            <p style={{ marginBottom: "25px", lineHeight: "1.5" }}>
              ขออภัยในความไม่สะดวก ระบบเกิดข้อผิดพลาดที่ไม่คาดคิด
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.3)",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backdropFilter: "blur(10px)"
                }}
              >
                🔄 โหลดหน้าใหม่
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                style={{
                  background: "white",
                  color: "#ff6b6b",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                🔧 ลองอีกครั้ง
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details style={{ 
                marginTop: "20px", 
                textAlign: "left",
                background: "rgba(0,0,0,0.1)",
                padding: "15px",
                borderRadius: "8px",
                fontSize: "12px"
              }}>
                <summary>รายละเอียดข้อผิดพลาด (Development)</summary>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;