import { Avatar, Button, Center, Drawer, Group, Progress, ScrollArea, Skeleton, Stack, Switch, Text, TextInput } from '@mantine/core'
import { useClipboard, useDisclosure, useLocalStorage } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import {
  mdiBullhornOutline,
  mdiCheck,
  mdiFileUploadOutline,
  mdiFlagOutline,
  mdiKeyOutline,
  mdiMagnify,
  mdiPuzzle,
  mdiSortVariant,
} from '@mdi/js'
import { Icon } from '@mdi/react'
import dayjs from 'dayjs'
import { CSSProperties, FC, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useParams } from 'react-router'
import { ChallengeRow } from '@Components/ChallengeRow'
import { Empty } from '@Components/Empty'
import { GameChallengeModal } from '@Components/GameChallengeModal'
import { GameNoticePanel } from '@Components/GameNoticePanel'
import { WriteupSubmitModal } from '@Components/WriteupSubmitModal'
import { useChallengeCategoryLabelMap, SubmissionTypeIconMap } from '@Utils/Shared'
import { useGame, useGameTeamInfo } from '@Hooks/useGame'
import { ChallengeInfo, ChallengeCategory, SubmissionType } from '@Api'
import classes from '@Styles/ChallengePanel.module.css'

type SortKey = 'default' | 'score' | 'solved'

const SORT_LABEL: Record<SortKey, string> = {
  default: '默认排序',
  score: '按分值',
  solved: '按解出数',
}

const SORT_CYCLE: SortKey[] = ['default', 'score', 'solved']

export const ChallengePanel: FC = () => {
  const { hash } = useLocation()
  const { id } = useParams()
  const numId = parseInt(id ?? '-1')

  const { teamInfo } = useGameTeamInfo(numId)
  const challenges = teamInfo?.challenges
  const rank = teamInfo?.rank

  const { game } = useGame(numId)

  const categories = Object.keys(challenges ?? {})
  const [activeTab, setActiveTab] = useState<ChallengeCategory | 'All'>('All')
  const [keyword, setKeyword] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('default')
  const [hideSolved, setHideSolved] = useLocalStorage({
    key: 'hide-solved',
    defaultValue: false,
    getInitialValueInEffect: false,
  })

  const allChallenges = useMemo(() => Object.values(challenges ?? {}).flat(), [challenges])

  // 已解出题目 id 集合，用于列表状态与分类进度
  const solvedIds = useMemo(() => {
    const set = new Set<number>()
    rank?.solvedChallenges?.forEach((c) => {
      if (c.type !== SubmissionType.Unaccepted && c.id !== undefined && c.id !== null) set.add(c.id)
    })
    return set
  }, [rank?.solvedChallenges])

  const currentChallenges = useMemo(() => {
    if (!challenges) return undefined

    const source = activeTab !== 'All' ? (challenges[activeTab] ?? []) : allChallenges
    const kw = keyword.trim().toLowerCase()

    const list = source.filter((chal) => {
      if (hideSolved && solvedIds.has(chal.id)) return false
      if (kw && !chal.title?.toLowerCase().includes(kw)) return false
      return true
    })

    if (sortKey === 'score') return [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    if (sortKey === 'solved') return [...list].sort((a, b) => (b.solved ?? 0) - (a.solved ?? 0))
    return list
  }, [challenges, activeTab, allChallenges, hideSolved, solvedIds, keyword, sortKey])

  const [challenge, setChallenge] = useState<ChallengeInfo | null>(null)
  const [detailOpened, setDetailOpened] = useState(false)
  const { iconMap, colorMap } = SubmissionTypeIconMap(0.8)
  const [writeupSubmitOpened, setWriteupSubmitOpened] = useState(false)
  const [noticeOpened, noticeHandlers] = useDisclosure(false)
  const challengeCategoryLabelMap = useChallengeCategoryLabelMap()
  const clipboard = useClipboard()
  const { t } = useTranslation()

  const totalCount = teamInfo?.challengeCount ?? allChallenges.length
  const solvedRatio = (rank?.solvedCount ?? 0) / (totalCount || 1)

  const copyToken = () => {
    if (!teamInfo?.teamToken) return
    clipboard.copy(teamInfo.teamToken)
    showNotification({
      color: 'teal',
      message: t('team.notification.token.copied'),
      icon: <Icon path={mdiCheck} size={1} />,
    })
  }

  useEffect(() => {
    const challId = hash.slice(1).split('-')[0]
    if (challId && allChallenges) {
      const id = parseInt(challId)
      if (isNaN(id) || id < 0) return
      if (challenge?.id === id) return

      const chal = allChallenges.find((c) => c.id === id)
      if (chal) {
        setChallenge(chal)
        setDetailOpened(true)
      }
    }
  }, [hash, challenge, allChallenges])

  // ── 加载骨架屏 ──────────────────────────────
  if (!challenges) {
    return (
      <div className={classes.workspace}>
        <Skeleton className={classes.sidebar} radius={14} />
        <div className={classes.main}>
          <Skeleton h="3.4rem" radius={12} />
          <Stack gap={8} mt={12}>
            {Array(8)
              .fill(null)
              .map((_v, i) => (
                <Skeleton key={i} h="3.2rem" radius={10} />
              ))}
          </Stack>
        </div>
      </div>
    )
  }

  if (allChallenges.length === 0) {
    return (
      <Center h="calc(100vh - 16rem)" w="100%">
        <Empty bordered description={t('game.content.no_challenge')} fontSize="xl" mdiPath={mdiFlagOutline} iconSize={8} />
      </Center>
    )
  }

  const scoreboardReady = !!rank?.divisionId || !!rank?.rank

  return (
    <>
      <div className={classes.workspace}>
        {/* ── 左侧：战队信息 + 分类导航 ───────────── */}
        <aside className={classes.sidebar}>
          <div className={classes.teamCard}>
            <Group gap={10} wrap="nowrap">
              <Avatar size={44} radius={12} src={rank?.avatar} className={classes.avatar}>
                {rank?.name?.slice(0, 1) ?? 'T'}
              </Avatar>
              <div className={classes.teamMeta}>
                <Text className={classes.teamName} lineClamp={1}>
                  {rank?.name ?? 'Team'}
                </Text>
                <button type="button" className={classes.token} onClick={copyToken} title={teamInfo?.teamToken}>
                  <Icon path={mdiKeyOutline} size={0.58} />
                  <span>{teamInfo?.teamToken ?? '------'}</span>
                </button>
              </div>
            </Group>

            <div className={classes.statRow}>
              <Stat label="排名" value={rank?.rank ? `#${rank.rank}` : '-'} accent="red" />
              <Stat label="得分" value={rank?.score ?? 0} accent="blue" />
              <Stat label="解出" value={`${rank?.solvedCount ?? 0}/${totalCount}`} />
            </div>

            <div className={classes.progressBox}>
              <Group justify="space-between" gap={4} mb={5}>
                <Text className={classes.progressLabel}>总进度</Text>
                <Text className={classes.progressPct}>{Math.round(solvedRatio * 100)}%</Text>
              </Group>
              <Progress
                value={solvedRatio * 100}
                radius="xl"
                classNames={{ root: classes.progressRoot, section: classes.progressSection }}
              />
            </div>
          </div>

          <ScrollArea scrollbarSize={5} className={classes.catScroll}>
            <nav className={classes.catNav}>
              <CategoryItem
                icon={mdiPuzzle}
                name="全部题目"
                total={allChallenges.length}
                solved={allChallenges.filter((c) => solvedIds.has(c.id)).length}
                active={activeTab === 'All'}
                onClick={() => setActiveTab('All')}
              />
              {categories.map((tab) => {
                const data = challengeCategoryLabelMap.get(tab as ChallengeCategory)!
                const list = challenges[tab] ?? []
                return (
                  <CategoryItem
                    key={tab}
                    icon={data?.icon}
                    name={data?.name ?? tab}
                    color={data?.color}
                    total={list.length}
                    solved={list.filter((c) => solvedIds.has(c.id)).length}
                    active={activeTab === tab}
                    onClick={() => setActiveTab(tab as ChallengeCategory)}
                  />
                )
              })}
            </nav>
          </ScrollArea>
        </aside>

        {/* ── 右侧：工具条 + 题目列表 ─────────────── */}
        <section className={classes.main}>
          <div className={classes.topbar}>
            <TextInput
              className={classes.search}
              placeholder="搜索题目名称"
              value={keyword}
              onChange={(e) => setKeyword(e.currentTarget.value)}
              leftSection={<Icon path={mdiMagnify} size={0.8} />}
              size="sm"
            />
            <Group gap="xs" wrap="nowrap">
              <Button
                size="xs"
                variant="subtle"
                leftSection={<Icon path={mdiSortVariant} size={0.8} />}
                onClick={() => setSortKey(SORT_CYCLE[(SORT_CYCLE.indexOf(sortKey) + 1) % SORT_CYCLE.length])}
              >
                {SORT_LABEL[sortKey]}
              </Button>
              <Switch
                checked={hideSolved}
                onChange={(e) => setHideSolved(e.target.checked)}
                size="sm"
                label={
                  <Text fz="sm" fw={600}>
                    {t('game.button.hide_solved')}
                  </Text>
                }
              />
              {game?.writeupRequired && (
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<Icon path={mdiFileUploadOutline} size={0.8} />}
                  onClick={() => setWriteupSubmitOpened(true)}
                >
                  {t('game.button.submit_writeup')}
                </Button>
              )}
              <Button
                size="xs"
                variant="light"
                color="orange"
                leftSection={<Icon path={mdiBullhornOutline} size={0.8} />}
                onClick={noticeHandlers.open}
              >
                赛事公告
              </Button>
            </Group>
          </div>

          {!scoreboardReady ? (
            <Center className={classes.stateBox}>
              <Stack gap={4} align="center">
                <Text className={classes.stateTitle}>{t('game.content.scoreboard_not_ready.title')}</Text>
                <Text className={classes.stateText}>{t('game.content.scoreboard_not_ready.comment')}</Text>
              </Stack>
            </Center>
          ) : (
            <div className={classes.listPanel}>
              <div className={classes.listHead}>
                <span>状态</span>
                <span>题目</span>
                <span>分类</span>
                <span>分值</span>
                <span>解出</span>
              </div>
              <ScrollArea className={classes.list} scrollbarSize={6}>
                {currentChallenges && currentChallenges.length ? (
                  <div className={classes.rows}>
                    {currentChallenges.map((chal) => (
                      <ChallengeRow
                        key={chal.id}
                        challenge={chal}
                        solved={solvedIds.has(chal.id)}
                        cateData={challengeCategoryLabelMap.get(chal.category as ChallengeCategory)}
                        iconMap={iconMap}
                        colorMap={colorMap}
                        teamId={rank?.id}
                        onClick={() => {
                          setChallenge(chal)
                          setDetailOpened(true)
                          window.location.hash = `#${chal.id}-${encodeURIComponent(chal.title?.replace(/ /g, '-') ?? '')}`
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <Center className={classes.stateBox}>
                    <Stack gap={4} align="center">
                      <Text className={classes.stateTitle}>
                        {keyword ? '没有匹配的题目' : t('game.content.all_solved.title')}
                      </Text>
                      <Text className={classes.stateText}>
                        {keyword ? '换个关键词试试' : t('game.content.all_solved.comment')}
                      </Text>
                    </Stack>
                  </Center>
                )}
              </ScrollArea>
            </div>
          )}
        </section>
      </div>

      {/* ── 公告抽屉（常驻挂载，保持实时推送） ──── */}
      <Drawer
        opened={noticeOpened}
        onClose={noticeHandlers.close}
        position="right"
        size="min(24rem, 92vw)"
        keepMounted
        title={
          <Group gap="xs">
            <Icon path={mdiBullhornOutline} size={0.9} />
            <Text fw={700}>赛事公告</Text>
          </Group>
        }
      >
        <GameNoticePanel />
      </Drawer>

      {game?.writeupRequired && (
        <WriteupSubmitModal
          opened={writeupSubmitOpened}
          onClose={() => setWriteupSubmitOpened(false)}
          withCloseButton={false}
          size="40%"
          gameId={numId}
          writeupDeadline={teamInfo.writeupDeadline}
        />
      )}
      {challenge?.id && (
        <GameChallengeModal
          gameId={numId}
          gameTitle={game?.title ?? ''}
          opened={detailOpened}
          withCloseButton={false}
          onClose={() => {
            window.location.hash = ''
            setDetailOpened(false)
          }}
          gameEnded={dayjs(game?.end) < dayjs()}
          practiceMode={game?.practiceMode}
          status={rank?.solvedChallenges?.find((c) => c.id === challenge?.id)?.type}
          cateData={challengeCategoryLabelMap.get((challenge?.category as ChallengeCategory) ?? ChallengeCategory.Misc)!}
          title={challenge?.title ?? ''}
          score={challenge?.score ?? 0}
          challengeId={challenge.id}
        />
      )}
    </>
  )
}

const Stat: FC<{ label: string; value: string | number; accent?: 'red' | 'blue' }> = ({ label, value, accent }) => (
  <div className={classes.stat} data-accent={accent}>
    <span className={classes.statValue}>{value}</span>
    <span className={classes.statLabel}>{label}</span>
  </div>
)

interface CategoryItemProps {
  icon: string
  name: string
  color?: string
  total: number
  solved: number
  active: boolean
  onClick: () => void
}

const CategoryItem: FC<CategoryItemProps> = ({ icon, name, color, total, solved, active, onClick }) => {
  const done = total > 0 && solved === total
  return (
    <button
      type="button"
      className={classes.catItem}
      data-active={active || undefined}
      data-done={done || undefined}
      style={color ? ({ '--cat-color': `var(--mantine-color-${color}-6)` } as CSSProperties) : undefined}
      onClick={onClick}
    >
      <Icon path={icon} size={0.78} />
      <span className={classes.catName}>{name}</span>
      <span className={classes.catCount}>
        {solved}/{total}
      </span>
      <i className={classes.catBar} style={{ '--cat-progress': `${total ? (solved / total) * 100 : 0}%` } as CSSProperties} />
    </button>
  )
}
