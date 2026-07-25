/**
 * Exhaustiveness check for discriminated unions (e.g. the `Beat` union in
 * schema/). Calling this in an unreachable `default` branch makes it a
 * compile-time error to add a new union member without handling it.
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled discriminated union member: ${JSON.stringify(value)}`)
}
