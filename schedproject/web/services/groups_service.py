import math
from services.abstract_service import ID, AbstractService
from typing import TYPE_CHECKING, Dict, List, override

from routes import GroupsRoutes
from services.database_service import equals
from utils.statistics import stats

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class GroupsService(AbstractService):
    _table_name = "groups"

    def __init__(self, app: "InterfacesWebApp") -> None:
        super().__init__(app, GroupsRoutes)
        self.compute_groups()

    @override
    def _get_view_name(self) -> str | None:
        return "detailed_groups"

    def compute_meta_students(self):
        query = """
        SELECT * FROM student_course_junction
        """
        data = self.app.db_service.execute_query(query=query)

        students_courses = {}

        for row in data:
            if row["student_id"] not in students_courses:
                students_courses[row["student_id"]] = []
            students_courses[row["student_id"]].append(row["course_id"])

        meta_students = []

        done = []

        for s1 in students_courses:
            if s1 in done:
                continue
            same = [s1]
            done.append(s1)
            for s2 in students_courses:
                if s2 in done:
                    continue
                if set(students_courses[s1]) == set(students_courses[s2]):
                    same.append(s2)
                    done.append(s2)

            meta_students.append({"students": same, "courses": students_courses[s1]})

        return meta_students

    def get_groups_by_modality(self) -> Dict[int, List[dict]]:
        all_groups = self.get_all()

        groups_by_modality = {}
        for group in all_groups:
            modality_id = group["modality_id"]
            if modality_id not in groups_by_modality:
                groups_by_modality[modality_id] = []
            groups_by_modality[modality_id].append(group)

        return groups_by_modality

    def compute_groups(self):
        meta_students = self.compute_meta_students()
        all_student_group_associations = []

        for students_courses in meta_students:
            formation_associated = {}
            for course in students_courses["courses"]:
                formations = self.app.formations_service.get_formations_given_course(
                    course
                )
                for f in formations:
                    if f["name"] not in formation_associated:
                        formation_associated[f["name"]] = 0
                    formation_associated[f["name"]] += 1

            main_formation_name = max(
                formation_associated, key=lambda x: formation_associated[x]
            )

            all_modalities = set()
            for course_id in students_courses["courses"]:
                modalities_for_course = (
                    self.app.modalities_service.get_modalities_by_course(course_id)
                )
                for modality in modalities_for_course:
                    all_modalities.add(modality["id"])
            group_size_per_modality = (
                self.app.conf_service.nb_student_per_modality_class
            )
            max_group_size = min(
                [group_size_per_modality[key] for key in group_size_per_modality]
            )

            modalities_by_id = {}
            for m in self.app.modalities_service.get_by_ids(list(all_modalities)):
                modalities_by_id[m["id"]] = m

            for modality_id in all_modalities:
                group_size = max_group_size
                nb_groups = math.ceil(len(students_courses["students"]) / group_size)
                modality_name = modalities_by_id[modality_id]["modality"]

                data = [
                    {
                        "name": f"{main_formation_name}-{modality_name}-{i+1}",
                        "modality_id": modality_id,
                    }
                    for i in range(nb_groups)
                ]

                groups = self.create_multiple(data)
                student_list = students_courses["students"]

                for i, group in enumerate(groups):
                    start_idx = i * group_size
                    end_idx = min(start_idx + group_size, len(student_list))
                    students_in_group = student_list[start_idx:end_idx]

                    for student_id in students_in_group:
                        all_student_group_associations.append((student_id, group["id"]))

        if all_student_group_associations:
            values_str = ",".join(["(%s, %s)"] * len(all_student_group_associations))
            query = f"""
            INSERT INTO student_group_junction (student_id, group_id)
            VALUES {values_str}
            """
            flat_params = [
                item for pair in all_student_group_associations for item in pair
            ]
            self.app.db_service.execute_query(
                query=query, params=flat_params, awaits_result=False
            )

    @stats
    def get_group_classes_student(self, group_id: ID):
        return {
            "id": group_id,
            "headcount": self.get_by_id(group_id)["student_count"],
            "students": [
                j["student_id"]
                for j in self.app.db_service.filter_records(
                    "student_group_junction", equals("group_id", group_id)
                )
            ],
            "classes": [
                j["class_id"]
                for j in self.app.db_service.filter_records(
                    "group_class_junction", equals("group_id", group_id)
                )
            ],
        }

    def get_groups_by_class_ids(self, class_ids: list[ID]):
        if not class_ids:
            return []

        placeholders = ",".join(["%s"] * len(class_ids))

        query = f"""
        SELECT DISTINCT g.*
        FROM {self._table_name} g
        JOIN group_class_junction gcj ON g.id = gcj.group_id
        WHERE gcj.class_id IN ({placeholders})
        """

        results = self.app.db_service.execute_query(
            query=query, params=class_ids, awaits_result=True
        )
        return results
