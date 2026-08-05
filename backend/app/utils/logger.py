import logging
import sys

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    # Set third-party logs to warning to keep output clean
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("beanie").setLevel(logging.WARNING)
