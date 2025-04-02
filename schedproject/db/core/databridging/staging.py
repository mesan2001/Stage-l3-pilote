import logging
import os
from typing import Optional
import clingo
import toml


class DuplicateStageConfiguration(Exception):
    pass


class StageConfigurationCycle(Exception):
    pass


logger = logging.getLogger(__name__)


class StageConfiguration:
    RENAMING_KEYWORD = "AS"
    DEFAULT_STAGING_PATH = "./databridging/staging"

    def __init__(
        self,
        name: str,
        datasources: list[str],
        staging_files: list[str],
        datamarts: list[str],
        workdir: str = DEFAULT_STAGING_PATH,
    ) -> None:
        self.name = name
        self.datasources = datasources
        self.datamarts = datamarts
        self.staging_files = staging_files
        self.workdir = workdir

    def __str__(self) -> str:
        return (
            f"StageConfiguration(name='{self.name}', "
            f"datasources={self.datasources}, "
            f"staging_files={self.staging_files}, "
            f"datamarts={self.datamarts}, "
            f"workdir='{self.workdir}')"
        )

    def __repr__(self) -> str:
        return self.__str__()

    @staticmethod
    def from_json(config):
        return StageConfiguration(
            name=config["MAIN"]["name"],
            workdir=config["MAIN"].get(
                "workdir", StageConfiguration.DEFAULT_STAGING_PATH
            ),
            datasources=config["IO"].get("datasources", []),
            staging_files=config["STAGING"]["files"],
            datamarts=config["IO"].get("datamarts", []),
        )

    @staticmethod
    def load_from_toml(toml_path):
        config = toml.load(toml_path)
        return StageConfiguration.from_json(config)

    @staticmethod
    def loads_from_toml(toml_file):
        config = toml.loads(toml_file)
        return StageConfiguration.from_json(config)

    @staticmethod
    def create_empty_configuration(path: str = DEFAULT_STAGING_PATH) -> None:
        configuration = {
            "MAIN": {
                "name": "",
                "workdir": StageConfiguration.DEFAULT_STAGING_PATH,
            },
            "IO": {"datasources": [], "datamarts": []},
            "STAGING": {"files": []},
        }
        with open(os.path.join(path, "empty_configuration.toml"), "w") as file:
            toml.dump(configuration, file)

    @staticmethod
    def visualize_staging_order(ordered_configs: list["StageConfiguration"]) -> str:
        result = []

        if not ordered_configs:
            result.append("  (No stages configured)")
            return "\n".join(result)

        for index, config in enumerate(ordered_configs):
            result.append(f"  {index+1}. {config.name}")
            if config.datasources:
                result.append(f"     ├── Sources: {', '.join(config.datasources)}")
            if config.staging_files:
                filenames = [os.path.basename(file) for file in config.staging_files]
                result.append(f"     ├── Files: {', '.join(filenames)}")
            if config.datamarts:
                result.append(f"     └── Outputs: {', '.join(config.datamarts)}")

        return "\n".join(result)

    @staticmethod
    def compute_staging_order(
        configs: list["StageConfiguration"], base_dependencies: list[str]
    ) -> list["StageConfiguration"]:
        logger.info("Computing staging order")

        if not configs:
            logger.info("No configurations to process")
            return []

        dict_config: dict[str, "StageConfiguration"] = {}
        for config in configs:
            if config.name in dict_config:
                logger.warning(f"Found duplicate config with name {config.name}")
                raise DuplicateStageConfiguration
            dict_config[config.name] = config
            print(config, flush=True)

        class ModelHolder:
            def __init__(self) -> None:
                self.models: list[list[clingo.Symbol]] = []

            def __call__(self, model: clingo.Model):
                ret = []
                symbols = model.symbols(shown=True)
                for symbol in symbols:
                    ret.append(symbol)
                self.models.append(ret)

        ctl = clingo.Control(arguments=["1"])
        ctl.load("./resources/staging_order.lp")

        main_program = ""
        for base_dependency in base_dependencies:
            main_program += f'task_p("{base_dependency}", "{base_dependency}"). order("{base_dependency}", 0).\n'

        for config in configs:
            program = f'task("{config.name}").\n'
            for datasource in config.datasources:
                program += f'task_r("{config.name}", "{datasource}").\n'
            for datamart in config.datamarts:
                program += f'task_p("{config.name}", "{datamart}").\n'

            main_program += program

        ctl.add("base", [], main_program)
        ctl.ground([("base", [])])
        mh = ModelHolder()

        def on_unsat(*kwargs):
            raise StageConfigurationCycle()

        ctl.solve(on_unsat=on_unsat, on_model=mh)

        print(mh.models, flush=True)
        pre_order = {
            symbol.arguments[0].string: symbol.arguments[1].number
            for symbol in mh.models[-1]
        }

        ordered_configs = [
            dict_config[config_name]
            for config_name in sorted(pre_order, key=lambda x: pre_order[x])
        ]

        logger.info("Staging order computation completed")
        logger.info(StageConfiguration.visualize_staging_order(ordered_configs))
        return ordered_configs

    @staticmethod
    def get_all_configs_in_folder(
        staging_path: Optional[str] = None,
    ) -> list["StageConfiguration"]:

        staging_path = staging_path or StageConfiguration.DEFAULT_STAGING_PATH

        if not os.path.exists(staging_path):
            logger.warning(
                f"Configuration folder not found: {os.path.abspath(staging_path)}"
            )
            return []

        configs_path = []
        for root, _, files in os.walk(staging_path):
            for file in files:
                if file.endswith(".toml"):
                    configs_path.append(os.path.abspath(os.path.join(root, file)))

        if not configs_path:
            logger.info(f"No TOML configuration files found in {staging_path}")
            return []

        configs = []
        for config_path in configs_path:
            try:
                config = StageConfiguration.load_from_toml(config_path)
                configs.append(config)
                logger.debug(f"Loaded configuration from {config_path}")
            except Exception as e:
                logger.error(
                    f"Failed to load configuration from {config_path}: {str(e)}"
                )

        logger.info(f"Loaded {len(configs)} configuration(s) from {staging_path}")
        return configs

    @classmethod
    def get_from_view_and_to_view(cls, expression: str) -> tuple[str, str]:
        to_view = expression
        from_view = expression

        if cls.RENAMING_KEYWORD.upper() in from_view.upper():
            idx = expression.upper().index(cls.RENAMING_KEYWORD.upper())
            from_view = expression[:idx].strip()
            to_view = expression[idx + len(cls.RENAMING_KEYWORD) :].strip()

        return from_view, to_view

    def to_json(self) -> dict:
        return {
            "MAIN": {
                "name": self.name,
                "workdir": self.workdir,
            },
            "IO": {
                "datasources": self.datasources,
                "datamarts": self.datamarts,
            },
            "STAGING": {"files": self.staging_files},
        }

    def dumps(self):
        return toml.dumps(self.to_json())
