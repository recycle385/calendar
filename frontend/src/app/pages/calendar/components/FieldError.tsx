export function FieldError({ message }: { message?: string }) {
  return message ? <small className="text-xs font-bold text-[#df4d4d]" role="alert">{message}</small> : null
}
