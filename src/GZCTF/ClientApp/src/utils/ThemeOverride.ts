import { generateColors } from '@mantine/colors-generator'
import {
  ActionIcon,
  Avatar,
  Badge,
  Code,
  Loader,
  MantineThemeOverride,
  Menu,
  Modal,
  Popover,
  Switch,
  Tabs,
  Tooltip,
  TooltipFloating,
  createTheme,
  useMantineTheme,
} from '@mantine/core'
import { createStyles } from '@mantine/emotion'
import { useLocalStorage, useMediaQuery } from '@mantine/hooks'
import { useEffect, useState } from 'react'
import { useConfig } from '@Hooks/useConfig'
import tooltipClasses from '@Styles/Tooltip.module.css'

const CustomTheme: MantineThemeOverride = {
  colors: {
    gray: [
      '#E9F8FF',
      '#D1EAF5',
      '#AFD2DF',
      '#8EB8C8',
      '#6D9BAF',
      '#527F94',
      '#3A6379',
      '#26495E',
      '#153449',
      '#082237',
    ],
    brand: [
      '#E3FAFF',
      '#C8F4FF',
      '#97E9FF',
      '#5CDAFF',
      '#25C9FF',
      '#00B4F0',
      '#0094CF',
      '#0075AB',
      '#075A84',
      '#074260',
    ],
    alert: [
      '#FFB4B4',
      '#FFA0A0',
      '#FF8c8c',
      '#FF7878',
      '#FF6464',
      '#FE5050',
      '#FE3c3c',
      '#FE2828',
      '#FC1414',
      '#FC0000',
    ],
    light: [
      '#FFFFFF',
      '#F8F8F8',
      '#EFEFEF',
      '#E0E0E0',
      '#DFDFDF',
      '#D0D0D0',
      '#CFCFCF',
      '#C0C0C0',
      '#BFBFBF',
      '#B0B0B0',
    ],
    dark: [
      '#DDF4FF',
      '#B8D9E8',
      '#8EB6C9',
      '#668EA4',
      '#436B82',
      '#254A63',
      '#113851',
      '#082A42',
      '#041E34',
      '#021426',
    ],
  },
  primaryColor: 'brand',
  defaultRadius: 'xs',
  fontFamily:
    '"Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  fontFamilyMonospace:
    '"JetBrains Mono", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", ui-monospace, SFMono-Regular, Monaco, Consolas, monospace',
  headings: {
    fontFamily:
      '"Exo 2", "Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
  },
  breakpoints: {
    xs: '30em',
    sm: '48em',
    md: '64em',
    lg: '74em',
    xl: '90em',
    w18: '1800px',
    w24: '2400px',
    w30: '3000px',
    w36: '3600px',
    w42: '4200px',
    w48: '4800px',
  },
  components: {
    Loader: Loader.extend({
      defaultProps: {
        type: 'bars',
      },
    }),
    Switch: Switch.extend({
      styles: {
        body: {
          alignItems: 'center',
        },
        labelWrapper: {
          display: 'flex',
        },
      },
    }),
    Modal: Modal.extend({
      defaultProps: {
        centered: true,
        styles: {
          title: {
            fontWeight: 'bold',
          },
        },
      },
    }),
    Popover: Popover.extend({
      defaultProps: {
        withinPortal: true,
      },
    }),
    ActionIcon: ActionIcon.extend({
      defaultProps: {
        variant: 'transparent',
      },
    }),
    Badge: Badge.extend({
      defaultProps: {
        variant: 'outline',
      },
    }),
    Tabs: Tabs.extend({
      styles: {
        tab: {
          padding: 'var(--mantine-spacing-xs)',
          fontWeight: 500,
        },
      },
    }),
    Avatar: Avatar.extend({
      defaultProps: {
        color: 'brand',
      },
    }),
    Menu: Menu.extend({
      styles: {
        item: {
          fontWeight: 500,
        },
      },
    }),
    Code: Code.extend({
      styles: {
        root: {
          fontWeight: 500,
        },
      },
    }),
    Tooltip: Tooltip.extend({
      classNames: tooltipClasses,
    }),
    TooltipFloating: TooltipFloating.extend({
      classNames: tooltipClasses,
    }),
  },
}

export enum ColorProvider {
  Managed = 'Managed',
  Default = 'Default',
  Custom = 'Custom',
}

export interface CustomColor {
  provider: ColorProvider
  color: string
}

export const useCustomColor = () => {
  const [customColor, setCustomColorInner] = useLocalStorage<CustomColor>({
    key: 'custom-theme',
    defaultValue: { provider: ColorProvider.Managed, color: '' } as CustomColor,
    getInitialValueInEffect: false,
    serialize: (value: CustomColor) => {
      if (value.provider === ColorProvider.Custom && /^#[0-9A-F]{6}$/i.test(value.color)) {
        return value.color
      } else if (value.provider === ColorProvider.Managed) {
        return ''
      } else {
        return 'brand'
      }
    },
    deserialize: (value?: string) => {
      if (typeof value !== 'string') return { provider: ColorProvider.Managed, color: '' }

      if (value === 'brand') {
        return { provider: ColorProvider.Default, color: '' }
      } else if (/^#[0-9A-F]{6}$/i.test(value)) {
        return { provider: ColorProvider.Custom, color: value }
      } else {
        return { provider: ColorProvider.Managed, color: '' }
      }
    },
  })

  const setCustomColor = (color: CustomColor) => {
    // validate custom color, do not save invalid values
    if (color.provider === ColorProvider.Custom && !/^#[0-9A-F]{6}$/i.test(color.color)) return

    setCustomColorInner(color)
  }

  // color: null for use platform color, 'brand' for default theme
  //        or hex color string for custom color
  return { customColor, setCustomColor }
}

export const useCustomTheme = () => {
  const { config } = useConfig()
  const { customColor } = useCustomColor()

  const resolveManaged = (color: string | null | undefined) => {
    return color && /^#[0-9A-F]{6}$/i.test(color) ? color : null
  }

  const [theme, setTheme] = useState<MantineThemeOverride>(createTheme(CustomTheme))

  useEffect(() => {
    if (customColor.provider === ColorProvider.Default) {
      setTheme(CustomTheme)
      return
    }

    const resolvedColor =
      customColor.provider === ColorProvider.Custom
        ? customColor.color
        : customColor.provider === ColorProvider.Managed
          ? resolveManaged(config.customTheme)
          : null

    if (resolvedColor) {
      setTheme({
        ...CustomTheme,
        colors: {
          ...CustomTheme.colors,
          custom: generateColors(resolvedColor),
        },
        components: {
          ...CustomTheme.components,
          Avatar: Avatar.extend({
            defaultProps: {
              color: 'custom',
            },
          }),
        },
        primaryColor: 'custom',
      })
    } else {
      setTheme(CustomTheme)
    }
  }, [customColor, config.customTheme])

  return { theme }
}

export const useIsMobile = (limit?: number) => {
  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${limit ? `${limit}px` : theme.breakpoints.sm})`)
  return isMobile
}

interface UseDisplayInputStylesProps {
  ff?: 'monospace' | 'text'
  fw?: React.CSSProperties['fontWeight']
  lh?: React.CSSProperties['lineHeight']
  cs?: React.CSSProperties['cursor']
}

export const useDisplayInputStyles = createStyles(
  (theme, { fw = 'normal', lh = '1.5rem', ff = 'text', cs = 'auto' }: UseDisplayInputStylesProps) => ({
    wrapper: {
      width: '100%',
    },
    input: {
      fontWeight: fw,
      fontFamily: ff === 'text' ? theme.fontFamily : theme.fontFamilyMonospace,
      height: lh,
      lineHeight: lh,
      cursor: cs,
      userSelect: 'none',
      minHeight: '1rem',
      maxHeight: '2rem',
    },
  })
)
