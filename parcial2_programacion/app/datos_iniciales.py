"""Carga explícita y no destructiva de datos de ejemplo en una base vacía.

Uso: python -m app.datos_iniciales
No se ejecuta durante el arranque de la aplicación.
"""

import asyncio
from decimal import Decimal

from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

import app.core.modelos  # Registra todos los modelos y sus relaciones.
from app.core.config import obtener_database_url
from app.core.database import crear_fabrica_de_sesiones, crear_motor
from app.modules.autores.models import Autor
from app.modules.clientes.models import Cliente, PerfilCliente
from app.modules.editoriales.models import Editorial
from app.modules.generos.models import Genero
from app.modules.libros.models import Libro, LibroAutor
from app.modules.ventas.models import Venta, RenglonVenta


MODELOS = (Editorial, Genero, Autor, Libro, LibroAutor, Cliente, PerfilCliente, Venta, RenglonVenta)


async def cargar(session: AsyncSession) -> tuple[int, list[int]]:
    """Inserta datos solo si todas las tablas del dominio están vacías.

    No borra ni modifica datos existentes. El llamador controla la transacción.
    Usar exclusivamente con la aplicación detenida o sin escrituras concurrentes.
    """
    for modelo in MODELOS:
        consulta = select(modelo).limit(1)
        if (await session.exec(consulta)).first() is not None:
            raise ValueError("La base ya contiene datos de la librería; no se cargó nada.")

    editorial = Editorial(nombre="Editorial Planeta", pais="Argentina")
    genero = Genero(nombre="Ficción")
    autores = [Autor(nombre="Jorge Luis Borges", nacionalidad="Argentina"),
               Autor(nombre="Adolfo Bioy Casares", nacionalidad="Argentina")]
    clientes = [
        Cliente(nombre="María Gómez", email="maria.gomez@example.com"),
        Cliente(nombre="Carlos Pérez", email="carlos.perez@example.com")
    ]
    session.add_all([editorial, genero, *autores, *clientes])
    await session.flush()

    libros = [
        Libro(isbn="978-950-08-3420-1", titulo="Ficciones", precio=Decimal("18500.00"),
              stock=12, editorial_id=editorial.id, genero_id=genero.id),
        Libro(isbn="978-950-04-1234-5", titulo="La invención de Morel", precio=Decimal("19200.00"),
              stock=5, editorial_id=editorial.id, genero_id=genero.id),
    ]
    session.add_all(libros)
    await session.flush()
    session.add_all([LibroAutor(libro_id=libro.id, autor_id=autor.id, rol="autor", orden=1)
                     for libro, autor in zip(libros, autores)])
    await session.flush()

    ventas = [
        Venta(cliente_id=clientes[0].id, total=Decimal("18500.00")),
        Venta(cliente_id=clientes[1].id, total=Decimal("19200.00"))
    ]
    session.add_all(ventas)
    await session.flush()
    session.add_all([
        RenglonVenta(venta_id=ventas[0].id, libro_id=libros[0].id, cantidad=1, precio_unitario=libros[0].precio, subtotal=libros[0].precio),
        RenglonVenta(venta_id=ventas[1].id, libro_id=libros[1].id, cantidad=1, precio_unitario=libros[1].precio, subtotal=libros[1].precio)
    ])
    await session.flush()
    return clientes[0].id, [libro.id for libro in libros]


async def main() -> None:
    motor = crear_motor(obtener_database_url())
    try:
        fabrica = crear_fabrica_de_sesiones(motor)
        async with fabrica() as session:
            async with session.begin():
                cliente_id, libros_ids = await cargar(session)
        print(f"Datos iniciales cargados. Cliente: {cliente_id}; libros: {libros_ids}.")
    except ValueError as error:
        raise SystemExit(str(error)) from None
    except IntegrityError:
        raise SystemExit("La base rechazó la carga; se revirtió la transacción.") from None
    finally:
        await motor.dispose()


if __name__ == "__main__":
    asyncio.run(main())
