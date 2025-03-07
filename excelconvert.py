import pandas as pd

# Чтение Excel файла
df = pd.read_excel('data.xlsx')

# Преобразование данных в JSON
json_data = df.to_json(orient='records')

# Сохраните результат как JSON
with open('data.json', 'w') as f:
    f.write(json_data)
