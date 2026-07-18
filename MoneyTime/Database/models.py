from Database.orm import db

# User Class
class User(db.Model):
    __tablename__ = 'User'

    # Table
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.Text)
    password = db.Column(db.Text)
    email = db.Column(db.Text)
    role = db.Column(db.Text)

    # Relation
    aktivitas = db.relationship("Aktivitas", back_populates="user", cascade="all, delete-orphan")
    finansial = db.relationship("Finansial", back_populates="user", cascade="all, delete-orphan")
    chatlogs = db.relationship("Chatlog", back_populates="user", cascade="all, delete-orphan")

# Aktivitas Class
class Aktivitas(db.Model):
    __tablename__ = 'Aktivitas'
    
    # Table
    aktivitasid = db.Column(db.Integer, primary_key=True, autoincrement=True)
    userid = db.Column(db.Integer, db.ForeignKey('User.id'))
    nama_aktivitas = db.Column(db.Text)
    deskripsi = db.Column(db.Text)
    tenggat = db.Column(db.Date)
    waktu = db.Column(db.Text)
    kategori = db.Column(db.Text)
    prioritas = db.Column(db.Text)
    status = db.Column(db.Text, default="Pending")
    isread = db.Column(db.Boolean, default=False)

    # Relation
    user = db.relationship("User", back_populates="aktivitas") 

# Finansial Class
class Finansial(db.Model):
    __tablename__ = 'Finansial'
    
    # Table
    finansialid = db.Column(db.Integer, primary_key=True, autoincrement=True)
    userid = db.Column(db.Integer, db.ForeignKey('User.id'))
    budget = db.Column(db.Numeric)
    kategori = db.Column(db.Text)
    status = db.Column(db.Text)
    date = db.Column(db.Date)

    # Relation
    user = db.relationship("User", back_populates="finansial")
    pemasukkan = db.relationship("Pemasukkan", back_populates="finansial", cascade="all, delete-orphan")
    pengeluaran = db.relationship("Pengeluaran", back_populates="finansial", cascade="all, delete-orphan")

# Pemasukkan Class
class Pemasukkan(db.Model):
    __tablename__ = 'Pemasukkan'
    
    # Table
    pemasukkanid = db.Column(db.Integer, primary_key=True, autoincrement=True)
    finansialid = db.Column(db.Integer, db.ForeignKey('Finansial.finansialid'))
    nominal = db.Column(db.Numeric)
    deskripsi = db.Column(db.Text)
    tanggal = db.Column(db.Date)

    # Relation
    finansial = db.relationship("Finansial", back_populates="pemasukkan")
    alokasi = db.relationship("Alokasi", back_populates="pemasukkan", cascade="all, delete-orphan")

# Pengeluaran Class
class Pengeluaran(db.Model):
    __tablename__ = 'Pengeluaran'
    
    # Table
    pengeluaranid = db.Column(db.Integer, primary_key=True, autoincrement=True)
    finansialid = db.Column(db.Integer, db.ForeignKey('Finansial.finansialid'))
    nominal = db.Column(db.Numeric)
    deskripsi = db.Column(db.Text)
    kategorialokasi = db.Column(db.Text)
    tanggal = db.Column(db.Date)

    # Relation
    finansial = db.relationship("Finansial", back_populates="pengeluaran")

# Alokasi Class
class Alokasi(db.Model):
    __tablename__ = 'Alokasi'
    
    # Table
    alokasiid = db.Column(db.Integer, primary_key=True, autoincrement=True)
    pemasukkanid = db.Column(db.Integer, db.ForeignKey('Pemasukkan.pemasukkanid', ondelete="CASCADE"))
    kategori_alokasi = db.Column(db.Text)
    nominal_alokasi = db.Column(db.Numeric)

    # Relation
    pemasukkan = db.relationship("Pemasukkan", back_populates="alokasi")

# Chatlog Class
class Chatlog(db.Model):
    __tablename__ = 'Chatlog'
    
    # Table
    logid = db.Column(db.Integer, primary_key=True, autoincrement=True)
    userid = db.Column(db.Integer, db.ForeignKey('User.id'))
    message = db.Column(db.Text)
    role = db.Column(db.Text)
    timestamp = db.Column(db.DateTime(timezone=True))

    # Relation
    user = db.relationship("User", back_populates="chatlogs")