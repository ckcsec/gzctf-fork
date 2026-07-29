import { Group, GroupProps, Title } from '@mantine/core'
import { forwardRef } from 'react'
import { LogoBox } from '@Components/LogoBox'
import { getPlatformName } from '@Utils/Brand'
import { useConfig } from '@Hooks/useConfig'
import { useIsMobile } from '@Utils/ThemeOverride'
import classes from '@Styles/LogoHeader.module.css'

export const LogoHeader = forwardRef<HTMLDivElement, GroupProps>((props, ref) => {
  const { config } = useConfig()
  const isMobile = useIsMobile()
  return (
    <Group ref={ref} wrap="nowrap" align="center" justify="flex-start" gap={isMobile ? 6 : 'sm'} {...props}>
      <LogoBox size={isMobile ? '36px' : '50px'} pr={isMobile ? 4 : 'sm'} />
      <Title textWrap="nowrap" className={classes.title} data-mobile={isMobile || undefined}>
        {getPlatformName(config?.title)}
      </Title>
    </Group>
  )
})
