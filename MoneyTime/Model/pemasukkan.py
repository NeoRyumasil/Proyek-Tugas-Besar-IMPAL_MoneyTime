from Controller.databaseController import db_connect

class Pemasukan():
    # Constructor
    def __init__(self, pemasukan_id: str, deskripsi: str, nominal: int, finansial):
        self.__pemasukan_id = pemasukan_id
        self.__deskripsi = deskripsi
        self.__nominal = nominal
        self.finansial = finansial
    
    def get_pemasukan_id(self):
        return self.__pemasukan_id  
    
    def set_pemasukan_id(self, value):
        self.__pemasukan_id = value
        
    def get_deskripsi(self):
        return self.__deskripsi
    
    def set_deskripsi(self, value):
        self.__deskripsi = value
        
    def get_nominal(self):
        return self.__nominal
    
    def set_nominal(self, value):
        self.__nominal = value
        
    def set_pemasukan(self):
        # logic disini
        pass