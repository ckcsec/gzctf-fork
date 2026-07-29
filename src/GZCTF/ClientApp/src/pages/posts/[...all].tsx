import { FC } from 'react'
import { Navigate } from 'react-router'

const LegacyPostsRedirect: FC = () => <Navigate to="/games" replace />

export default LegacyPostsRedirect
