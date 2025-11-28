from Controller.databaseController import db_connect

class Finansial():
    # Constructor
    def __init__(self, finansial_id: str, budget: int, kategori: str, status: str):
        self.__finansial_id = finansial_id
        self.__budget = budget
        self.__kategori = kategori
        self.__status = status
        
    def get_finansial_id(self):
        return self.__finansial_id   

    def set_finansial_id(self, value):
        self.__finansial_id = value 
        
    def get_budget(self):
        return self.__budget
    
    def set_budget(self, value):
        self.__budget = value

    def kategori(self):
        return self.__kategori

    def kategori(self, value):
        self.__kategori = value
    
    def get_status(self):
        return self.__status
    
    def set_status(self, value):
        self.__status = value
        
    def edit_data_finansial(self):
        # logic disini
        pass
    
    def tambah_data_finansial(self):
        # logic disini
        pass
    
    def set_budget(self):
        # logic disini
        pass
    
    def set_kategori_finansial(self):
        # logic disini
        pass
    
    def hitung_sisa_budget(self):
        # logic disini
        pass