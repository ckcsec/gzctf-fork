import { Text, Tooltip, alpha, useMantineTheme } from '@mantine/core'
import { mdiAccountGroupOutline, mdiCheckDecagram, mdiClockAlertOutline } from '@mdi/js'
import { Icon } from '@mdi/react'
import dayjs from 'dayjs'
import { CSSProperties, FC, useMemo } from 'react'
import { useLanguage } from '@Utils/I18n'
import { BloodsTypes, ChallengeCategoryItemProps, PartialIconProps } from '@Utils/Shared'
import { ChallengeInfo, SubmissionType } from '@Api'
import classes from '@Styles/ChallengeRow.module.css'

interface ChallengeRowProps {
  challenge: ChallengeInfo
  solved?: boolean
  cateData?: ChallengeCategoryItemProps
  onClick?: () => void
  iconMap: Map<SubmissionType, PartialIconProps | undefined>
  colorMap: Map<SubmissionType, string | undefined>
  teamId?: number
}

/**
 * 答题页题目列表的单行，替代原先的卡片网格布局
 */
export const ChallengeRow: FC<ChallengeRowProps> = ({
  challenge,
  solved,
  cateData,
  onClick,
  iconMap,
  colorMap,
  teamId,
}) => {
  const theme = useMantineTheme()
  const { locale } = useLanguage()

  const expired = useMemo(() => {
    if (!challenge.deadline) return false
    return dayjs().isAfter(dayjs(challenge.deadline))
  }, [challenge.deadline])

  const accent = cateData ? theme.colors[cateData.color][5] : theme.colors.blue[5]

  return (
    <button
      type="button"
      className={classes.row}
      data-solved={solved || undefined}
      data-expired={expired || undefined}
      onClick={onClick}
      style={
        {
          '--row-color': accent,
          '--row-color-soft': alpha(accent, 0.16),
        } as CSSProperties
      }
    >
      {/* 状态 */}
      <span className={classes.status}>
        {solved ? (
          <span className={classes.solvedMark}>
            <Icon path={mdiCheckDecagram} size={0.78} />
          </span>
        ) : expired ? (
          <Tooltip label="已过截止时间" position="right">
            <span className={classes.expiredMark}>
              <Icon path={mdiClockAlertOutline} size={0.75} />
            </span>
          </Tooltip>
        ) : (
          <span className={classes.pendingMark} />
        )}
      </span>

      {/* 题目名 + 一血 */}
      <span className={classes.titleCell}>
        <span className={classes.title}>{challenge.title}</span>
        <span className={classes.bloods}>
          {challenge.bloods?.map((blood, idx) => {
            if (!blood) return null
            const iconProps = iconMap.get(BloodsTypes[idx])
            if (!iconProps) return null
            return (
              <Tooltip
                key={idx}
                position="top"
                label={
                  <div>
                    <Text fw={600} size="xs">
                      {blood.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {dayjs(blood.submitTimeUtc).locale(locale).format('SLL LTS')}
                    </Text>
                  </div>
                }
              >
                <span
                  className={classes.blood}
                  data-own={teamId === blood.id || undefined}
                  style={{ '--blood-color': colorMap.get(BloodsTypes[idx]) } as CSSProperties}
                >
                  <Icon {...iconProps} />
                </span>
              </Tooltip>
            )
          })}
        </span>
      </span>

      {/* 分类 */}
      <span className={classes.cate}>
        {cateData && <Icon path={cateData.icon} size={0.62} />}
        <span>{cateData?.name ?? challenge.category}</span>
      </span>

      {/* 分值 */}
      <span className={classes.score}>
        {challenge.score}
        <em>pts</em>
      </span>

      {/* 解出队伍数 */}
      <span className={classes.solves}>
        <Icon path={mdiAccountGroupOutline} size={0.66} />
        {challenge.solved ?? 0}
      </span>
    </button>
  )
}
