import { StyleProp, rem } from '@mantine/core'
import { FC, SVGProps } from 'react'
import classes from '@Styles/Icon.module.css'

export interface MainIconProps {
  ignoreTheme?: boolean
  size?: StyleProp<React.CSSProperties['width']>
}

export const MainIcon: FC<MainIconProps & SVGProps<SVGSVGElement>> = ({ ignoreTheme, size, ...svgProps }) => {
  return (
    <svg
      width="480"
      height="480"
      viewBox="0 0 480 480"
      style={{
        width: rem(size) || 'auto',
        height: 'auto',
        aspectRatio: '1 / 1',
      }}
      {...svgProps}
    >
      <path className={ignoreTheme ? undefined : classes.main} fill={ignoreTheme ? '#fff' : undefined} d="M240 22 422 127v226L240 458 58 353V127Zm0 42L94 148v184l146 84 146-84V148Z" />
      <path className={ignoreTheme ? undefined : classes.front} fill={ignoreTheme ? '#fff' : undefined} d="m240 108 114 66v132l-114 66-114-66V174Zm0 42-78 45v90l78 45 78-45v-90Z" />
      <path className={ignoreTheme ? undefined : classes.mid} fill={ignoreTheme ? '#fff' : undefined} d="M224 178h32v46h46v32h-46v46h-32v-46h-46v-32h46Z" />
      <path className={ignoreTheme ? undefined : classes.back} fill={ignoreTheme ? '#fff' : undefined} d="M224 22h32v62h-32zM396 224h62v32h-62zM224 396h32v62h-32zM22 224h62v32H22z" />
    </svg>
  )
}
