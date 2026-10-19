class AdapterError(Exception):
    """Safe, transport-independent failure for one case."""

    def __init__(self, kind: str, status: int | None = None,
                 retry_after_seconds: float | None = None):
        self.kind = kind
        self.status = status
        self.retry_after_seconds = retry_after_seconds
        super().__init__(kind)
