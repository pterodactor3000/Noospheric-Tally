import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const Login = () => {
  return (
    <div>
      <Input placeholder="Email" type="email" />
      <Input placeholder="Password" type="password" />
      <Button>Login</Button>
    </div>
  )
}

export default Login
