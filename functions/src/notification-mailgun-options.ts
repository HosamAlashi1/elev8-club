/**
 * Disable Mailgun tracking only for the second page's notification messages.
 * @param {URLSearchParams} form The notification's Mailgun request.
 */
export function disableNotificationTracking(form: URLSearchParams): void {
  form.set("o:tracking", "no");
  form.set("o:tracking-clicks", "no");
  form.set("o:tracking-opens", "no");
}
