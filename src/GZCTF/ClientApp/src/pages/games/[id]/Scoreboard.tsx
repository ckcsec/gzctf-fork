import { Stack } from '@mantine/core'
import { FC, useState } from 'react'
import { useParams } from 'react-router'
import { CompetitionDashboard } from '@Components/CompetitionDashboard'
import { ScoreboardTable } from '@Components/ScoreboardTable'
import { TeamRank } from '@Components/TeamRank'
import { MobileScoreboardTable } from '@Components/mobile/ScoreboardTable'
import { useIsMobile } from '@Utils/ThemeOverride'
import { useGame, useGameScoreboard, useGameTeamInfo } from '@Hooks/useGame'
import { usePageTitle } from '@Hooks/usePageTitle'

const Scoreboard: FC = () => {
  const { id } = useParams()
  const numId = parseInt(id ?? '-1')
  const { teamInfo, error } = useGameTeamInfo(numId)
  const { game } = useGame(numId)
  const { scoreboard } = useGameScoreboard(numId)

  const [divisionId, setDivisionId] = useState<number | null>(null)
  const isMobile = useIsMobile(1080)
  const isVertical = useIsMobile()

  usePageTitle(game?.title)

  if (!isMobile) {
    return <CompetitionDashboard scoreboard={scoreboard} title={game?.title} start={game?.start} />
  }

  return (
    <Stack p="md" mih="100vh">
      {teamInfo && !error && <TeamRank />}
      {isVertical ? (
        <MobileScoreboardTable divisionId={divisionId} setDivisionId={setDivisionId} />
      ) : (
        <ScoreboardTable divisionId={divisionId} setDivisionId={setDivisionId} />
      )}
    </Stack>
  )
}

export default Scoreboard
