import json
import logging
import random

from services.abstract_service import ID, AbstractService

from typing import TYPE_CHECKING, override

from routes import PerimetersRoutes
from services.database_service import FilterSet, equals, ilike
from utils.statistics import stats

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp

random.seed(1)

logger = logging.getLogger(__name__)


class PerimetersService(AbstractService):
    _table_name = "perimeters"

    def __init__(self, app: "InterfacesWebApp") -> None:
        self.app = app
        self.routes = PerimetersRoutes(app=app, service=self).commit_routes()

    def _generate_rules(self, ret):
        rules = []
        rule_id = 1

        course_ids = [course["id"] for course in ret["courses"]]

        modality_by_course = {}
        for course in ret["courses"]:
            modality_by_course[course["id"]] = [part["id"] for part in course["parts"]]
        teacher_ids = [teacher["id"] for teacher in ret["teachers"]]

        rules.append(
            {
                "id": rule_id,
                "labels": ["student_no_overlap"],
                "selector": [{"generator": "(student, *)", "filter": ""}],
                "constraint": {"name": "noOverlap", "type": "hard"},
            }
        )
        rule_id += 1

        rules.append(
            {
                "id": rule_id,
                "labels": ["teacher_no_overlap"],
                "selector": [{"generator": "(teacher, *)", "filter": ""}],
                "constraint": {"name": "noOverlap", "type": "hard"},
            }
        )
        rule_id += 1

        rules.append(
            {
                "id": rule_id,
                "labels": ["room_no_overlap"],
                "selector": [{"generator": "(room, *)", "filter": ""}],
                "constraint": {"name": "noOverlap", "type": "hard"},
            }
        )
        rule_id += 1

        for course in ret["courses"]:
            course_id = course["id"]

            if len(course["parts"]) > 1:
                rules.append(
                    {
                        "id": rule_id,
                        "labels": ["scheduling_rule"],
                        "selector": [
                            {
                                "generator": "(class, *)",
                                "filter": f"course[id='{course_id}']",
                            }
                        ],
                        "constraint": {"name": "sameRooms", "type": "hard"},
                    }
                )
                rule_id += 1

                if len(course["parts"]) >= 2:
                    rules.append(
                        {
                            "id": rule_id,
                            "labels": ["lecture_spacing"],
                            "selector": [
                                {
                                    "generator": "(class, {1})",
                                    "filter": f"part[id='{course['parts'][0]['id']}']",
                                }
                            ],
                            "constraint": {
                                "name": "periodic",
                                "type": "hard",
                                "parameters": [
                                    [
                                        {"value": "1", "type": "value"},
                                        {"value": "week", "type": "unit"},
                                    ]
                                ],
                            },
                        }
                    )
                    rule_id += 1

                    rules.append(
                        {
                            "id": rule_id,
                            "labels": ["tutorial_after_lecture"],
                            "selector": [
                                {
                                    "generator": "(class, {1})",
                                    "filter": f"part[id='{course['parts'][0]['id']}']",
                                },
                                {
                                    "generator": "(class, {2})",
                                    "filter": f"part[id='{course['parts'][1]['id']}']",
                                },
                            ],
                            "constraint": {"name": "sequenced", "type": "hard"},
                        }
                    )
                    rule_id += 1

        return rules

    @stats
    def create_instance(self, step_ids: list[int]):
        ret = {
            "name": "University Fall Semester 2023",
            "nrWeeks": 15,
            "nrDaysPerWeek": 5,
            "nrSlotsPerDay": 12,
        }
        rooms = []
        teachers = []
        courses = []
        rules = []
        _n_sessions = 0
        _rooms = (
            self.app.classrooms_service.filter(equals("building", "I"))
            + self.app.classrooms_service.filter(equals("building", "A"))
            + self.app.classrooms_service.filter(equals("building", "L"))
        )

        for r in _rooms:
            rooms.append(
                {
                    "id": r["id"],
                    "capacity": int(r["capacity"] or 40),
                    "label": self.app.labels_service.get_label_expression(
                        resource_type="classrooms", resource_id=r["id"]
                    ),
                }
            )
        _rooms = []
        ret["rooms"] = rooms

        _teachers = random.sample(self.app.lecturers_service.get_all(), 20)
        for t in _teachers:
            teachers.append(
                {
                    "id": t["id"],
                    "label": self.app.labels_service.get_label_expression(
                        resource_type="lecturers", resource_id=t["id"]
                    ),
                }
            )
        _teachers = []
        ret["teachers"] = teachers

        for step_id in step_ids:
            courses.extend(self.app.courses_service.get_courses_by_step(step_id))

        ret["students"] = self.app.students_service.get_students_by_courses(
            [c["id"] for c in courses]
        )

        for s in ret["students"]:
            s["courses"] = [c["id"] for c in courses]

        ret["courses"] = []

        groups = []

        _all_classes_id = []

        _real_teacher_used = []
        _real_room_used = []

        for course in courses:
            ret_course = {
                "label": self.app.labels_service.get_label_expression(
                    resource_type="courses", resource_id=course["id"]
                ),
                "id": course["id"],
                "parts": [],
            }
            for modality in self.app.modalities_service.get_modalities_by_course(
                course_id=course["id"]
            ):

                ret_modality = {
                    "id": modality["id"],
                    "label": self.app.labels_service.get_label_expression(
                        resource_type="modalities", resource_id=modality["id"]
                    ),
                    "sessionLength": int(modality.get("session_length", 80) or 80),
                    "sessionRooms": modality.get("session_rooms", "single") or "single",
                    "sessionTeachers": str(
                        modality.get("sessions_teachers", "1") or "1"
                    ),
                    "classes": {
                        "maxHeadCount": self.app.conf_service.nb_student_per_modality_class.get(
                            modality["modality"], 20
                        )
                        or 20,
                        "items": [],
                    },
                    "allowedSlots": {
                        "sessionLength": int(modality.get("session_length", 80) or 80),
                        "dailySlots": "480,540,600,660,720,780,840,900,960,1020,1080",
                        "days": "1,2,3,4,5",
                        "weeks": "1,2,3,4,5,6,7,8,9,10",
                    },
                    "allowedRooms": {
                        "sessionRooms": "single",
                        "rooms": [
                            r["id"] for r in random.sample(rooms, random.randint(2, 10))
                        ],
                    },
                }

                _real_room_used.extend(ret_modality["allowedRooms"]["rooms"])

                classes = self.app.classes_service.filter(
                    equals("modality_id", modality["id"])
                )

                ret_modality["nrSessions"] = int(
                    ((float(modality.get("hours", 10) or 10)) * 60)
                    / (int(modality.get("session_length", 80) or 80))
                )

                for c in classes:
                    ret_modality["classes"]["items"].append(
                        {
                            "id": c["id"],
                            "label": self.app.labels_service.get_label_expression(
                                resource_type="classes", resource_id=c["id"]
                            ),
                        }
                    )
                    _all_classes_id.append(c["id"])

                assignments = self.app.lecturer_assignments_service.get_by_modality_id(
                    modality["id"]
                )
                if assignments:
                    for assignment in assignments:
                        pass
                else:
                    r = random.randint(2, 4)
                    effective_nr_sessions = ret_modality["nrSessions"] * len(classes)

                    if int(effective_nr_sessions) / r != 0:
                        r = 1

                    selected_teachers = random.sample(teachers, r)
                    nr_sessions_per_teacher = str(int(int(effective_nr_sessions) / r))

                    for s in selected_teachers:
                        _real_teacher_used.append(s["id"])

                    ret_modality["allowedTeachers"] = {
                        "sessionTeachers": ret_modality["sessionTeachers"],
                        "teachers": [
                            {"id": t["id"], "nrSessions": nr_sessions_per_teacher}
                            for t in selected_teachers
                        ],
                    }

                ret_course["parts"].append(ret_modality)
            ret["courses"].append(ret_course)

        ret["rules"] = self._generate_rules(ret)

        groups_ids = [
            g["id"]
            for g in self.app.groups_service.get_groups_by_class_ids(_all_classes_id)
        ]

        ret["solution"] = {
            "groups": [
                self.app.groups_service.get_group_classes_student(g) for g in groups_ids
            ]
        }

        ret["rooms"] = [room for room in ret["rooms"] if room["id"] in _real_room_used]

        ret["teachers"] = [
            teacher
            for teacher in ret["teachers"]
            if teacher["id"] in _real_teacher_used
        ]

        return {"timetabling": ret}
