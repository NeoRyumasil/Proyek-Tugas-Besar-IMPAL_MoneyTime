from Controller.databaseController import db_connect

class Pengeluaran():
    # Constructor
    def __init__(self, pengeluaran_id: str, deskripsi: str, nominal: int, finansial):
        self.__pengeluaran_id = pengeluaran_id
        self.__deskripsi = deskripsi
        self.__nominal = nominal
        self.finansial = finansial
    
    def get_pengeluaran_id(self):
        return self.__pengeluaran_id  
    
    def set_pengeluaran_id(self, value):
        self.__pengeluaran_id = value
        
    def get_deskripsi(self):
        return self.__deskripsi
    
    def set_deskripsi(self, value):
        self.__deskripsi = value
        
    def get_nominal(self):
        return self.__nominal
    
    def set_nominal(self, value):
        self.__nominal = value
        
    def set_pengeluaran(self):
        # logic disini
        pass