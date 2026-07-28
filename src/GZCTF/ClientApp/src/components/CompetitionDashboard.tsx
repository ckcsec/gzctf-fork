import { CSSProperties, FC, useMemo } from 'react'
import dayjs from 'dayjs'
import type { EChartsOption } from 'echarts'
import { mdiMedal } from '@mdi/js'
import { Icon } from '@mdi/react'
import { EchartsContainer } from '@Components/charts/EchartsContainer'
import { ScoreboardModel, SubmissionType } from '@Api'
import classes from '@Styles/CompetitionDashboard.module.css'

interface CompetitionDashboardProps {
  scoreboard?: ScoreboardModel
  title?: string
  start?: number
}

const chartColors = ['#2f8cff', '#ff304d', '#22e2a2', '#ffd33d', '#a06cff', '#00d5ff', '#ff7acb', '#ff8a3d']
const categoryPalette = ['#2f8cff', '#ff304d', '#22e2a2', '#ffd33d', '#a06cff', '#00d5ff', '#ff7acb', '#ff8a3d']
const chartTooltip = {
  backgroundColor: 'rgba(7, 26, 51, 0.96)',
  borderColor: '#2c6aa5',
  textStyle: { color: '#eef7ff' },
  extraCssText: 'box-shadow:0 12px 30px rgba(0,8,20,.38);border-radius:8px;',
}

const formatNumber = (value: number) => new Intl.NumberFormat('zh-CN').format(value)
const formatTime = (value?: number | null) => (value ? dayjs(value).format('HH:mm:ss') : '--:--:--')

const bloodLabel = (type?: SubmissionType) => {
  if (type === SubmissionType.FirstBlood) return '一血'
  if (type === SubmissionType.SecondBlood) return '二血'
  if (type === SubmissionType.ThirdBlood) return '三血'
  return '解题'
}

export const CompetitionDashboard: FC<CompetitionDashboardProps> = ({ scoreboard, title, start }) => {
  const challenges = useMemo(() => Object.values(scoreboard?.challenges ?? {}).flat(), [scoreboard?.challenges])
  const challengeMap = useMemo(() => new Map(challenges.map((challenge) => [challenge.id, challenge])), [challenges])
  const rankedItems = useMemo(
    () => [...(scoreboard?.items ?? [])].filter((item) => item.rank > 0).sort((a, b) => a.rank - b.rank),
    [scoreboard?.items]
  )

  const submissions = useMemo(
    () =>
      rankedItems
        .flatMap((item) =>
          item.solvedChallenges.map((solve) => {
            const challenge = challengeMap.get(solve.id)
            return {
              participant: item.name,
              userName: solve.userName,
              title: challenge?.title ?? `Challenge #${solve.id}`,
              category: challenge?.category ?? 'Misc',
              score: solve.score,
              time: solve.time,
            }
          })
        )
        .sort((a, b) => b.time - a.time),
    [challengeMap, rankedItems]
  )

  const bloods = useMemo(
    () =>
      challenges
        .flatMap((challenge) =>
          challenge.bloods.map((blood, index) => ({
            title: challenge.title,
            category: challenge.category,
            name: blood.name,
            time: blood.submitTimeUtc,
            type: [SubmissionType.FirstBlood, SubmissionType.SecondBlood, SubmissionType.ThirdBlood][index],
          }))
        )
        .sort((a, b) => (b.time ?? 0) - (a.time ?? 0)),
    [challenges]
  )

  const categoryStats = useMemo(() => {
    const stats = new Map<string, { category: string; total: number; completed: number; submissions: number }>()
    challenges.forEach((challenge) => {
      const category = challenge.category.toString()
      const current = stats.get(category) ?? { category, total: 0, completed: 0, submissions: 0 }
      current.total += 1
      current.completed += challenge.solved > 0 ? 1 : 0
      current.submissions += challenge.solved
      stats.set(category, current)
    })
    return [...stats.values()].sort((a, b) => b.total - a.total)
  }, [challenges])

  const timeLine = useMemo(() => {
    const overall = scoreboard?.timelines.find((item) => (item.divisionId ?? 0) === 0)
    return overall?.teams ?? scoreboard?.timelines[0]?.teams ?? []
  }, [scoreboard?.timelines])

  const lineOption: EChartsOption = useMemo(
    () => ({
      animationDuration: 700,
      color: chartColors,
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', ...chartTooltip },
      legend: { top: 4, textStyle: { color: '#c8d8e8', fontSize: 10 }, itemWidth: 12, itemHeight: 5 },
      grid: { top: 45, left: 54, right: 16, bottom: 34 },
      xAxis: {
        type: 'time',
        axisLabel: { color: '#9fb9d5', fontSize: 10 },
        axisLine: { lineStyle: { color: 'rgba(132, 190, 255, 0.32)' } },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '累计分数',
        nameTextStyle: { color: '#9fb9d5', fontSize: 10 },
        axisLabel: { color: '#9fb9d5', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(132, 190, 255, 0.16)', type: 'dashed' } },
      },
      series: timeLine.map((item) => ({
        name: item.name,
        type: 'line',
        smooth: 0.32,
        smoothMonotone: 'x',
        showSymbol: false,
        lineStyle: { width: 2.8 },
        emphasis: { lineStyle: { width: 4 } },
        data: [[start ?? scoreboard?.updateTimeUtc ?? Date.now(), 0], ...item.items.map((point) => [point.time, point.score])],
      })),
    }),
    [scoreboard?.updateTimeUtc, start, timeLine]
  )

  const categoryBarOption: EChartsOption = useMemo(
    () => ({
      animationDuration: 500,
      color: categoryPalette,
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        ...chartTooltip,
      },
      legend: { top: 0, textStyle: { color: '#c8d8e8', fontSize: 10 }, itemWidth: 12, itemHeight: 6 },
      grid: { top: 26, left: 62, right: 24, bottom: 8 },
      xAxis: {
        type: 'value',
        axisLabel: { color: '#9fb9d5', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(132, 190, 255, 0.14)' } },
      },
      yAxis: {
        type: 'category',
        data: categoryStats.map((item) => item.category),
        axisLabel: { color: '#d9e9f9', fontSize: 10, fontWeight: 700 },
        axisLine: { lineStyle: { color: 'rgba(132, 190, 255, 0.28)' } },
      },
      series: [
        {
          name: '已攻克',
          type: 'bar',
          stack: 'total',
          data: categoryStats.map((item, index) => ({
            value: item.completed,
            itemStyle: {
              color: categoryPalette[index % categoryPalette.length],
              shadowBlur: 7,
              shadowColor: 'rgba(88, 170, 255, 0.24)',
            },
          })),
          barWidth: 13,
          itemStyle: { borderRadius: [2, 0, 0, 2] },
        },
        {
          name: '待攻克',
          type: 'bar',
          stack: 'total',
          data: categoryStats.map((item) => ({
            value: item.total - item.completed,
            itemStyle: { color: 'rgba(132, 190, 255, 0.16)' },
          })),
          barWidth: 13,
          itemStyle: { borderRadius: [0, 2, 2, 0] },
        },
      ],
    }),
    [categoryStats]
  )

  const categoryPieOption: EChartsOption = useMemo(
    () => ({
      animationDuration: 500,
      color: chartColors,
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', ...chartTooltip },
      legend: { right: 0, top: 'middle', orient: 'vertical', textStyle: { color: '#c8d8e8', fontSize: 10 } },
      series: [
        {
          type: 'pie',
          radius: ['46%', '72%'],
          center: ['38%', '54%'],
          label: { color: '#d9e9f9', fontSize: 10, formatter: '{b}\n{d}%' },
          labelLine: { lineStyle: { color: 'rgba(132, 190, 255, 0.34)' } },
          data: categoryStats.map((item) => ({ name: item.category, value: item.submissions })),
        },
      ],
    }),
    [categoryStats]
  )

  const leader = rankedItems[0]
  const maxScore = leader?.score || 1
  const solvedChallengeCount = challenges.filter((challenge) => challenge.solved > 0).length

  return (
    <main className={classes.dashboard}>
      <header className={classes.header}>
        <h1>{title ?? '赛事'}排名</h1>
        <div className={classes.live}>
          <i />
          LIVE
        </div>
      </header>

      <section className={classes.metrics}>
        <Metric value={rankedItems.length} label="参赛人数 / 队伍" />
        <Metric value={scoreboard?.challengeCount ?? 0} label="题目总数" />
        <Metric value={solvedChallengeCount} label="已攻克题目" />
        <Metric value={leader?.name ?? '-'} label="当前领先" />
        <Metric value={submissions[0]?.participant ?? '-'} label="最新解题" />
        <Metric value={submissions.length} label="总解题次数" />
      </section>

      <section className={classes.layout}>
        <DashboardPanel title={`实时排行榜 · ${rankedItems.length} 支队伍`} className={classes.rankingPanel}>
          {/* 展示全部参赛队伍，超出面板高度时纵向滚动 */}
          <div className={classes.rankList}>
            {rankedItems.length === 0 && <EmptyState text="暂无排行榜数据" />}
            {rankedItems.map((item) => (
              <div className={classes.rankItem} data-rank={item.rank <= 3 ? item.rank : undefined} key={item.id}>
                <b className={classes.rankPosition}>
                  {item.rank <= 3 && <Icon path={mdiMedal} size={0.72} />}
                  <span>{item.rank}</span>
                </b>
                <span>{item.name}</span>
                <div className={classes.rankTrack}>
                  <i style={{ '--rank-width': `${Math.max(3, (item.score / maxScore) * 100)}%` } as CSSProperties} />
                </div>
                <strong>{formatNumber(item.score)}</strong>
              </div>
            ))}
          </div>
        </DashboardPanel>

        <div className={classes.centerColumn}>
          <DashboardPanel title="实时得分趋势" className={classes.trendPanel}>
            <EchartsContainer option={lineOption} style={{ width: '100%', height: '100%' }} />
          </DashboardPanel>
          <div className={classes.lowerCharts}>
            <DashboardPanel title="分类完成度">
              <EchartsContainer option={categoryBarOption} style={{ width: '100%', height: '100%' }} />
            </DashboardPanel>
            <DashboardPanel title="分类解题占比">
              <EchartsContainer option={categoryPieOption} style={{ width: '100%', height: '100%' }} />
            </DashboardPanel>
          </div>
        </div>

        <div className={classes.rightColumn}>
          <DashboardPanel title="实时提交">
            <div className={classes.feed}>
              {submissions.length === 0 && <EmptyState text="暂无解题记录" />}
              {submissions.slice(0, 10).map((item, index) => (
                <div className={classes.feedItem} key={`${item.participant}-${item.title}-${item.time}-${index}`}>
                  <div>
                    <b>{item.participant}</b>
                    <span>{item.title} · {item.category}</span>
                  </div>
                  <strong>+{item.score}</strong>
                  <time>{formatTime(item.time)}</time>
                </div>
              ))}
            </div>
          </DashboardPanel>
          <DashboardPanel title="血榜">
            <div className={classes.feed}>
              {bloods.length === 0 && <EmptyState text="暂无血榜记录" />}
              {bloods.slice(0, 6).map((item, index) => (
                <div className={classes.bloodItem} key={`${item.name}-${item.title}-${index}`}>
                  <em>{bloodLabel(item.type)}</em>
                  <div>
                    <b>{item.name}</b>
                    <span>{item.title} · {item.category}</span>
                  </div>
                  <time>{formatTime(item.time)}</time>
                </div>
              ))}
            </div>
          </DashboardPanel>
        </div>
      </section>

      <footer className={classes.footer}>最后更新 {formatTime(scoreboard?.updateTimeUtc)}</footer>
    </main>
  )
}

const Metric: FC<{ value: string | number; label: string }> = ({ value, label }) => (
  <div className={classes.metric}>
    <strong>{typeof value === 'number' ? formatNumber(value) : value}</strong>
    <span>{label}</span>
  </div>
)

const DashboardPanel: FC<{ title: string; className?: string; children: React.ReactNode }> = ({
  title,
  className,
  children,
}) => (
  <section className={`${classes.panel} ${className ?? ''}`}>
    <h2>{title}</h2>
    <div className={classes.panelBody}>{children}</div>
  </section>
)

const EmptyState: FC<{ text: string }> = ({ text }) => <div className={classes.empty}>{text}</div>
