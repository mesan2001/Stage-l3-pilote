### Filtre

```http
POST /api/courses/filter
Content-Type: application/json

[
  {
    "column": "coursename",
    "operator": "=",
    "value": "Mathématiques"
  }
]
```

### Utilisation de conditions multiples

```http
POST /api/lecturers/filter
Content-Type: application/json

[
  {
    "column": "name",
    "operator": "LIKE",
    "value": "Smith"
  },
  {
    "column": "hourly_volume",
    "operator": ">",
    "value": "20"
  }
]
```

### Filtrage complexe

```http
POST /api/modalities/filter
Content-Type: application/json

[
  {
    "column": "modality",
    "operator": "IN",
    "value": ["Lab", "Lecture", "Tutorial"]
  },
  {
    "column": "hours",
    "operator": "BETWEEN",
    "value": [10, 30]
  }
]
```

| Opérateur     | Description                                     | Exemple                                                                          |
| ------------- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| `=`           | Égal à                                          | `{"column": "name", "operator": "=", "value": "John"}`                           |
| `!=`          | Différent de                                    | `{"column": "status", "operator": "!=", "value": "inactive"}`                    |
| `>`           | Plus grand que                                  | `{"column": "hours", "operator": ">", "value": 10}`                              |
| `<`           | Plus petit que                                  | `{"column": "price", "operator": "<", "value": 100}`                             |
| `>=`          | Plus grand ou égal à                            | `{"column": "age", "operator": ">=", "value": 18}`                               |
| `<=`          | Plus petit ou égal à                            | `{"column": "quantity", "operator": "<=", "value": 50}`                          |
| `LIKE`        | Correspondance de motif (sensible à la casse)   | `{"column": "name", "operator": "LIKE", "value": "%Smith%"}`                     |
| `ILIKE`       | Correspondance de motif (insensible à la casse) | `{"column": "email", "operator": "ILIKE", "value": "%gmail.com"}`                |
| `IN`          | Dans une liste de valeurs                       | `{"column": "status", "operator": "IN", "value": ["active", "pending"]}`         |
| `NOT IN`      | Pas dans une liste de valeurs                   | `{"column": "category", "operator": "NOT IN", "value": ["archived", "deleted"]}` |
| `IS NULL`     | Est nul                                         | `{"column": "completion_date", "operator": "IS NULL"}`                           |
| `IS NOT NULL` | N'est pas nul                                   | `{"column": "email", "operator": "IS NOT NULL"}`                                 |
| `BETWEEN`     | Entre deux valeurs                              | `{"column": "price", "operator": "BETWEEN", "value": [10, 50]}`                  |
