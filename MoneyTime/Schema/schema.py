from Utils.marshmallow import marshmallow
from marshmallow import validate, fields
from Database.models import User, Aktivitas, Finansial, Pemasukkan, Pengeluaran, Alokasi, Chatlog
from Database.models import db 

# User Schema
class UserSchema(marshmallow.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True 
        sqla_session = db.session

    username = marshmallow.auto_field(validate=validate.Length(min=3, max=50))
    password = marshmallow.auto_field(validate=validate.Length(min=6), load_only=True)
    email = fields.Email(required=True) 

# Aktivitas Schema
class AktivitasSchema(marshmallow.SQLAlchemyAutoSchema):
    class Meta:
        model = Aktivitas
        load_instance = True
        include_fk = True 
        sqla_session = db.session

    nama_aktivitas = marshmallow.auto_field(validate=validate.Length(min=3))
    # Mengganti 'missing' menjadi 'load_default'
    prioritas = marshmallow.auto_field(validate=validate.OneOf(["Low", "Medium", "High", "Critical"]), load_default="Medium")
    status = marshmallow.auto_field(validate=validate.OneOf(["Pending", "In Progress", "Completed", "Canceled"]), load_default="Pending")

# Finansial Schema
class FinansialSchema(marshmallow.SQLAlchemyAutoSchema):
    class Meta:
        model = Finansial
        load_instance = True
        include_fk = True
        sqla_session = db.session
        
    budget = marshmallow.auto_field(validate=validate.Range(min=0))

# Pemasukkan Schema
class PemasukkanSchema(marshmallow.SQLAlchemyAutoSchema):
    class Meta:
        model = Pemasukkan
        load_instance = True
        include_fk = True
        sqla_session = db.session
        
    nominal = marshmallow.auto_field(validate=validate.Range(min=0.01, error="Nominal must higher than 0"))

# Pengeluaran Schema
class PengeluaranSchema(marshmallow.SQLAlchemyAutoSchema):
    class Meta:
        model = Pengeluaran
        load_instance = True
        include_fk = True
        sqla_session = db.session
        
    nominal = marshmallow.auto_field(validate=validate.Range(min=0.01, error="Nominal must higher than 0"))

# Alokasi Schema
class AlokasiSchema(marshmallow.SQLAlchemyAutoSchema):
    class Meta:
        model = Alokasi
        load_instance = True
        include_fk = True
        sqla_session = db.session
        
    nominal_alokasi = marshmallow.auto_field(validate=validate.Range(min=0.01, error="Nominal must higher than 0"))

# Chatlog Schema
class ChatlogSchema(marshmallow.SQLAlchemyAutoSchema):
    class Meta:
        model = Chatlog
        load_instance = True
        include_fk = True
        sqla_session = db.session

    message = marshmallow.auto_field(validate=validate.Length(min=1, max=1000, error="Max Chat is 1000 Characters."))
    role = marshmallow.auto_field(validate=validate.OneOf(["user", "assistant", "system", "tool"]))