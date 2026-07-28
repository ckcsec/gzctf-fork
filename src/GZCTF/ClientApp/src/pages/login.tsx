import { FC } from 'react'
import { Navigate } from 'react-router'

const LoginRedirect: FC = () => <Navigate to="/account/login" replace />

export default LoginRedirect
