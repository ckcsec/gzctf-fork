import { Button, Group, Stack, Text, Title } from '@mantine/core'
import { mdiAccountPlusOutline, mdiChartLine, mdiFlagCheckered, mdiShieldCheckOutline, mdiTarget, mdiTrophyOutline } from '@mdi/js'
import { Icon } from '@mdi/react'
import dayjs from 'dayjs'
import { FC } from 'react'
import { Link } from 'react-router'
import { WithNavBar } from '@Components/WithNavbar'
import { useConfig } from '@Hooks/useConfig'
import { usePageTitle } from '@Hooks/usePageTitle'
import { getPlatformName } from '@Utils/Brand'
import classes from '@Styles/Home.module.css'

const DEFAULT_SLOGAN = '聚焦攻防实战，锻造网安精英'
const DEFAULT_BADGE = 'OFFICIAL CTF PLATFORM'

// 首页特色卡默认文案（后台留空时使用）；图标按顺序循环取用
const FEATURE_ICONS = [mdiTarget, mdiShieldCheckOutline, mdiChartLine, mdiTrophyOutline]
const DEFAULT_FEATURES = ['实战驱动|真实场景 攻防对抗', '能力进阶|技术比拼 思维突破', '实时排行|动态计分 数据总览', '荣誉激励|权威认证 职业加持']

const clean = (v?: string | null) => {
  const s = v?.trim()
  return s && s.length > 0 ? s : undefined
}

const Home: FC = () => {
  const { config } = useConfig()

  // 首页所有文案均来自后台全局配置（管理后台 → 系统设置 → 首页文案），留空则回退默认值。
  // 首页主标题 / 副标题独立于平台名称与平台标语，留空才回退到后者。
  const platform = getPlatformName(config?.title)
  const rawSlogan = clean(config?.slogan)
  const platformSlogan = rawSlogan && !/^hack for fun/i.test(rawSlogan) ? rawSlogan : DEFAULT_SLOGAN
  const title = clean(config?.homeTitle) ?? platform
  const slogan = clean(config?.homeSubtitle) ?? platformSlogan
  const eyebrow = clean(config?.homeEyebrow) ?? `${dayjs().year()} 年度`
  const badge = clean(config?.homeBadge) ?? DEFAULT_BADGE
  const enterText = clean(config?.homeEnterText) ?? '进入赛事'
  const registerText = clean(config?.homeRegisterText) ?? '注册参赛'

  const features = (clean(config?.homeFeatures)?.split('\n') ?? DEFAULT_FEATURES)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, ...rest] = line.split('|')
      return { title: title.trim(), text: rest.join('|').trim() }
    })

  usePageTitle()

  return (
    <WithNavBar width="100%" minWidth={0}>
      <main className={classes.page}>
        <section className={classes.hero}>
          <div className={classes.copy}>
            <div className={classes.eyebrow}>
              <span>{eyebrow}</span>
              <i />
              {badge && <em>{badge}</em>}
            </div>
            <Title className={classes.title}>{title}</Title>
            <Text className={classes.subtitle}>{slogan}</Text>
            <Group className={classes.actions} gap="md">
              <Button component={Link} to="/games" size="lg" leftSection={<Icon path={mdiFlagCheckered} size={0.95} />}>
                {enterText}
              </Button>
              <Button
                component={Link}
                to="/account/register"
                size="lg"
                variant="outline"
                leftSection={<Icon path={mdiAccountPlusOutline} size={0.95} />}
              >
                {registerText}
              </Button>
            </Group>
          </div>

          {features.length > 0 && (
            <div className={classes.featureRail}>
              {features.map((f, i) => (
                <Feature key={i} icon={FEATURE_ICONS[i % FEATURE_ICONS.length]} title={f.title} text={f.text} />
              ))}
            </div>
          )}
        </section>
      </main>
    </WithNavBar>
  )
}

const Feature: FC<{ icon: string; title: string; text: string }> = ({ icon, title, text }) => (
  <div className={classes.feature}>
    <Icon path={icon} size={1.55} />
    <Stack gap={2}>
      <strong>{title}</strong>
      <span>{text}</span>
    </Stack>
  </div>
)

export default Home
