from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models import all_models, AuthorisedUser
import logging

# Patch Motor Client to prevent the append_metadata attribute error in Beanie
if not hasattr(AsyncIOMotorClient, "append_metadata"):
    AsyncIOMotorClient.append_metadata = lambda *args, **kwargs: None

logger = logging.getLogger("cryptosphere.db")
db_initialized = False

async def init_db():
    global db_initialized
    if db_initialized:
        return
    logger.info("Initializing database connection...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    await init_beanie(
        database=db,
        document_models=all_models
    )
    db_initialized = True
    logger.info("Database connection and Beanie models initialized successfully.")
    
    # Check and seed authorized users
    await seed_authorised_users()

async def seed_authorised_users():
    logger.info("Synchronizing authorised users list with database...")
    existing_records = await AuthorisedUser.find_all().to_list()
    existing_emails = {r.email.lower() for r in existing_records}
    config_emails = {email.lower() for email in settings.WHITELISTED_EMAILS}
    
    # Insert new whitelisted emails
    for email in settings.WHITELISTED_EMAILS:
        if email.lower() not in existing_emails:
            authorised_user = AuthorisedUser(
                email=email.lower(),
                role="admin" if email == settings.WHITELISTED_EMAILS[0] else "user",
                is_active=True
            )
            await authorised_user.insert()
            logger.info(f"Seeded new whitelisted user: {email}")
            
    # Remove outdated whitelisted emails
    for record in existing_records:
        if record.email.lower() not in config_emails:
            await record.delete()
            logger.info(f"Removed outdated whitelisted user: {record.email}")
            
    logger.info("Authorised users synchronization completed.")
