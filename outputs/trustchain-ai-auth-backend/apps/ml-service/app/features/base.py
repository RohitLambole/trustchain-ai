from abc import ABC, abstractmethod
from typing import Any

import pandas as pd
from pydantic import BaseModel


class FeatureBuilder(ABC):
    feature_names: list[str]

    @abstractmethod
    def build_one(self, payload: BaseModel) -> pd.DataFrame:
        raise NotImplementedError

    def frame_from_records(self, records: list[dict[str, Any]]) -> pd.DataFrame:
        frame = pd.DataFrame(records)
        return frame[self.feature_names].astype(float)
