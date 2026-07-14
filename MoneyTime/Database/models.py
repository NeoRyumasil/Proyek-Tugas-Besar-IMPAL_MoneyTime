from sqlalchemy import Column, Integer, Text, Date, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from orm import base

# User Class
class User(base):
    __tablename__ = 'User'

    # Table
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(Text)
    password = Column(Text)
    email = Column(Text)
    role = Column(Text)

    # Relation
    aktivitas = relationship("Aktivitas", back_populates="user", cascade="all, delete-orphan")
    finansial = relationship("Finansial", back_populates="user", cascade="all, delete-orphan")
    chatlogs = relationship("Chatlog", back_populates="user", cascade="all, delete-orphan")

# Aktivitas Class
class Aktivitas(base):
    __tablename__ = 'Aktivitas'
    
    # Table
    aktivitasid = Column(Integer, primary_key=True, autoincrement=True)
    userid = Column(Integer, ForeignKey('User.id'))
    nama_aktivitas = Column(Text)
    deskripsi = Column(Text)
    tenggat = Column(Date)
    waktu = Column(Text)
    kategori = Column(Text)
    prioritas = Column(Text)
    status = Column(Text, default="Pending")
    isread = Column(Boolean, default=False)

    # Relation
    user = relationship("User", back_populates="aktivitas") 

# Finansial Class
class Finansial(base):
    __tablename__ = 'Finansial'
    
    # Table
    finansialid = Column(Integer, primary_key=True, autoincrement=True)
    userid = Column(Integer, ForeignKey('User.id'))
    budget = Column(Numeric)
    kategori = Column(Text)
    status = Column(Text)
    date = Column(Date)

    # Relation
    user = relationship("User", back_populates="finansial")
    pemasukkan = relationship("Pemasukkan", back_populates="finansial", cascade="all, delete-orphan")
    pengeluaran = relationship("Pengeluaran", back_populates="finansial", cascade="all, delete-orphan")

# Pemasukkan Class
class Pemasukkan(base):
    __tablename__ = 'Pemasukkan'
    
    # Table
    pemasukkanid = Column(Integer, primary_key=True, autoincrement=True)
    finansialid = Column(Integer, ForeignKey('Finansial.finansialid'))
    nominal = Column(Numeric)
    deskripsi = Column(Text)
    tanggal = Column(Date)

    # Relation
    finansial = relationship("Finansial", back_populates="pemasukkan")
    alokasi = relationship("Alokasi", back_populates="pemasukkan", cascade="all, delete-orphan")

# Pengeluaran Class
class Pengeluaran(base):
    __tablename__ = 'Pengeluaran'
    
    # Table
    pengeluaranid = Column(Integer, primary_key=True, autoincrement=True)
    finansialid = Column(Integer, ForeignKey('Finansial.finansialid'))
    nominal = Column(Numeric)
    deskripsi = Column(Text)
    kategorialokasi = Column(Text)
    tanggal = Column(Date)

    # Relation
    finansial = relationship("Finansial", back_populates="pengeluaran")

# Alokasi Class
class Alokasi(base):
    __tablename__ = 'Alokasi'
    
    # Table
    alokasiid = Column(Integer, primary_key=True, autoincrement=True)
    pemasukkanid = Column(Integer, ForeignKey('Pemasukkan.pemasukkanid', ondelete="CASCADE"))
    kategori_alokasi = Column(Text)
    nominal_alokasi = Column(Numeric)

    # Relation
    pemasukkan = relationship("Pemasukkan", back_populates="alokasi")

# Chatlog Class
class Chatlog(base):
    __tablename__ = 'Chatlog'
    
    # Table
    logid = Column(Integer, primary_key=True, autoincrement=True)
    userid = Column(Integer, ForeignKey('User.id'))
    message = Column(Text)
    role = Column(Text)
    timestamp = Column(DateTime(timezone=True))

    # Relation
    user = relationship("User", back_populates="chatlogs")