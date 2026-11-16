"""Ejecuta las revisiones contra la misma base que usa la API."""

import asyncio

from alembic import context
from sqlalchemy import text
from sqlmodel import SQLModel

import app.core.modelos
from app.core.config import obtener_database_url
from app.core.database import crear_motor


def run_migrations(connection):
    # Serializa el arranque de contenedores que usan la misma base.
    with connection.begin():
        connection.execute(text("SELECT pg_advisory_xact_lock(88421, 1)"))
        context.configure(connection=connection, target_metadata=SQLModel.metadata)
        with context.begin_transaction():
            context.run_migrations()


async def run_online():
    engine = crear_motor(obtener_database_url())
    try:
        async with engine.connect() as connection:
            await connection.run_sync(run_migrations)
    finally:
        await engine.dispose()


if context.is_offline_mode():
    context.configure(
        url=obtener_database_url(),
        target_metadata=SQLModel.metadata,
        literal_binds=True,
    )
    with context.begin_transaction():
        context.run_migrations()
else:
    asyncio.run(run_online())
