# Volley Connect

Создай полноценный веб-сайт (не телеграм-бота) для волейбольного сообщества города, с базой данных (Lovable Cloud) и системой аккаунтов/ролей.

Раздел 1 — "Тренировки":
- Список открытых тренировок по волейболу в городе: дата/время, место, уровень игры (новичок/средний/продвинутый), сколько игроков нужно всего и сколько свободных мест осталось.
- Организатор тренировки может создать тренировку (указать место, время, нужное количество игроков, уровень).
- Игроки могут откликнуться/подать заявку на участие в тренировке.
- Организатор видит заявки и может подтвердить (забронировать место за игроком) или отклонить; после подтверждения место у игрока считается занятым, счётчик свободных мест уменьшается.

Раздел 2 — "Турниры":
- Список будущих турниров по волейболу в городе: название, дата, место, статус регистрации.
- У каждого турнира — список зарегистрированных команд и участников в каждой команде.
- Организатор турнира может создать турнир и добавлять/подтверждать команды и участников.

Общее:
- Нужна регистрация/вход пользователей с ролями: обычный игрок и организатор (организатор может создавать тренировки/турниры и подтверждать заявки).
- Простая понятная навигация между разделами "Тренировки" и "Турниры", современный чистый дизайн, адаптивный под мобильные устройства.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://spike-squad-finder.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d42c54be-2b12-40a6-8371-670633b54337).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
