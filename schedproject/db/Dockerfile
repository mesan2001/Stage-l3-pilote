FROM python:3.12.4-slim

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir /app

WORKDIR /app

COPY . .

VOLUME ["/app"]

EXPOSE 5000

RUN rm -rf .population .transformation

CMD ["sh", "-c", "python app.docker.py"]
