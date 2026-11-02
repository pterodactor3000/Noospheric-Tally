const PASSWORD_MIRROR_CHARACTER = '•'

const getInputMirrorText = (
  value: string,
  type: string | undefined,
): string => {
  if (type !== 'password') {
    return value
  }

  return Array.from(value, () => PASSWORD_MIRROR_CHARACTER).join('')
}

export { getInputMirrorText }
