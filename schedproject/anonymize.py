import json
import random
from faker import Faker
import argparse
from pathlib import Path


def anonymize_teacher_data(input_path, output_path=None):
    fake = Faker("fr_FR")

    with open(input_path, "r", encoding="utf-8") as file:
        data = json.load(file)

    for teacher in data:
        teacher["nomEnseignant"] = fake.last_name().lower()
        teacher["prenomEnseignant"] = fake.first_name().lower()

        if teacher["volumeHoraire"] is not None:
            teacher["volumeHoraire"] = str(random.randint(30, 200))

        teacher["uuidEnseignant"] = str(random.randint(1, 50000))

    if output_path is None:
        input_file = Path(input_path)
        output_path = input_file.parent / f"anonymized_{input_file.name}"

    with open(output_path, "w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=4)

    print(f"Anonymized data saved to {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Anonymize teacher data in JSON file")
    parser.add_argument("input_path", help="Path to the input JSON file")
    parser.add_argument(
        "--output_path", help="Path to save the output JSON file (optional)"
    )

    args = parser.parse_args()

    anonymize_teacher_data(args.input_path, args.output_path)
