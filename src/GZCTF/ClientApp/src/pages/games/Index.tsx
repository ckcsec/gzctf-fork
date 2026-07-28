import {
  Badge,
  Button,
  Group,
  Pagination,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core'
import { mdiAccountPlusOutline, mdiCalendarClock, mdiChartTimelineVariant, mdiFlagCheckered, mdiRadar } from '@mdi/js'
import { Icon } from '@mdi/react'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { GameCard, GameColorMap } from '@Components/GameCard'
import { WithNavBar } from '@Components/WithNavbar'
import { GanttTimeLine } from '@Components/charts/GanttTimeline'
import { getGameStatus, toLimitTag, useRecentGames } from '@Hooks/useGame'
import { usePageTitle } from '@Hooks/usePageTitle'
import api from '@Api'
import ganttClasses from '@Styles/GanttTimeline.module.css'
import classes from '@Styles/Games.module.css'

const ITEM_PER_PAGE = 12

const Games: FC = () => {
  const { t } = useTranslation()

  const { recentGames } = useRecentGames()
  const [activePage, setPage] = useState(1)

  const { data: games } = api.game.useGameGames(
    { count: ITEM_PER_PAGE, skip: (activePage - 1) * ITEM_PER_PAGE },
    {
      refreshInterval: 5 * 60 * 1000,
    }
  )

  usePageTitle(t('game.title.index'))

  const theme = useMantineTheme()
  const { colorScheme } = useMantineColorScheme()

  const recents =
    recentGames?.map((game) => {
      const { startTime, endTime, status } = getGameStatus(game)
      const color = GameColorMap.get(status) ?? 'gray'
      const colorHex = theme.colors[color][colorScheme === 'dark' ? 9 : 4]

      return {
        id: game.id,
        textTitle: game.title ?? '',
        color: colorHex,
        title: (
          <UnstyledButton w="100%" component={Link} to={`/games/${game.id}`}>
            <Group gap="sm" className={ganttClasses.gameBox}>
              <Text size="sm" className={ganttClasses.title}>
                {game.title}
              </Text>
              <Badge size="sm" color={color}>
              {toLimitTag(t, game.limit, game.participationMode)}
              </Badge>
            </Group>
          </UnstyledButton>
        ),
        start: startTime,
        end: endTime,
      }
    }) ?? []

  const pageCount = Math.ceil((games?.total ?? 0) / ITEM_PER_PAGE)

  return (
    <WithNavBar width="100%" minWidth={0} withFooter>
      <main className={classes.page}>
        <section className={classes.hero}>
          <Stack gap="md" className={classes.heroCopy}>
            <Text className={classes.kicker}>网络安全 · 团队夺旗竞赛</Text>
            <Title className={classes.heroTitle}>攻防赛事中心</Title>
            <Text className={classes.heroText}>
              选择对应比赛进入赛场，按规则完成组队报名，挑战 Web、Pwn、Crypto、Reverse 等多类别赛题。
            </Text>
            <Group className={classes.heroActions} gap="sm">
              <Button component={Link} to="/games" leftSection={<Icon path={mdiFlagCheckered} size={0.9} />}>
                查看赛事
              </Button>
              <Button
                component={Link}
                to="/account/register"
                variant="outline"
                leftSection={<Icon path={mdiAccountPlusOutline} size={0.9} />}
              >
                注册账号
              </Button>
            </Group>
          </Stack>
          <div className={classes.heroStats}>
            <div className={classes.stat}>
              <strong>{games?.total ?? 0}</strong>
              <span>赛事总数</span>
            </div>
            <div className={classes.stat}>
              <strong>{recentGames?.length ?? 0}</strong>
              <span>近期排期</span>
            </div>
            <div className={classes.stat}>
              <strong>{recents.length}</strong>
              <span>时间线赛事</span>
            </div>
            <div className={classes.stat}>
              <strong>{ITEM_PER_PAGE}</strong>
              <span>每页展示</span>
            </div>
          </div>
        </section>

        <section className={classes.timelinePanel}>
          <div className={classes.sectionHead}>
            <div>
              <h2>
                <Icon path={mdiCalendarClock} size={0.95} />
                赛事时间线
              </h2>
              <p>查看最近比赛开始和结束时间，快速定位当前赛程。</p>
            </div>
            <Icon path={mdiChartTimelineVariant} size={1.25} />
          </div>
          <GanttTimeLine items={recents} />
        </section>

        <section className={classes.listPanel}>
          <div className={classes.sectionHead}>
            <div>
              <h2>
                <Icon path={mdiRadar} size={0.95} />
                赛事列表
              </h2>
              <p>进入比赛后可浏览题目列表、启动动态靶机并提交 flag，实时查看排名变化。</p>
            </div>
          </div>
          <Stack mih="calc(100vh - 78px)" justify="space-between">
            <SimpleGrid
              className={classes.grid}
              cols={{ base: 1, sm: 1, md: 2, lg: 3, xl: 3, w18: 4, w24: 5 }}
              spacing="lg"
              verticalSpacing="lg"
            >
              {games && games.data.map((g) => <GameCard key={g.id} game={g} />)}
            </SimpleGrid>
            <Pagination.Root
              total={pageCount}
              siblings={3}
              value={activePage}
              onChange={setPage}
              className={classes.pagination}
            >
              <Group gap={5} justify="flex-end">
                <Pagination.First />
                <Pagination.Previous />
                <Pagination.Items />
                <Pagination.Next />
                <Pagination.Last />
              </Group>
            </Pagination.Root>
          </Stack>
        </section>
      </main>
    </WithNavBar>
  )
}

export default Games
