# Insight — схема базы данных

<img width="2362" height="988" alt="database" src="https://github.com/user-attachments/assets/c5be5f13-a3a0-4f0d-b123-7e1a75e95ad1" />


## Как использовать

Код диаграммы написан на языке DBML (Database Markup Language).  
Откройте https://dbdiagram.io, вставьте код ниже в левую панель.

---

## Код диаграммы (DBML)
```
Table users {
  id            uuid      [pk]
  name          varchar   [not null]
  email         varchar   [not null, unique]
  password_hash varchar   [not null]
  created_at    timestamp [not null, default: `now()`]
}

Table sites {
  id         uuid      [pk]
  user_id    uuid      [not null, ref: > users.id]
  name       varchar   [not null]
  domain     varchar   [not null]
  site_key   varchar   [not null, unique]
  created_at timestamp [not null, default: `now()`]
}

Table campaigns {
  id         uuid      [pk]
  site_id    uuid      [not null, ref: > sites.id]
  name       varchar   [not null]
  target_url varchar   [not null]
  token      varchar   [not null, unique]
  status     varchar   [not null, default: 'active']
  created_at timestamp [not null, default: `now()`]
}

Table participants {
  id          uuid      [pk]
  age_group   varchar
  gender      varchar
  profession  varchar
  vision      varchar
  created_at  timestamp [not null, default: `now()`]
}

Table sessions {
  id             uuid      [pk]
  campaign_id    uuid      [not null, ref: > campaigns.id]
  participant_id uuid      [not null, ref: > participants.id]
  focus_pct      float
  duration_sec   int
  started_at     timestamp [not null]
  ended_at       timestamp
}

Table gaze_events {
  id          uuid      [pk]
  session_id  uuid      [not null, ref: > sessions.id]
  type        varchar   [not null]
  x           float
  y           float
  element_id  varchar
  element_tag varchar
  ts          timestamp [not null]
}
```

---

## Документация по таблицам

### users
Владельцы сайтов — те, кто регистрируется в Insight и подключает свои сайты к сервису.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | Первичный ключ |
| name | varchar | Имя владельца аккаунта |
| email | varchar | Email для входа, уникальный |
| password_hash | varchar | Хэш пароля (bcrypt) |
| created_at | timestamp | Дата регистрации |

---

### sites
Сайты, подключённые к сервису. Один пользователь может иметь несколько сайтов.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | Первичный ключ |
| user_id | uuid | FK → users.id |
| name | varchar | Название проекта |
| domain | varchar | Домен сайта |
| site_key | varchar | Уникальный ключ для SDK (data-site-id), выдаётся при создании сайта |
| created_at | timestamp | Дата подключения |

---

### campaigns
Тестовая кампания — единица исследования. Генерирует пригласительную ссылку для участников. SDK активируется только при наличии токена в URL (?test=TOKEN), обычные посетители сайта не затрагиваются.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | Первичный ключ |
| site_id | uuid | FK → sites.id |
| name | varchar | Название кампании |
| target_url | varchar | URL тестируемой страницы |
| token | varchar | Уникальный токен приглашения |
| status | varchar | active / archived |
| created_at | timestamp | Дата создания |

---

### participants
Участник тестовой сессии. Хранится отдельно от sessions, так как один участник теоретически может пройти несколько сессий. Персональные данные не собираются — только анонимные демографические категории из анкеты.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | Первичный ключ |
| age_group | varchar | Возрастная группа |
| gender | varchar | Пол: male / female / prefer_not_to_say |
| profession | varchar | Профессия |
| vision | varchar | Зрение |
| created_at | timestamp | Дата заполнения анкеты |

---
### sessions
Одна сессия = один прогон теста одним участником в рамках одной кампании. ended_at может быть NULL, если участник закрыл вкладку до корректного завершения сессии.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | Первичный ключ |
| campaign_id | uuid | FK → campaigns.id |
| participant_id | uuid | FK → participants.id |
| focus_pct | float | Агрегированный % времени, когда лицо было направлено на экран |
| duration_sec | int | Общая длительность сессии в секундах |
| started_at | timestamp | Начало сессии |
| ended_at | timestamp | Конец сессии (NULL если сессия прервана) |

---

### gaze_events
Сырые события от SDK. Самая большая таблица — генерирует около 10-30 записей в секунду на каждую активную сессию. Координаты x и y могут быть NULL для событий без позиции (например, focus_lost).

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | Первичный ключ |
| session_id | uuid | FK → sessions.id |
| type | varchar | Тип события: gaze / focus_lost / focus_returned / click |
| x | float | X-координата взгляда (CSS px) |
| y | float | Y-координата взгляда (CSS px) |
| element_id | varchar | id DOM-элемента под точкой взгляда |
| element_tag | varchar | Тег DOM-элемента: section / p / button и т.д. |
| ts | timestamp | Точное время события |

---

## Связи

| Откуда | Куда | Тип | Смысл |
|--------|------|-----|-------|
| sites.user_id | users.id | many-to-one | У одного пользователя много сайтов |
| campaigns.site_id | sites.id | many-to-one | На одном сайте много кампаний |
| sessions.campaign_id | campaigns.id | many-to-one | В одной кампании много сессий |
| sessions.participant_id | participants.id | many-to-one | Один участник может пройти несколько сессий |
| gaze_events.session_id | sessions.id | many-to-one | В одной сессии много событий |
