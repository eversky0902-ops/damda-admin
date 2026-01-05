import { Navigate } from 'react-router-dom'

// 설정 메인 페이지 - 서비스 설정으로 리다이렉트
export function SettingsPage() {
  return <Navigate to="/settings/service" replace />
}
