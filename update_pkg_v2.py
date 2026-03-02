import os
import sys

# Set path so backend can be imported
sys.path.append('c:/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI')

from backend.database.connection import SessionLocal
from backend.database.models.user import User

data = """
Marisol Hernandez cruz	hernandezcruzmarisol343@gmail.com	Mariher	119214105	pre-affiliate	-
42	Alvaro Javier Toro Abaunza	alvarotoro84@gmail.com	Alvarin78	7709997	pre-affiliate	-
41	Roger Mendez Anacona	rogermendez3060@gmail.com	Mendez30	6716557	pre-affiliate	-
40	Norma constanza Hernandez gonzalez	canor_2329@hotmaill.com	Nocohego	55117762	pre-affiliate	-
39	Adrian a Lucia Chacon	luciavalenzuela569@gmail.com	Flakita07	1082124865	pre-affiliate	-
38	Katty yohana melean Arguelles	meleankattyyohana@gmail.com	Morena53	5210030	pre-affiliate	-
37	Nilsa Gonsalez	nilsa5386@gmail.com	Nilsaexitosa	26455963	pre-affiliate	-
36	Paola Andrea Ortiz Rojas	paoyesteffany@gmail.com	Andrea18	55117967	pre-affiliate	-
35	Mercedes Martinez	mercedesmartinez092@hotmail.com	MMestrategia	52118861	active	FDI 1
34	Isis Mahy Gomez Martinez	isismahygomez@gmail.com	Isis14	55117559	pre-affiliate	-
33	Adriana Maria gonzalez	12adrianagonzalez12@gmail.com	Adrifer	55118444	pre-affiliate	-
32	Eisson Hawer Cardona Ramirez	zonachill328@gmail.com	Hawer713	12203521	active	FDI 1
31	Hector Garcia Villaquira	hectorgarciavillaquira@gmail.com	Hegavi	83056425	active	FDI 3
30	Olmedo Rojas Ducuara	oolmedorojas@gmail.com	Olmedord	1081415042	pre-affiliate	-
29	Leidys jacome contreras	leidysjacomecontrerasmora@gmail.com	LeidysJ	1020749593	pre-affiliate	-
28	Eduardo Quintero Cubillos	eduardoquinterocubillos@hotmail.com	EduardoQ	1004300464	pre-affiliate	-
27	Marcela rojas	josemiguelyate02@gmail.com	Marce	1081420260	pre-affiliate	-
26	Fidel Herrera Buitrago	fh3234890@gmail.com	Pilu28	Cedula	pre-affiliate	-
25	Fabiola Gomez Sanchez	anyisoto446@gmail.com	FabiolaG	1007097286	pre-affiliate	-
24	Juan Carlos Paredes Norato	juanchef2016@gmail.com	Juan81	83183035	active	FDI 2
23	Pedro Alfonso Suarez Barragan	donpedrosuarez.b@gmail.com	Pedrito	83055277	pre-affiliate	-
22	Anyi Liliana Quiza Trujillo	quizaanyi2@gmail.com	Anyili	1082129848	pre-affiliate	-
21	Yesenia Horta Carrillo	yeseniahorta1205@gmail.com	Yesse	1082127244	pre-affiliate	-
20	Heber Prieto Garcia	hever1230p@gmail.com	HeberP	18491680	active	FDI 1
19	Virgelina Castillo Silva	vircassilva@gmail.com	Linacassi	26509569	active	FDI 1
18	Yamid Martinez Castillo	martinezyamid1983@gmail.com	YamMar	1082124724	active	FDI 1
17	Jorge Alfredo Perilla Ramos	jperillaramos@hotmail.com	JPerillaR	79528481	pre-affiliate	-
16	Melba Lucy Mapura Quiroga	melu601@hotmail.com	Lucy601	24989987	active	FDI 1
15	Luis Alejandro Silva	silvaalejandro435@gmail.com	cantante	79988211	pre-affiliate	-
14	Carolina Bravo Jaramillo	carolinabravo152@gmail.com	karolBJ	52469425	active	FDI 1
13	Ruby Bravo Jaramillo	rubybravoj@gmail.com	RubyB.J	51603097	active	FDI 1
12	Lauren Lizeth Bravo Martinez	laurenbravo373@gmail.com	Lau.B.M	1080935064	active	FDI 1
11	Maria Fernanda Calderon Moreno	mariafcalderonmor@gmail.com	Mafecitasilva	52826168	active	FDI 1
10	Heber Danilo Bravo	danihcr2@gmail.com	Danicr	1028889172	active	FDI 1
9	Mercedes Campos Quimbayo	mechisquimbayo08@gmail.com	Mercam	40612600	active	FDI 1
8	Alexis Bravo	gerversonalexis@gmail.com	AlexisBM	1013119017	active	FDI 1
7	Diana Martinez Castillo	dianismarcas@gmail.com	Dianismarcas	1080930409	active	FDI 1
6	Gerverson Bravo	gerbraja+1@gmail.com	Gerbraja1	79520277	active	FDI 1
5	Ramses Bravo	gerbraja@gmail.com	Gerbraja	79520277	pre-affiliate	-
4	Sembradores Esperanza	sembradores@gmail.com	Sembradores	83000009131	active	FDI 1
2	TEI Admin	admin@tei.com	TeiAdmin	830000091318	active	FDI 1
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
        
        # Some rows might not have ID at the front
        if len(parts) >= 6:
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
