from enum import Enum
from services.abstract_service import AbstractService, logger
from typing import TYPE_CHECKING

from routes import ClassesRoutes
from services.database_service import ID, equals

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class ClassesServices(AbstractService):
    _table_name = "classes"

    def __init__(self, app: "InterfacesWebApp") -> None:
        super().__init__(app, ClassesRoutes)
        self.create_classes()

    def create_classes(self):
        nb_student_per_modality = self.app.conf_service.nb_student_per_modality_class

        groups_by_modality = self.app.groups_service.get_groups_by_modality()

        modalities_detail = self.app.modalities_service.get_by_ids(
            list(groups_by_modality.keys())
        )

        classes = []
        group_class = []

        courses_by_id = {}

        courses = self.app.courses_service.get_by_ids(
            list(set([m["course_id"] for m in modalities_detail]))
        )

        for c in courses:
            courses_by_id[c["id"]] = c
        courses = []

        for modality in modalities_detail:
            max_nb_student = nb_student_per_modality.get(modality["modality"], 20)

            sum_headcount = max(
                [int(g["student_count"]) for g in groups_by_modality[modality["id"]]]
            ) * len(groups_by_modality[modality["id"]])

            nb_classes_required = sum_headcount // max_nb_student

            count = 0
            group_assignement = [[] for _ in range(nb_classes_required)]
            idx = 0
            for group in groups_by_modality[modality["id"]]:
                if count + int(group["student_count"]) > max_nb_student:
                    idx += 1
                    count = 0
                    if idx >= nb_classes_required:
                        raise ValueError(
                            "Something went wrong durring the calculation of the groups classes attribution"
                        )

                group_assignement[idx].append(group)
                count += int(group["student_count"])

            course_name = courses_by_id[modality["course_id"]]["coursename"]
            values = []
            value_placeholders = []
            for f_class, groups in enumerate(group_assignement):

                classes.append(
                    {
                        "name": f"{course_name}-{modality['modality']}-{f_class}[{', '.join([g['name'] for g in groups])}]",
                        "modality_id": modality["id"],
                    }
                )

                for i, group in enumerate(groups):
                    group_class.append((group["id"], len(classes) - 1))

        classes_after_insert = self.create_multiple(data=classes)
        data = []
        for gc in group_class:
            data.append(
                {"group_id": gc[0], "class_id": classes_after_insert[gc[1]]["id"]}
            )

        self.app.db_service.create_records("group_class_junction", data)

    def get_modality_headcount(self, modality_id: ID):
        query = """
            SELECT COUNT(*)
        """
