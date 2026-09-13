export function FieldError({ message }: { message?: string }) {
  return message ? <small className="form-error" role="alert">{message}</small> : null
}
