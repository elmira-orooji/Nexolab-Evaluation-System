def validate_request(request) -> None:
    """Service-specific options are validated at the adapter boundary."""
    if not isinstance(request, dict):
        raise ValueError("Request settings must be an object")
