from core.controller import PostgreSQLAPIController as PostgreSQLAPIController


a = PostgreSQLAPIController(
    user="postgres", password="mysecretpassword", host="db", port="5432"
).run()
