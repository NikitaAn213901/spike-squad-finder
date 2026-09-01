export const LEVELS = {
  beginner: "Новичок",
  intermediate: "Средний",
  advanced: "Продвинутый",
} as const;

export type Level = keyof typeof LEVELS;

export const SIGNUP_STATUS = {
  pending: "Заявка",
  confirmed: "Подтверждён",
  rejected: "Отклонён",
} as const;

export const REGISTRATION_STATUS = {
  open: "Регистрация открыта",
  closed: "Регистрация закрыта",
  finished: "Завершён",
} as const;

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const shortDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
});

export function formatDateTime(iso: string) {
  return dateFormatter.format(new Date(iso));
}

export function formatDate(iso: string) {
  return shortDateFormatter.format(new Date(iso));
}

export function toLocalInputValue(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
