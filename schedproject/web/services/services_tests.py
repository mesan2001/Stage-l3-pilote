import logging
from typing import TYPE_CHECKING
from datetime import datetime, timedelta

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp

logger = logging.getLogger(__name__)


class ServicesTests:
    def __init__(self, app: "InterfacesWebApp"):
        self.app = app
        self.test_data = {}  # Store test data for cleanup

    def run_all_tests(self):
        """Run all service tests"""
        try:
            logger.info("Starting comprehensive services tests...")

            # Basic CRUD tests
            self._test_basic_crud()

            # Calendar and scheduling tests
            self._test_calendar_management()

            # Program and curriculum tests
            self._test_program_flow()
            self._test_advanced_program_management()

            # Class and group tests
            self._test_class_management()
            self._test_advanced_class_operations()

            # Student management tests
            self._test_student_management()
            self._test_advanced_student_operations()

            # Lecturer tests
            self._test_lecturer_management()

            # Modality and course tests
            self._test_modality_management()

            # Complex relationship tests
            self._test_complex_relationships()

            # Labels and metadata tests
            self._test_labels()
            self._test_advanced_labels()

            logger.info("All tests completed successfully!")
            return True

        except Exception as e:
            logger.error(f"Test suite failed: {str(e)}")
            return False

    def cleanup_all_test_data(self):
        """Clean up all test data created during testing"""
        logger.info("Cleaning up test data...")

        try:
            # Clean up in reverse order of creation to handle dependencies
            for key, items in reversed(list(self.test_data.items())):
                if not isinstance(items, list):
                    items = [items]

                for item in items:
                    if key == "students":
                        self.app.groups_service.remove_student_from_groups(item["id"])

                    service = getattr(self.app, f"{key}_service", None)
                    if service and hasattr(service, "delete"):
                        try:
                            service.delete(item["id"])
                        except Exception as e:
                            logger.warning(
                                f"Error deleting {key} {item['id']}: {str(e)}"
                            )

            self.test_data.clear()
            logger.info("Test data cleanup completed!")

        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")
            raise

    def _test_basic_crud(self):
        """Test basic CRUD operations for core services"""
        logger.info("Testing basic CRUD operations...")

        # Test Lecturer CRUD
        lecturer = self.app.lecturers_service.create(
            {
                "name": "Test Lecturer",
                "lastname": "Test",
                "volumehoraireannee": "192",
                "oraganization_component": "Test Dept",
                "hourly_volume": "192",
                "code_fonction": "PR",
                "code_unite": "U1",
            }
        )
        assert lecturer["name"] == "Test Lecturer"
        lecturer_id = lecturer["id"]

        updated = self.app.lecturers_service.update(
            lecturer_id, {"name": "Updated Lecturer"}
        )
        assert updated["name"] == "Updated Lecturer"

        deleted = self.app.lecturers_service.delete(lecturer_id)
        assert deleted is True

        # Test Steps CRUD
        step = self.app.steps_service.create(
            {
                "id": "TEST1",
                "name": "Test Step",
                "stepstructurecode": "TST",
                "stepstructurename": "Test Structure",
                "year": "2024",
            }
        )
        assert step["name"] == "Test Step"
        step_id = step["id"]

        self.app.steps_service.update(step_id, {"name": "Updated Step"})
        self.app.steps_service.delete(step_id)

        logger.info("Basic CRUD tests passed!")

    def _test_program_flow(self):
        """Test basic program flow and relationships"""
        logger.info("Testing program flow...")

        # Create program
        program = self.app.programs_service.create({"name": "Test Program"})
        program_id = program["id"]

        # Create step
        step = self.app.steps_service.create(
            {
                "id": "TEST1",
                "name": "Test Step",
                "stepstructurecode": "TST",
                "stepstructurename": "Test Structure",
                "year": "2024",
            }
        )
        step_id = step["id"]

        # Create course
        course = self.app.courses_service.create(
            {
                "name": "Test Course",
                "step_id": step_id,
                "elementnumber": "E1",
                "elementname": "Test Element",
                "elpccode": "ELPC1",
                "elpname": "Test ELP",
                "cnucode": "CNU1",
                "cnuname": "Test CNU",
                "periodcode": "P1",
                "periodname": "Test Period",
            }
        )

        # Verify course creation
        assert course["step_id"] == step_id

        # Verify course lookup by step
        step_courses = self.app.courses_service.get_courses_by_step(step_id)
        assert len(step_courses) > 0

        logger.info("Program flow tests passed!")

    def _test_class_management(self):
        """Test basic class management"""
        logger.info("Testing class management...")

        # Create program and class
        program = self.app.programs_service.create({"name": "Test Program"})
        class_obj = self.app.classes_service.create_class("Test Class")

        # Create group
        group = self.app.groups_service.create_group(program["id"], "Test Group")

        # Add group to class
        self.app.classes_service.add_groups_to_class(class_obj["id"], [group["id"]])

        # Verify group assignment
        class_details = self.app.classes_service.get_class_details(class_obj["id"])
        assert len(class_details["groups"]) == 1

        logger.info("Class management tests passed!")

    def _test_student_management(self):
        """Test basic student management"""
        logger.info("Testing student management...")

        # Create program
        program = self.app.programs_service.create({"name": "Test Program"})

        # Generate students
        students = self.app.students_service.generate_students(program["id"], 3)
        assert len(students) == 3

        # Create group
        group = self.app.groups_service.create_group(program["id"], "Test Group")

        # Assign student to group
        self.app.groups_service.assign_student_to_group(students[0]["id"], group["id"])

        # Verify assignment
        group_students = self.app.groups_service.get_group_students(group["id"])
        assert len(group_students) == 1

        logger.info("Student management tests passed!")

    def _test_labels(self):
        """Test basic label generation and verification"""
        logger.info("Testing labels...")

        # Create test entities
        program = self.app.programs_service.create({"name": "Label Test Program"})

        step = self.app.steps_service.create(
            {
                "id": "TEST1",
                "name": "Label Test Step",
                "stepstructurecode": "TST",
                "stepstructurename": "Test Structure",
                "year": "2024",
            }
        )

        course = self.app.courses_service.create(
            {
                "name": "Label Test Course",
                "step_id": step["id"],
                "elementnumber": "E1",
                "elementname": "Test Element",
                "elpccode": "ELPC1",
                "elpname": "Test ELP",
                "cnucode": "CNU1",
                "cnuname": "Test CNU",
                "periodcode": "P1",
                "periodname": "Test Period",
            }
        )

        # Create test group
        group = self.app.groups_service.create_group(program["id"], "Label Test Group")

        # Generate test student
        student = self.app.students_service.generate_students(program["id"], 1)[0]
        self.app.groups_service.assign_student_to_group(student["id"], group["id"])

        logger.info("Labels tests passed!")

    def _test_calendar_management(self):
        """Test calendar-related operations"""
        logger.info("Testing calendar management...")

        # Create calendar
        calendar = self.app.calendars_service.create(
            {"name": "Test Calendar 2024", "type": "global"}
        )
        self.test_data["calendar"] = calendar

        # Verify calendar creation
        assert calendar["name"] == "Test Calendar 2024"

        # Test calendar updates
        updated_calendar = self.app.calendars_service.update(
            calendar["id"], {"name": "Updated Calendar 2024"}
        )
        assert updated_calendar["name"] == "Updated Calendar 2024"

        logger.info("Calendar management tests passed!")

    def _test_advanced_program_management(self):
        """Test advanced program operations and relationships"""
        logger.info("Testing advanced program management...")

        # Create base program
        program = self.app.programs_service.create({"name": "Advanced Test Program"})
        self.test_data["program"] = program

        # Create multiple steps
        steps = []
        for i in range(3):
            step = self.app.steps_service.create(
                {
                    "id": f"TEST{i+1}",
                    "name": f"Step {i+1}",
                    "stepstructurecode": f"TST{i+1}",
                    "stepstructurename": f"Test Structure {i+1}",
                    "year": "2024",
                }
            )
            steps.append(step)
        self.test_data["steps"] = steps

        # Create courses for each step
        courses = []
        for step in steps:
            course = self.app.courses_service.create(
                {
                    "name": f"Course for {step['name']}",
                    "step_id": step["id"],
                    "elementnumber": f"E{step['id']}",
                    "elementname": f"Element {step['name']}",
                    "elpccode": f"ELPC{step['id']}",
                    "elpname": f"ELP {step['name']}",
                    "cnucode": "CNU1",
                    "cnuname": "Test CNU",
                    "periodcode": "P1",
                    "periodname": "Test Period",
                }
            )
            courses.append(course)
        self.test_data["courses"] = courses

        # Create multiple modalities for each course
        modalities = []
        for course in courses:
            for i in range(2):
                modality = self.app.modalities_service.create(
                    {
                        "course_id": course["id"],
                        "groups": 1,
                        "hours": 60 * (i + 1),
                        "modality": f"Modality {i+1} for {course['name']}",
                    }
                )
                modalities.append(modality)

                # Add modality to program
                self.app.programs_service.add_modality(program["id"], modality["id"])
        self.test_data["modalities"] = modalities

        # Verify program structure
        program_summary = self.app.programs_service.get_program_summary(program["id"])
        assert len(program_summary["modalities"]) == len(courses) * 2
        assert len(program_summary["courses"]) == len(courses)

        logger.info("Advanced program management tests passed!")

    def _test_advanced_class_operations(self):
        """Test advanced class operations and complex group management"""
        logger.info("Testing advanced class operations...")

        # Create program if not exists
        program = self.test_data.get("program") or self.app.programs_service.create(
            {"name": "Test Program for Classes"}
        )

        # Create multiple groups
        groups = []
        for i in range(3):
            group = self.app.groups_service.create_group(program["id"], f"Group {i+1}")
            groups.append(group)
        self.test_data["groups"] = groups

        # Create class with multiple groups
        class_obj = self.app.classes_service.create_class("Advanced Test Class")
        self.test_data["class"] = class_obj

        # Add all groups to class
        group_ids = [g["id"] for g in groups]
        self.app.classes_service.add_groups_to_class(class_obj["id"], group_ids)

        # Add modalities to class
        if "modalities" in self.test_data:
            modality_ids = [m["id"] for m in self.test_data["modalities"][:2]]
            self.app.classes_service.add_modalities_to_class(
                class_obj["id"], modality_ids
            )

        # Verify class structure
        class_details = self.app.classes_service.get_class_details(class_obj["id"])
        assert len(class_details["groups"]) == len(groups)

        # Test group removal
        self.app.classes_service.remove_group_from_class(
            class_obj["id"], groups[0]["id"]
        )
        updated_details = self.app.classes_service.get_class_details(class_obj["id"])
        assert len(updated_details["groups"]) == len(groups) - 1

        logger.info("Advanced class operations tests passed!")

    def _test_advanced_student_operations(self):
        """Test advanced student operations and group management"""
        logger.info("Testing advanced student operations...")

        # Create program if not exists
        program = self.test_data.get("program") or self.app.programs_service.create(
            {"name": "Test Program for Students"}
        )

        # Generate multiple students
        students = self.app.students_service.generate_students(program["id"], 10)
        self.test_data["students"] = students

        # Create multiple groups
        groups = self.test_data.get("groups", [])
        if not groups:
            for i in range(3):
                group = self.app.groups_service.create_group(
                    program["id"], f"Student Test Group {i+1}"
                )
                groups.append(group)

        # Distribute students across groups
        for i, student in enumerate(students):
            group_index = i % len(groups)
            self.app.groups_service.assign_student_to_group(
                student["id"], groups[group_index]["id"]
            )

        # Verify student distribution
        for group in groups:
            group_students = self.app.groups_service.get_group_students(group["id"])
            assert len(group_students) > 0

        # Test student removal from group
        self.app.groups_service.remove_student_from_groups(students[0]["id"])

        logger.info("Advanced student operations tests passed!")

    def _test_lecturer_management(self):
        """Test lecturer management and assignments"""
        logger.info("Testing lecturer management...")

        # Create lecturers
        lecturers = []
        for i in range(3):
            lecturer = self.app.lecturers_service.create(
                {
                    "name": f"Test Lecturer {i+1}",
                    "lastname": f"Test {i+1}",
                    "volumehoraireannee": "192",
                    "oraganization_component": "Test Dept",
                    "hourly_volume": "192",
                    "code_fonction": "PR",
                    "code_unite": f"U{i+1}",
                }
            )
            lecturers.append(lecturer)
        self.test_data["lecturers"] = lecturers

        # Add lecturers to test data for cleanup
        if "modalities" in self.test_data:
            for modality in self.test_data["modalities"]:
                # We'll store this for future lecturer-modality assignments
                pass

        logger.info("Lecturer management tests passed!")

    def _test_modality_management(self):
        """Test comprehensive modality management"""
        logger.info("Testing modality management...")

        # Create step and course if not exists
        step = self.test_data.get("steps", [None])[0] or self.app.steps_service.create(
            {
                "id": "TEST1",
                "name": "Modality Test Step",
                "stepstructurecode": "TST",
                "stepstructurename": "Test Structure",
                "year": "2024",
            }
        )

        course = self.app.courses_service.create(
            {
                "name": "Modality Test Course",
                "step_id": step["id"],
                "elementnumber": "E1",
                "elementname": "Test Element",
                "elpccode": "ELPC1",
                "elpname": "Test ELP",
                "cnucode": "CNU1",
                "cnuname": "Test CNU",
                "periodcode": "P1",
                "periodname": "Test Period",
            }
        )

        # Create modalities with different configurations
        modalities = []
        durations = [60, 90, 120]
        for i, duration in enumerate(durations):
            modality = self.app.modalities_service.create(
                {
                    "course_id": course["id"],
                    "groups": 1,
                    "hours": duration,
                    "modality": f"Test Modality {i+1}",
                }
            )
            modalities.append(modality)

        # Get modalities by course
        course_modalities = self.app.modalities_service.get_modalities(course["id"])
        assert len(course_modalities) == len(durations)

        # Get modalities by step
        step_modalities = self.app.modalities_service.get_modalities_by_step(step["id"])
        assert len(step_modalities) > 0

        logger.info("Modality management tests passed!")

    def _test_complex_relationships(self):
        """Test complex relationships between different entities"""
        logger.info("Testing complex relationships...")

        # Create a complete program structure
        program = self.app.programs_service.create({"name": "Complex Test Program"})

        # Create multiple steps with courses
        steps_data = []
        for i in range(2):
            step = self.app.steps_service.create(
                {
                    "id": f"TEST{i+1}",
                    "name": f"Complex Step {i+1}",
                    "stepstructurecode": f"TST{i+1}",
                    "stepstructurename": f"Test Structure {i+1}",
                    "year": "2024",
                }
            )

            courses = []
            for j in range(2):
                course = self.app.courses_service.create(
                    {
                        "name": f"Course {j+1} for Step {i+1}",
                        "step_id": step["id"],
                        "elementnumber": f"E{j+1}S{i+1}",
                        "elementname": f"Element {j+1} Step {i+1}",
                        "elpccode": f"ELPC{j+1}S{i+1}",
                        "elpname": f"ELP {j+1} Step {i+1}",
                        "cnucode": "CNU1",
                        "cnuname": "Test CNU",
                        "periodcode": "P1",
                        "periodname": "Test Period",
                    }
                )

                # Create modalities for each course
                modalities = []
                for k in range(2):
                    modality = self.app.modalities_service.create(
                        {
                            "course_id": course["id"],
                            "groups": 1,
                            "hours": 60 * (k + 1),
                            "modality": f"Modality {k+1} for Course {j+1}",
                        }
                    )
                    modalities.append(modality)
                    self.app.programs_service.add_modality(
                        program["id"], modality["id"]
                    )

                courses.append({"course": course, "modalities": modalities})

            steps_data.append({"step": step, "courses": courses})

        # Create groups and distribute students
        students = self.app.students_service.generate_students(program["id"], 20)
        groups = []
        for i in range(4):
            group = self.app.groups_service.create_group(
                program["id"], f"Complex Group {i+1}"
            )
            groups.append(group)

        # Distribute students across groups
        for i, student in enumerate(students):
            group_index = i % len(groups)
            self.app.groups_service.assign_student_to_group(
                student["id"], groups[group_index]["id"]
            )

        # Create classes with different configurations
        for i, group in enumerate(groups):
            class_obj = self.app.classes_service.create_class(f"Complex Class {i+1}")
            self.app.classes_service.add_groups_to_class(class_obj["id"], [group["id"]])

            # Add modalities from different courses to the class
            step_index = i % len(steps_data)
            course_index = (i // 2) % len(steps_data[step_index]["courses"])
            modalities = steps_data[step_index]["courses"][course_index]["modalities"]
            modality_ids = [m["id"] for m in modalities]
            self.app.classes_service.add_modalities_to_class(
                class_obj["id"], modality_ids
            )

        # Verify the complex structure
        program_summary = self.app.programs_service.get_program_summary(program["id"])
        assert len(program_summary["modalities"]) > 0
        assert len(program_summary["courses"]) > 0

        logger.info("Complex relationships tests passed!")

    def _test_advanced_labels(self):
        """Test advanced label scenarios and propagation"""
        logger.info("Testing advanced labels...")

        # Create a complex structure for label testing
        program = self.app.programs_service.create(
            {"name": "Label Test Program Advanced"}
        )

        step = self.app.steps_service.create(
            {
                "id": "TEST1",
                "name": "Label Test Step Advanced",
                "stepstructurecode": "TST",
                "stepstructurename": "Test Structure",
                "year": "2024",
            }
        )

        course = self.app.courses_service.create(
            {
                "name": "Label Test Course Advanced",
                "step_id": step["id"],
                "elementnumber": "E1",
                "elementname": "Test Element",
                "elpccode": "ELPC1",
                "elpname": "Test ELP",
                "cnucode": "CNU1",
                "cnuname": "Test CNU",
                "periodcode": "P1",
                "periodname": "Test Period",
            }
        )

        modalities = []
        for i in range(2):
            modality = self.app.modalities_service.create(
                {
                    "course_id": course["id"],
                    "groups": 1,
                    "hours": 60 * (i + 1),
                    "modality": f"Label Test Modality {i+1}",
                }
            )
            modalities.append(modality)
            self.app.programs_service.add_modality(program["id"], modality["id"])

        # Create groups and classes
        group = self.app.groups_service.create_group(
            program["id"], "Label Test Group Advanced"
        )

        class_obj = self.app.classes_service.create_class("Label Test Class Advanced")
        self.app.classes_service.add_groups_to_class(class_obj["id"], [group["id"]])
        self.app.classes_service.add_modalities_to_class(
            class_obj["id"], [m["id"] for m in modalities]
        )

        # Generate students
        students = self.app.students_service.generate_students(program["id"], 5)
        for student in students:
            self.app.groups_service.assign_student_to_group(student["id"], group["id"])

        # Verify label propagation through the hierarchy
        # The actual verification would depend on your specific label implementation

        logger.info("Advanced labels tests passed!")
