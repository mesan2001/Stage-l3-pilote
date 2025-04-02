FROM python:3.12.4-slim

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir /web

WORKDIR /web

RUN chmod -R 777 /web
COPY . .


VOLUME ["/web"]


CMD ["sh", "-c", "python app.docker.py"]
