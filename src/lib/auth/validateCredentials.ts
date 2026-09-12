interface CredentialFields {
  email: string
  password: string
}

interface ValidCredentials {
  status: 'valid'
  email: string
  password: string
}

interface InvalidCredentials {
  status: 'invalid'
  field: 'email' | 'password'
  message: string
}

type CredentialValidationResult = ValidCredentials | InvalidCredentials

const MINIMUM_PASSWORD_LENGTH = 6
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const MISSING_EMAIL_MESSAGE = 'Enter an email address.'
const MALFORMED_EMAIL_MESSAGE = 'Enter a valid email address.'
const MISSING_PASSWORD_MESSAGE = 'Enter a password.'
const SHORT_PASSWORD_MESSAGE = `Password must be at least ${MINIMUM_PASSWORD_LENGTH} characters.`

const validateCredentials = ({
  email,
  password,
}: CredentialFields): CredentialValidationResult => {
  const trimmedEmail = email.trim()
  const trimmedPassword = password.trim()

  if (!trimmedEmail) {
    return {
      status: 'invalid',
      field: 'email',
      message: MISSING_EMAIL_MESSAGE,
    }
  }

  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    return {
      status: 'invalid',
      field: 'email',
      message: MALFORMED_EMAIL_MESSAGE,
    }
  }

  if (!trimmedPassword) {
    return {
      status: 'invalid',
      field: 'password',
      message: MISSING_PASSWORD_MESSAGE,
    }
  }

  if (trimmedPassword.length < MINIMUM_PASSWORD_LENGTH) {
    return {
      status: 'invalid',
      field: 'password',
      message: SHORT_PASSWORD_MESSAGE,
    }
  }

  return {
    status: 'valid',
    email: trimmedEmail,
    password: trimmedPassword,
  }
}

export { validateCredentials }
