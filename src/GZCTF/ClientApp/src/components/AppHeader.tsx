import { ActionIcon, AppShell, Avatar, Burger, Group, Menu, Popover, Tooltip } from '@mantine/core'
import {
  mdiAccountCircleOutline,
  mdiAccountGroupOutline,
  mdiCached,
  mdiFlagOutline,
  mdiLogin,
  mdiLogout,
  mdiPalette,
  mdiTranslate,
  mdiTransitConnectionVariant,
  mdiWrenchOutline,
} from '@mdi/js'
import { Icon } from '@mdi/react'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router'
import { ContainerPortMappingType, Role } from '@Api'
import { LogoHeader } from '@Components/LogoHeader'
import { AppControlProps } from '@Components/WithNavbar'
import { WsrxManager } from '@Components/WsrxManager'
import { clearLocalCache } from '@Utils/Cache'
import { LanguageMap, SupportedLanguages, useLanguage } from '@Utils/I18n'
import { useConfig } from '@Hooks/useConfig'
import { useLogOut, useUser } from '@Hooks/useUser'
import { useIsMobile } from '@Utils/ThemeOverride'
import classes from '@Styles/AppHeader.module.css'

interface HeaderItem {
  icon: string
  label: string
  link: string
  admin?: boolean
}

const navItems: HeaderItem[] = [
  { icon: mdiFlagOutline, label: 'common.tab.game', link: '/games' },
  { icon: mdiAccountGroupOutline, label: 'common.tab.team', link: '/teams' },
  { icon: mdiWrenchOutline, label: 'common.tab.admin', link: '/admin/games', admin: true },
]

export const AppHeader: FC<AppControlProps> = ({ openColorModal }) => {
  const [opened, setOpened] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, error } = useUser()
  const { config } = useConfig()
  const logout = useLogOut()
  const isMobile = useIsMobile()
  const { t } = useTranslation()
  const { setLanguage, supportedLanguages } = useLanguage()

  const loggedIn = user && !error
  const items = navItems.filter((item) => !item.admin || user?.role === Role.Admin)
  const isActive = (link: string) => (link.startsWith('/admin') ? location.pathname.startsWith('/admin') : location.pathname.startsWith(link))

  const languageMenu = supportedLanguages.map((lang: SupportedLanguages) => (
    <Menu.Item key={lang} fw={500} onClick={() => setLanguage(lang)}>
      {LanguageMap[lang] ?? lang}
    </Menu.Item>
  ))

  const accountMenu = (
    <>
      {loggedIn && (
        <>
          <Menu.Label>{user?.userName}</Menu.Label>
          <Menu.Item component={Link} to="/account/profile" leftSection={<Icon path={mdiAccountCircleOutline} size={1} />}>
            {t('common.tab.account.profile')}
          </Menu.Item>
        </>
      )}
      <Menu.Item onClick={clearLocalCache} leftSection={<Icon path={mdiCached} size={1} />}>
        {t('common.tab.account.clean_cache')}
      </Menu.Item>
      <Menu.Item onClick={openColorModal} leftSection={<Icon path={mdiPalette} size={1} />}>
        {t('common.content.color.title')}
      </Menu.Item>
      <Menu.Divider />
      {loggedIn ? (
        <Menu.Item color="red" onClick={logout} leftSection={<Icon path={mdiLogout} size={1} />}>
          {t('common.tab.account.logout')}
        </Menu.Item>
      ) : (
        <Menu.Item
          component={Link}
          to={`/account/login?from=${location.pathname}`}
          leftSection={<Icon path={mdiLogin} size={1} />}
        >
          {t('common.tab.account.login')}
        </Menu.Item>
      )}
    </>
  )

  return (
    <AppShell.Header h={isMobile ? 60 : 68} className={classes.header}>
      <Group h="100%" px={isMobile ? 'sm' : 'xl'} justify="space-between" wrap="nowrap">
        <LogoHeader onClick={() => navigate('/')} className={classes.brand} />

        {!isMobile && (
          <Group className={classes.navigation} gap={4} wrap="nowrap">
            {items.map((item) => (
              <Link className={classes.navLink} data-active={isActive(item.link) || undefined} key={item.link} to={item.link}>
                <Icon path={item.icon} size={0.8} />
                <span>{t(item.label)}</span>
              </Link>
            ))}
          </Group>
        )}

        <Group justify="flex-end" gap="xs" wrap="nowrap">
          {!isMobile && config.portMapping === ContainerPortMappingType.PlatformProxy && (
            <Popover position="bottom-end" offset={18} width={320}>
              <Popover.Target>
                <Tooltip label="WebSocket Reflector">
                  <ActionIcon className={classes.action}>
                    <Icon path={mdiTransitConnectionVariant} size={1} />
                  </ActionIcon>
                </Tooltip>
              </Popover.Target>
              <Popover.Dropdown>
                <WsrxManager />
              </Popover.Dropdown>
            </Popover>
          )}

          <Menu position="bottom-end" offset={18} width={160}>
            <Menu.Target>
              <Tooltip label="语言切换">
                <ActionIcon className={classes.action}>
                  <Icon path={mdiTranslate} size={1} />
                </ActionIcon>
              </Tooltip>
            </Menu.Target>
            <Menu.Dropdown>{languageMenu}</Menu.Dropdown>
          </Menu>

          {isMobile ? (
            <Menu shadow="md" opened={opened} onClose={() => setOpened(false)} width={220} offset={14}>
              <Menu.Target>
                <Burger opened={opened} onClick={() => setOpened((value) => !value)} size="sm" />
              </Menu.Target>
              <Menu.Dropdown>
                {items.map((item) => (
                  <Menu.Item component={Link} key={item.link} to={item.link} leftSection={<Icon path={item.icon} size={1} />}>
                    {t(item.label)}
                  </Menu.Item>
                ))}
                <Menu.Divider />
                {accountMenu}
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Menu position="bottom-end" offset={18} width={210}>
              <Menu.Target>
                <ActionIcon className={classes.account}>
                  {user?.avatar ? (
                    <Avatar alt="avatar" src={user.avatar} size="sm">
                      {user.userName?.slice(0, 1) ?? 'U'}
                    </Avatar>
                  ) : (
                    <Icon path={mdiAccountCircleOutline} size={1.15} />
                  )}
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>{accountMenu}</Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Group>
    </AppShell.Header>
  )
}
