"""Esquema inicial de la librería y adopción de bases existentes."""

from alembic import context, op
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
import sqlalchemy as sa

revision = "20261116_01"
down_revision = None
branch_labels = None
depends_on = None

schema = sa.MetaData()


def identifier():
    return sa.Column("id", sa.Integer(), primary_key=True)


def reference(name, target, *, optional=False, primary_key=False, unique=False, index=True):
    return sa.Column(
        name, sa.Integer(), sa.ForeignKey(target), nullable=optional,
        primary_key=primary_key, unique=unique, index=index,
    )


sa.Table(
    "autor", schema, identifier(), sa.Column("nombre", sa.String(), nullable=False),
    sa.Column("nacionalidad", sa.String()),
)
sa.Table(
    "cliente", schema, identifier(), sa.Column("nombre", sa.String(), nullable=False),
    sa.Column("email", sa.String(), nullable=False, index=True, unique=True),
    sa.UniqueConstraint("email", name="uq_cliente_email"),
)
sa.Table(
    "perfil_cliente", schema, identifier(), reference("cliente_id", "cliente.id", unique=True),
    sa.Column("telefono", sa.String(), nullable=False),
    sa.Column("direccion", sa.String(), nullable=False),
    sa.UniqueConstraint("cliente_id", name="uq_perfil_cliente_cliente_id"),
)
sa.Table(
    "editorial", schema, identifier(),
    sa.Column("nombre", sa.String(), nullable=False, index=True, unique=True),
    sa.Column("pais", sa.String()),
    sa.UniqueConstraint("nombre", name="uq_editorial_nombre"),
)
sa.Table(
    "genero", schema, identifier(),
    sa.Column("nombre", sa.String(), nullable=False, index=True, unique=True),
    sa.UniqueConstraint("nombre", name="uq_genero_nombre"),
)
sa.Table(
    "libro", schema, identifier(),
    sa.Column("isbn", sa.String(), nullable=False, index=True, unique=True),
    sa.Column("titulo", sa.String(), nullable=False),
    sa.Column("precio", sa.Numeric(10, 2), nullable=False),
    sa.Column("stock", sa.Integer(), nullable=False),
    reference("editorial_id", "editorial.id"),
    reference("genero_id", "genero.id", optional=True),
    sa.UniqueConstraint("isbn", name="uq_libro_isbn"),
    sa.CheckConstraint("precio > 0", name="ck_libro_precio_positivo"),
    sa.CheckConstraint("stock >= 0", name="ck_libro_stock_no_negativo"),
)
sa.Table(
    "libro_autor", schema,
    reference("libro_id", "libro.id", primary_key=True, index=False),
    reference("autor_id", "autor.id", primary_key=True),
    sa.Column("rol", sa.String(), nullable=False),
    sa.Column("orden", sa.Integer(), nullable=False),
    sa.CheckConstraint("orden >= 1", name="ck_libro_autor_orden_positivo"),
    sa.CheckConstraint(
        "rol IN ('autor', 'coautor', 'traductor', 'ilustrador')",
        name="ck_libro_autor_rol_valido",
    ),
)
sa.Table(
    "venta", schema, identifier(), reference("cliente_id", "cliente.id"),
    sa.Column("fecha", sa.DateTime(timezone=True), nullable=False),
    sa.Column("total", sa.Numeric(12, 2), nullable=False),
    sa.CheckConstraint("total >= 0", name="ck_venta_total_no_negativo"),
)
sa.Table(
    "renglon_venta", schema, identifier(),
    reference("venta_id", "venta.id"), reference("libro_id", "libro.id"),
    sa.Column("cantidad", sa.Integer(), nullable=False),
    sa.Column("precio_unitario", sa.Numeric(10, 2), nullable=False),
    sa.CheckConstraint("cantidad > 0", name="ck_renglon_venta_cantidad_positiva"),
    sa.CheckConstraint("precio_unitario > 0", name="ck_renglon_venta_precio_positivo"),
)


def upgrade():
    connection = op.get_bind()
    if context.is_offline_mode():
        schema.create_all(connection, checkfirst=False)
        return

    inspector = sa.inspect(connection)
    expected = set(schema.tables)
    existing = expected.intersection(inspector.get_table_names())
    if not existing:
        schema.create_all(connection, checkfirst=False)
        return
    if existing != expected:
        missing = ", ".join(sorted(expected - existing))
        raise RuntimeError(f"Esquema previo incompleto. Faltan tablas: {missing}.")

    def include_name(name, kind, _parent):
        return kind != "table" or name in expected

    migration = MigrationContext.configure(connection, opts={"include_name": include_name})
    differences = compare_metadata(migration, schema)
    invalid_checks = []
    for table in schema.tables.values():
        expected_checks = {c.name for c in table.constraints if isinstance(c, sa.CheckConstraint)}
        present_checks = {c["name"] for c in inspector.get_check_constraints(table.name)}
        invalid_checks.extend(sorted(expected_checks - present_checks))
        database_pk = inspector.get_pk_constraint(table.name)["constrained_columns"]
        if database_pk != [column.name for column in table.primary_key.columns]:
            raise RuntimeError(f"Clave primaria incompatible en la tabla {table.name}.")
    if differences or invalid_checks:
        raise RuntimeError(
            "Esquema previo incompatible con la revisión inicial. "
            f"Diferencias: {differences}. Restricciones faltantes: {invalid_checks}."
        )


def downgrade():
    raise RuntimeError("La revisión inicial protege los datos existentes de la librería.")
