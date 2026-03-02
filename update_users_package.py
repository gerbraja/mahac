import os
import sys

# Set path so backend can be imported
sys.path.append('c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from backend.database.connection import SessionLocal
from backend.database.models.user import User

data = """
Marisol Hernandez cruzhernandezcruzmarisol343@gmail.comMariher119214105pre-affiliate-
42Alvaro Javier Toro Abaunzaalvarotoro84@gmail.comAlvarin787709997pre-affiliate-
41Roger Mendez Anaconarogermendez3060@gmail.comMendez306716557pre-affiliate-
40Norma constanza Hernández gonzalezcanor_2329@hotmaill.comNocohego55117762pre-affiliate-
39Adrián a Lucia Chacónluciavalenzuela569@gmail.comFlakita071082124865pre-affiliate-
38Katty yohana melean Arguellesmeleankattyyohana@gmail.comMorena535210030pre-affiliate-
37Nilsa Gonsaleznilsa5386@gmail.comNilsaexitosa26455963pre-affiliate-
36Paola Andrea Ortiz Rojaspaoyesteffany@gmail.comAndrea1855117967pre-affiliate-
35Mercedes Martinezmercedesmartinez092@hotmail.comMMestrategia52118861activeFDI 1
34Isis Mahy Gomez Martinezisismahygomez@gmail.comIsis1455117559pre-affiliate-
33Adriana María gonzalez12adrianagonzalez12@gmail.comAdrifer55118444pre-affiliate-
32Eisson Hawer Cardona Ramírezzonachill328@gmail.comHawer71312203521activeFDI 1
31Hector García Villaquirahectorgarciavillaquira@gmail.comHegavi83056425activeFDI 3
30Olmedo Rojas Ducuaraoolmedorojas@gmail.comOlmedord1081415042pre-affiliate-
29Leidys jacome contrerasleidysjacomecontrerasmora@gmail.comLeidysJ1020749593pre-affiliate-
28Eduardo Quintero Cubilloseduardoquinterocubillos@hotmail.comEduardoQ1004300464pre-affiliate-
27Marcela rojasjosemiguelyate02@gmail.comMarce1081420260pre-affiliate-
26Fidel Herrera Buitragofh3234890@gmail.comPilu28Cedulapre-affiliate-
25Fabiola Gomez Sanchezanyisoto446@gmail.comFabiolaG1007097286pre-affiliate-
24Juan Carlos Paredes Noratojuanchef2016@gmail.comJuan8183183035activeFDI 2
23Pedro Alfonso Suarez Barragandonpedrosuarez.b@gmail.comPedrito83055277pre-affiliate-
22Anyi Liliana Quiza Trujilloquizaanyi2@gmail.comAnyili1082129848pre-affiliate-
21Yesenia Horta Carrilloyeseniahorta1205@gmail.comYesse1082127244pre-affiliate-
20Heber Prieto Garciahever1230p@gmail.comHeberP18491680activeFDI 1
19Virgelina Castillo Silvavircassilva@gmail.comLinacassi26509569activeFDI 1
18Yamid Martinez Castillomartinezyamid1983@gmail.comYamMar1082124724activeFDI 1
17Jorge Alfredo Perilla Ramosjperillaramos@hotmail.comJPerillaR79528481pre-affiliate-
16Melba Lucy Mapura Quirogamelu601@hotmail.comLucy60124989987activeFDI 1
15Luis Alejandro Silvasilvaalejandro435@gmail.comcantante79988211pre-affiliate-
14Carolina Bravo Jaramillocarolinabravo152@gmail.comkarolBJ52469425activeFDI 1
13Ruby Bravo Jaramillorubybravoj@gmail.comRubyB.J51603097activeFDI 1
12Lauren Lizeth Bravo Martinezlaurenbravo373@gmail.comLau.B.M1080935064activeFDI 1
11Maria Fernanda Calderon Morenomariafcalderonmor@gmail.comMafecitasilva52826168activeFDI 1
10Heber Danilo Bravodanihcr2@gmail.comDanicr1028889172activeFDI 1
9Mercedes Campos Quimbayomechisquimbayo08@gmail.comMercam40612600activeFDI 1
8Alexis Bravogerversonalexis@gmail.comAlexisBM1013119017activeFDI 1
7Diana Martinez Castillodianismarcas@gmail.comDianismarcas1080930409activeFDI 1
6Gerverson Bravogerbraja+1@gmail.comGerbraja179520277activeFDI 1
5Ramses Bravogerbraja@gmail.comGerbraja79520277pre-affiliate-
4Sembradores Esperanzasembradores@gmail.comSembradores83000009131activeFDI 1
2TEI Adminadmin@tei.comTeiAdmin830000091318activeFDI 1
"""

def main():
    db = SessionLocal()
    lines = data.strip().split('\n')
    
    updated_count = 0
    not_found = []
    
    for line in lines:
        if not line.strip():
            continue
        
        parts = line.split('\t')
        
        # Some rows might not have ID at the front. E.g "Marisol Hernandez cruz..."
        if len(parts) >= 6:
            # Let's try to parse by email. Email is always the one with '@'.
            email = None
            status = parts[-2].strip().lower()
            package_str = parts[-1].strip().upper()
            
            for part in parts:
                if '@' in part:
                    email = part.strip().lower()
                    break
            
            if not email:
                print(f"Skipping line without email: {line}")
                continue
                
            user = db.query(User).filter(User.email == email).first()
            if not user:
                not_found.append(email)
                continue
            
            # Determine package_level
            package_level = 0
            if package_str == 'FDI 1':
                package_level = 1
            elif package_str == 'FDI 2':
                package_level = 2
            elif package_str == 'FDI 3':
                package_level = 3
                
            user.status = status
            user.package_level = package_level
            updated_count += 1
            print(f"Updated {email}: status={status}, package_level={package_level}")
            
    db.commit()
    print(f"\nSuccessfully updated {updated_count} users.")
    if not_found:
        print(f"Users not found in DB: {not_found}")

if __name__ == '__main__':
    main()
