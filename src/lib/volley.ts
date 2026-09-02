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

export const POSITIONS = {
  setter: "Связующий",
  outside: "Доигровщик",
  opposite: "Диагональный",
  middle: "Центральный блокирующий",
  libero: "Либеро",
} as const;

export type Position = keyof typeof POSITIONS;

export const SKILLS = {
  novice: "Новичок",
  amateur: "Любитель",
  intermediate: "Средний",
  advanced: "Продвинутый",
  strong: "Сильный",
} as const;

export type Skill = keyof typeof SKILLS;

export const ATTENDANCE = {
  pending: "Не отмечен",
  attended: "Пришёл",
  late: "Опоздал",
  no_show: "Не пришёл",
  cancelled: "Отменил участие",
} as const;

export type Attendance = keyof typeof ATTENDANCE;

export const GAME_FORMATS = ["2x2", "3x3", "4x4", "6x6", "Микст"] as const;

export type GameStatus = "open" | "almost" | "full" | "waitlist" | "closed" | "cancelled";

export const GAME_STATUS_LABEL: Record<GameStatus, string> = {
  open: "Есть места",
  almost: "Почти заполнено",
  full: "Заполнено",
  waitlist: "Лист ожидания",
  closed: "Набор закрыт",
  cancelled: "Отменена",
};

export const GAME_STATUS_CLASS: Record<GameStatus, string> = {
  open: "bg-emerald-100 text-emerald-800",
  almost: "bg-amber-100 text-amber-900",
  full: "bg-rose-100 text-rose-800",
  waitlist: "bg-sky-100 text-sky-800",
  closed: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground line-through",
};

export function gameStatus(opts: {
  confirmed: number;
  total: number;
  waiting?: number;
  isClosed?: boolean;
  isCancelled?: boolean;
}): GameStatus {
  if (opts.isCancelled) return "cancelled";
  if (opts.isClosed) return "closed";
  const free = opts.total - opts.confirmed;
  if (free <= 0) return (opts.waiting ?? 0) > 0 ? "waitlist" : "full";
  if (free <= Math.max(1, Math.round(opts.total * 0.25))) return "almost";
  return "open";
}

export function formatPrice(amount: number) {
  return amount > 0 ? `${amount.toLocaleString("ru-RU")} ₸` : "Бесплатно";
}

export function ageFromYear(year?: number | null) {
  if (!year) return null;
  const age = new Date().getFullYear() - year;
  return age > 5 && age < 100 ? age : null;
}

export const CITIES = ["Костанай", "Астана", "Алматы", "Караганда", "Актобе", "Павлодар"] as const;
