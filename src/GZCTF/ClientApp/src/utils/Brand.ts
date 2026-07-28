export const DEFAULT_PLATFORM_NAME = 'GZCTF'

/** 平台展示名：优先使用后台配置的平台名称，留空时回退到默认值 */
export const getPlatformName = (title?: string | null) => {
  const normalized = title?.trim()

  return normalized && normalized.length > 0 ? normalized : DEFAULT_PLATFORM_NAME
}
