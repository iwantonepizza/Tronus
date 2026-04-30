# Колоды Вестероса — список карт
# CR-009 / T-128 — заполнить реальными slug'ами карт
#
# Файл загружен владельцем проекта, но пришёл пустым.
# Когда данные будут готовы — заполнить по шаблону ниже
# и передать в T-128 для замены placeholder-slugов в backend.
#
# Формат:
#   колода: westeros_1 | westeros_2 | westeros_3 | wildlings
#   slug: snake_case (используется в MatchTimelineEvent.payload.card_slug)
#   name_ru: отображаемое имя на русском
#
# Пример:
# ---
# - deck: westeros_1
#   slug: supply
#   name_ru: Снабжение
#
# - deck: westeros_2
#   slug: clash_of_kings
#   name_ru: Битва королей
#
# - deck: wildlings
#   slug: horn_of_winter
#   name_ru: Рог зимы
