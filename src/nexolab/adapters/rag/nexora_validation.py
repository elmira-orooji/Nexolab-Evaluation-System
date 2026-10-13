import uuid

REQUEST_KEYS = {"limit", "document_id", "document_set_id", "document_ids", "filters"}


def validate_request(request) -> None:
    if not isinstance(request, dict) or request.keys() - REQUEST_KEYS:
        raise ValueError("Unsupported request settings")
    if "limit" in request and (type(request["limit"]) is not int or not 1 <= request["limit"] <= 8):
        raise ValueError("limit must be 1..8")
    for key in ("document_id", "document_set_id"):
        if request.get(key) is not None:
            if not isinstance(request[key], str):
                raise ValueError("Document IDs must be UUID strings")
            uuid.UUID(request[key])
    if request.get("document_ids") is not None:
        ids = request["document_ids"]
        if not isinstance(ids, list) or len(ids) > 50:
            raise ValueError("document_ids must be a list of at most 50 UUIDs")
        for value in ids:
            if not isinstance(value, str):
                raise ValueError("Document IDs must be UUID strings")
            uuid.UUID(value)
    filters = request.get("filters")
    if filters is not None and (not isinstance(filters, dict) or filters.keys() - {"authors", "languages", "source_types", "tags", "date_from", "date_to"}):
        raise ValueError("Unsupported filters")
