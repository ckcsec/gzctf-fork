import { FC } from 'react'
import { ChallengePanel } from '@Components/ChallengePanel'
import { WithGameTab } from '@Components/WithGameTab'
import { WithNavBar } from '@Components/WithNavbar'
import { WithRole } from '@Components/WithRole'
import { Role } from '@Api'
import classes from '@Styles/ChallengePanel.module.css'

const Challenges: FC = () => {
  return (
    <WithNavBar width="100%" minWidth={0}>
      <WithRole requiredRole={Role.User}>
        <main className={classes.page}>
          <WithGameTab>
            <ChallengePanel />
          </WithGameTab>
        </main>
      </WithRole>
    </WithNavBar>
  )
}

export default Challenges
