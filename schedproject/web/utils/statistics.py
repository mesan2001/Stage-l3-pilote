import functools
import time
import os
import json
import threading
import inspect
import tracemalloc
from datetime import datetime

FUNCTION_STATS = {}
stats_lock = threading.Lock()
JSON_STATS_FILE = "stats.json"
HUMAN_STATS_FILE = "stats_human_readable.txt"
SAVE_INTERVAL = 5


def get_function_identifier(func):

    module_obj = inspect.getmodule(func)
    module = module_obj.__name__ if module_obj is not None else "__main__"

    try:
        if hasattr(func, "__qualname__"):
            qual_name = func.__qualname__
            if "." in qual_name:
                class_name = qual_name.split(".")[0]
                return f"{module}.{class_name}.{func.__name__}"
    except:
        pass

    return f"{module}.{func.__name__}"


def format_bytes(bytes):
    for unit in ["B", "KB", "MB", "GB"]:
        if bytes < 1024 or unit == "GB":
            return f"{bytes:.2f} {unit}"
        bytes /= 1024


def save_stats_to_files():
    with stats_lock:
        # Save JSON format
        with open(JSON_STATS_FILE, "w") as f:
            json.dump(FUNCTION_STATS, f, indent=2, default=str)

        # Save human-readable format
        with open(HUMAN_STATS_FILE, "w") as f:
            f.write(f"Function Statistics Report - Generated at {datetime.now()}\n")
            f.write("=" * 80 + "\n\n")

            if not FUNCTION_STATS:
                f.write("No functions have been called yet.\n")
            else:
                for func_id, stats in FUNCTION_STATS.items():
                    f.write(f"FUNCTION: {func_id}\n")
                    f.write("-" * 80 + "\n")
                    f.write(f"Number of calls:          {stats['calls']}\n")
                    f.write(f"Last called:              {stats['last_called']}\n")
                    f.write("\nExecution Time:\n")
                    f.write(
                        f"  Minimum:                {stats['min_time']:.6f} seconds\n"
                    )
                    f.write(
                        f"  Maximum:                {stats['max_time']:.6f} seconds\n"
                    )
                    f.write(
                        f"  Average:                {stats['avg_time']:.6f} seconds\n"
                    )
                    f.write(
                        f"  Total:                  {stats['total_time']:.6f} seconds\n"
                    )
                    f.write("\nMemory Usage:\n")
                    f.write(
                        f"  Minimum:                {format_bytes(stats['min_memory'])}\n"
                    )
                    f.write(
                        f"  Maximum:                {format_bytes(stats['max_memory'])}\n"
                    )
                    f.write(
                        f"  Average:                {format_bytes(stats['avg_memory'])}\n"
                    )
                    f.write(
                        f"  Total:                  {format_bytes(stats['total_memory'])}\n"
                    )
                    f.write("\n" + "=" * 80 + "\n\n")

    t = threading.Timer(SAVE_INTERVAL, save_stats_to_files)
    t.daemon = True
    t.start()


save_timer = threading.Timer(SAVE_INTERVAL, save_stats_to_files)
save_timer.daemon = True
save_timer.start()


def stats(func):

    function_id = get_function_identifier(func)

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        tracemalloc.start()

        start_time = time.time()

        result = func(*args, **kwargs)

        execution_time = time.time() - start_time

        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()

        with stats_lock:
            if function_id not in FUNCTION_STATS:
                FUNCTION_STATS[function_id] = {
                    "calls": 0,
                    "total_time": 0,
                    "min_time": float("inf"),
                    "max_time": 0,
                    "avg_time": 0,
                    "min_memory": float("inf"),
                    "max_memory": 0,
                    "avg_memory": 0,
                    "total_memory": 0,
                    "last_called": None,
                }

            stats = FUNCTION_STATS[function_id]
            stats["calls"] += 1
            stats["total_time"] += execution_time
            stats["min_time"] = min(stats["min_time"], execution_time)
            stats["max_time"] = max(stats["max_time"], execution_time)
            stats["avg_time"] = stats["total_time"] / stats["calls"]

            stats["total_memory"] += peak
            stats["min_memory"] = min(stats["min_memory"], peak)
            stats["max_memory"] = max(stats["max_memory"], peak)
            stats["avg_memory"] = stats["total_memory"] / stats["calls"]
            stats["last_called"] = datetime.now()

        return result

    return wrapper
