import { FC } from 'react'
import { Navigate } from 'react-router'

const RegisterRedirect: FC = () => <Navigate to="/account/register" replace />

export default RegisterRedirect
