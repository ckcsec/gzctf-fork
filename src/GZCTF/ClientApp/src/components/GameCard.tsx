import {
  BackgroundImage,
  Badge,
  Card,
  Center,
  Group,
  MantineColor,
  Stack,
  Title,
  Text,
} from '@mantine/core'
import { mdiChevronTripleRight } from '@mdi/js'
import { Icon } from '@mdi/react'
import cx from 'clsx'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLanguage } from '@Utils/I18n'
import { getGameStatus, toLimitTag } from '@Hooks/useGame'
import { BasicGameInfoModel } from '@Api'
import misc from '@Styles/Misc.module.css'
import classes from '@Styles/GameCard.module.css'

export enum GameStatus {
  Coming = 'coming',
  OnGoing = 'ongoing',
  Ended = 'ended',
}

export const GameColorMap = new Map<GameStatus, MantineColor>([
  [GameStatus.Coming, 'yellow'],
  [GameStatus.OnGoing, 'green'],
  [GameStatus.Ended, 'blue'],
])

interface GameCardProps {
  game: BasicGameInfoModel
}

export const GameCard: FC<GameCardProps> = ({ game, ...others }) => {
  const { t } = useTranslation()
  const { locale } = useLanguage()

  const { summary, title, poster, limit, participationMode } = game
  const { startTime, endTime, status } = getGameStatus(game)

  const duration = endTime.diff(startTime, 'hours')

  const color = GameColorMap.get(status)

  return (
    <Card
      {...others}
      shadow="sm"
      component={Link}
      to={`/games/${game.id}`}
      className={classes.card}
      classNames={{ root: cx(misc.hoverCard, classes.root) }}
    >
      <Card.Section>
        <BackgroundImage
          src={poster || '/brand/ctf-hero-red-blue.png'}
          h="12rem"
          w="100%"
          pos="relative"
          className={classes.poster}
          data-has-poster={poster ? true : undefined}
        >
          <Center pos="absolute" top={8} right={8}>
            <Badge color={color} size="sm" variant="filled" className={classes.status}>
              {status}
            </Badge>
          </Center>
        </BackgroundImage>
      </Card.Section>
      <Stack gap="sm" pt="sm">
        <Group gap={0} justify="space-between" align="flex-start">
          <Stack gap={2} flex={1}>
            <Group wrap="nowrap" gap="xs">
              <Badge size="xs" color={color} className={classes.meta}>
                {toLimitTag(t, limit, participationMode)}
              </Badge>
              <Badge size="xs" color={color} className={classes.meta}>
                {t('game.content.duration', {
                  hours: duration,
                })}
              </Badge>
            </Group>
            <Title order={3} ta="left" lineClamp={2}>
              {title}
            </Title>
            <Group mt={4} wrap="nowrap" gap={3}>
              <Badge size="xs" color={color} className={classes.meta}>
                {startTime.locale(locale).format('L LTS')}
              </Badge>
              <Icon path={mdiChevronTripleRight} size={1} />
              <Badge size="xs" color={color} className={classes.meta}>
                {endTime.locale(locale).format('L LTS')}
              </Badge>
            </Group>
          </Stack>
        </Group>
        <Text fw={500} size="sm" lineClamp={3}>
          {summary}
        </Text>
      </Stack>
    </Card>
  )
}
