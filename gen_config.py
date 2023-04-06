import argparse
import datetime
import requests
from pathlib import Path


URL = "https://graph.facebook.com/v16.0/oauth/access_token?grant_type=fb_exchange_token&client_id={app_id}&client_secret={app_secret}&fb_exchange_token={token}"
PAGE_IDS = [
    "6452516118114624",
    "9374741405884326",
    "17841458729800999",
    "6103090656441649",
    "17841458753863739",
]


def get_long_lived_access_token(app_id: str, app_secret: str, token: str) -> str:
    url = URL.format(app_id=app_id, app_secret=app_secret, token=token)
    response = requests.get(url).json()
    long_token = response["access_token"]
    expiration = datetime.datetime.now() + datetime.timedelta(
        seconds=int(response["expires_in"])
    )
    return long_token, expiration


def main(app_id: str, app_secret: str, tokens: list[str]) -> None:
    path = Path(__file__).parent / "config.env"
    max_expiration = datetime.datetime.now()
    with open(path, "w") as f:
        for i, page_id in enumerate(PAGE_IDS):
            f.write(f"PAGE_ID_{i+1}={page_id}\n")

        for i, token in enumerate(tokens):
            long_token, expiration = get_long_lived_access_token(
                app_id, app_secret, token
            )
            max_expiration = max(max_expiration, expiration)
            f.write(f"ACCESS_TOKEN_{i+1}={long_token}\n")
    print(f"Expiration: {max_expiration}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--app-id", required=True)
    parser.add_argument("--app-secret", required=True)
    parser.add_argument("--tokens", nargs="+")
    args = parser.parse_args()

    main(args.app_id, args.app_secret, args.tokens)
