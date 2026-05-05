
import { signup } from  '@/actions/auth'

export function SignupForm() {
 
  return (
    <form action={signup} className="space-y-4">
      <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="name"
              required
              minLength={6}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded bg-black py-2 text-white hover:bg-gray-800"
          >
            Sign up
          </button>
        </form>
  )
}