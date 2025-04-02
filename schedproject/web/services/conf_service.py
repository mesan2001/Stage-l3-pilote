from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class ConfService:
    student_per_group = 20

    nb_group_per_modality_class = {
        "practical": 1,
        "lecture": 4,
        "tutorial": 2,
        "lecture tutorial": 3,
    }

    # parents : [direct child 1, direct child 2, ...]
    labeling_hierarchy = {
        "students": ["groups", "programs"],
        "calendars": ["programs"],
        "steps": ["programs"],
        "programs": ["groups", "courses"],
        "courses": ["modalities"],
        "groups": ["classes"],
        "classes": ["modalities"],
        "lecturers": ["modalities"],
        "modalities": [],
    }

    def __init__(self, app: "InterfacesWebApp"):
        pass

    def get_labeling_hierarchy(self):
        return self.labeling_hierarchy

    def get_labeling_hierarchy_order(self):

        def visit(node, visited, order):
            if node not in visited:
                visited.add(node)
                for child in self.labeling_hierarchy.get(node, []):
                    visit(child, visited, order)
                    if node not in order:
                        order.insert(0, node)

        visited = set()
        order = []
        for parent in self.labeling_hierarchy:
            visit(parent, visited, order)

        return order
