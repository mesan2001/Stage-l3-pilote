import logging
import os

import colorama

from core.controller import (
    PostgreSQLAPIController as PostgreSQLAPIController,
)
from core.controller import (
    PostgreSQLController as PostgreSQLController,
)

colorama.init()


class ColorFormatter(logging.Formatter):
    COLORS = {
        "DEBUG": colorama.Fore.CYAN,
        "INFO": colorama.Fore.GREEN,
        "WARNING": colorama.Fore.YELLOW,
        "ERROR": colorama.Fore.RED,
        "CRITICAL": colorama.Fore.WHITE + colorama.Back.RED,
    }

    def format(self, record):
        color = self.COLORS.get(record.levelname, colorama.Fore.RESET)
        record.relativepath = os.path.relpath(record.pathname)
        message = super().format(record)
        return f"{color}{message}{colorama.Fore.RESET}"


def setup_logging():
    handler = logging.StreamHandler()

    formatter = ColorFormatter(
        fmt="%(asctime)s | %(filename)s:%(lineno)d : %(message)s", datefmt="%H:%M:%S"
    )
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    for h in root_logger.handlers[:]:
        root_logger.removeHandler(h)

    root_logger.addHandler(handler)


setup_logging()
