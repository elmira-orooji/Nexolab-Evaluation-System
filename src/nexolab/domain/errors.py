class AdapterError(Exception):
    """Safe, transport-independent failure for one case."""

    def __init__(self, kind: str, status: int | None = None):
        self.kind = kind
        self.status = status
        super().__init__(kind)
