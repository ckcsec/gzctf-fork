import { Anchor, Center, Group, Stack, Text } from '@mantine/core'
import { FC } from 'react'
import { Copyright } from '@Components/Copyright'
import { FooterRender } from '@Components/FooterRender'
import { getPlatformName } from '@Utils/Brand'
import { useConfig } from '@Hooks/useConfig'
import { useIsMobile } from '@Utils/ThemeOverride'
import classes from '@Styles/AppFooter.module.css'

export const AppFooter: FC = () => {
  const { config } = useConfig()
  const isMobile = useIsMobile()

  return (
    <>
      <div className={classes.spacer} />
      <footer className={classes.wrapper}>
        <Center mx="auto" h="100%">
          <Stack align="center" gap={6}>
            <Text fw={800} size="lg" className={classes.title}>
              {getPlatformName(config.title)}
            </Text>
            <Text size="xs" className={classes.subtitle}>
              网络安全实战型人才培养平台
            </Text>
            {config.footerInfo && <FooterRender source={config.footerInfo} />}
            {/* 上游开源署名：AGPLv3 与 GZCTF 受限许可证均要求保留且清晰可见 */}
            <Group gap={6} justify="center" className={classes.attribution}>
              <Copyright isMobile={isMobile} />
              <Text size="xs" c="dimmed">
                Based on the open core of{' '}
                <Anchor href="https://github.com/GZTimeWalker/GZCTF" target="_blank" rel="noreferrer" size="xs" c="dimmed">
                  GZCTF
                </Anchor>{' '}
                (AGPLv3)
              </Text>
            </Group>
          </Stack>
        </Center>
      </footer>
    </>
  )
}
