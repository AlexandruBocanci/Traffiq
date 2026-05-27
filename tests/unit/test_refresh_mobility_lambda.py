import importlib
import json
import os
import sys
import types
from unittest.mock import Mock
from unittest.mock import patch


class FakeClientError(Exception):
    def __init__(self, response, operation_name):
        del operation_name
        self.response = response


fake_boto3 = types.ModuleType("boto3")
fake_boto3.client = Mock()
fake_botocore = types.ModuleType("botocore")
fake_botocore_exceptions = types.ModuleType("botocore.exceptions")
fake_botocore_exceptions.ClientError = FakeClientError
sys.modules.setdefault("boto3", fake_boto3)
sys.modules.setdefault("botocore", fake_botocore)
sys.modules.setdefault("botocore.exceptions", fake_botocore_exceptions)

refresh_lambda = importlib.import_module("src.cloud.refresh_mobility_lambda")


class RateLimitedDynamoClient:
    def update_item(self, **kwargs):
        del kwargs
        raise FakeClientError(
            {"Error": {"Code": "ConditionalCheckFailedException"}}, "UpdateItem"
        )


def test_conditional_lock_blocks_duplicate_refresh():
    assert not refresh_lambda._claim_refresh_slot(
        RateLimitedDynamoClient(), "refresh-table", 1000
    )


def test_rate_limited_request_does_not_extract_external_data():
    os.environ["LOCK_TABLE_NAME"] = "refresh-table"

    with patch.object(refresh_lambda.boto3, "client", return_value=Mock()):
        with patch.object(refresh_lambda, "_claim_refresh_slot", return_value=False):
            with patch.object(refresh_lambda, "_extract_flow_snapshot") as extractor:
                response = refresh_lambda.lambda_handler(
                    {"requestContext": {"http": {"method": "POST"}}}, None
                )

    assert json.loads(response["body"]) == {
        "refreshed": False,
        "reason": "rate_limited",
    }
    assert extractor.call_count == 0


def test_get_request_cannot_consume_refresh_slot():
    with patch.object(refresh_lambda, "_claim_refresh_slot") as claim:
        response = refresh_lambda.lambda_handler(
            {"requestContext": {"http": {"method": "GET"}}}, None
        )

    assert response["statusCode"] == 405
    assert claim.call_count == 0


if __name__ == "__main__":
    test_conditional_lock_blocks_duplicate_refresh()
    test_rate_limited_request_does_not_extract_external_data()
    test_get_request_cannot_consume_refresh_slot()
    print("SUCCESS: Lambda global 15-minute refresh lock validated.")
