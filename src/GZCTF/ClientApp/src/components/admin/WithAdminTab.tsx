import { Group, GroupProps, LoadingOverlay } from '@mantine/core'
import {
  mdiAccountCogOutline,
  mdiAccountGroupOutline,
  mdiFileDocumentOutline,
  mdiFlagOutline,
  mdiPackageVariantClosed,
  mdiShieldCrownOutline,
  mdiSitemapOutline,
} from '@mdi/js'
import { Icon } from '@mdi/react'
import React, { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { DEFAULT_LOADING_OVERLAY } from '@Utils/Shared'
import { getPlatformName } from '@Utils/Brand'
import { useConfig } from '@Hooks/useConfig'
import { usePageTitle } from '@Hooks/usePageTitle'
import classes from '@Styles/AdminLayout.module.css'

export interface AdminTabProps extends React.PropsWithChildren {
  head?: React.ReactNode
  isLoading?: boolean
  headProps?: GroupProps
}

export const WithAdminTab: FC<AdminTabProps> = ({ head, headProps, isLoading, children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { config } = useConfig()

  const { t } = useTranslation()

  const pages = [
    { icon: mdiFlagOutline, title: t('admin.tab.games.index'), path: 'games' },
    { icon: mdiAccountGroupOutline, title: t('admin.tab.teams'), path: 'teams' },
    { icon: mdiAccountCogOutline, title: t('admin.tab.users'), path: 'users' },
    { icon: mdiPackageVariantClosed, title: t('admin.tab.instances'), path: 'instances' },
    { icon: mdiFileDocumentOutline, title: t('admin.tab.logs'), path: 'logs' },
    { icon: mdiSitemapOutline, title: t('admin.tab.settings'), path: 'settings' },
  ]

  const getTab = (path: string) => pages.findIndex((page) => path.startsWith(`/admin/${page.path}`))
  const tabIndex = getTab(location.pathname)
  const [activeTab, setActiveTab] = useState(tabIndex < 0 ? 0 : tabIndex)

  useEffect(() => {
    const tab = getTab(location.pathname)
    if (tab >= 0) {
      setActiveTab(tab)
    } else {
      navigate(pages[0].path)
    }
  }, [location])

  const current = pages[tabIndex] ?? pages[0]
  usePageTitle(current.title)

  return (
    <div className={classes.shell}>
      {/* ── 左侧导航 ──────────────────────────── */}
      <aside className={classes.sidebar}>
        <div className={classes.brand}>
          <span className={classes.brandIcon}>
            <Icon path={mdiShieldCrownOutline} size={1} />
          </span>
          <div className={classes.brandText}>
            <strong>{getPlatformName(config?.title)}</strong>
            <span>管理控制台</span>
          </div>
        </div>

        <nav className={classes.nav}>
          {pages.map((page, idx) => (
            <button
              key={page.path}
              type="button"
              className={classes.navItem}
              data-active={activeTab === idx || undefined}
              onClick={() => {
                setActiveTab(idx)
                navigate(`/admin/${page.path}`)
              }}
            >
              <Icon path={page.icon} size={0.85} />
              <span>{page.title}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── 右侧内容区 ─────────────────────────── */}
      <section className={classes.content}>
        <header className={classes.contentHead}>
          <div className={classes.headTitle}>
            <Icon path={current.icon} size={0.92} />
            <h1>{current.title}</h1>
          </div>
          {head && (
            <Group wrap="nowrap" justify="flex-end" gap="sm" className={classes.headActions} {...headProps}>
              {head}
            </Group>
          )}
        </header>

        <div className={classes.panel}>{children}</div>

        <LoadingOverlay visible={isLoading ?? false} overlayProps={DEFAULT_LOADING_OVERLAY} />
      </section>
    </div>
  )
}
