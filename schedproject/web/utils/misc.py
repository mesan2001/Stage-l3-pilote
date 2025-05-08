import hashlib
import json
import os
import requests
import logging

import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Any
from flask import Flask

logger = logging.getLogger(__name__)


def generate_endpoints_summary(
    app: Flask,
    base_routes: list[str] = ["/api/"],
    output_path: str = os.path.join("template", "index.html"),
) -> None:

    categorized_endpoints: dict[str, dict[str, list[tuple]]] = {}

    with app.test_request_context():
        for rule in app.url_map.iter_rules():
            if rule.endpoint == "static":
                continue

            matching_base = None
            for base in base_routes:
                if rule.rule.startswith(base):
                    matching_base = base
                    break

            if matching_base is None:
                matching_base = ""

            remaining_path = rule.rule[len(matching_base) :].strip("/")
            parts = remaining_path.split("/")
            subcategory = parts[0].upper() if parts else "ROOT"

            display_base = matching_base.strip("/").upper() or "ROOT"

            if display_base not in categorized_endpoints:
                categorized_endpoints[display_base] = {}
            if subcategory not in categorized_endpoints[display_base]:
                categorized_endpoints[display_base][subcategory] = []

            methods = (
                [m for m in rule.methods if m not in {"HEAD", "OPTIONS"}]
                if rule.methods
                else []
            )
            method_links = []
            endpoint_str = rule.rule.replace("<", "&lt;").replace(">", "&gt;")
            for method in methods:
                try:
                    method_links.append(
                        f'<a href="{endpoint_str}" class="text-blue-500 hover:underline">{method}</a>'
                    )
                except Exception:
                    print("error")

                    method_links.append(f"{method}")

            method_links_str = ", ".join(method_links)

            categorized_endpoints[display_base][subcategory].append(
                (endpoint_str, method_links_str)
            )

    summary_html = generate_html_summary(categorized_endpoints)

    with open(os.path.join(os.getcwd(), output_path), "w") as f:
        f.write(summary_html)


def generate_html_summary(endpoints: dict[str, dict[str, list[tuple]]]) -> str:
    def build_html(data: dict[str, dict[str, list[tuple]]]) -> str:
        html = ""
        for base_category, subcategories in sorted(data.items()):
            html += f"<h1 class='text-2xl font-bold mt-6 mb-4'>{base_category}</h1>"
            for subcategory, routes in sorted(subcategories.items()):
                html += (
                    f"<h2 class='text-xl font-bold mt-4 mb-2 ml-4'>{subcategory}</h2>"
                )
                html += "<div class='ml-8'>"
                for route, methods in routes:
                    html += (
                        f"<div class='mb-2'>"
                        f"<span class='font-mono'>{route}</span> "
                        f"<span class='text-gray-600'>[{methods}]</span>"
                        f"</div>"
                    )
                html += "</div>"
        return html

    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Endpoint Summary</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100 p-6">
        <div class="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
            <h1 class="text-3xl font-bold mb-6">API Endpoint Summary</h1>
            <div class="space-y-2">
                {build_html(endpoints)}
            </div>
        </div>
    </body>
    </html>
    """


def populate_database(host, port) -> None:
    BASE_URL = "https://api.univ-angers.fr/api/edtLeria"
    YEAR = "2024"
    DATA_FOLDER = "_cache"

    def fetch(base_url: str, endpoint: str) -> list[dict[str, Any]]:
        with open("conf/key") as f:
            secret_key = f.read().strip()
        timestamp = int(datetime.now().timestamp())
        hsh = hashlib.sha512(f"{secret_key}-{timestamp}".encode()).hexdigest()

        headers = {
            "X-token": f"key={hsh},timestamp={timestamp}",
            "Content-Type": "application/json",
        }
        res: requests.Response = requests.get(
            url=f"{base_url}{endpoint}", headers=headers
        )
        logger.info(f"fetching ... {base_url}{endpoint}")

        if res.status_code == 200:
            return json.loads(res.text.replace("\u00e9", "é").replace("\u00e8", "è"))
        if res.status_code == 401:
            logger.error(res)
        return []

    def save_to_json(data: Any, filename: str) -> None:
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, "w") as json_file:
            json.dump(data, json_file, ensure_ascii=False, indent=4)
        logger.info(f"JSON saved to: {os.path.abspath(filename)}")

    def load_from_json(filename: str) -> Any:
        full_path = os.path.abspath(filename)
        logger.info(f"Attempting to load JSON from: .{full_path}")
        if os.path.exists(filename):
            with open(filename, "r") as json_file:
                data = json_file.read()
                return json.loads(data)
        return None

    def push_to_database(
        data: Any, table_name: str, primary_key: str | None = None
    ) -> requests.Response | None:

        tables = requests.get(url=f"{host}:{port}/tables/raw").json()
        logger.info(f"tables gathered : {tables}")
        if table_name in tables:
            operator = "insert"
        else:
            operator = "create_table"

        url = f"{host}:{port}/{operator}/fromjson/{table_name}"
        logger.info(f"Pushing to {url}")
        response = requests.post(url=url, json=data)
        if response.status_code < 400:
            return response
        else:
            logger.error(f"Error pushing to database: {response.status_code}")
            return None

    endpoints = {
        "raw_agent": f"/enseignant/{YEAR}",
        "raw_room": f"/salle/{YEAR}",
        "raw_step": f"/etape/{YEAR}",
    }

    for table_name, endpoint in endpoints.items():
        filename = os.path.join(DATA_FOLDER, f"{table_name}.json")
        if not (data := load_from_json(filename)):
            data = fetch(base_url=BASE_URL, endpoint=endpoint)
        if data is not None:
            save_to_json(data, filename)
            push_result = push_to_database(data=data, table_name=table_name)
            if push_result is None:
                logger.error(f"Failed to push {table_name} to database")

    if not (steps := load_from_json(os.path.join(DATA_FOLDER, "raw_step.json"))):
        steps = fetch(base_url=BASE_URL, endpoint=endpoints["raw_step"])

    if steps is not None:
        save_to_json(steps, os.path.join(DATA_FOLDER, "raw_step.json"))

        for step in steps:
            step_code = step["codeEtape"]
            filename = os.path.join(DATA_FOLDER, f"raw_courses_{step_code}.json")

            if os.path.exists(filename):
                data = load_from_json(filename)
            else:
                data = fetch(
                    base_url=BASE_URL, endpoint=f"/maquette/{YEAR}/{step_code}"
                )

            if data is not None:
                save_to_json(data, filename)
                ret = push_to_database(data=data, table_name="raw_courses")
                if ret is not None:
                    logger.info(f"{ret.status_code}, {ret.text}")
                else:
                    logger.error(
                        f"Failed to push raw_courses for step {step_code} to database"
                    )


def parse_rules_catalog(file_path: str) -> dict[str, dict[str, Any]]:
    tree = ET.parse(file_path)
    root = tree.getroot()

    rules: dict[str, dict[str, Any]] = {}

    for constraint in root.findall("constraint"):
        rule_id = constraint.findtext("id", "")
        rule: dict[str, Any] = {
            "id": rule_id,
            "name": constraint.findtext("name", ""),
            "arity": int(constraint.findtext("arity") or 0),
            "parameters": [],
            "keywords": [],
            "description": {},
            "latex": {},
        }

        params = constraint.find("parameters")
        if params is not None:
            rule["parameters"] = [
                {
                    "name": param.get("name", ""),
                    "type": param.get("type", ""),
                    "description": param.text.strip() if param.text else "",
                    "mandatory": param.get("mandatory") == "1",
                    "optional": param.get("optionnel") == "1",
                }
                for param in params.findall("parameter")
            ]

        keywords = constraint.findtext("keywords")
        if keywords:
            rule["keywords"] = [kw.strip() for kw in keywords.split(",")]

        for desc in constraint.findall("description"):
            lang = desc.get("lang", "en")
            rule["description"][lang] = {
                "short": desc.findtext("short", ""),
                "long": desc.findtext("long", ""),
            }

        latex = constraint.find("latex")
        if latex is not None:
            rule["latex"] = {
                "entry": latex.findtext("entry", ""),
                "setEntry": latex.findtext("setEntry", ""),
                "equation": latex.findtext("equation", ""),
            }

        rules[rule_id] = rule

    return rules
